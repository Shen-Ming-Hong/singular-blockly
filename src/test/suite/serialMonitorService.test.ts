/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { SerialMonitorService } from '../../services/serialMonitorService';

suite('SerialMonitorService Test Suite', () => {
	let sandbox: sinon.SinonSandbox;
	let service: SerialMonitorService;
	let mockTerminal: { show: sinon.SinonStub; dispose: sinon.SinonStub; sendText: sinon.SinonStub };

	setup(() => {
		sandbox = sinon.createSandbox();
		mockTerminal = {
			show: sandbox.stub(),
			dispose: sandbox.stub(),
			sendText: sandbox.stub(),
		};
		sandbox.stub(vscode.window, 'createTerminal').returns(mockTerminal as unknown as vscode.Terminal);
		service = new SerialMonitorService('/mock/workspace');
	});

	teardown(() => {
		service.dispose();
		sandbox.restore();
	});

	test('falls back to mpremote port detection when pyserial enumeration returns no device', async () => {
		const uploader = {
			listSerialPorts: sandbox.stub().resolves({ ports: [], autoDetected: undefined }),
			listPorts: sandbox.stub().resolves({
				ports: [{ path: '/dev/cu.usbmodem1201', vendorId: '303A', productId: '1001' }],
				autoDetected: '/dev/cu.usbmodem1201',
			}),
			checkMpremoteInstalled: sandbox.stub().resolves(true),
			getMpremotePath: sandbox.stub().returns('/mock/mpremote'),
			getPlatformioPythonPath: sandbox.stub().returns('/mock/python'),
		};
		(service as any).uploader = uploader;
		sandbox.stub(service as any, 'resetAndStartMonitor').resolves();

		const result = await service.start();

		assert.strictEqual(result.success, true);
		assert.strictEqual(result.port, '/dev/cu.usbmodem1201');
		assert.ok(uploader.listSerialPorts.calledOnce, 'pyserial enumeration should still be tried first');
		assert.ok(uploader.listPorts.calledOnce, 'mpremote port detection should be used as a fallback');
		assert.ok((service as any).resetAndStartMonitor.calledOnceWith('/dev/cu.usbmodem1201'));
	});

	test('returns MPREMOTE_NOT_INSTALLED when pyserial monitor bootstrap fails and mpremote is unavailable', async () => {
		const uploader = {
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
		sandbox.stub(service as any, 'resetAndStartMonitor').rejects(new Error('pyserial failed'));

		const result = await service.start();

		assert.strictEqual(result.success, false);
		assert.strictEqual(result.error?.code, 'MPREMOTE_NOT_INSTALLED');
		assert.ok(mockTerminal.dispose.calledOnce, 'failed startup should dispose the temporary terminal');
	});
});