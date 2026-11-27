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
	ArduinoBuildCache,
	BUILD_CACHE_FILE,
	findPlatformNames,
	parseEsptoolMac,
	reuseModeFor,
	resolveBuildRoot,
	resolveDefaultEnvironment,
	type CoreIdentity,
} from '../../services/arduinoBuildCache';

const INI = '[env:esp32dev]\nplatform = espressif32@6.9.0\nboard = esp32dev\nframework = arduino\n';

suite('ArduinoBuildCache (spec 077)', () => {
	let root: string;
	let workspace: string;
	let platformsDir: string;
	let core: CoreIdentity;

	setup(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-build-cache-'));
		workspace = path.join(root, 'project');
		platformsDir = path.join(root, 'core', 'platforms');
		fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
		fs.mkdirSync(path.join(platformsDir, 'espressif32'), { recursive: true });
		fs.writeFileSync(path.join(workspace, 'platformio.ini'), INI);
		fs.writeFileSync(path.join(workspace, 'src', 'main.cpp'), 'void setup() {}\nvoid loop() {}\n');
		core = { id: 'managed', command: 'pio', env: {} };
	});

	teardown(() => {
		fs.rmSync(root, { recursive: true, force: true });
	});

	function writeFirmware(content = 'firmware'): void {
		const dir = path.join(workspace, '.pio', 'build', 'esp32dev');
		fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(path.join(dir, 'firmware.bin'), content);
		fs.writeFileSync(path.join(dir, 'bootloader.bin'), 'boot');
	}

	test('resolves the one environment pio run builds', () => {
		assert.strictEqual(resolveDefaultEnvironment(INI), 'esp32dev');
		assert.strictEqual(resolveDefaultEnvironment('[env:a]\n[env:b]\n'), null);
		assert.strictEqual(resolveDefaultEnvironment('[platformio]\ndefault_envs = b\n[env:a]\n[env:b]\n'), 'b');
		assert.strictEqual(resolveDefaultEnvironment('[platformio]\n'), null);
	});

	test('reads plain platform names and refuses URLs', () => {
		assert.deepStrictEqual(findPlatformNames(INI), ['espressif32']);
		assert.deepStrictEqual(findPlatformNames('platform = atmelavr ; pinned later\n'), ['atmelavr']);
		assert.deepStrictEqual(findPlatformNames('platform = platformio/espressif32@7.0.1\n'), ['espressif32']);
		assert.strictEqual(findPlatformNames('platform = https://example.com/platform.zip\n'), null);
	});

	test('reuses AVR builds anywhere but ESP32 builds only on the same chip', () => {
		assert.strictEqual(reuseModeFor(['atmelavr']), 'whole');
		assert.strictEqual(reuseModeFor(['espressif32']), 'app-only');
		assert.strictEqual(reuseModeFor(['ststm32']), 'unsupported');
		assert.strictEqual(reuseModeFor(['atmelavr', 'espressif32']), 'unsupported');
		assert.strictEqual(reuseModeFor(null), 'unsupported');
		assert.strictEqual(parseEsptoolMac('MAC: 24:6F:28:AA:BB:01'), '24:6f:28:aa:bb:01');
		assert.strictEqual(parseEsptoolMac('BASE MAC: 24:6f:28:aa:bb:01'), '24:6f:28:aa:bb:01');
		assert.strictEqual(parseEsptoolMac('Serial port COM35'), null);
	});

	test('keeps the flashed board with the build it belongs to', async () => {
		const cache = new ArduinoBuildCache(workspace);
		writeFirmware();
		const inputs = (await cache.computeInputs(core))!;
		await cache.recordDevice(inputs, core, { port: 'COM35', mac: 'aa' });
		assert.strictEqual(await cache.flashedDevice(core), null, 'no build recorded yet');
		await cache.markBuilt(inputs, core);
		await cache.recordDevice(inputs, core, { port: 'COM35', mac: 'aa' });
		assert.deepStrictEqual(await cache.flashedDevice(core), { port: 'COM35', mac: 'aa' });
		await cache.invalidateBuild(core);
		assert.strictEqual(await cache.flashedDevice(core), null);
	});

	test('follows the managed Core build folder', () => {
		assert.strictEqual(resolveBuildRoot('/p', {}), path.join('/p', '.pio', 'build'));
		assert.strictEqual(resolveBuildRoot('/p', { PLATFORMIO_BUILD_DIR: '/w/build' }), '/w/build');
		assert.strictEqual(resolveBuildRoot('/p', { PLATFORMIO_WORKSPACE_DIR: '/w' }), path.join('/w', 'build'));
	});

	test('remembers package preparation until the ini, Core, or platform changes', async () => {
		const cache = new ArduinoBuildCache(workspace);
		const inputs = (await cache.computeInputs(core))!;
		assert.strictEqual(await cache.isPrepared(inputs, core, platformsDir), false);
		await cache.markPrepared(inputs, core);
		assert.strictEqual(await cache.isPrepared(inputs, core, platformsDir), true);

		const otherCore = { ...core, id: 'provider' };
		assert.strictEqual(await cache.isPrepared((await cache.computeInputs(otherCore))!, otherCore, platformsDir), false);

		fs.rmSync(path.join(platformsDir, 'espressif32'), { recursive: true });
		assert.strictEqual(await cache.isPrepared(inputs, core, platformsDir), false, 'platform removed');

		fs.mkdirSync(path.join(platformsDir, 'espressif32'));
		fs.appendFileSync(path.join(workspace, 'platformio.ini'), 'lib_deps = foo\n');
		assert.strictEqual(await cache.isPrepared((await cache.computeInputs(core))!, core, platformsDir), false, 'ini changed');
	});

	test('reuses a build only while sources and firmware are unchanged', async () => {
		const cache = new ArduinoBuildCache(workspace);
		const inputs = (await cache.computeInputs(core))!;
		assert.strictEqual(await cache.markBuilt(inputs, core), false, 'no firmware yet');
		writeFirmware();
		assert.strictEqual(await cache.markBuilt(inputs, core), true);
		assert.ok(fs.existsSync(path.join(workspace, '.pio', 'build', BUILD_CACHE_FILE)));
		assert.strictEqual(await cache.canReuseBuild((await cache.computeInputs(core))!, core), true);

		fs.writeFileSync(path.join(workspace, 'src', 'main.cpp'), 'void setup() { }\nvoid loop() {}\n');
		assert.strictEqual(await cache.canReuseBuild((await cache.computeInputs(core))!, core), false, 'code changed');
	});

	test('notices new library files and replaced firmware', async () => {
		const cache = new ArduinoBuildCache(workspace);
		writeFirmware();
		const inputs = (await cache.computeInputs(core))!;
		await cache.markBuilt(inputs, core);

		fs.mkdirSync(path.join(workspace, 'lib', 'Helper'), { recursive: true });
		fs.writeFileSync(path.join(workspace, 'lib', 'Helper', 'helper.h'), '#pragma once\n');
		assert.strictEqual(await cache.canReuseBuild((await cache.computeInputs(core))!, core), false, 'new lib file');

		const again = (await cache.computeInputs(core))!;
		await cache.markBuilt(again, core);
		assert.strictEqual(await cache.canReuseBuild(again, core), true);
		writeFirmware('rebuilt by someone else');
		assert.strictEqual(await cache.canReuseBuild(again, core), false, 'firmware size changed');
		fs.rmSync(path.join(workspace, '.pio', 'build', 'esp32dev'), { recursive: true });
		assert.strictEqual(await cache.canReuseBuild(again, core), false, 'firmware deleted');
	});

	test('invalidateBuild forgets the firmware but keeps package preparation', async () => {
		const cache = new ArduinoBuildCache(workspace);
		writeFirmware();
		const inputs = (await cache.computeInputs(core))!;
		await cache.markPrepared(inputs, core);
		await cache.markBuilt(inputs, core);
		await cache.invalidateBuild(core);
		assert.strictEqual(await cache.canReuseBuild(inputs, core), false);
		assert.strictEqual(await cache.isPrepared(inputs, core, platformsDir), true);
	});

	test('turns itself off for projects it cannot fingerprint', async () => {
		const cache = new ArduinoBuildCache(workspace);
		fs.writeFileSync(path.join(workspace, 'platformio.ini'), '[env:a]\nplatform = atmelavr\n[env:b]\nplatform = atmelavr\n');
		const inputs = (await cache.computeInputs(core))!;
		assert.strictEqual(inputs.env, null);
		assert.strictEqual(await cache.markBuilt(inputs, core), false);
		fs.rmSync(path.join(workspace, 'platformio.ini'));
		assert.strictEqual(await cache.computeInputs(core), null);
	});

	test('ignores a corrupt cache file', async () => {
		const cache = new ArduinoBuildCache(workspace);
		writeFirmware();
		const inputs = (await cache.computeInputs(core))!;
		fs.writeFileSync(path.join(workspace, '.pio', 'build', BUILD_CACHE_FILE), '{not json');
		assert.strictEqual(await cache.canReuseBuild(inputs, core), false);
		assert.strictEqual(await cache.markBuilt(inputs, core), true);
		assert.strictEqual(await cache.canReuseBuild(inputs, core), true);
	});
});
