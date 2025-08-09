import { RgsoModel, SemanticBlock, TermTemplate, EmitTemplate, Binding } from './types';
import { DataFactory, Writer } from 'n3';

const RGSO = 'http://example.org/rgso#';
const { namedNode, literal, quad } = DataFactory;

function termTemplateQuads(subjectIri: string, name: string, tpl: TermTemplate) {
  const quads = [] as any[];
  const b = namedNode(`${subjectIri}#term-${name}`);
  quads.push(quad(b, namedNode(RGSO + 'kind'), literal(tpl.kind)));
  if ('value' in tpl && tpl.value) quads.push(quad(b, namedNode(RGSO + 'value'), literal(tpl.value)));
  if ('fromVar' in tpl && tpl.fromVar) quads.push(quad(b, namedNode(RGSO + 'fromVar'), literal(tpl.fromVar)));
  if (tpl.kind === 'literal') {
    if (tpl.lang) quads.push(quad(b, namedNode(RGSO + 'lang'), literal(tpl.lang)));
    if (tpl.datatype) quads.push(quad(b, namedNode(RGSO + 'datatype'), literal(tpl.datatype)));
  }
  quads.push(quad(namedNode(subjectIri), namedNode(RGSO + 'term'), b));
  return quads;
}

export async function serializeRgso(model: RgsoModel): Promise<string> {
  const writer = new Writer({ prefixes: { rgso: RGSO } });
  for (const block of model.blocks) {
    const subjectIri = `urn:rgsl:${model.grammarName}:${block.altName}`;
    const S = namedNode(subjectIri);
    writer.addQuad(quad(S, namedNode(RGSO + 'altName'), literal(block.altName)));
    for (const [pfx, iri] of Object.entries(block.prefixes)) {
      writer.addQuad(quad(S, namedNode(RGSO + 'prefix'), literal(`${pfx}:${iri}`)));
    }
    if (block.defaultLang) writer.addQuad(quad(S, namedNode(RGSO + 'defaultLang'), literal(block.defaultLang)));
    if (block.defaultDatatype) writer.addQuad(quad(S, namedNode(RGSO + 'defaultDatatype'), literal(block.defaultDatatype)));
    for (const [termName, tpl] of Object.entries(block.terms)) {
      for (const q of termTemplateQuads(subjectIri, termName, tpl)) writer.addQuad(q);
    }
    for (const b of block.bindings) {
      const bn = namedNode(`${subjectIri}#binding-${b.var}`);
      writer.addQuad(quad(S, namedNode(RGSO + 'binding'), bn));
      writer.addQuad(quad(bn, namedNode(RGSO + 'var'), literal(b.var)));
      writer.addQuad(quad(bn, namedNode(RGSO + 'path'), literal(b.path)));
      if (b.transform) writer.addQuad(quad(bn, namedNode(RGSO + 'transform'), literal(b.transform)));
    }
    for (let i = 0; i < block.emits.length; i++) {
      const e = block.emits[i];
      const en = namedNode(`${subjectIri}#emit-${i}`);
      writer.addQuad(quad(S, namedNode(RGSO + 'emit'), en));
      const termPart = (tpl: TermTemplate, role: string) => {
        const tn = namedNode(`${en.value}#${role}`);
        writer.addQuad(quad(en, namedNode(RGSO + role.charAt(0).toUpperCase() + role.slice(1)), tn));
        writer.addQuad(quad(tn, namedNode(RGSO + 'kind'), literal(tpl.kind)));
        if ('value' in tpl && tpl.value) writer.addQuad(quad(tn, namedNode(RGSO + 'value'), literal(tpl.value)));
        if ('fromVar' in tpl && tpl.fromVar) writer.addQuad(quad(tn, namedNode(RGSO + 'fromVar'), literal(tpl.fromVar)));
        if (tpl.kind === 'literal') {
          if (tpl.lang) writer.addQuad(quad(tn, namedNode(RGSO + 'lang'), literal(tpl.lang)));
          if (tpl.datatype) writer.addQuad(quad(tn, namedNode(RGSO + 'datatype'), literal(tpl.datatype)));
        }
      };
      termPart(e.subject, 'subject');
      termPart(e.predicate, 'predicate');
      termPart(e.object, 'object');
      if (e.graph) termPart(e.graph, 'graph');
    }
  }
  return new Promise((resolve, reject) => {
    writer.end((err, result) => {
      if (err) reject(err); else resolve(result);
    });
  });
}
