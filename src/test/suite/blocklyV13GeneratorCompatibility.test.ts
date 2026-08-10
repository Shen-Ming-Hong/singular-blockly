/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const EXPECTED_ROOT = path.join(PROJECT_ROOT, 'src', 'test', 'fixtures', 'blockly-v13', 'expected');

function runScript(relativePath: string, context: Record<string, unknown>): void {
	const filePath = path.join(PROJECT_ROOT, relativePath);
	vm.runInNewContext(fs.readFileSync(filePath, 'utf8'), context, { filename: filePath });
}

function readGolden(name: string): string {
	return fs.readFileSync(path.join(EXPECTED_ROOT, name), 'utf8');
}

suite('Blockly 13 generator golden compatibility', () => {
	test('Arduino custom function output remains represented by the v12 golden', () => {
		const functions: Record<string, string> = {};
		const generator: any = {
			forBlock: {},
			functions_: functions,
			convertFunctionName: (name: string) => name,
			statementToCode: () => '  Serial.println("hello");\n',
		};
		runScript('media/blockly/generators/arduino/functions.js', { window: { arduinoGenerator: generator }, Map });
		generator.forBlock.arduino_function({
			getFieldValue: () => 'blink',
			arguments_: ['times'],
			argumentTypes_: ['int'],
		});

		const golden = readGolden('arduino.cpp');
		assert.match(functions.blink, /void blink\(int times\)/);
		assert.ok(golden.includes('void blink(int times) {'));
		assert.ok(golden.includes('Serial.println("hello");'));
	});

	test('MicroPython procedure VariableModel names remain represented by the v12 golden', () => {
		const functions = new Map<string, string>();
		const generator: any = {
			forBlock: {},
			nameDB_: { getName: (name: string) => name },
			ORDER_NONE: 99,
			ORDER_FUNCTION_CALL: 2.2,
			INDENT: '    ',
			currentFunction_: 'main',
			functionGlobals_: new Map(),
			statementToCode: () => '    pass\n',
			prefixLines: (value: string) => value,
			injectId: (value: string) => value,
			valueToCode: () => '',
			addFunction: (name: string, code: string) => functions.set(name, code),
		};
		runScript('media/blockly/generators/micropython/functions.js', {
			window: { micropythonGenerator: generator },
			Blockly: { PROCEDURE_CATEGORY_NAME: 'PROCEDURE', VARIABLE_CATEGORY_NAME: 'VARIABLE' },
			Set,
			Map,
			console,
		});
		generator.forBlock.procedures_defnoreturn({
			getFieldValue: () => 'move',
			getVarModels: () => [{ name: 'speed' }],
		});

		assert.strictEqual(functions.get('move'), 'def move(speed):\n    pass\n');
		assert.ok(readGolden('cyberbrick.py').includes('def move(speed):\n    pass'));
	});

	test('TXT procedure VariableModel names remain represented by the v12 golden', () => {
		const functions = new Map<string, { name: string; code: string }>();
		const generator: any = {
			forBlock: {},
			reset() {},
			variables_: new Map(),
			functionGlobals_: new Map(),
			functions_: functions,
			nameDB_: { getName: (name: string) => name, getDistinctName: (name: string) => name },
			INDENT: '    ',
			ORDER_NONE: 99,
			ORDER_ATOMIC: 0,
			ORDER_FUNCTION_CALL: 2.2,
			statementToCode: () => '    pass\n',
			valueToCode: () => '',
			isInAllowedContext: () => true,
			addImport() {},
		};
		runScript('media/blockly/generators/txt/python_common.js', {
			window: { txtGenerator: generator },
			Blockly: { PROCEDURE_CATEGORY_NAME: 'PROCEDURE', VARIABLE_CATEGORY_NAME: 'VARIABLE' },
			Set,
			Map,
			Math,
			console,
		});
		generator.forBlock.procedures_defnoreturn({
			getFieldValue: () => 'wait',
			getVarModels: () => [{ name: 'seconds' }],
		});

		assert.strictEqual(functions.get('wait')?.code, 'def wait(seconds):\n    pass\n');
		assert.ok(readGolden('txt.py').includes('def wait(seconds):\n    pass'));
	});

	test('legacy Arduino golden remains non-empty and orphan-free', () => {
		const golden = readGolden('legacy.cpp');
		assert.ok(golden.includes('counter = 1;'));
		assert.doesNotMatch(golden, /Orphan block|controls_if/);
	});
});
