import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { t } from '../src/lib/translations';

const roots = [
    'src/pages/public',
    'src/components/layout',
    'src/components/rentals',
    'src/components/ui',
];
const allowSameInBothLanguages = new Set(['BRIZ', 'Ciclotours', 'Mamachari', 'BMX Cross', 'Combo', 'QR', 'CI', 'Bs.']);
const files: string[] = [];

function collect(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) collect(path);
        else if (/\.(tsx|ts)$/.test(entry.name)) files.push(path);
    }
}
roots.forEach(collect);

const untranslated: Array<{ file: string; line: number; text: string }> = [];
for (const file of files) {
    const sourceText = readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const visit = (node: ts.Node) => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't') {
            const first = node.arguments[0];
            if (first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))) {
                const spanish = first.text;
                const english = t(spanish, 'en');
                if (english === spanish && !allowSameInBothLanguages.has(spanish)) {
                    const location = sourceFile.getLineAndCharacterOfPosition(first.getStart(sourceFile));
                    untranslated.push({ file: relative(process.cwd(), file), line: location.line + 1, text: spanish });
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
}

assert.deepEqual(untranslated, [], `Missing English translations in literal t() call sites:\n${untranslated.map(item => `${item.file}:${item.line} ${item.text}`).join('\n')}`);
console.log(`PASS all ${files.length} public UI source files: literal t() calls resolve to English or approved proper names`);
