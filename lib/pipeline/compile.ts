// ANTLR-based compile pipeline: parses ANTLR v4 grammar + RGSL directives.
import { CharStreams, CommonTokenStream } from 'antlr4ts';
import { ParseTreeWalker } from 'antlr4ts/tree/ParseTreeWalker';
import { Token } from 'antlr4ts';

// Meta-grammar generated sources (must be generated via antlr4ts)
import { ANTLRv4Lexer } from '../../generated/v4meta/ANTLRv4Lexer';
import { ANTLRv4Parser } from '../../generated/v4meta/ANTLRv4Parser';
import { ANTLRv4ParserListener } from '../../generated/v4meta/ANTLRv4ParserListener';

// RGSL grammar generated sources
import { RGSLLexer } from '../../generated/rgsl/RGSLLexer';
import { RGSLParser } from '../../generated/rgsl/RGSLParser';
import { RGSLListener } from '../../generated/rgsl/RGSLListener';

import { RgsoModel, SemanticBlock, TermTemplate, EmitTemplate, Binding } from './types';
import { generateEmitterTs } from './emitter-gen';

export interface AltInfo { name: string; rule: string; startTokenIndex: number; stopTokenIndex: number }

export function compileG4WithRgslComments(g4Source: string) {
  const { tokens, alts } = parseG4Meta(g4Source);
  const blocks: SemanticBlock[] = [];
  for (const alt of alts) {
    const script = harvestRgslForAlt(alt, tokens);
    if (!script.trim()) continue;
    const block = parseRgslToBlock(script);
    block.altName = `${alt.rule}.${alt.name}`;
    blocks.push(block);
  }
  const grammarName = findGrammarName(g4Source);
  const semantics: RgsoModel = { grammarName, blocks };
  const emitterTs = generateEmitterTs(semantics);
  return { semantics, emitterTs };
}

// ================= ANTLR v4 Grammar Parsing =================
class AltCollector implements ANTLRv4ParserListener {
  private currentRule: string | null = null;
  alts: AltInfo[] = [];

  enterParserRuleSpec(ctx: any) {
    const idTok = ctx.ID?.(0);
    this.currentRule = idTok ? idTok.text : null;
  }
  exitParserRuleSpec() { this.currentRule = null; }

  exitLabeledAlt(ctx: any) {
    if (!this.currentRule) return;
    const idCtx = ctx.identifier?.();
    if (!idCtx) return;
    const name = idCtx.text;
    const start: Token = ctx.start;
    const stop: Token = ctx.stop;
    this.alts.push({ name, rule: this.currentRule, startTokenIndex: start.tokenIndex, stopTokenIndex: stop.tokenIndex });
  }

  visitTerminal() { /* noop */ }
  visitErrorNode() { /* noop */ }
  enterEveryRule() { /* noop */ }
  exitEveryRule() { /* noop */ }
}

function parseG4Meta(src: string) {
  // Pre-strip lexer rules (uppercase-leading identifiers) so our reduced meta-grammar can parse complex grammars like Turtle.
  const lines = src.split(/\n/);
  let cutIndex = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^[A-Z][A-Z0-9_]*\s*:/.test(line)) { // first token (lexer) rule encountered
      cutIndex = i; break;
    }
  }
  const parserSection = lines.slice(0, cutIndex).join('\n');
  const input = CharStreams.fromString(parserSection);
  const lexer = new ANTLRv4Lexer(input);
  const tokens = new CommonTokenStream(lexer);
  const parser = new ANTLRv4Parser(tokens);
  parser.buildParseTree = true;
  const tree = parser.grammarSpec();
  const collector = new AltCollector();
  ParseTreeWalker.DEFAULT.walk(collector as ANTLRv4ParserListener, tree);
  return { tokens, alts: collector.alts };
}

// ============== Harvest RGSL directives following an alternative ==============
function harvestRgslForAlt(alt: AltInfo, tokens: CommonTokenStream) {
  // Directives are stored in comment tokens that immediately follow the alt until a non-hidden token appears.
  const lines: string[] = [];
  let i = alt.stopTokenIndex + 1;
  tokens.fill();
  while (i < tokens.size) {
    const t = tokens.get(i);
    if (!t) break;
    if (t.channel === 0) break; // default channel -> stop
    const txt = t.text ?? '';
    // Split multi-line comment content
    const candidateLines = txt.split(/\r?\n/)
      .map((s: string) => s.trim().replace(/^\/\/\s?/, '').replace(/^\/\*+/, '').replace(/\*+\/$/, '').replace(/^\*\s?/, '').trim())
      .filter((s: string) => s.length > 0);
    let consumedAny = false;
    for (const c of candidateLines) {
      if (c.startsWith('@')) { lines.push(c); consumedAny = true; }
    }
    if (!consumedAny) break; // stop at first comment block without directives
    i++;
  }
  return lines.join('\n');
}

// ============== RGSL Directive Parsing (structure-aware) =====================
interface WorkBlock {
  prefixes: Record<string,string>;
  terms: Record<string,TermTemplate>;
  bindings: Binding[];
  emits: EmitTemplate[];
  defaultLang?: string;
  defaultDatatype?: string;
}

