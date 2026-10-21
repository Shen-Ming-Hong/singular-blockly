/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

const generatorsRoot = path.join(__dirname, '..', '..', '..', 'media', 'blockly', 'generators');
const CJK = /[぀-ヿ㐀-鿿가-힯＀-￯]/u;

function listJsFiles(dir: string): string[] {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			return listJsFiles(fullPath);
		}
		return entry.name.endsWith('.js') ? [fullPath] : [];
	});
}

/** 開發者日誌（log.* / console.*）不會進入產生的程式碼，允許保留原文 */
function isInsideLogCall(node: ts.Node): boolean {
	for (let current = node.parent; current; current = current.parent) {
		if (ts.isCallExpression(current)) {
			const callee = current.expression.getText();
			if (/^(log|console)\./.test(callee)) {
				return true;
			}
		}
	}
	return false;
}

function findNonEnglishStrings(filePath: string): string[] {
	const source = fs.readFileSync(filePath, 'utf8');
	const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
	const findings: string[] = [];
	const visit = (node: ts.Node) => {
		if (
			(ts.isStringLiteral(node) ||
				ts.isNoSubstitutionTemplateLiteral(node) ||
				ts.isTemplateHead(node) ||
				ts.isTemplateMiddle(node) ||
				ts.isTemplateTail(node)) &&
			CJK.test(node.text) &&
			!isInsideLogCall(node)
		) {
			const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
			findings.push(`${path.relative(generatorsRoot, filePath)}:${line + 1}`);
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	return findings;
}

suite('Generator output language contract', () => {
	test('產生器輸出的程式碼字串（註解、Serial 訊息、警告）一律使用英文，不寫死特定語系', () => {
		const files = listJsFiles(generatorsRoot);
		assert.ok(files.length > 20, 'should scan all generator files');
		const findings = files.flatMap(findNonEnglishStrings);
		assert.deepStrictEqual(findings, []);
	});
});
