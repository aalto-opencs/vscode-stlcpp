# STLC++ for Visual Studio Code

## TODOs

- Build with Nix and don't include the wasm file as a binary

Tree-sitter based syntax highlighting for the STLC++ language.

## Features

- Syntax highlighting for `.stlc` files using tree-sitter
- Bracket matching and auto-closing
- Comment toggling with `Ctrl+/` (or `Cmd+/` on macOS)

## Installation

### From GitHub Release

1. Download the `.vsix` file from the [Releases](../../releases) page
2. Install in VSCode:
   ```bash
   code --install-extension stlcpp-*.vsix
   ```

### From Source

```bash
git clone <repo-url>
cd vscode-stlcpp
npm install
npm run compile
npx vsce package
code --install-extension stlcpp-*.vsix
```

## Supported Syntax

- Keywords: `if`, `then`, `else`, `case`, `lcase`, `of`, `let`, `in`, `fun`, `forall`, `import`, `Type`
- Fixity declarations: `infixl`, `infixr`, `prefix`
- Constructors: `nil`, `cons`, `inl`, `inr`
- Projections: `fst`, `snd`
- Booleans: `true`, `false`
- Builtins: `__print`, `__pure`, `__bind`, `__readline`
- Debug: `panic`, `trace`, `fix`
- Type identifiers: `[A-Z][A-Za-z0-9]*`
- Term identifiers: `[a-z][A-Za-z0-9._']*`
- String and character literals with escape sequences
- Comments: `// ...`
- Operators: `->`, `=>`, `==`, custom operators

## Related

- [tree-sitter-stlcpp](https://github.com/aalto-opencs/tree-sitter-stlcpp) - Tree-sitter grammar for STLC++

## License

MIT
