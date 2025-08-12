import { compileG4WithRgslComments } from '../lib';
import { readFileSync } from 'fs';
import { join } from 'path';

// Basic test to ensure Turtle grammar with RGSL annotations parses and yields semantic blocks

test('compile TURTLE grammar with RGSL annotations', () => {
  const g4 = readFileSync(join(__dirname, '../lib/grammars/turtle.g4'), 'utf8');
  const { semantics } = compileG4WithRgslComments(g4);
  expect(semantics.blocks.length).toBeGreaterThan(0);
  const altNames = semantics.blocks.map(b => b.altName);
  expect(altNames).toContain('turtle.triples.TriplesSPO'.toLowerCase());
});
