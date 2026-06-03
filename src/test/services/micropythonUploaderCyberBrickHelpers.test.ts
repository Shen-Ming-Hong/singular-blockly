import assert = require('assert');
import * as fs from 'fs';
import { suite, test } from 'mocha';
import {
	buildCyberBrickOtaAgentSource,
	CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START,
	withCyberBrickRcMainOtaBootstrap,
} from '../../services/cyberbrickOtaAgentSource';
import { MicropythonUploader, CommandExecutor } from '../../services/micropythonUploader';
import { CYBERBRICK_OTA_AGENT_TARGET_VERSION, CYBERBRICK_OTA_REMOTE_PATH } from '../../types/cyberbrickUpload';

suite('MicropythonUploader CyberBrick helper commands', () => {
	function createUploader(executor: CommandExecutor): MicropythonUploader {
		const uploader = new MicropythonUploader('/workspace', executor);
		(uploader as unknown as { pythonPath: string }).pythonPath = '/mock/python';
		(uploader as unknown as { mpremotePath: string }).mpremotePath = '/mock/mpremote';
		return uploader;
	}

	test('lists CyberBrick USB ports via PlatformIO Python without depending on mpremote', async () => {
		let helperScript = '';
		const uploader = createUploader({
			exec: async command => {
				const scriptPath = command.match(/"([^"]*cyberbrick_serial_ports_[^"]*\.py)"$/)?.[1] || command.match(/"([^"]*cyberbrick_serial_ports_[^"]*\.py)"/)?.[1];
				assert.ok(scriptPath, 'serial port probe should run a temporary Python helper script');
				helperScript = fs.readFileSync(scriptPath, 'utf8');
				return {
					stdout: '{"ports":[{"path":"/dev/cu.usbmodem1201","vendorId":"303A","productId":"1001","manufacturer":"CyberBrick","description":"USB Serial","serialNumber":"ABC123"}]}\n',
					stderr: '',
				};
			},
		});

		const result = await uploader.listSerialPorts('cyberbrick');

		assert.strictEqual(result.autoDetected, '/dev/cu.usbmodem1201');
		assert.strictEqual(result.ports.length, 1);
		assert.strictEqual(result.ports[0].serialNumber, 'ABC123');
		assert.ok(helperScript.includes('from serial.tools import list_ports'));
		assert.ok(helperScript.includes("getattr(info, 'serial_number', None)"));
	});

	test('interrupts the running program and runs temporary helper scripts with mpremote resume + run', async () => {
		const commands: string[] = [];
		const uploader = createUploader({
			exec: async command => {
				commands.push(command);
				if (command.includes('blockly_interrupt.py')) {
					const scriptPath = command.match(/"([^"]*blockly_interrupt\.py)"/)?.[1];
					assert.ok(scriptPath, 'interrupt command should include the temporary script path');
					const script = fs.readFileSync(scriptPath, 'utf8');
					assert.ok(script.includes('try:\n    s = serial.Serial("/dev/cu.usbmodem1201", 115200, timeout=2)'));
					assert.strictEqual(script.includes('\t'), false, 'interrupt script should use spaces only');
					return { stdout: 'OK\n', stderr: '' };
				}
				return { stdout: '{"networks":[{"ssid":"Classroom","rssi":-42}]}\n', stderr: '' };
			},
		});

		const networks = await uploader.scanCyberBrickWifi('/dev/cu.usbmodem1201');

		assert.strictEqual(networks[0].ssid, 'Classroom');
		assert.strictEqual(commands.length, 2);
		assert.ok(commands[1].includes('cyberbrick_exec_'), 'Wi-Fi scan should run through a temporary helper script');
		assert.ok(commands[0].includes('blockly_interrupt.py'));
		assert.ok(commands[1].includes(" connect '/dev/cu.usbmodem1201' resume + run "));
		assert.strictEqual(commands[1].includes(' exec '), false);
	});

	test('resets CyberBrick STA Wi-Fi before scanning networks', async () => {
		let helperScript = '';
		const uploader = createUploader({
			exec: async command => {
				if (command.includes('blockly_interrupt.py')) {
					return { stdout: 'OK\n', stderr: '' };
				}
				const scriptPath = command.match(/'([^']*cyberbrick_exec_[^']*\.py)'/)?.[1] || command.match(/"([^"]*cyberbrick_exec_[^"]*\.py)"/)?.[1];
				assert.ok(scriptPath, 'scan command should run a temporary helper script');
				helperScript = fs.readFileSync(scriptPath, 'utf8');
				return { stdout: '{"networks":[{"ssid":"Classroom","rssi":-42}]}\n', stderr: '' };
			},
		});

		await uploader.scanCyberBrickWifi('/dev/cu.usbmodem1201');

		assert.strictEqual(helperScript.includes('\t'), false, 'scan helper script should use spaces only');
		assert.ok(helperScript.startsWith('import json\nimport time\ntry:\n'), 'scan helper should use a stable top-level layout');
		assert.ok(helperScript.includes('import time'), 'scan helper should wait for STA hardware to settle');
		assert.ok(helperScript.includes('wlan.active(False)'), 'scan helper should reset stale STA state before scanning');
		assert.ok(helperScript.includes('time.sleep(1.5)'), 'scan helper should wait before wlan.scan() (Windows USB-Serial compatibility)');
		assert.ok(helperScript.indexOf('wlan.active(False)') < helperScript.indexOf('wlan.scan()'));
	});

	test('surfaces mpremote stderr when helper execution fails', async () => {
		let commandIndex = 0;
		const uploader = createUploader({
			exec: async () => {
				commandIndex++;
				if (commandIndex === 1) {
					return { stdout: 'OK\n', stderr: '' };
				}
				return Promise.reject({
					error: new Error('Command failed'),
					stdout: '',
					stderr: 'Traceback (most recent call last): SyntaxError: invalid syntax',
				});
			},
		});

		await assert.rejects(
			() => uploader.scanCyberBrickWifi('/dev/cu.usbmodem1201'),
			/CyberBrick helper failed: Command failed \| stderr: .*SyntaxError/
		);
	});

	test('deploys OTA agent after interrupt using mpremote resume + fs cp', async () => {
		const commands: string[] = [];
		const uploader = createUploader({
			exec: async command => {
				commands.push(command);
				if (command.includes('blockly_interrupt.py')) {
					return { stdout: 'OK\n', stderr: '' };
				}
				return { stdout: '', stderr: '' };
			},
		});

		await uploader.deployCyberBrickOtaAgent('/dev/cu.usbmodem1201', 'print("agent")\n');

		assert.strictEqual(commands.length, 2);
		assert.ok(commands[0].includes('blockly_interrupt.py'));
		assert.ok(commands[1].includes(" connect '/dev/cu.usbmodem1201' resume + fs cp "));
		assert.ok(commands[1].includes(':/cyberbrick_ota_agent.py'));
		assert.deepStrictEqual(commands[1].match(/:\/[^\s]+/g), [':/cyberbrick_ota_agent.py']);
	});

	test('builds OTA agent source without patch artifacts and with background startup', () => {
		const source = buildCyberBrickOtaAgentSource({ deviceId: 'cyberbrick-test', otaToken: 'token-test', otaPort: 8266 });

		assert.strictEqual(source.includes('\n+'), false, 'generated MicroPython source must not contain patch artifact lines');
		assert.ok(source.includes('def start_background(wait_for_wifi=True):'), 'OTA agent should expose background startup for USB provisioning');
		assert.ok(source.includes("import _thread"), 'OTA agent should start its HTTP server without blocking student code');
		assert.ok(source.includes("X=[0];Y=[0]"), 'OTA agent should track background startup state and avoid duplicate launches');
		assert.ok(source.includes("Z=lambda ip:{'started':True,'ipAddress':ip or I(),'mode':'thread'}"), 'OTA agent should centralize the background-start success payload to stay compact on low-memory devices');
		assert.ok(source.includes("if Y[0]:return Z(ip)"), 'OTA agent should avoid launching duplicate background servers');
		assert.ok(source.includes("z.listen(1);Y[0]=2"), 'OTA agent should mark the background HTTP thread as ready after binding the socket');
		assert.ok(source.includes("W=_cfg('WIFI_PASSWORD','')"), 'OTA agent should read device-side Wi-Fi credentials');
		assert.ok(source.includes(`R=${JSON.stringify(CYBERBRICK_OTA_REMOTE_PATH)}`), 'OTA agent must only write the CyberBrick app entrypoint');
		assert.strictEqual(source.includes('/boot.py'), false, 'OTA agent must not modify CyberBrick boot files');
		assert.ok(source.includes('def H(c):'), 'OTA agent should stream-read HTTP headers before binary upload');
		assert.ok(source.includes('def U(c,d,l):'), 'OTA agent should use streaming binary upload');
		assert.ok(source.includes('def F(c,l,n,p):'), 'OTA agent should share a streaming file writer for OTA uploads');
		assert.strictEqual(source.includes('data += chunk'), false, 'OTA agent upgrade route must not buffer the whole agent in memory');
		assert.ok(source.includes("content-length"), 'OTA agent should honor Content-Length for streaming upload');
		assert.ok(
			source.includes("('HTTP/1.1 %s\\r\\nContent-Length:%d\\r\\n\\r\\n'%(n,len(p))).encode()+p"),
			'OTA agent should encode HTTP responses as bytes and compute Content-Length from byte length',
		);
		assert.ok(source.includes('def T(c,b):'), 'OTA agent should centralize socket response writes through a full-buffer send helper');
		assert.ok(source.includes('while o<len(b):'), 'OTA agent should retry socket.send until the whole response body is written');
		assert.ok(source.includes("if not n:raise OSError('short-send')"), 'OTA agent should fail loudly if the socket stops sending bytes mid-response');
		assert.ok(
			source.includes("while b'\\r\\n\\r\\n' not in r:"),
			'OTA agent should keep header parsing delimiters escaped in generated Python source',
		);
		assert.strictEqual(source.includes('uzlib'), false, 'OTA agent must not depend on uzlib because the target MicroPython build does not provide it');
		assert.ok(source.length < 4500, `OTA agent source should stay compact enough for low-memory devices (got ${source.length} bytes)`);
		const longSource = buildCyberBrickOtaAgentSource({
			deviceId: `cyberbrick-${'d'.repeat(48)}`,
			otaToken: 't'.repeat(96),
			otaPort: 8266,
		});
		assert.strictEqual(longSource.includes('uzlib'), false, 'OTA agent must not reintroduce uzlib for longer credentials either');
		assert.ok(longSource.length < 4500, `OTA agent source should stay compact even with longer credentials (got ${longSource.length} bytes)`);
		assert.ok(source.includes("if __name__ == '__main__':"), 'OTA agent should still support direct foreground execution for diagnostics');
	});

	test('wraps rc_main.py with a single OTA startup call without secrets', () => {
		const wrapped = withCyberBrickRcMainOtaBootstrap('print("hello")\n');
		const wrappedAgain = withCyberBrickRcMainOtaBootstrap(wrapped);

		assert.ok(wrapped.startsWith(CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START));
		assert.ok(wrapped.includes('import cyberbrick_ota_agent as _singular_blockly_ota_agent'));
		assert.ok(wrapped.includes('_singular_blockly_ota_agent.start_background(False)'));
		assert.ok(wrapped.includes('def _singular_blockly_ota_yield(ms=1):'), 'bootstrap should provide a tiny yield helper for OTA thread fairness');
		assert.ok(wrapped.includes('for _singular_blockly_ota_wait_idx in range(50):'), 'bootstrap should wait briefly for the OTA background thread to bind before user code begins');
		assert.ok(wrapped.includes('getattr(_singular_blockly_ota_agent, "Y", [0])[0] > 1'), 'bootstrap should detect when the OTA background thread has reached the socket-listening state');
		assert.ok(wrapped.includes('_singular_blockly_ota_yield(10)'), 'bootstrap should poll for OTA thread readiness in short 10ms steps');
		assert.ok(wrapped.includes('_singular_blockly_ota_yield(500)'), 'bootstrap should retain a conservative fallback wait if the readiness probe itself fails');
		assert.ok(wrapped.includes('_singular_blockly_ota_yield(300)'), 'bootstrap should keep a short OTA-only head start after the background thread is ready');
		assert.ok(wrapped.includes('try:\n    print("hello")\n'));
		assert.ok(wrapped.includes('except Exception as _singular_blockly_ota_exc:'));
		assert.ok(wrapped.includes('_singular_blockly_ota_sys.print_exception(_singular_blockly_ota_exc)'));
		assert.strictEqual(wrappedAgain.split(CYBERBRICK_OTA_RC_MAIN_BOOTSTRAP_START).length - 1, 1);
		assert.strictEqual(wrapped.includes('WIFI_PASSWORD'), false);
		assert.strictEqual(wrapped.includes('OTA_TOKEN'), false);
	});

	test('configures Wi-Fi and starts OTA agent in the same USB setup run', async () => {
		const commands: string[] = [];
		let helperScript = '';
		const uploader = createUploader({
			exec: async command => {
				commands.push(command);
				if (command.includes('blockly_interrupt.py')) {
					return { stdout: 'OK\n', stderr: '' };
				}
				const scriptPath = command.match(/'([^']*cyberbrick_exec_[^']*\.py)'/)?.[1] || command.match(/"([^"]*cyberbrick_exec_[^"]*\.py)"/)?.[1];
				assert.ok(scriptPath, 'configure command should run a temporary helper script');
				helperScript = fs.readFileSync(scriptPath, 'utf8');
				return { stdout: '{"ipAddress":"192.168.1.50","agentVersion":"1.0.0","agentStarted":true,"agentMode":"thread","agentError":"","rcMainPatched":true,"rcMainError":""}\n', stderr: '' };
			},
		});

		const result = await uploader.configureCyberBrickOtaAgent('/dev/cu.usbmodem1201', {
			deviceId: 'cyberbrick-test',
			ssid: 'Classroom',
			wifiPassword: 'secret-wifi-password',
			otaToken: 'token-test',
			pairingSecret: 'pairing-test',
			otaPort: 8266,
		});

		assert.strictEqual(result.agentStarted, true);
		assert.strictEqual(result.agentMode, 'thread');
		assert.strictEqual(result.rcMainPatched, true);
		assert.ok(helperScript.includes(CYBERBRICK_OTA_AGENT_TARGET_VERSION), 'configure helper should report the OTA target version it just installed');
		assert.strictEqual(helperScript.includes('\t'), false, 'configure helper script should use spaces only');
		assert.ok(helperScript.includes('import os'), 'configure helper should be able to create /app before writing rc_main.py');
		assert.ok(helperScript.includes('os.mkdir(path)'), 'configure helper should create missing directories for /app/rc_main.py');
		assert.ok(
			helperScript.includes("try:\n            with open('/app/rc_main.py', 'r') as f:\n                rc_main_source = f.read()"),
			'configure helper rc_main.py read block should use valid space indentation'
		);
		const writePaths = [...helperScript.matchAll(/with open\('([^']+)'\s*,\s*'w'\)/g)].map(match => match[1]);
		assert.deepStrictEqual(writePaths, ['/cyberbrick_ota_config.py', '/app/rc_main.py']);
		assert.ok(helperScript.includes("f.write('WIFI_PASSWORD = ' + repr(config.get('wifiPassword') or '')"));
		assert.ok(helperScript.includes("with open('/app/rc_main.py', 'w') as f:"));
		assert.ok(helperScript.includes('Singular Blockly CyberBrick OTA bootstrap START'));
		assert.ok(helperScript.includes('_singular_blockly_ota_agent.start_background(False)'));
		assert.strictEqual(helperScript.includes('/boot.py'), false);
		assert.ok(helperScript.includes('import cyberbrick_ota_agent as ota_agent'));
		assert.ok(helperScript.includes('start_result = ota_agent.start_background()'));
		assert.ok(
			helperScript.includes("sys.modules['cyberbrick_ota_agent'].OTA_TOKEN = _ota_token"),
			'configure helper should update cached agent OTA_TOKEN to prevent token mismatch after re-provisioning'
		);
		assert.strictEqual(commands.length, 2);
	});

	test('redacts secret-bearing OTA configuration helper failures', async () => {
		let commandIndex = 0;
		const uploader = createUploader({
			exec: async () => {
				commandIndex++;
				if (commandIndex === 1) {
					return { stdout: 'OK\n', stderr: '' };
				}
				return Promise.reject({
					error: new Error('Command failed'),
					stdout: 'config = {"wifiPassword":"secret-wifi-password","otaToken":"token-test"}',
					stderr: 'Traceback: secret-wifi-password token-test',
				});
			},
		});

		await assert.rejects(
			() =>
				uploader.configureCyberBrickOtaAgent('/dev/cu.usbmodem1201', {
					deviceId: 'cyberbrick-test',
					ssid: 'Classroom',
					wifiPassword: 'secret-wifi-password',
					otaToken: 'token-test',
					pairingSecret: 'pairing-test',
					otaPort: 8266,
				}),
			error => {
				const message = error instanceof Error ? error.message : String(error);
				assert.strictEqual(message, 'CyberBrick OTA configuration failed.');
				assert.strictEqual(message.includes('secret-wifi-password'), false);
				assert.strictEqual(message.includes('token-test'), false);
				return true;
			}
		);
	});

	test('removes only Singular Blockly OTA artifacts and strips rc_main.py bootstrap', async () => {
		let helperScript = '';
		const uploader = createUploader({
			exec: async command => {
				if (command.includes('blockly_interrupt.py')) {
					return { stdout: 'OK\n', stderr: '' };
				}
				const scriptPath = command.match(/'([^']*cyberbrick_exec_[^']*\.py)'/)?.[1] || command.match(/"([^"]*cyberbrick_exec_[^"]*\.py)"/)?.[1];
				assert.ok(scriptPath, 'cleanup command should run a temporary helper script');
				helperScript = fs.readFileSync(scriptPath, 'utf8');
				return { stdout: '{"removedAgent":true,"removedConfig":true,"rcMainPatched":true,"rcMainHadBootstrap":true}\n', stderr: '' };
			},
		});

		const result = await uploader.removeCyberBrickOtaArtifacts('/dev/cu.usbmodem1201');

		assert.strictEqual(result.removedAgent, true);
		assert.strictEqual(result.removedConfig, true);
		assert.strictEqual(result.rcMainPatched, true);
		assert.strictEqual(helperScript.includes('\t'), false, 'cleanup helper script should use spaces only');
		assert.ok(helperScript.includes("with open('/app/rc_main.py', 'w') as f:"));
		assert.ok(helperScript.includes('Singular Blockly CyberBrick OTA bootstrap START'));
		assert.ok(helperScript.includes('Singular Blockly CyberBrick OTA bootstrap END'));
		assert.ok(helperScript.includes("getattr(os, 'remove', None) or getattr(os, 'unlink', None)"));
		assert.ok(helperScript.includes('os.stat(path)'), 'cleanup helper should distinguish missing files from remove failures');
		assert.ok(helperScript.includes("result[error_key] = str(exc)"), 'cleanup helper should report device-side remove errors');
		const writePaths = [...helperScript.matchAll(/with open\('([^']+)'\s*,\s*'w'\)/g)].map(match => match[1]);
		assert.deepStrictEqual(writePaths, ['/app/rc_main.py']);
		const deletePaths = [...helperScript.matchAll(/_remove\('([^']+)'/g)].map(match => match[1]);
		assert.deepStrictEqual(deletePaths, ['/cyberbrick_ota_agent.py', '/cyberbrick_ota_config.py']);
		assert.strictEqual(helperScript.includes('/boot.py'), false);
	});

	test('surfaces OTA cleanup helper stderr when cleanup execution fails', async () => {
		let commandIndex = 0;
		const uploader = createUploader({
			exec: async () => {
				commandIndex++;
				if (commandIndex === 1) {
					return { stdout: 'OK\n', stderr: '' };
				}
				return Promise.reject({
					error: new Error('Command failed'),
					stdout: '',
					stderr: 'Traceback (most recent call last): AttributeError: module os has no attribute remove',
				});
			},
		});

		await assert.rejects(
			() => uploader.removeCyberBrickOtaArtifacts('/dev/cu.usbmodem1201'),
			/CyberBrick OTA cleanup failed: CyberBrick helper failed: Command failed \| stderr: .*AttributeError/
		);
	});

	test('uploads rc_main.py with OTA startup bootstrap over USB when OTA is configured', async () => {
		let uploadedCode = '';
		const uploader = createUploader({
			exec: async command => {
				if (command.includes('blockly_upload.py')) {
					const scriptPath = command.match(/'([^']*blockly_upload\.py)'/)?.[1] || command.match(/"([^"]*blockly_upload\.py)"/)?.[ 1];
					assert.ok(scriptPath, 'upload command should include the temporary rc_main.py path');
					uploadedCode = fs.readFileSync(scriptPath, 'utf8');
					return { stdout: '', stderr: '' };
				}
				if (command.includes('blockly_interrupt.py')) {
					return { stdout: 'OK\n', stderr: '' };
				}
				// OTA config check (cyberbrick_exec_*.py): simulate device has OTA configured
				if (command.includes('cyberbrick_exec_')) {
					return { stdout: 'YES\n', stderr: '' };
				}
				return { stdout: '', stderr: '' };
			},
		});

		await (uploader as unknown as { uploadCode(code: string, port: string): Promise<void> }).uploadCode('print("student")\n', '/dev/cu.usbmodem1201');

		// OTA configured → bootstrap should be injected
		assert.ok(uploadedCode.includes('_singular_blockly_ota_agent.start_background(False)'), 'should inject OTA agent startup call when OTA is configured');
		assert.ok(uploadedCode.includes('print("student")'), 'should preserve user code');
	});

	test('uploads rc_main.py without OTA bootstrap when OTA is not configured', async () => {
		let uploadedCode = '';
		const uploader = createUploader({
			exec: async command => {
				if (command.includes('blockly_upload.py')) {
					const scriptPath = command.match(/'([^']*blockly_upload\.py)'/)?.[1] || command.match(/"([^"]*blockly_upload\.py)"/)?.[ 1];
					assert.ok(scriptPath, 'upload command should include the temporary rc_main.py path');
					uploadedCode = fs.readFileSync(scriptPath, 'utf8');
					return { stdout: '', stderr: '' };
				}
				if (command.includes('blockly_interrupt.py')) {
					return { stdout: 'OK\n', stderr: '' };
				}
				// OTA config check (cyberbrick_exec_*.py): simulate device has NO OTA
				if (command.includes('cyberbrick_exec_')) {
					return { stdout: 'NO\n', stderr: '' };
				}
				return { stdout: '', stderr: '' };
			},
		});

		await (uploader as unknown as { uploadCode(code: string, port: string): Promise<void> }).uploadCode('print("student")\n', '/dev/cu.usbmodem1201');

		// OTA not configured → clean code, no bootstrap
		assert.ok(!uploadedCode.includes('_singular_blockly_ota_agent.start_background'), 'should NOT inject OTA bootstrap when OTA is not configured');
		assert.ok(uploadedCode.includes('print("student")'), 'should preserve user code');
	});

	test('uploads rc_main.py with OTA bootstrap when OTA check fails (conservative fallback)', async () => {
		let uploadedCode = '';
		const uploader = createUploader({
			exec: async command => {
				if (command.includes('blockly_upload.py')) {
					const scriptPath = command.match(/'([^']*blockly_upload\.py)'/)?.[1] || command.match(/"([^"]*blockly_upload\.py)"/)?.[ 1];
					assert.ok(scriptPath, 'upload command should include the temporary rc_main.py path');
					uploadedCode = fs.readFileSync(scriptPath, 'utf8');
					return { stdout: '', stderr: '' };
				}
				if (command.includes('blockly_interrupt.py')) {
					return { stdout: 'OK\n', stderr: '' };
				}
				// OTA config check (cyberbrick_exec_*.py): simulate check failure (e.g. port busy / timeout)
				if (command.includes('cyberbrick_exec_')) {
					return Promise.reject(new Error('PermissionError: [Errno 13] Access is denied'));
				}
				return { stdout: '', stderr: '' };
			},
		});

		await (uploader as unknown as { uploadCode(code: string, port: string): Promise<void> }).uploadCode('print("student")\n', '/dev/cu.usbmodem1201');

		// Check failed → conservative: inject bootstrap to preserve OTA on already-configured devices
		assert.ok(uploadedCode.includes('_singular_blockly_ota_agent.start_background(False)'), 'should inject OTA bootstrap as conservative fallback when check fails');
		assert.ok(uploadedCode.includes('print("student")'), 'should preserve user code');
	});
});
