/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { generateBlockJsonTemplate, getBlockByType } from '../../mcp/blockDictionary';

type TxtMOutputValidationApi = {
	M_COMPONENTS: Record<string, {
		key: string;
		requiresDirection: boolean;
		valueLabelMessageKey: string;
		generatorMode: string;
		sharedPinPolicy: string;
	}>;
};

const validation = require(path.join(
	__dirname,
	'..',
	'..',
	'..',
	'media',
	'js',
	'txtMOutputValidation.js'
)) as TxtMOutputValidationApi;

suite('TXT M Output Metadata Tests', () => {
	test('component metadata 應明確描述方向需求、數值文案、generator mode 與 shared-pin policy', () => {
		assert.strictEqual(validation.M_COMPONENTS.MOTOR.requiresDirection, true);
		assert.strictEqual(validation.M_COMPONENTS.MOTOR.generatorMode, 'signed-speed');
		assert.strictEqual(validation.M_COMPONENTS.MOTOR.valueLabelMessageKey, 'TXT_MOTOR_SPEED_SET');

		assert.strictEqual(validation.M_COMPONENTS.LAMP.requiresDirection, false);
		assert.strictEqual(validation.M_COMPONENTS.LAMP.generatorMode, 'unsigned-level');
		assert.strictEqual(validation.M_COMPONENTS.LAMP.valueLabelMessageKey, 'TXT_LAMP_BRIGHTNESS');

		for (const component of Object.values(validation.M_COMPONENTS)) {
			assert.strictEqual(component.sharedPinPolicy, 'm-port-exclusive');
		}
	});

	test('block shape 與 generator branches 應消費 metadata capability，而非新增 lamp-specific public block type', () => {
		const blockSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'media', 'blockly', 'blocks', 'txt.js'), 'utf8');
		const generatorSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'media', 'blockly', 'generators', 'txt', 'txt.js'), 'utf8');

		assert.match(blockSource, /getTxtMOutputComponents|M_COMPONENTS/, 'block UI should read component metadata');
		assert.match(blockSource, /requiresDirection/, 'block UI should use requiresDirection capability');
		assert.match(generatorSource, /metadata\.generatorMode/, 'generator should branch by generatorMode capability');
		assert.doesNotMatch(blockSource, /txt_lamp_(?:speed|set|stop)|lamp_.*Blockly\.Blocks/i, 'should not define lamp-specific public block types');
	});

	test('validation helper 應文件化 future component extension points', () => {
		const helperSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'media', 'js', 'txtMOutputValidation.js'), 'utf8');

		assert.match(helperSource, /Extension points for future M components/i);
		assert.match(helperSource, /requiresDirection/);
		assert.match(helperSource, /generatorMode/);
		assert.match(helperSource, /sharedPinPolicy/);
	});

	test('block dictionary template 應為 txt_motor_speed SPEED 放入預設數字', () => {
		const block = getBlockByType('txt_motor_speed');
		assert.ok(block, 'txt_motor_speed should exist in block dictionary');

		const speedInput = block.inputs.find(input => input.name === 'SPEED');
		assert.strictEqual(speedInput?.default, 512, 'SPEED input should record the same default number as the toolbox');

		const template = generateBlockJsonTemplate(block, {});
		assert.strictEqual(template?.inputs?.SPEED?.block.type, 'math_number', 'SPEED should be filled by a math_number block');
		assert.strictEqual(template?.inputs?.SPEED?.block.fields?.NUM, 512, 'SPEED template should default to 512');
	});
});