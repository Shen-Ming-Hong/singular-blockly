/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { SerialMonitorService } from '../../services/serialMonitorService';

suite('SerialMonitorService Test Suite', () => {
	let sandbox: sinon.SinonSandbox;
	let service: SerialMonitorService;
	let mockTerminal: { show: sinon.SinonStub; dispose: sinon.SinonStub };
	let createTerminal: sinon.SinonStub;
	let terminalOptions: { pty: vscode.Pseudoterminal };
	let spawnProcess: sinon.SinonStub;
	let child: EventEmitter & {
		stdout: PassThrough;
		stderr: PassThrough;
		stdin: PassThrough;
		pid: number;
		exitCode: number | null;
		killed: boolean;
		kill: sinon.SinonStub;
	};

	setup(() => {
		sandbox = sinon.createSandbox();
		mockTerminal = {
			show: sandbox.stub(),
			dispose: sandbox.stub(),
		};
		createTerminal = sandbox.stub(vscode.window, 'createTerminal').callsFake(options => {
			terminalOptions = options as { pty: vscode.Pseudoterminal };
			return mockTerminal as unknown as vscode.Terminal;
		});
		child = Object.assign(new EventEmitter(), {
			stdout: new PassThrough(),
			stderr: new PassThrough(),
			stdin: new PassThrough(),
			pid: 123,
			exitCode: null as number | null,
			killed: false,
			kill: sandbox.stub().callsFake(() => {
				child.killed = true;
				child.exitCode = 0;
				queueMicrotask(() => child.emit('close', 0));
				return true;
			}),
		});
		spawnProcess = sandbox.stub().returns(child);
		service = new SerialMonitorService('/mock/workspace', undefined, () => true, spawnProcess);
	});

	teardown(() => {
		service.dispose();
		sandbox.restore();
	});

	test('does not prepare Core or probe ports when workspace is untrusted', async () => {
		service.dispose();
		service = new SerialMonitorService('/mock/workspace', undefined, () => false, spawnProcess);
		const uploader = {
			ensureMpremoteAvailable: sandbox.stub(),
			listSerialPorts: sandbox.stub(),
			listPorts: sandbox.stub(),
		};
		(service as any).uploader = uploader;

		const result = await service.start();

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'WORKSPACE_UNTRUSTED');
		assert.strictEqual(uploader.ensureMpremoteAvailable.called, false);
		assert.strictEqual(uploader.listSerialPorts.called, false);
	});

	test('returns before port detection when no Core environment is available', async () => {
		const uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({
				success: false,
				stage: 'checking_tool',
				message: 'Core unavailable',
			}),
			listSerialPorts: sandbox.stub(),
			listPorts: sandbox.stub(),
		};
		(service as any).uploader = uploader;

		const result = await service.start();

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'PIO_NOT_FOUND');
		assert.strictEqual(uploader.listSerialPorts.called, false);
	});

	test('uses managed mpremote with literal argv boundaries after fallback port detection', async () => {
		const uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			listPorts: sandbox.stub().resolves({
				ports: [{ path: '/dev/cu.裝置 $HOME', vendorId: '303A', productId: '1001' }],
				autoDetected: '/dev/cu.裝置 $HOME',
			}),
			checkMpremoteInstalled: sandbox.stub().resolves(true),
			getMpremotePath: sandbox.stub().returns('/mock/受管理 core/$HOME/mpremote'),
			getPlatformioPythonPath: sandbox.stub().returns('/mock/python'),
		};
		(service as any).uploader = uploader;

		const result = await service.start();

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.port, '/dev/cu.裝置 $HOME');
		assert.strictEqual(uploader.ensureMpremoteAvailable.calledOnce, true);
		assert.strictEqual(spawnProcess.calledOnce, true);
		assert.strictEqual(spawnProcess.firstCall.args[0], '/mock/受管理 core/$HOME/mpremote');
		assert.deepStrictEqual(spawnProcess.firstCall.args[1], ['connect', '/dev/cu.裝置 $HOME', 'repl']);
		assert.strictEqual(spawnProcess.firstCall.args[2].shell, false);
		assert.strictEqual(spawnProcess.firstCall.args[2].env.PYTHONUTF8, '1');
		assert.strictEqual(spawnProcess.firstCall.args[2].env.PYTHONIOENCODING, 'utf-8');
		assert.strictEqual(createTerminal.calledOnce, true);
		assert.ok(createTerminal.firstCall.args[0].pty);
	});

	test('sets UTF-8 Python environment for the pyserial backend', async () => {
		(service as any).uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({ ports: [{ path: 'COM7' }], autoDetected: 'COM7' }),
			listPorts: sandbox.stub(),
			getPlatformioPythonPath: sandbox.stub().returns('C:\\python.exe'),
		};

		const result = await service.start();

		assert.strictEqual(result.success, true);
		assert.strictEqual(spawnProcess.firstCall.args[0], 'C:\\python.exe');
		assert.strictEqual(spawnProcess.firstCall.args[2].env.PYTHONUTF8, '1');
		assert.strictEqual(spawnProcess.firstCall.args[2].env.PYTHONIOENCODING, 'utf-8');
	});

	test('uses the selected Python monitor backend when pyserial detects the device', async () => {
		const uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({
				ports: [{ path: '/dev/cu.usbmodem1201', vendorId: '303A', productId: '1001' }],
				autoDetected: '/dev/cu.usbmodem1201',
			}),
			listPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			checkMpremoteInstalled: sandbox.stub().resolves(false),
			getMpremotePath: sandbox.stub().returns('/mock/mpremote'),
			getPlatformioPythonPath: sandbox.stub().returns('/custom/python'),
		};
		(service as any).uploader = uploader;
		const resetAndStartMonitor = sandbox.stub(service as any, 'resetAndStartMonitor').resolves();

		const result = await service.start();

		assert.strictEqual(result.success, true);
		assert.strictEqual(resetAndStartMonitor.calledOnceWith('/dev/cu.usbmodem1201'), true);
		assert.strictEqual(uploader.listPorts.notCalled, true);
		assert.strictEqual(uploader.checkMpremoteInstalled.notCalled, true);
	});

	test('returns MPREMOTE_NOT_INSTALLED when Python monitor bootstrap fails and mpremote is unavailable', async () => {
		const uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({
				ports: [{ path: '/dev/cu.usbmodem1201', vendorId: '303A', productId: '1001' }],
				autoDetected: '/dev/cu.usbmodem1201',
			}),
			listPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			checkMpremoteInstalled: sandbox.stub().resolves(false),
			getMpremotePath: sandbox.stub().returns('/mock/mpremote'),
			getPlatformioPythonPath: sandbox.stub().returns('/mock/python'),
		};
		(service as any).uploader = uploader;
		sandbox.stub(service as any, 'resetAndStartMonitor').rejects(Object.assign(new Error('failed'), { code: 'ENOENT' }));

		const result = await service.start();

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'MPREMOTE_NOT_INSTALLED');
		assert.strictEqual(createTerminal.called, false);
	});

	test('decodes split UTF-8 stdout and stderr without replacement characters', async () => {
		(service as any).uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			listPorts: sandbox.stub().resolves({ ports: [{ path: 'COM7' }], autoDetected: 'COM7' }),
			getMpremotePath: sandbox.stub().returns('mpremote'),
		};
		await service.start();
		const output: string[] = [];
		terminalOptions.pty.onDidWrite(value => output.push(value));
		terminalOptions.pty.open(undefined);
		const stdout = Buffer.from('中文');
		const stderr = Buffer.from('測試');

		child.stdout.write(stdout.subarray(0, 1));
		child.stdout.write(stdout.subarray(1, 4));
		child.stdout.write(stdout.subarray(4));
		child.stderr.write(stderr.subarray(0, 2));
		child.stderr.write(stderr.subarray(2, 5));
		child.stderr.write(stderr.subarray(5));
		child.exitCode = 7;
		child.emit('close', 7);

		assert.strictEqual(output.join(''), '中文測試');
		assert.ok(!output.join('').includes('�'));
	});

	test('reports each expected stop once with PTY exit code zero', async () => {
		(service as any).uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			listPorts: sandbox.stub().resolves({ ports: [{ path: 'COM7' }], autoDetected: 'COM7' }),
			getMpremotePath: sandbox.stub().returns('mpremote'),
		};
		const reasons: string[] = [];
		service.onStopped(reason => reasons.push(reason));
		await service.start();
		let closeCode: number | void | undefined;
		terminalOptions.pty.onDidClose!(code => {closeCode = code;});

		await service.stop('manual_stop');

		assert.deepStrictEqual(reasons, ['manual_stop']);
		assert.strictEqual(closeCode, 0);
	});

	test('reports upload stop once with PTY exit code zero', async () => {
		(service as any).uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			listPorts: sandbox.stub().resolves({ ports: [{ path: 'COM7' }], autoDetected: 'COM7' }),
			getMpremotePath: sandbox.stub().returns('mpremote'),
		};
		const reasons: string[] = [];
		service.onStopped(reason => reasons.push(reason));
		await service.start();
		let closeCode: number | void | undefined;
		terminalOptions.pty.onDidClose!(code => {closeCode = code;});

		await service.stopForUpload();

		assert.deepStrictEqual(reasons, ['upload_started']);
		assert.strictEqual(closeCode, 0);
	});

	test('reports terminal user close once with PTY exit code zero', async () => {
		(service as any).uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			listPorts: sandbox.stub().resolves({ ports: [{ path: 'COM7' }], autoDetected: 'COM7' }),
			getMpremotePath: sandbox.stub().returns('mpremote'),
		};
		const reasons: string[] = [];
		service.onStopped(reason => reasons.push(reason));
		await service.start();
		let closeCode: number | void | undefined;
		terminalOptions.pty.onDidClose!(code => {closeCode = code;});

		terminalOptions.pty.close();
		await new Promise<void>(resolve => queueMicrotask(resolve));

		assert.deepStrictEqual(reasons, ['user_closed']);
		assert.strictEqual(closeCode, 0);
	});

	test('keeps an unexpected process failure non-zero and reports device disconnect once', async () => {
		(service as any).uploader = {
			ensureMpremoteAvailable: sandbox.stub().resolves({ success: true }),
			listSerialPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			listPorts: sandbox.stub().resolves({ ports: [{ path: 'COM7' }], autoDetected: 'COM7' }),
			getMpremotePath: sandbox.stub().returns('mpremote'),
		};
		const reasons: string[] = [];
		service.onStopped(reason => reasons.push(reason));
		await service.start();
		let closeCode: number | void | undefined;
		terminalOptions.pty.onDidClose!(code => {closeCode = code;});

		child.exitCode = 9;
		child.emit('close', 9);

		assert.deepStrictEqual(reasons, ['device_disconnected']);
		assert.strictEqual(closeCode, 9);
	});
});