class RgslCollector implements RGSLListener {
  block: WorkBlock = { prefixes: {}, terms: {}, bindings: [], emits: [] };

  private textOf(ctx: any) { return ctx?.text ?? ''; }

  exitPrefixStmt(ctx: any) {
    const id = this.textOf(ctx.IDENT());
    const iri = this.textOf(ctx.IRI());
    if (id && iri) this.block.prefixes[id] = iri.slice(1,-1);
  }
  exitBindStmt(ctx: any) {
    const ident = this.textOf(ctx.IDENT());
    const path = this.textOf(ctx.PATH());
    const transform = ctx.IDENT(1)? this.textOf(ctx.IDENT(1)) : undefined;
    if (ident && path) this.block.bindings.push({ var: ident, path: path.trim(), transform });
  }
  exitLangStmt(ctx: any) {
    const tag = this.textOf(ctx.LANGTAG());
    if (tag) this.block.defaultLang = tag.replace(/^@/,'');
  }
  exitDtStmt(ctx: any) {
    // dt term -> only record if IRI or CURIE
    const termCtx = ctx.term();
    const iriNode = termCtx?.IRI?.();
    const curieNode = termCtx?.CURIE?.();
    if (iriNode) this.block.defaultDatatype = iriNode.text.slice(1,-1);
    else if (curieNode) this.block.defaultDatatype = curieNode.text; // CURIE preserved
  }
  exitTermStmt(ctx: any) {
    const name = this.textOf(ctx.IDENT());
    const t = ctx.term();
    if (!name || !t) return;
    this.block.terms[name] = convertTerm(t);
  }
  exitEmitStmt(ctx: any) {
    const term = (i: number) => convertTerm(ctx.term(i));
    const subj = term(0), pred = term(1), obj = term(2);
    const graph = ctx.term(3)? term(3) : undefined;
    this.block.emits.push({ subject: subj, predicate: pred, object: obj, graph });
  }

  // Unused listener hooks
  visitTerminal() {}
  visitErrorNode() {}
  enterEveryRule() {}
  exitEveryRule() {}
  // Other stmt types handled above
}

function convertTerm(t: any): TermTemplate {
  if (!t) return { kind: 'iri', fromVar: '' };
  if (t.children) {
    const txt = t.text as string;
    if (txt.startsWith('iri:')) {
      const inner = txt.slice(4).trim();
      return iriFromInner(inner);
    }
    if (txt.startsWith('lit:')) {
      const inner = txt.slice(4).trim();
      const mStr = inner.match(/^"(.*)"(@[A-Za-z][A-ZaZ0-9-]*)?$/);
      const mDt = inner.match(/^"(.*)"\^\^(.*)$/);
      if (mDt) return { kind: 'literal', value: mDt[1], datatype: stripAngle(mDt[2]) };
      if (mStr) return { kind: 'literal', value: mStr[1], lang: mStr[2]? mStr[2].slice(1): undefined };
      return { kind: 'literal', fromVar: inner };
    }
    if (txt.startsWith('bnode:')) return { kind: 'bnode', value: txt.slice(6) };
    if (/^<[^>]+>$/.test(txt)) return { kind: 'iri', value: txt.slice(1,-1) };
    if (/^[A-Za-z_][A-Za-z0-9_]*:[A-Za-z0-9_.-]*$/.test(txt)) return { kind: 'iri', value: txt }; // CURIE
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(txt)) return { kind: 'iri', fromVar: txt };
  }
  return { kind: 'iri', fromVar: String(t.text) };
}

function iriFromInner(inner: string): TermTemplate {
  if (/^<[^>]+>$/.test(inner)) return { kind: 'iri', value: inner.slice(1,-1) };
  if (/^[A-Za-z_][A-Za-z0-9_]*:[A-Za-z0-9_.-]*$/.test(inner)) return { kind: 'iri', value: inner };
  if (/^[A-Za-z_][A-ZaZ0-9_]*$/.test(inner)) return { kind: 'iri', fromVar: inner };
  return { kind: 'iri', value: inner };
}

function parseRgslToBlock(script: string): SemanticBlock {
  const input = CharStreams.fromString(script);
  const lexer = new RGSLLexer(input);
  const tokens = new CommonTokenStream(lexer);
  const parser = new RGSLParser(tokens);
  parser.buildParseTree = true;
  const tree = parser.script();
  const collector = new RgslCollector();
  ParseTreeWalker.DEFAULT.walk(collector as RGSLListener, tree);
  const b = collector.block;
  return { altName: '', prefixes: b.prefixes, terms: b.terms, bindings: b.bindings, emits: b.emits, defaultLang: b.defaultLang, defaultDatatype: b.defaultDatatype };
}

function stripAngle(s: string) { return s.replace(/^</,'').replace(/>$/,''); }

function findGrammarName(src: string) {
  const m = src.match(/\bgrammar\s+([A-Za-z_][A-ZaZ0-9_]*)\s*;/);
  if (!m) throw new Error('No grammar name');
  return m[1];
}
