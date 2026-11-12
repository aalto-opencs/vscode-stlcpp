const assert = require('node:assert/strict');
const { join } = require('node:path');
const vscode = require('vscode');

const tests = [];
const test = (name, run) => tests.push({ name, run });
module.exports = tests;

let sequence = 0;
async function openEditor(text, suffix = '.stlc') {
  const uri = vscode.Uri.file(join(process.env.STLCPP_TEST_WORKSPACE, `example-${sequence++}${suffix}`));
  await vscode.workspace.fs.writeFile(uri, Buffer.from(text));
  const document = await vscode.workspace.openTextDocument(uri);
  return vscode.window.showTextDocument(document);
}

async function tokensFor(document) {
  const legend = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokensLegend', document.uri);
  assert.ok(legend, 'The installed WASM parser must register its semantic token provider');
  const tokens = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', document.uri);
  assert.ok(tokens, 'The parser must return semantic tokens');
  const result = [];
  let line = 0;
  let character = 0;
  for (let i = 0; i < tokens.data.length; i += 5) {
    const [deltaLine, deltaStart, length, tokenType] = tokens.data.slice(i, i + 4);
    line += deltaLine;
    character = deltaLine === 0 ? character + deltaStart : deltaStart;
    assert.ok(length > 0, 'Tokens must not be empty');
    assert.ok(character + length <= document.lineAt(line).text.length, 'Token must fit on its line');
    const range = new vscode.Range(line, character, line, character + length);
    result.push({ text: document.getText(range), type: legend.tokenTypes[tokenType], line, character });
  }
  return result;
}

function assertToken(tokens, text, type) {
  assert.ok(tokens.some((token) => token.text === text && token.type === type),
    `Missing ${type} token ${JSON.stringify(text)} in ${JSON.stringify(tokens)}`);
}

test('opening a .stlc file activates the packaged extension and loads its WASM parser', async () => {
  const { document } = await openEditor('answer : Int\nanswer = 42\n');
  assert.equal(document.languageId, 'stlcpp');
  // Opening the file triggers asynchronous activation. Observe that event
  // without manually activating the extension and masking a broken manifest.
  const extension = vscode.extensions.getExtension('aalto-opencs.stlcpp');
  while (!extension.isActive) await new Promise((resolve) => setTimeout(resolve, 20));
  const tokens = await tokensFor(document);
  assert.equal(extension.isActive, true);
  assert.deepEqual(tokens.map(({ text, type }) => [text, type]), [
    ['answer', 'variable'], ['Int', 'type'], ['answer', 'variable'], ['=', 'operator'], ['42', 'number'],
  ]);
});

test('highlights the advertised language constructs', async () => {
  const source = [
    '// Example syntax',
    'import example',
    'infixl a <> b = a',
    'infixr a ** b = b',
    'prefix ! x = x',
    'identity : forall A : Type, A -> A',
    'identity = fun x : Int, x',
    'choice = if true then 1 else 2',
    'binding = let x = 1 in x',
    'pairFirst = fst (1, 2)',
    'pairSecond = snd (1, 2)',
    'empty = nil Int',
    'items = cons 1 (nil Int)',
    'left = inl 1 Int',
    'right = inr 1 Int',
    'sum = case left of | inl x => x | inr y => y',
    'list = lcase items of | nil => 0 | cons h t => h',
    'printed = __print "hello"',
    'pure = __pure Int 1',
    'bound = __bind Int Int identity pure',
    'input = __readline',
    'failure = panic Int "message"',
    'traced = trace 1 2',
    'fixed = fix identity',
    'negative = false',
    'equal = 1 == 2',
    'addition : Int + Bool',
    "character = 'a'",
    '',
  ].join('\n');
  const { document } = await openEditor(source);
  const tokens = await tokensFor(document);
  for (const keyword of ['import', 'infixl', 'infixr', 'prefix', 'forall', 'Type', 'fun',
    'if', 'then', 'else', 'let', 'in', 'fst', 'snd', 'nil', 'cons', 'inl', 'inr', 'case',
    'of', 'lcase', 'panic', 'trace', 'fix']) assertToken(tokens, keyword, 'keyword');
  for (const name of ['__print', '__pure', '__bind', '__readline']) assertToken(tokens, name, 'function');
  for (const boolean of ['true', 'false']) assertToken(tokens, boolean, 'boolean');
  for (const operator of ['=', '->', '=>', '+', '==', '<>']) assertToken(tokens, operator, 'operator');
  assertToken(tokens, '// Example syntax', 'comment');
  assertToken(tokens, 'Int', 'type');
  assertToken(tokens, 'identity', 'variable');
  assertToken(tokens, '1', 'number');
  assertToken(tokens, '"hello"', 'string');
  assertToken(tokens, "'a'", 'string');
});

