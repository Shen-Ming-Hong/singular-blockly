import assert = require('assert');
import * as fs from 'fs';
import * as path from 'path';
import { suite, test } from 'mocha';
import { buildCyberBrickRcMainOtaBootstrap } from '../../services/cyberbrickOtaAgentSource';

suite('CyberBrick RC MicroPython OTA coexistence contract', () => {
	const rcGeneratorPath = path.join(process.cwd(), 'media/blockly/generators/micropython/rc.js');

	function readRcGenerator(): string {
		return fs.readFileSync(rcGeneratorPath, 'utf8');
	}

	test('keeps OTA Wi-Fi alive when RC ESP-NOW code is generated for a paired device', () => {
		const source = readRcGenerator();

		assert.ok(source.includes('cyberbrick_ota_config'), 'RC generator should detect device-side OTA configuration');
		assert.ok(source.includes('_rc_keep_wifi_for_ota'), 'RC generator should cache whether OTA Wi-Fi must be kept alive');
		assert.match(source, /if not _rc_keep_wifi_for_ota:\n\s+_wlan\.disconnect\(\)/, 'RC Wi-Fi disconnect must be guarded when OTA is configured');
		assert.ok(
			source.includes(".replace(/\\t/g, '    ')"),
			'RC generator should normalize template tabs to space-indented Python code'
		);
		assert.strictEqual(
			source.includes('_wlan.active(True)\n_wlan.disconnect()'),
			false,
			'RC initialization must not unconditionally disconnect STA Wi-Fi after OTA bootstrap starts'
		);
		assert.strictEqual(
			source.includes('_wlan.active(True)\n_wlan.config(reconnects=0)'),
			false,
			'RC initialization must not unconditionally disable Wi-Fi reconnects needed by OTA'
		);
		assert.ok(
			source.includes('isconnected()'),
			'RC OTA guard must check actual Wi-Fi connection state via isconnected(), not only config file existence'
		);
	});

	test('OTA bootstrap waits for Wi-Fi stability and disables reconnect when AP is unavailable', () => {
		const bootstrap = buildCyberBrickRcMainOtaBootstrap();

		assert.ok(
			bootstrap.includes('_singular_blockly_ota_yield(100)'),
			'Bootstrap must poll every 100ms (5-second wait window) rather than only the original 10ms loop'
		);
		assert.ok(
			bootstrap.includes('reconnects=0'),
			'Bootstrap must disable Wi-Fi auto-reconnect when AP is not available, to stop channel scanning'
		);
		assert.ok(
			bootstrap.includes('.disconnect()'),
			'Bootstrap must call disconnect() to stop any in-progress Wi-Fi connection attempt when AP is unavailable'
		);
		assert.ok(
			bootstrap.includes('isconnected()'),
			'Bootstrap must check isconnected() to detect whether AP was reached before proceeding'
		);
	});
});