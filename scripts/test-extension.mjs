import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { downloadAndUnzipVSCode, runTests, runVSCodeCommand } from '@vscode/test-electron';

const root = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const { values } = parseArgs({ options: {
  vsix: { type: 'string' },
  version: { type: 'string', default: manifest.config.vscodeTestVersion },
} });
const cachePath = join(root, '.vscode-test');
await mkdir(cachePath, { recursive: true });
// Keep installed extensions outside the checkout so Node cannot resolve missing
// packaged dependencies from this project's development node_modules directory.
const temporary = await mkdtemp(join(tmpdir(), 'stlcpp-editor-'));
const extensions = join(temporary, 'extensions');
const userData = join(temporary, 'user-data');
const workspace = join(temporary, 'workspace');

try {
  const vsix = values.vsix ? resolve(values.vsix) : join(temporary, 'extension.vsix');
  if (!values.vsix) {
    execFileSync(process.execPath, [
      join(dirname(require.resolve('@vscode/vsce/package.json')), 'vsce'),
      'package', '--out', vsix,
    ], { cwd: root, stdio: 'inherit' });
  }

  await mkdir(workspace, { recursive: true });
  await mkdir(join(userData, 'User'), { recursive: true });
  await writeFile(join(userData, 'User', 'settings.json'), JSON.stringify({
    'update.mode': 'none',
    'extensions.autoUpdate': false,
    'extensions.autoCheckUpdates': false,
    'telemetry.telemetryLevel': 'off',
    'editor.semanticHighlighting.enabled': true,
    'editor.autoClosingBrackets': 'languageDefined',
    'editor.autoClosingQuotes': 'languageDefined',
    'editor.wordWrap': 'off',
    'files.autoSave': 'off',
    'workbench.startupEditor': 'none',
  }));
  const options = { version: values.version, cachePath };
  const vscodeExecutablePath = await downloadAndUnzipVSCode(options);
  const profileArgs = [`--extensions-dir=${extensions}`, `--user-data-dir=${userData}`];
  const installation = await runVSCodeCommand([
    ...profileArgs, '--install-extension', vsix,
  ], options);
  console.log(installation.stdout);

  // Run only the installed VSIX. The source checkout and its runtime dependencies
  // must not mask missing files in the artifact that the marketplaces receive.
  const installed = (await readdir(extensions)).filter((name) =>
    name.startsWith(`${manifest.publisher}.${manifest.name}-`));
  if (installed.length !== 1) throw new Error(`Expected one installed STLC++ extension: ${installed}`);
  const extensionPath = join(extensions, installed[0]);
  await runTests({
    vscodeExecutablePath,
    extensionDevelopmentPath: extensionPath,
    extensionTestsPath: join(root, 'tests', 'extension-host', 'index.cjs'),
    extensionTestsEnv: { STLCPP_TEST_WORKSPACE: workspace },
    launchArgs: [workspace, ...profileArgs, '--disable-gpu'],
  });
  await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
} catch (error) {
  console.error(`Extension test files and VS Code logs retained in ${temporary}`);
  const diagnostics = join(cachePath, `run-${basename(temporary)}`, 'user-data', 'logs');
  await cp(join(userData, 'logs'), diagnostics, { recursive: true }).catch(() => {});
  throw error;
}
