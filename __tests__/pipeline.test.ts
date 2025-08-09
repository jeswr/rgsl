import { compileG4WithRgslComments, serializeRgso } from '../lib';
import { readFileSync } from 'fs';
import { join } from 'path';

test('compile sample grammar and serialize', async () => {
  const g4 = readFileSync(join(__dirname, 'SampleGrammar.g4'), 'utf8');
  const { semantics } = compileG4WithRgslComments(g4);
  expect(semantics.blocks.length).toBeGreaterThan(0);
  const ttl = await serializeRgso(semantics);
  expect(ttl).toContain('rgso:altName');
});
