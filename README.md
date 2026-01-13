# STLC++ for Visual Studio Code

Syntax highlighting support for the STLC++ language.

## Features

- Syntax highlighting for `.stlc` files
- Bracket matching and auto-closing
- Comment toggling with `Ctrl+/` (or `Cmd+/` on macOS)

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

## Installation

### From Source

1. Clone or download this extension folder
2. Copy the `vscode-stlcpp` folder to your VSCode extensions directory:
   - **Linux**: `~/.vscode/extensions/`
   - **macOS**: `~/.vscode/extensions/`
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`
3. Restart VSCode

### Using vsce (for development)

```bash
cd vscode-stlcpp
npm install -g @vscode/vsce
vsce package
code --install-extension stlcpp-0.0.1.vsix
```

## Publishing (for maintainers)

The extension is automatically built and published via GitHub Actions when a version tag is pushed.

### Setup

1. Create a Personal Access Token (PAT) for the VS Code Marketplace:
   - Go to [Azure DevOps](https://dev.azure.com/)
   - Create an organization (or use an existing one)
   - Go to User Settings > Personal Access Tokens
   - Create a new token with **Marketplace (Manage)** scope
   - Add the token as a repository secret named `VSCE_PAT`

2. (Optional) For Open VSX Registry:
   - Go to [Open VSX](https://open-vsx.org/)
   - Create an access token
   - Add it as a repository secret named `OVSX_PAT`

### Release Process

1. Update the version in `package.json`
2. Commit the change
3. Create and push a version tag:
   ```bash
   git tag v0.0.1
   git push origin v0.0.1
   ```

The workflow will automatically:
- Build and package the extension
- Publish to VS Code Marketplace
- Publish to Open VSX Registry (if configured)
- Create a GitHub Release with the VSIX file attached

## Related

- [tree-sitter-stlcpp](https://github.com/aalto-opencs/tree-sitter-stlcpp) - Tree-sitter grammar for STLC++

## License

MIT
