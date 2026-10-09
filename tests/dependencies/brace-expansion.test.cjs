const test = require('node:test');
const assert = require('node:assert/strict');
const expand = require('brace-expansion');
const minimatch = require('minimatch');

test('packaging globs retain nested alternatives, ranges, and escaped literals', () => {
  assert.deepEqual(expand('assets/{wasm,{queries,config}}/*'), ['assets/wasm/*', 'assets/queries/*', 'assets/config/*']);
  assert.deepEqual(expand('chunk-{01..03}.js'), ['chunk-01.js', 'chunk-02.js', 'chunk-03.js']);
  assert.deepEqual(expand('literal\\{name\\}'), ['literal{name}']);
  const pattern = '**/*.{ts,map}';
  assert.equal(minimatch('src/extension.ts', pattern), true);
  assert.equal(minimatch('out/extension.js.map', pattern), true);
  assert.equal(minimatch('wasm/tree-sitter-stlcpp.wasm', pattern), false);
});
