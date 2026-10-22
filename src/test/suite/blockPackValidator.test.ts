/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import {
	blockPackLibDeps,
	getBlockPackBlockType,
	parseBlockPack,
	validateBlockPack,
	validateBlockPackSnapshot,
} from '../../services/blockPackValidator';

const ROOT = path.join(__dirname, '..', '..', '..');
const EXAMPLES = path.join(ROOT, 'resources', 'block-pack-examples');
const SCHEMA = path.join(ROOT, 'media', 'schemas', 'block-pack.schema.json');

function readExample(name: string): any {
	return JSON.parse(fs.readFileSync(path.join(EXAMPLES, name), 'utf8'));
}

function minimalPack(): any {
	return {
		formatVersion: 1,
		id: 'buzzer',
		version: '1.0.0',
		defaultLocale: 'en',
		category: { name: 'Buzzer', colour: 30 },
		blocks: [
			{
				name: 'beep',
				shape: 'statement',
				label: 'beep on {PIN} for {MS} ms',
				inputs: [
					{ name: 'PIN', kind: 'pin', mode: 'digital', direction: 'output' },
					{ name: 'MS', kind: 'number', default: 100, min: 1, max: 5000 },
				],
			},
		],
		targets: { esp32: { blocks: { beep: 'tone({{PIN}}, 440, {{MS}});\n' } } },
	};
}

function codes(value: unknown): string[] {
	const result = validateBlockPack(value);
	return result.ok ? [] : result.errors.map(error => `${error.code}@${error.path}`);
}

suite('Block pack validator', () => {
	test('accepts the shipped examples and a minimal pack', () => {
		assert.deepStrictEqual(codes(minimalPack()), []);
		for (const name of ['hc-sr04.sbpack.json', 'dht11.sbpack.json']) {
			assert.deepStrictEqual(codes(readExample(name)), [], name);
		}
	});

	test('rejects each invalid example with a stable error code and path', () => {
		const expected: Record<string, string[]> = {
			'unsupported-board.sbpack.json': ['UNSUPPORTED_BOARD@targets.uno'],
			'unknown-template-input.sbpack.json': ['UNKNOWN_TEMPLATE_INPUT@targets.esp32.blocks.beep'],
			'label-mismatch.sbpack.json': ['LABEL_INPUT_MISMATCH@blocks[0].label'],
			'url-lib-dep.sbpack.json': ['INVALID_LIB_DEP@targets.esp32.libDeps[0]'],
		};
		for (const [name, errors] of Object.entries(expected)) {
			assert.deepStrictEqual(codes(readExample(path.join('invalid', name))), errors, name);
		}
	});

	test('reports structural errors', () => {
		const pack = minimalPack();
		pack.extra = true;
		pack.blocks[0].inputs.push({ name: 'PIN', kind: 'statement' });
		pack.blocks[0].label = 'beep on {PIN} for {MS} ms';
		delete pack.targets.esp32.blocks.beep;
		const result = codes(pack);
		assert.ok(result.includes('UNKNOWN_FIELD@extra'));
		assert.ok(result.includes('DUPLICATE_NAME@blocks[0].inputs[2].name'));
		assert.ok(result.includes('MISSING_TEMPLATE@targets.esp32.blocks.beep'));

		assert.deepStrictEqual(codes({ ...minimalPack(), formatVersion: 2 }), ['UNSUPPORTED_FORMAT_VERSION@formatVersion']);
		assert.deepStrictEqual(codes({ ...minimalPack(), id: 'Bad-Id' }), ['INVALID_VALUE@id']);

		const analogOutput = minimalPack();
		analogOutput.blocks[0].inputs[0].mode = 'analog';
		assert.deepStrictEqual(codes(analogOutput), ['INVALID_VALUE@blocks[0].inputs[0].direction']);

		const outputOnStatement = minimalPack();
		outputOnStatement.blocks[0].output = 'Number';
		assert.deepStrictEqual(codes(outputOnStatement), ['INVALID_VALUE@blocks[0].output']);
	});

	test('localized labels must include the default locale and every input once in each language', () => {
		const pack = minimalPack();
		pack.blocks[0].label = { 'zh-hant': '在 {PIN} 嗶 {MS} 毫秒' };
		assert.deepStrictEqual(codes(pack), ['MISSING_FIELD@blocks[0].label.en']);
		pack.blocks[0].label = { en: 'beep on {PIN} for {MS} ms', ja: '{PIN} で鳴らす' };
		assert.deepStrictEqual(codes(pack), ['LABEL_INPUT_MISMATCH@blocks[0].label']);
		pack.blocks[0].label = { en: 'beep on {PIN} for {MS} ms', xx: 'x {PIN} {MS}' };
		assert.deepStrictEqual(codes(pack), ['INVALID_VALUE@blocks[0].label.xx']);
	});

	test('parses text with size and JSON checks', () => {
		assert.deepStrictEqual(parseBlockPack('{').ok, false);
		assert.deepStrictEqual(parseBlockPack(' '.repeat(256 * 1024 + 1)).ok, false);
		assert.strictEqual(parseBlockPack(JSON.stringify(minimalPack())).ok, true);
	});

	test('validates project snapshots and rejects duplicate pack ids', () => {
		const pack = { ...minimalPack(), importedAt: '2026-10-22T03:00:00Z', sourceName: 'buzzer.sbpack.json' };
		assert.strictEqual(validateBlockPackSnapshot({ formatVersion: 1, packs: [pack] }).ok, true);
		const duplicate = validateBlockPackSnapshot({ formatVersion: 1, packs: [pack, pack] });
		assert.strictEqual(duplicate.ok, false);
		assert.deepStrictEqual(!duplicate.ok && duplicate.errors, [{ code: 'DUPLICATE_NAME', path: 'customBlocks.packs[1].id' }]);
		assert.strictEqual(validateBlockPackSnapshot({ packs: [] }).ok, false);
	});

	test('derives block types and library dependencies', () => {
		assert.strictEqual(getBlockPackBlockType('hc_sr04', 'distance'), 'pack_hc_sr04_distance');
		assert.deepStrictEqual(blockPackLibDeps(readExample('dht11.sbpack.json')), [
			'adafruit/DHT sensor library@^1.4.6',
			'adafruit/Adafruit Unified Sensor@^1.1.14',
		]);
		assert.deepStrictEqual(blockPackLibDeps(minimalPack()), []);
	});

	test('the authoring schema agrees with the validator on every example', () => {
		const Ajv2020 = require('ajv/dist/2020').default;
		const validate = new Ajv2020({ allErrors: true, strict: false }).compile(JSON.parse(fs.readFileSync(SCHEMA, 'utf8')));
		for (const name of ['hc-sr04.sbpack.json', 'dht11.sbpack.json']) {
			assert.strictEqual(validate(readExample(name)), true, `${name}: ${JSON.stringify(validate.errors)}`);
		}
		assert.strictEqual(validate(minimalPack()), true);
		// Schema 無法表達跨欄位規則（標籤與模板引用），其餘結構錯誤必須同樣被拒絕
		for (const name of ['unsupported-board.sbpack.json', 'url-lib-dep.sbpack.json']) {
			assert.strictEqual(validate(readExample(path.join('invalid', name))), false, name);
		}
	});
});