test('highlights reserved words and type arguments without matching identifier prefixes', async () => {
  const { document } = await openEditor('fixed = fix Result identity\nfirst = fst (1, 2)\nsecond = snd (1, 2)\nitems = cons 1 (nil Int)');
  const tokens = await tokensFor(document);
  for (const keyword of ['fix', 'fst', 'snd', 'cons']) assertToken(tokens, keyword, 'keyword');
  for (const identifier of ['fixed', 'first', 'second', 'items', 'identity']) assertToken(tokens, identifier, 'variable');
  assertToken(tokens, 'Result', 'type');
});

test('keeps escaped strings and characters as complete tokens', async () => {
  const { document } = await openEditor(String.raw`message = "hello\n\"world\""` + '\n' + String.raw`letter = '\n'`);
  const tokens = await tokensFor(document);
  assertToken(tokens, String.raw`"hello\n\"world\""`, 'string');
  assertToken(tokens, String.raw`'\n'`, 'string');
});

test('uses correct UTF-16 positions after Unicode text with CRLF line endings', async () => {
  const { document } = await openEditor('message = "λ😀" // café😀\r\nanswer = 42\r\n');
  const tokens = await tokensFor(document);
  assert.deepEqual(tokens.find((token) => token.type === 'comment'), {
    text: '// café😀', type: 'comment', line: 0, character: 16,
  });
  assert.deepEqual(tokens.find((token) => token.text === '42'), {
    text: '42', type: 'number', line: 1, character: 9,
  });
  assertToken(tokens, '"λ😀"', 'string');
});

test('refreshes highlighting after an unsaved edit', async () => {
  const editor = await openEditor('answer = 42');
  assertToken(await tokensFor(editor.document), '42', 'number');
  assert.equal(await editor.edit((edit) => edit.replace(new vscode.Range(0, 9, 0, 11), 'true')), true);
  assert.equal(editor.document.isDirty, true);
  const tokens = await tokensFor(editor.document);
  assertToken(tokens, 'true', 'boolean');
  assert.equal(tokens.some((token) => token.text === '42'), false);
});

test('highlights multiline strings without emitting tokens for empty lines or CRLF', async () => {
  const { document } = await openEditor('message = "hello\r\n\r\n😀world"\r\nanswer = 1');
  const tokens = await tokensFor(document);
  assert.deepEqual(tokens.filter((token) => token.type === 'string'), [
    { text: '"hello', type: 'string', line: 0, character: 10 },
    { text: '😀world"', type: 'string', line: 2, character: 0 },
  ]);
  assertToken(tokens, '1', 'number');
});

test('tolerates unfinished syntax and recovers when it is repaired', async () => {
  const editor = await openEditor('answer = (');
  assertToken(await tokensFor(editor.document), 'answer', 'variable');
  await editor.edit((edit) => edit.insert(new vscode.Position(0, 10), '7)'));
  assertToken(await tokensFor(editor.document), '7', 'number');
});

test('handles an empty file', async () => {
  const { document } = await openEditor('');
  assert.deepEqual(await tokensFor(document), []);
});

test('omits zero-width tokens for a missing type and highlights it once entered', async () => {
  const editor = await openEditor('answer :');
  assert.deepEqual((await tokensFor(editor.document)).map(({ text, type }) => [text, type]), [
    ['answer', 'variable'],
  ]);
  await editor.edit((edit) => edit.insert(new vscode.Position(0, 8), ' Int'));
  assertToken(await tokensFor(editor.document), 'Int', 'type');
});

test('does not claim ordinary text files', async () => {
  const { document } = await openEditor('answer = 42', '.txt');
  assert.equal(document.languageId, 'plaintext');
  const tokens = await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens', document.uri);
  assert.equal(tokens, undefined);
});

test('toggles line comments and restores the original text', async () => {
  const editor = await openEditor('answer = 42');
  editor.selection = new vscode.Selection(0, 0, 0, 0);
  await vscode.commands.executeCommand('editor.action.commentLine');
  assert.equal(editor.document.getText(), '// answer = 42');
  assertToken(await tokensFor(editor.document), '// answer = 42', 'comment');
  await vscode.commands.executeCommand('editor.action.commentLine');
  assert.equal(editor.document.getText(), 'answer = 42');
});

for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
  test(`matches ${open}${close} brackets`, async () => {
    const editor = await openEditor(`${open}42${close}`);
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    await vscode.commands.executeCommand('editor.action.jumpToBracket');
    assert.equal(editor.selection.active.character, 3);
    await vscode.commands.executeCommand('editor.action.jumpToBracket');
    assert.equal(editor.selection.active.character, 0);
  });
}

for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}'], ['"', '"'], ["'", "'"]]) {
  test(`auto-closes ${open}${close} while typing`, async () => {
    const editor = await openEditor('');
    await vscode.commands.executeCommand('type', { text: open });
    assert.equal(editor.document.getText(), open + close);
    assert.equal(editor.selection.active.character, 1);
  });
}
