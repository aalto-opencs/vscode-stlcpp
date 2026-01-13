import * as vscode from 'vscode';
import * as path from 'path';
import Parser from 'web-tree-sitter';

// Token types that VSCode supports
const tokenTypes = [
    'comment',
    'keyword',
    'string',
    'number',
    'operator',
    'type',
    'variable',
    'function',
    'boolean',
];

// Token modifiers
const tokenModifiers = [
    'declaration',
    'definition',
    'readonly',
    'defaultLibrary',
];

const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

// Map tree-sitter node types to VSCode token types
function getTokenType(nodeType: string): number | undefined {
    const mapping: Record<string, number> = {
        // Comments
        'comment': 0,

        // Keywords
        'kw_import': 1,
        'kw_fun': 1,
        'kw_forall': 1,
        'kw_Type': 1,
        'kw_let': 1,
        'kw_in': 1,
        'kw_if': 1,
        'kw_then': 1,
        'kw_else': 1,
        'kw_case': 1,
        'kw_lcase': 1,
        'kw_of': 1,
        'kw_nil': 1,
        'kw_cons': 1,
        'kw_inl': 1,
        'kw_inr': 1,
        'kw_fst': 1,
        'kw_snd': 1,
        'kw_fix': 1,
        'kw_panic': 1,
        'kw_trace': 1,
        'kw_infixl': 1,
        'kw_infixr': 1,
        'kw_prefix': 1,

        // Booleans
        'kw_true': 8,
        'kw_false': 8,

        // Builtins (as functions)
        'kw___print': 7,
        'kw___pure': 7,
        'kw___bind': 7,
        'kw___readline': 7,

        // Strings
        'string_literal': 2,
        'char_literal': 2,

        // Numbers
        'integer': 3,

        // Operators
        'operator': 4,
        'arrow': 4,
        'fat_arrow': 4,
        'equals': 4,
        'plus': 4,

        // Types
        'type_identifier': 5,

        // Variables/identifiers
        'term_identifier': 6,
        'term_identifier_or_hole': 6,
    };

    return mapping[nodeType];
}

// Check if node type should be highlighted
function shouldHighlight(nodeType: string): boolean {
    return getTokenType(nodeType) !== undefined;
}

class StlcppSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
    private parser: Parser | null = null;
    private language: Parser.Language | null = null;

    constructor(private extensionPath: string) {}

    async init(): Promise<void> {
        await Parser.init();
        this.parser = new Parser();

        const wasmPath = path.join(this.extensionPath, 'wasm', 'tree-sitter-stlcpp.wasm');
        this.language = await Parser.Language.load(wasmPath);
        this.parser.setLanguage(this.language);
    }

    provideDocumentSemanticTokens(
        document: vscode.TextDocument,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.SemanticTokens> {
        if (!this.parser) {
            return null;
        }

        const text = document.getText();
        const tree = this.parser.parse(text);
        const builder = new vscode.SemanticTokensBuilder(legend);

        // Traverse the tree and collect tokens
        const traverse = (node: Parser.SyntaxNode) => {
            const tokenType = getTokenType(node.type);

            if (tokenType !== undefined && node.childCount === 0) {
                // Only highlight leaf nodes
                const startPos = document.positionAt(node.startIndex);
                const endPos = document.positionAt(node.endIndex);

                // Handle multi-line tokens
                if (startPos.line === endPos.line) {
                    builder.push(
                        startPos.line,
                        startPos.character,
                        node.endIndex - node.startIndex,
                        tokenType,
                        0
                    );
                }
            }

            // Recurse into children
            for (let i = 0; i < node.childCount; i++) {
                const child = node.child(i);
                if (child) {
                    traverse(child);
                }
            }
        };

        traverse(tree.rootNode);

        return builder.build();
    }
}

let provider: StlcppSemanticTokensProvider | null = null;

export async function activate(context: vscode.ExtensionContext) {
    provider = new StlcppSemanticTokensProvider(context.extensionPath);

    try {
        await provider.init();

        const selector: vscode.DocumentSelector = { language: 'stlcpp', scheme: 'file' };

        context.subscriptions.push(
            vscode.languages.registerDocumentSemanticTokensProvider(
                selector,
                provider,
                legend
            )
        );

        console.log('STLC++ extension activated with tree-sitter support');
    } catch (error) {
        console.error('Failed to initialize tree-sitter parser:', error);
        vscode.window.showErrorMessage('Failed to initialize STLC++ syntax highlighting');
    }
}

export function deactivate() {
    provider = null;
}
