const vscode = require('vscode');
const tests = require('./features.test.cjs');

// Use plain assertions so the same tests run in the older Node runtime bundled
// with our minimum supported VS Code as well as the current release.
exports.run = async () => {
  for (const { name, run } of tests) {
    let timer;
    try {
      await Promise.race([
        run(),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Timed out: ${name}`)), 15_000);
        }),
      ]);
      console.log(`PASS ${name}`);
    } catch (error) {
      console.error(`FAIL ${name}`);
      throw error;
    } finally {
      clearTimeout(timer);
      await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    }
  }
  console.log(`${tests.length} editor tests passed`);
};
