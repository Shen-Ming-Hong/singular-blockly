/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { ArduinoMonitorService } from '../../services/arduinoMonitorService';
import { isEsp32Board, ESP32_BOARDS } from '../../types/arduino';

suite('ArduinoMonitorService Test Suite', () => {
	let service: ArduinoMonitorService;
	let sandbox: sinon.SinonSandbox;
	let mockTerminal: any;
	let spawnStub: sinon.SinonStub;
	let terminalOptions: any;
	let processes: any[];

	function createProcess(): any {
		const process = new EventEmitter() as any;
		process.stdout = new PassThrough();
		process.stderr = new PassThrough();
		process.stdin = new PassThrough();
		process.pid = 1234;
		process.exitCode = null;
		process.killed = false;
		process.kill = sandbox.stub().callsFake(() => {
			process.killed = true;
			process.exitCode = 0;
			process.emit('exit', 0);
			process.emit('close', 0);
			return true;
		});
		processes.push(process);
		return process;
	}

	setup(() => {
		sandbox = sinon.createSandbox();
		mockTerminal = {
			show: sandbox.stub(),
			dispose: sandbox.stub(),
		};
		processes = [];
		spawnStub = sandbox.stub().callsFake(() => createProcess());

		// Mock vscode.window.createTerminal
		sandbox.stub(vscode.window, 'createTerminal').callsFake((options: any) => {
			terminalOptions = options;
			return mockTerminal;
		});

		service = new ArduinoMonitorService('e:\\test-workspace', {
			resolvePlatformio: async () => ({ command: 'pio', prefixArgs: [], mode: 'direct', source: 'path-search' }),
			spawnProcess: spawnStub,
			isWorkspaceTrusted: () => true,
		});
	});

	teardown(() => {
		service.dispose();
		sandbox.restore();
	});

	suite('isEsp32Board', () => {
		test('should return true for esp32 board', () => {
			assert.strictEqual(isEsp32Board('esp32'), true);
		});

		test('should return true for supermini board', () => {
			assert.strictEqual(isEsp32Board('supermini'), true);
		});

		test('should return false for uno board', () => {
			assert.strictEqual(isEsp32Board('uno'), false);
		});

		test('should return false for mega board', () => {
			assert.strictEqual(isEsp32Board('mega'), false);
		});

		test('should return false for nano board', () => {
			assert.strictEqual(isEsp32Board('nano'), false);
		});

		test('ESP32_BOARDS constant should contain expected boards', () => {
			assert.ok(ESP32_BOARDS.includes('esp32'));
			assert.ok(ESP32_BOARDS.includes('supermini'));
			assert.strictEqual(ESP32_BOARDS.length, 2);
		});
	});

	suite('start()', () => {
		test('should create terminal and start monitor', async () => {
			const result = await service.start('uno', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);
			assert.strictEqual(result.port, 'auto');
			assert.ok(service.isRunning());
			assert.ok((vscode.window.createTerminal as sinon.SinonStub).calledOnce);
			assert.ok(spawnStub.calledOnce);
			assert.ok(terminalOptions.pty, 'Should use a Pseudoterminal');
			assert.strictEqual(terminalOptions.shellPath, undefined);
			assert.ok(mockTerminal.show.calledOnce);
		});

		test('should include exception decoder for ESP32 boards', async () => {
			const result = await service.start('esp32', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);

			// Check that the command includes exception decoder filter
			const args = spawnStub.firstCall.args[1];
			assert.ok(args.includes('--filter'));
			assert.ok(args.includes('esp32_exception_decoder'));
			assert.strictEqual(spawnStub.firstCall.args[2].shell, false);
		});

		test('should not include exception decoder for non-ESP32 boards', async () => {
			const result = await service.start('uno', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);

			// Check that the command does not include exception decoder filter
			const args = spawnStub.firstCall.args[1];
			assert.ok(!args.includes('esp32_exception_decoder'));
		});

		test('should use the resolved Python module fallback command', async () => {
			const fallbackService = new ArduinoMonitorService('e:\\test-workspace', {
				resolvePlatformio: async () => ({
					command: 'C:\\.platformio\\penv\\Scripts\\python.exe',
					prefixArgs: ['-m', 'platformio'],
					mode: 'python-module',
					source: 'system-drive-core-dir',
				}),
				spawnProcess: spawnStub,
				isWorkspaceTrusted: () => true,
			});

			const result = await fallbackService.start('uno', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);
			assert.strictEqual(spawnStub.firstCall.args[0], 'C:\\.platformio\\penv\\Scripts\\python.exe');
			assert.deepStrictEqual(spawnStub.firstCall.args[1].slice(0, 2), ['-m', 'platformio']);
			fallbackService.dispose();
		});

		test('passes special-character project paths as one argument without a shell', async () => {
			const projectPath = 'e:\\中文 & project (test)';
			const result = await service.start('uno', projectPath);
			assert.strictEqual(result.success, true);
			const args = spawnStub.firstCall.args[1];
			assert.strictEqual(args[args.indexOf('--project-dir') + 1], projectPath);
			assert.strictEqual(spawnStub.firstCall.args[2].shell, false);
		});

		test('does not resolve or spawn in an untrusted workspace', async () => {
			const resolvePlatformio = sandbox.stub();
			const untrustedService = new ArduinoMonitorService('e:\\test-workspace', {
				resolvePlatformio,
				spawnProcess: spawnStub,
				isWorkspaceTrusted: () => false,
			});
			const result = await untrustedService.start('uno');
			assert.strictEqual(result.success, false);
			assert.strictEqual(result.error?.code, 'WORKSPACE_UNTRUSTED');
			assert.ok(resolvePlatformio.notCalled);
			assert.ok(spawnStub.notCalled);
			untrustedService.dispose();
		});

		test('forwards process output and closes the Pseudoterminal on exit', async () => {
			await service.start('uno');
			const output: string[] = [];
			let closeCode: number | undefined;
			terminalOptions.pty.onDidWrite((value: string) => output.push(value));
			terminalOptions.pty.onDidClose((value: number) => {closeCode = value;});
			terminalOptions.pty.open();
			processes[0].stdout.write('hello\n');
			processes[0].emit('exit', 7);
			assert.deepStrictEqual(output, ['hello\r\n']);
			assert.strictEqual(closeCode, 7);
		});

		test('should return success if already running', async () => {
			await service.start('uno', 'e:\\test-workspace');
			const result = await service.start('uno', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);
			// createTerminal should only be called once
			assert.ok((vscode.window.createTerminal as sinon.SinonStub).calledOnce);
		});
	});

	suite('stop()', () => {
		test('should stop the monitor and dispose terminal', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stop();

			assert.strictEqual(service.isRunning(), false);
			assert.strictEqual(service.getCurrentPort(), null);
			assert.ok(processes[0].kill.calledOnce);
			assert.ok(mockTerminal.dispose.calledOnce);
		});

		test('should be safe to call when not running', async () => {
			// Should not throw
			await service.stop();
			assert.strictEqual(service.isRunning(), false);
		});
	});

	suite('stopForUpload()', () => {
		test('should stop monitor and record previous state', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stopForUpload();

			assert.strictEqual(service.isRunning(), false);
			assert.ok(processes[0].kill.calledOnce);
			assert.ok(mockTerminal.dispose.calledOnce);
		});

		test('should be safe to call when not running', async () => {
			await service.stopForUpload();
			assert.strictEqual(service.isRunning(), false);
		});
	});

	suite('restartAfterUpload()', () => {
		test('should restart if was running before upload', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stopForUpload();
			await service.restartAfterUpload('uno', 'e:\\test-workspace');

			assert.strictEqual(service.isRunning(), true);
			// createTerminal should be called twice
			assert.strictEqual((vscode.window.createTerminal as sinon.SinonStub).callCount, 2);
		});

		test('should not restart if was not running before upload', async () => {
			await service.stopForUpload();
			await service.restartAfterUpload('uno', 'e:\\test-workspace');

			assert.strictEqual(service.isRunning(), false);
			assert.ok((vscode.window.createTerminal as sinon.SinonStub).notCalled);
		});
	});

	suite('isRunning()', () => {
		test('should return false initially', () => {
			assert.strictEqual(service.isRunning(), false);
		});

		test('should return true after start', async () => {
			await service.start('uno', 'e:\\test-workspace');
			assert.strictEqual(service.isRunning(), true);
		});

		test('should return false after stop', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stop();
			assert.strictEqual(service.isRunning(), false);
		});
	});

	suite('getCurrentPort()', () => {
		test('should return null initially', () => {
			assert.strictEqual(service.getCurrentPort(), null);
		});

		test('should return "auto" after start', async () => {
			await service.start('uno', 'e:\\test-workspace');
			assert.strictEqual(service.getCurrentPort(), 'auto');
		});

		test('should return null after stop', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stop();
			assert.strictEqual(service.getCurrentPort(), null);
		});
	});

	suite('onStopped() callback', () => {
		test('should trigger callback with upload_started reason on stopForUpload', async () => {
			let callbackReason: string | null = null;
			service.onStopped(reason => {
				callbackReason = reason;
			});

			await service.start('uno', 'e:\\test-workspace');
			await service.stopForUpload();

			assert.strictEqual(callbackReason, 'upload_started');
		});
	});

	suite('dispose()', () => {
		test('should stop monitor and clean up', async () => {
			await service.start('uno', 'e:\\test-workspace');
			service.dispose();

			assert.strictEqual(service.isRunning(), false);
			assert.ok(mockTerminal.dispose.calledOnce);
		});
	});
});
