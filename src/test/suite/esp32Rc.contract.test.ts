/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import * as os from 'os';
import { spawnSync } from 'child_process';
import { BlockContractService } from '../../services/blockContractService';

const ROOT = path.join(__dirname, '..', '..', '..');
const TYPES = [
	'esp32_rc_receiver_init',
	'esp32_rc_wait_connection',
	'esp32_rc_is_connected',
	'esp32_rc_get_joystick',
	'esp32_rc_get_joystick_mapped',
	'esp32_rc_is_button_pressed',
];

suite('ESP32 CyberBrick RC contract', () => {
	const { loadRuntime } = require(path.join(ROOT, 'scripts', 'generate-skill-contract.js'));
	let runtime: any;

	suiteSetup(() => {
		if ((global as any).Blockly?.Blocks?.esp32_rc_receiver_init) {
			runtime = { Blockly: (global as any).Blockly };
		} else {
			runtime = loadRuntime();
		}
	});

	test('all six blocks are experimental, survive serialization, and belong only to ESP32', () => {
		const { Blockly } = runtime;
		const experimental = new Set<string>();
		const window = (global as any).window;
		const originalRegister = window.registerExperimentalBlock;
		window.registerExperimentalBlock = (type: string) => {
			experimental.add(type);
			originalRegister.call(window, type);
		};
		const first = new Blockly.Workspace();
		const second = new Blockly.Workspace();
		try {
			for (const type of TYPES) {
				first.newBlock(type);
			}
			assert.deepStrictEqual(TYPES.filter(type => experimental.has(type)), TYPES);
			const saved = Blockly.serialization.workspaces.save(first);
			Blockly.serialization.workspaces.load(saved, second);
			assert.deepStrictEqual(second.getAllBlocks(false).map((block: any) => block.type).sort(), [...TYPES].sort());
		} finally {
			window.registerExperimentalBlock = originalRegister;
			first.dispose();
			second.dispose();
		}
		const contract = new BlockContractService(ROOT).load().contract;
		for (const type of TYPES) {
			const block = contract.blocks.find((candidate: any) => candidate.type === type);
			assert.ok(block);
			assert.deepStrictEqual(block.boards, ['esp32']);
		}
	});

	test('toolbox gating and board warnings use the exact esp32 board ID', () => {
		const source = fs.readFileSync(path.join(ROOT, 'media', 'js', 'blocklyEdit.js'), 'utf8');
		assert.match(source, /item\.name === '%\{CATEGORY_RC\}'[\s\S]*?boardId === 'esp32'/);
		assert.match(source, /rcBlockTypes\.includes\(block\.type\) \? boardId !== 'esp32'/);
		for (const type of TYPES) {
			assert.match(source, new RegExp(`'${type}'`));
		}
	});

	test('RC and Wi-Fi warning updates after disabling a block or switching boards', () => {
		const source = fs.readFileSync(path.join(ROOT, 'media/js/blocklyEdit.js'), 'utf8');
		const warningSource = source.slice(source.indexOf('function updateEsp32BlockWarnings('), source.indexOf('// ===== Serial Monitor 功能 ====='));
		const sandbox: any = { window: { languageManager: { getMessage: (key: string) => key } } };
		vm.runInNewContext(`${warningSource}\nthis.updateWarnings = updateEsp32BlockWarnings;`, sandbox);
		const block = (type: string) => ({ type, enabled: true, warning: null as string | null,
			isEnabled() { return this.enabled; },
			setWarningText(message: string | null) { this.warning = message; },
		});
		const rc = block('esp32_rc_receiver_init');
		const wifi = block('esp32_wifi_connect');
		const workspace = { getAllBlocks: () => [rc, wifi] };
		sandbox.updateWarnings(workspace, 'esp32');
		assert.strictEqual(rc.warning, 'ESP32_RC_WIFI_COEXIST_WARNING');
		assert.strictEqual(wifi.warning, 'ESP32_RC_WIFI_COEXIST_WARNING');
		rc.enabled = false;
		sandbox.updateWarnings(workspace, 'esp32');
		assert.strictEqual(rc.warning, null);
		assert.strictEqual(wifi.warning, null);
		rc.enabled = true;
		sandbox.updateWarnings(workspace, 'supermini');
		assert.strictEqual(rc.warning, 'ESP32_RC_ONLY_WARNING');
		assert.strictEqual(wifi.warning, null);
	});

	test('all RC blocks warn when orphaned and preserve board warnings when connected', () => {
		const { Blockly } = runtime;
		const source = fs.readFileSync(path.join(ROOT, 'media/js/blocklyEdit.js'), 'utf8');
		const warningSource = source.slice(source.indexOf('function updateEsp32BlockWarnings('), source.indexOf('// ===== Serial Monitor 功能 ====='));
		const sandbox: any = { window: (global as any).window };
		vm.runInNewContext(`${warningSource}\nthis.updateWarnings = updateEsp32BlockWarnings;`, sandbox);
		const workspace = new Blockly.Workspace();
		const main = workspace.newBlock('arduino_setup_loop');
		try {
			for (const type of TYPES) {
				const block = workspace.newBlock(type);
				const warnings = new Map<string, string>();
				block.setWarningText = (message: string | null, id = '') => {
					if (message) { warnings.set(id, message); }
					else if (id) { warnings.delete(id); }
					else { warnings.clear(); }
				};
				assert.strictEqual(typeof block.onchange, 'function');
				block.onchange({ type: Blockly.Events.BLOCK_CREATE });
				assert.strictEqual(warnings.get('esp32-rc-orphan'), 'ORPHAN_BLOCK_WARNING_ARDUINO');
				sandbox.updateWarnings(workspace, 'esp32');
				assert.ok(warnings.has('esp32-rc-orphan'));
				sandbox.updateWarnings(workspace, 'supermini');
				assert.strictEqual(warnings.get('esp32-board'), 'ESP32_RC_ONLY_WARNING');

				const holder = block.outputConnection ? workspace.newBlock('variables_set') : block;
				if (block.outputConnection) {
					holder.getInput('VALUE').connection.connect(block.outputConnection);
				}
				main.getInput('SETUP').connection.connect(holder.previousConnection);
				block.onchange({ type: Blockly.Events.BLOCK_MOVE });
				assert.strictEqual(warnings.has('esp32-rc-orphan'), false);
				assert.ok(warnings.has('esp32-board'));
				sandbox.updateWarnings(workspace, 'esp32');
				assert.strictEqual(warnings.size, 0);
				block.unplug();
				block.onchange({ type: Blockly.Events.FINISHED_LOADING });
				assert.ok(warnings.has('esp32-rc-orphan'));
				block.dispose();
				if (holder !== block) { holder.dispose(); }
			}
		} finally {
			workspace.dispose();
		}
	});

	test('opening the RC category marks flyout blocks before dragging', () => {
		let workspaceListener: (event: { type: string }) => void = () => {};
		const windowListeners: Record<string, () => void> = {};
		const marked: string[] = [];
		const flyoutBlocks = TYPES.map((type, index) => ({
			type,
			id: String(index),
			getSvgRoot: () => ({ classList: { add: (name: string) => assert.strictEqual(name, 'singular-experimental-block') } }),
		}));
		const workspace = {
			getFlyout: () => ({ getWorkspace: () => ({ getAllBlocks: () => flyoutBlocks }) }),
			addChangeListener: (listener: typeof workspaceListener) => { workspaceListener = listener; },
		};
		const sandbox: any = {
			window: {
				log: { info() {}, warn() {}, error() {} },
				getBlocklyWorkspace: () => workspace,
				addEventListener: (type: string, listener: () => void) => { windowListeners[type] = listener; },
				experimentalBlockMarker: {
					markExperimentalBlock: (_svg: unknown, block: { type: string }) => { marked.push(block.type); },
				},
			},
			document: { addEventListener() {} },
			Blockly: { Events: { TOOLBOX_ITEM_SELECT: 'toolbox_item_select' } },
			console,
			setTimeout,
		};
		vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'media/js/experimentalBlockMarker.js'), 'utf8'), sandbox);
		sandbox.window.potentialExperimentalBlocks.push(...TYPES);
		windowListeners.blocklyWorkspaceCreated();
		workspaceListener({ type: 'toolbox_item_select' });
		assert.deepStrictEqual(marked, TYPES);
		assert.deepStrictEqual(Array.from(sandbox.window.experimentalBlocks), TYPES);
	});

	test('workspace load and language rebuild both refresh experimental marks', () => {
		const source = fs.readFileSync(path.join(ROOT, 'media/js/blocklyEdit.js'), 'utf8');
		const loader = source.slice(source.indexOf('const handleWorkspaceLoadMessage = async message => {'), source.indexOf('const validateWorkspaceCandidateDocument = message => {'));
		const load = loader.indexOf('loadWorkspaceState(workspaceState, workspace)');
		const collect = loader.indexOf('window.updateExperimentalBlocksList?.(workspace)', load);
		const refresh = loader.indexOf('window.experimentalBlockMarker?.refreshMarks()', collect);
		assert.ok(load >= 0 && collect > load && refresh > collect);
		const rebuild = source.slice(source.indexOf('window.rebuildEditorWorkspaceForLanguage = async state => {'), source.indexOf('// 處理開發板選擇'));
		const render = rebuild.indexOf('workspace.render()');
		const rebuildCollect = rebuild.indexOf('window.updateExperimentalBlocksList?.(workspace)', render);
		const rebuildRefresh = rebuild.indexOf('window.experimentalBlockMarker?.refreshMarks()', rebuildCollect);
		assert.ok(render >= 0 && rebuildCollect > render && rebuildRefresh > rebuildCollect);
	});

	test('generated receiver uses the current ESP-NOW callback and exact packet layout', () => {
		const sandbox: any = { window: { Blockly: runtime.Blockly }, console, setTimeout };
		sandbox.window.getCurrentBoard = () => 'esp32';
		sandbox.window.arduinoGenerator = {
			forBlock: {}, definitions_: {}, includes_: {},
			ORDER_NONE: 99, ORDER_ATOMIC: 0, ORDER_FUNCTION_CALL: 0,
			isInAllowedContext: () => true,
			valueToCode: () => '1',
		};
		const source = fs.readFileSync(path.join(ROOT, 'media', 'blockly', 'generators', 'arduino', 'esp32-rc.js'), 'utf8');
		vm.runInNewContext(source, sandbox);
		const generator = sandbox.window.arduinoGenerator;
		const init = generator.forBlock.esp32_rc_receiver_init({ getFieldValue: () => '1' });
		assert.match(init, /_sbRcBegin/);
		const receiver = generator.definitions_.esp32RcReceiver;
		assert.match(receiver, /const uint8_t \*mac, const uint8_t \*data, int len/);
		assert.match(receiver, /len != 21/);
		assert.match(receiver, /data\[0\] == _sbRcPairId/);
		assert.match(receiver, /\(uint16_t\)data\[2 \+ 2 \* i\] << 8/);
		assert.match(receiver, /millis\(\) - lastReceived\) <= 1500/);
		assert.match(receiver, /portENTER_CRITICAL/);
		assert.match(receiver, /return channel < 6 .* : 2048/);
		assert.match(receiver, /values\[6 \+ button\] == 0/);
		assert.match(generator.forBlock.esp32_rc_is_connected({})[0], /_sbRcConnected/);
		sandbox.window.getCurrentBoard = () => 'uno';
		assert.strictEqual(generator.forBlock.esp32_rc_is_connected({})[0], 'false');
		assert.strictEqual(generator.forBlock.esp32_rc_get_joystick({})[0], '2048');
	});

	test('native receiver rejects invalid values, preserves timeout and restores Wi-Fi reconnect on connection', function () {
		const compiler = spawnSync('c++', ['--version'], { encoding: 'utf8' });
		if (compiler.error) {
			this.skip();
		}
		const sandbox: any = { window: { getCurrentBoard: () => 'esp32', arduinoGenerator: {
			forBlock: {}, definitions_: {}, includes_: {}, ORDER_NONE: 99, ORDER_ATOMIC: 0, ORDER_FUNCTION_CALL: 0,
			isInAllowedContext: () => true, valueToCode: () => '7',
		} } };
		vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'media/blockly/generators/arduino/esp32-rc.js'), 'utf8'), sandbox);
		sandbox.window.arduinoGenerator.forBlock.esp32_rc_receiver_init({ getFieldValue: () => '1' });
		sandbox.window.currentBoard = 'esp32';
		vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'media/blockly/generators/arduino/esp32-wifi-mqtt.js'), 'utf8'), sandbox);
		const wifiCode = sandbox.window.arduinoGenerator.forBlock.esp32_wifi_connect({ getFieldValue: () => 'test' });
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'esp32-rc-test-'));
		try {
			const headers: Record<string, string> = {
				'Arduino.h': `#pragma once\n#include <cstdint>\nusing portMUX_TYPE = int;\n#define portMUX_INITIALIZER_UNLOCKED 0\ninline void portENTER_CRITICAL(portMUX_TYPE*) {}\ninline void portEXIT_CRITICAL(portMUX_TYPE*) {}\nextern uint32_t testNow;\ninline uint32_t millis() { return testNow; }\ninline void delay(unsigned long duration) { testNow += duration; }\n`,
				'WiFi.h': `#pragma once\n#define WIFI_STA 1\n#define WL_CONNECTED 3\nextern bool testWifiMode;\nstruct FakeWiFi { bool autoReconnect = true; bool connected = false; bool mode(int) { return testWifiMode; } void setAutoReconnect(bool enabled) { autoReconnect = enabled; } void disconnect() { connected = false; } void begin(const char*, const char*) { connected = true; } int status() { return connected ? WL_CONNECTED : 0; } };\nextern FakeWiFi WiFi;\n`,
				'esp_now.h': `#pragma once\n#include <cstdint>\n#define ESP_OK 0\ninline int esp_now_init() { return ESP_OK; }\ninline int esp_now_deinit() { return ESP_OK; }\ninline int esp_now_unregister_recv_cb() { return ESP_OK; }\ninline int esp_now_register_recv_cb(void (*)(const uint8_t*, const uint8_t*, int)) { return ESP_OK; }\n`,
				'esp_wifi.h': `#pragma once\n#include <cstdint>\n#define WIFI_SECOND_CHAN_NONE 0\ninline int esp_wifi_set_channel(uint8_t, int) { return 0; }\n`,
			};
			for (const [file, contents] of Object.entries(headers)) {
				fs.writeFileSync(path.join(directory, file), contents);
			}
			const receiver = sandbox.window.arduinoGenerator.definitions_.esp32RcReceiver;
			const program = `#include <cassert>
#include <cstring>
#include <initializer_list>
#include <Arduino.h>
#include <WiFi.h>
#include <esp_now.h>
#include <esp_wifi.h>
uint32_t testNow = 0;
bool testWifiMode = true;
FakeWiFi WiFi;
${receiver}
int main() {
  assert(!_sbRcConnected());
  for (int channel = 0; channel < 6; ++channel) assert(_sbRcJoystick(channel) == 2048);
  for (int button = 0; button < 4; ++button) assert(!_sbRcButtonPressed(button));
  testWifiMode = false;
  assert(!_sbRcBegin(7, 1));
  assert(!_sbRcConnected());
  assert(_sbRcJoystick(0) == 2048);
  testWifiMode = true;
  assert(_sbRcBegin(7, 1));
  assert(!WiFi.autoReconnect);
  ${wifiCode}
  assert(WiFi.autoReconnect && WiFi.connected);
  assert(_sbRcBegin(7, 1));
  assert(!WiFi.autoReconnect && !WiFi.connected);
  uint8_t packet[21] = {7};
  const int16_t values[10] = {100, 200, 300, 400, 500, 600, 0, 1, 1, 1};
  for (int index = 0; index < 10; ++index) {
    packet[1 + 2 * index] = (uint8_t)values[index];
    packet[2 + 2 * index] = (uint8_t)(values[index] >> 8);
  }
  _sbRcOnReceive(nullptr, packet, 20);
  assert(!_sbRcConnected());
  _sbRcOnReceive(nullptr, packet, 22);
  assert(!_sbRcConnected());
  packet[0] = 8; _sbRcOnReceive(nullptr, packet, 21);
  assert(!_sbRcConnected());
  packet[0] = 7;
  packet[1] = 0; packet[2] = 128;
  _sbRcOnReceive(nullptr, packet, 21);
  assert(!_sbRcConnected() && _sbRcJoystick(0) == 2048);
  packet[1] = 100; packet[2] = 0;
  _sbRcOnReceive(nullptr, packet, 21);
  assert(_sbRcConnected());
  for (int channel = 0; channel < 6; ++channel) assert(_sbRcJoystick(channel) == values[channel]);
  assert(_sbRcButtonPressed(0));
  for (int button = 1; button < 4; ++button) assert(!_sbRcButtonPressed(button));
  testNow = 1000;
  for (int index = 0; index < 10; ++index) {
    for (const int16_t invalidValue : {-32768, -1, 2, 4096, 32767}) {
      if (index < 6 && invalidValue == 2) continue;
      uint8_t invalidPacket[21];
      std::memcpy(invalidPacket, packet, sizeof(packet));
      invalidPacket[1 + 2 * index] = (uint8_t)invalidValue;
      invalidPacket[2 + 2 * index] = (uint8_t)(invalidValue >> 8);
      _sbRcOnReceive(nullptr, invalidPacket, 21);
      assert(_sbRcLastReceived == 0 && _sbRcJoystick(0) == 100 && _sbRcButtonPressed(0));
    }
  }
  testNow = 1501;
  assert(!_sbRcConnected());
  for (int channel = 0; channel < 6; ++channel) assert(_sbRcJoystick(channel) == 2048);
  for (int button = 0; button < 4; ++button) assert(!_sbRcButtonPressed(button));
  packet[1] = 255; packet[2] = 15;
  _sbRcOnReceive(nullptr, packet, 21);
  assert(_sbRcJoystickMapped(0, -100, 100) == 100);
  packet[1] = 0; packet[2] = 0;
  _sbRcOnReceive(nullptr, packet, 21);
  assert(_sbRcJoystickMapped(0, -100, 100) == -100);
  return 0;
}
`;
			fs.writeFileSync(path.join(directory, 'receiver.cpp'), program);
			const build = spawnSync('c++', ['-std=c++17', '-I', directory, path.join(directory, 'receiver.cpp'), '-o', path.join(directory, 'receiver')], { encoding: 'utf8' });
			assert.strictEqual(build.status, 0, build.stderr);
			const run = spawnSync(path.join(directory, 'receiver'), [], { encoding: 'utf8' });
			assert.strictEqual(run.status, 0, run.stderr);
		} finally {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	});
});
