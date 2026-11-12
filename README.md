# STLC++ for Visual Studio Code

<img src="media/opencs-icon.png" alt="STLC++: pink OpenCS bracket and cursor symbol on a dark tile" width="96" height="96">

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
   code --install-extension extension.vsix
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

## Testing

```sh
npm ci
npm test
```

`npm test` runs the release safeguards, dependency/packaging checks, and editor
tests. The editor tests build a VSIX, install it in an isolated VS Code profile,
and exercise the packaged extension: automatic `.stlc` activation, WASM loading,
syntax highlighting, Unicode positions, edits, incomplete files, comment toggling,
bracket matching and automatic closing. Your normal editor profile is not used.

VS Code is downloaded to `.vscode-test/` on the first run. Linux needs a display;
on a headless machine use `xvfb-run -a npm test`.

To test an existing artifact without rebuilding it:

```sh
npm run test:extension -- --vsix extension.vsix
```

The current test version is pinned in `package.json` under `config.vscodeTestVersion`.
Use `--version 1.75.0` to check the declared minimum supported VS Code release.
Failed runs retain their temporary profiles at the path printed by the runner and
copy available VS Code logs into `.vscode-test/run-*/`.
CI tests the same built VSIX on Linux, macOS and Windows, plus the minimum VS Code
release on Linux. All editor checks must pass before a GitHub Release or marketplace
upload can start.

## Releases

Publishing starts only when a **new `vMAJOR.MINOR.PATCH` tag is pushed**. A maintainer
or AI creates and pushes the tag; the workflow does not bump versions or create tags.
Both plugin repositories use the same release process:

1. Update `package.json` and `package-lock.json` together, for example with
   `npm version patch --no-git-tag-version`. Add a non-empty entry for that exact
   version to `CHANGELOG.md` under `## [MAJOR.MINOR.PATCH]`.
2. Merge those changes into `main` and wait for CI to pass.
3. Create and push the matching tag on the tested commit. Replace `X.Y.Z` below
   with the new package version:

   ```sh
   git fetch origin main
   git tag -a vX.Y.Z origin/main -m "Release X.Y.Z"
   git push origin vX.Y.Z
   ```

The tag workflow validates the new tag, versions, changelog and membership in
`main`, runs tests, and builds one VSIX. It then creates the **GitHub Release**
with that changelog and VSIX attached. After the release succeeds, it uploads
that same VSIX to **Visual Studio Marketplace and Open VSX** using trusted publishing.
A validation, test, build or GitHub Release failure prevents marketplace uploads.

Branch pushes, pull requests and manual workflow runs only validate/package;
they never publish. Moving an existing tag is rejected. For a failed release,
use **Re-run failed jobs** on the original tag run so it reuses the same artifact;
do not move tags or rerun successful marketplace uploads.

The [publishing guide](docs/publishing.md) records the trusted-publisher setup,
release safeguards, dry runs and retry procedure.

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
