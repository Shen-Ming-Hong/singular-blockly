/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
	BlockPackService,
	BlockPackServiceDeps,
	BLOCK_PACKS_SETTING_KEY,
	BLOCK_PACKS_SETTING_SECTION,
	isBlockPacksEnabled,
	parseInstalledSummaries,
	readBlockPackFile,
} from '../../services/blockPackService';

const ROOT = path.join(__dirname, '..', '..', '..');
const EXAMPLES = path.join(ROOT, 'resources', 'block-pack-examples');

function deps(overrides: Partial<BlockPackServiceDeps> = {}): BlockPackServiceDeps & { confirmed: string[][] } {
	const confirmed: string[][] = [];
	return {
		confirmed,
		pickFile: async () => path.join(EXAMPLES, 'hc-sr04.sbpack.json'),
		readFile: readBlockPackFile,
		isWorkspaceTrusted: () => true,
		confirmLibDeps: async (_pack, libDeps) => {
			confirmed.push(libDeps);
			return true;
		},
		...overrides,
	};
}

suite('Block pack import service', () => {
	test('a new pack without libraries is ready without any confirmation', async () => {
		const options = deps();
		const outcome = await new BlockPackService(options).importPack([]);
		assert.strictEqual(outcome.kind, 'ready');
		assert.ok(outcome.kind === 'ready');
		assert.strictEqual(outcome.pack.id, 'hc_sr04');
		assert.strictEqual(outcome.sourceName, 'hc-sr04.sbpack.json');
		assert.strictEqual(outcome.change, 'new');
		assert.deepStrictEqual(outcome.removedBlocks, []);
		assert.deepStrictEqual(options.confirmed, []);
	});

	test('cancelled file selection returns cancelled', async () => {
		const outcome = await new BlockPackService(deps({ pickFile: async () => undefined })).importPack([]);
		assert.deepStrictEqual(outcome, { kind: 'cancelled' });
	});

	test('library dependencies need a trusted workspace and the user’s confirmation', async () => {
		const dht = path.join(EXAMPLES, 'dht11.sbpack.json');
		const untrusted = await new BlockPackService(deps({ pickFile: async () => dht, isWorkspaceTrusted: () => false })).importPack([]);
		assert.deepStrictEqual(untrusted, {
			kind: 'rejected',
			sourceName: 'dht11.sbpack.json',
			errors: [{ code: 'UNTRUSTED_WORKSPACE', path: 'targets.esp32.libDeps' }],
		});

		const declined = await new BlockPackService(deps({ pickFile: async () => dht, confirmLibDeps: async () => false })).importPack([]);
		assert.deepStrictEqual(declined, { kind: 'cancelled' });

		const options = deps({ pickFile: async () => dht });
		const accepted = await new BlockPackService(options).importPack([]);
		assert.strictEqual(accepted.kind, 'ready');
		assert.deepStrictEqual(options.confirmed, [['adafruit/DHT sensor library@^1.4.6', 'adafruit/Adafruit Unified Sensor@^1.1.14']]);
	});

	test('compares against the installed version and lists removed blocks', async () => {
		const service = new BlockPackService(deps());
		const same = await service.importPack([{ id: 'hc_sr04', version: '1.0.0', blocks: ['distance'] }]);
		assert.ok(same.kind === 'ready' && same.change === 'same' && same.previousVersion === '1.0.0');
		const update = await service.importPack([{ id: 'hc_sr04', version: '0.9.0', blocks: ['distance', 'old_block'] }]);
		assert.ok(update.kind === 'ready');
		assert.strictEqual(update.change, 'update');
		assert.deepStrictEqual(update.removedBlocks, ['old_block']);
	});

	test('invalid, oversized, and unreadable files are rejected with codes', async () => {
		const invalid = await new BlockPackService(
			deps({ pickFile: async () => path.join(EXAMPLES, 'invalid', 'url-lib-dep.sbpack.json') })
		).importPack([]);
		assert.deepStrictEqual(invalid, {
			kind: 'rejected',
			sourceName: 'url-lib-dep.sbpack.json',
			errors: [{ code: 'INVALID_LIB_DEP', path: 'targets.esp32.libDeps[0]' }],
		});

		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'block-pack-'));
		try {
			const big = path.join(dir, 'big.sbpack.json');
			fs.writeFileSync(big, `{"pad":"${'x'.repeat(300 * 1024)}"}`);
			const oversized = await new BlockPackService(deps({ pickFile: async () => big })).importPack([]);
			assert.ok(oversized.kind === 'rejected' && oversized.errors[0].code === 'INVALID_JSON');
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}

		const unreadable = await new BlockPackService(
			deps({ readFile: async () => Promise.reject(new Error('EACCES')) })
		).importPack([]);
		assert.deepStrictEqual(unreadable, { kind: 'rejected', sourceName: 'hc-sr04.sbpack.json', errors: [{ code: 'INVALID_JSON', path: '' }] });
	});

	test('validates the installed summary list from the WebView', () => {
		assert.deepStrictEqual(parseInstalledSummaries([{ id: 'a1', version: '1.0.0', blocks: ['x'] }]), [
			{ id: 'a1', version: '1.0.0', blocks: ['x'] },
		]);
		assert.strictEqual(parseInstalledSummaries([{ id: 'a1', version: '1.0.0' }]), null);
		assert.strictEqual(parseInstalledSummaries('nope'), null);
	});

	test('block packs stay behind an experimental setting that is off by default', () => {
		const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
		const setting = manifest.contributes.configuration.properties[`${BLOCK_PACKS_SETTING_SECTION}.${BLOCK_PACKS_SETTING_KEY}`];
		assert.strictEqual(setting.type, 'boolean');
		assert.strictEqual(setting.default, false);
		assert.strictEqual(isBlockPacksEnabled({ get: <T>(_key: string, fallback: T) => fallback }), false);
		assert.strictEqual(isBlockPacksEnabled({ get: <T>() => true as unknown as T }), true);

		const html = fs.readFileSync(path.join(ROOT, 'media', 'html', 'blocklyEdit.html'), 'utf8');
		assert.match(html, /id="blockPackContainer" data-enabled="\{blockPacksEnabled\}"/);
		const editor = fs.readFileSync(path.join(ROOT, 'media', 'js', 'blocklyEdit.js'), 'utf8');
		assert.match(editor, /boardId === 'esp32' && blockPackManager\.isEnabled\(\)/);
		const manager = fs.readFileSync(path.join(ROOT, 'src', 'webview', 'webviewManager.ts'), 'utf8');
		assert.match(manager, /replace\(\s*'\{blockPacksEnabled\}'/);
	});
});
