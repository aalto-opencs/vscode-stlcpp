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

## Licensing and contributions

This project's software and technical documentation are [MIT licensed](LICENSE).
Separately licensed third-party material and dependencies retain their existing
licenses and notices. The software license does not license separately supplied
course content, assignments, solutions, or student submissions.

All contributors, including maintainers and direct committers, must follow
[CONTRIBUTING.md](CONTRIBUTING.md) and have the rights to submit their original
contributions under MIT.

## Contributors

Thanks to the people who have contributed to this project. This static snapshot
preserves commit authors and human coauthors from the default-branch history
through [bcdaf31](https://github.com/aalto-opencs/vscode-stlcpp/commit/bcdaf317c0ee7051bfbaa0c1c6679ebbe1e75f32),
reviewed on 22 October 2026. Aliases have been consolidated; unmerged branch
contributions are not included.

- [@lajp](https://github.com/lajp)
- [@superseacat](https://github.com/superseacat)
- [@xhalo32](https://github.com/xhalo32)

### Automation credits

Git history also records Dependabot, Claude. These are listed separately
from human contributors.

These credits are not a statement of copyright ownership or a license grant.
Keep them when moving repositories or replacing history; add future contributors
without removing the historical credits.
