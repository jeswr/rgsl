export type Iri = string;

export type TermTemplate =
  | { kind: 'iri'; value?: Iri; fromVar?: string; transform?: string }
  | { kind: 'literal'; value?: string; fromVar?: string; lang?: string; datatype?: Iri }
  | { kind: 'bnode'; value?: string; fromVar?: string };

export interface Binding { var: string; path: string; transform?: string }
export interface EmitTemplate { subject: TermTemplate; predicate: TermTemplate; object: TermTemplate; graph?: TermTemplate }

export interface SemanticBlock {
  altName: string;
  prefixes: Record<string, Iri>;
  defaultLang?: string;
  defaultDatatype?: Iri;
  terms: Record<string, TermTemplate>;
  bindings: Binding[];
  emits: EmitTemplate[];
}

export interface RgsoModel { grammarName: string; blocks: SemanticBlock[] }
