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
		createTerminal = sandbox.stub(vscode.window, 'createTerminal').returns(mockTerminal as unknown as vscode.Terminal);
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
		assert.strictEqual(createTerminal.calledOnce, true);
		assert.ok(createTerminal.firstCall.args[0].pty);
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
});
