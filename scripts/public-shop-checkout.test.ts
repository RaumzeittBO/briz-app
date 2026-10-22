import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { generateShopWhatsAppLink } from '../src/lib/whatsapp';

const source = await readFile(new URL('../src/pages/public/ShopPage.tsx', import.meta.url), 'utf8');
const ast = ts.createSourceFile('ShopPage.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let checkout: ts.ArrowFunction | undefined;

function findCheckout(node: ts.Node): void {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === 'handleCheckout'
        && node.initializer && ts.isArrowFunction(node.initializer)) {
        checkout = node.initializer;
    }
    ts.forEachChild(node, findCheckout);
}
findCheckout(ast);
assert.ok(checkout, 'ShopPage must keep its checkout submit handler');

const calledNames = new Set<string>();
function collectCalls(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
        const expression = node.expression;
        if (ts.isIdentifier(expression)) calledNames.add(expression.text);
        else if (ts.isPropertyAccessExpression(expression)) calledNames.add(expression.name.text);
    }
    ts.forEachChild(node, collectCalls);
}
collectCalls(checkout);
for (const forbidden of ['addSale', 'addOrUpdateCustomer', 'setDoc', 'addDoc', 'updateDoc', 'deleteDoc', 'writeBatch']) {
    assert.equal(calledNames.has(forbidden), false, `Public WhatsApp checkout must not call ${forbidden}`);
}
assert.equal(calledNames.has('generateShopWhatsAppLink'), true);
assert.equal(calledNames.has('open'), true, 'Checkout opens WhatsApp directly from the submit gesture');
assert.equal(calledNames.has('clearCart'), true, 'Checkout clears the cart after preparing WhatsApp');

const link = new URL(generateShopWhatsAppLink({
    customerName: 'Cliente Ficticio',
    customerPhone: '70000000',
    customerCI: 'TEST-ONLY',
    items: [
        { name: 'Bicicleta Urbana', price: 120, quantity: 2 },
        { name: 'Casco', price: 35, quantity: 1 },
    ],
    total: 275,
    notes: 'Entrega a coordinar',
}));
const message = link.searchParams.get('text') || '';
assert.equal(link.hostname, 'api.whatsapp.com');
assert.equal(link.pathname, '/send');
assert.equal(link.searchParams.get('phone'), '59177860277');
assert.match(message, /2x Bicicleta Urbana \(Bs\. 120 c\/u\) = Bs\. 240/);
assert.match(message, /1x Casco \(Bs\. 35 c\/u\) = Bs\. 35/);
assert.match(message, /TOTAL: Bs\. 275/);
assert.match(message, /Entrega a coordinar/);

console.log('PASS public shop checkout opens WhatsApp with complete cart and creates no sale/customer writes');
