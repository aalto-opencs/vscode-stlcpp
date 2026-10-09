const test = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, dirname } = require('node:path');
const { execFileSync } = require('node:child_process');
const vsceManifest = require.resolve('@vscode/vsce/package.json');

function readArchive(file) {
  // Python's standard ZIP reader verifies the packaged artifact independently
  // of the ZIP implementation used by vsce itself.
  const script = `import base64,json,sys,zipfile
with zipfile.ZipFile(sys.argv[1]) as archive:
  wanted = {'extension/package.json', 'extension/wasm/tree-sitter-stlcpp.wasm'}
  print(json.dumps({name: base64.b64encode(archive.read(name)).decode() if name in wanted else '' for name in archive.namelist()}))`;
  const contents = JSON.parse(execFileSync('python3', ['-c', script, file], { encoding: 'utf8', timeout: 30_000 }));
  return new Map(Object.entries(contents).map(([name, data]) => [name, Buffer.from(data, 'base64')]));
}

test('the locked vsce packages a loadable extension without source or test files', async () => {
  const temporary = mkdtempSync(join(tmpdir(), 'stlcpp-vsix-'));
  try {
    const output = join(temporary, 'extension.vsix');
    execFileSync(process.execPath, [join(dirname(vsceManifest), 'vsce'), 'package', '--out', output], {
      cwd: process.cwd(), timeout: 120_000, stdio: 'pipe',
    });
    const files = await readArchive(output);
    const manifest = JSON.parse(files.get('extension/package.json'));
    assert.equal(manifest.publisher, 'aalto-opencs');
    assert.equal(manifest.contributes.languages[0].id, 'stlcpp');
    for (const name of ['out/extension.js', 'language-configuration.json', 'wasm/tree-sitter-stlcpp.wasm',
      'node_modules/web-tree-sitter/package.json']) {
      assert.ok(files.has(`extension/${name}`), `Missing runtime asset: ${name}`);
    }
    assert.deepEqual(files.get('extension/wasm/tree-sitter-stlcpp.wasm'), readFileSync('wasm/tree-sitter-stlcpp.wasm'));
    assert.ok(files.has('extension/README.md') || files.has('extension/readme.md'));
    for (const name of files.keys()) {
      assert.doesNotMatch(name, /^extension\/(?:src|tests|\.github)\//);
      assert.doesNotMatch(name, /^extension\/node_modules\/@vscode\/vsce\//);
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
