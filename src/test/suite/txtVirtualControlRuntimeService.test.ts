/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { TxtConnectionService } from '../../services/txtConnectionService';
import {
	TxtVirtualControlRuntimeService,
	VirtualControlRuntimeSshClient,
} from '../../services/txtVirtualControlRuntimeService';
import { TxtVirtualControlsDocument } from '../../types/txtVirtualControls';

suite('TxtVirtualControlRuntimeService Test Suite', () => {
	let sandbox: sinon.SinonSandbox;
	let connectionService: Pick<TxtConnectionService, 'loadConfig' | 'getPasswordOrDefault'>;
	let fetchStub: sinon.SinonStub;
	let sshClients: Array<{
		connect: sinon.SinonStub;
		putFile: sinon.SinonStub;
		execCommand: sinon.SinonStub;
		dispose: sinon.SinonStub;
	}>;
	let service: TxtVirtualControlRuntimeService;

	const document: TxtVirtualControlsDocument = {
		schemaVersion: 1,
		canvas: { mode: 'editing' },
		controls: [
			{
				stableId: 'btn-1',
				displayName: 'Start',
				identifier: 'start',
				kind: 'button',
				position: { x: 24, y: 32 },
				size: { width: 120, height: 48 },
				style: { backgroundColor: '#0288d1', textColor: '#ffffff' },
			},
		],
	};

	function jsonResponse(body: unknown, ok = true, status = 200): Response {
		return {
			ok,
			status,
			json: async () => body,
		} as Response;
	}

	setup(() => {
		sandbox = sinon.createSandbox();
		fetchStub = sandbox.stub();
		sshClients = [];

		connectionService = {
			loadConfig: () => ({
				host: '192.168.7.2',
				username: 'ftc',
				remotePath: '/tmp/singular_blockly/main.py',
				runtimePort: 8080,
			}),
			getPasswordOrDefault: sandbox.stub().resolves('ftc'),
		};

		service = new TxtVirtualControlRuntimeService(
			connectionService as TxtConnectionService,
			vscode.Uri.file('/mock/extension'),
			() => {
				const client = {
					connect: sandbox.stub().resolves(),
					putFile: sandbox.stub().resolves(),
					execCommand: sandbox.stub().resolves({ stdout: '', stderr: '', code: 0 }),
					dispose: sandbox.stub(),
				};
				sshClients.push(client);
				return client as VirtualControlRuntimeSshClient;
			},
			fetchStub as typeof fetch
		);
	});

	teardown(() => {
		sandbox.restore();
	});

	test('extractReferencedStableIds should return unique stable ids', () => {
		const code = [
			"value = _txt_virtual_button_state('btn-1')",
			"other = _txt_virtual_button_state(\"btn-2\")",
			"again = _txt_virtual_button_state('btn-1')",
		].join('\n');

		assert.deepStrictEqual(TxtVirtualControlRuntimeService.extractReferencedStableIds(code), ['btn-1', 'btn-2']);
	});

	test('createSession should start the runtime when health check fails and then send the session payload', async () => {
		fetchStub.onCall(0).resolves(jsonResponse({ error: 'offline' }, false, 503));
		fetchStub.onCall(1).resolves(jsonResponse({ ok: true, sessionId: null, updatedAt: Date.now() }));
		fetchStub.onCall(2).resolves(jsonResponse({ ok: true, updatedAt: 123456 }));

		const session = await service.createSession(document);

		assert.strictEqual(session.mode, 'running');
		assert.deepStrictEqual(session.controlIds, ['btn-1']);
		assert.strictEqual(sshClients.length, 2, 'installRuntime and startRuntime should each use an SSH client');

		const installClient = sshClients.find(client => client.putFile.calledOnce);
		const startClient = sshClients.find(client => client.execCommand.callCount === 2 && !client.putFile.called);
		assert.ok(installClient, 'runtime installer SSH client should upload the runtime script');
		assert.ok(startClient, 'runtime starter SSH client should launch the background process');
		assert.ok(installClient.connect.calledOnce);
		assert.ok(installClient.putFile.calledOnce);
		assert.strictEqual(installClient.putFile.firstCall.args[1], '/tmp/singular_blockly/virtual_controls_runtime.py');
		assert.strictEqual(startClient.execCommand.callCount, 2);
		assert.match(startClient.execCommand.firstCall.args[0], /pkill -f 'virtual_controls_runtime\.py'/);
		assert.match(startClient.execCommand.secondCall.args[0], /nohup python3 \/tmp\/singular_blockly\/virtual_controls_runtime\.py 8081/);
		assert.match(startClient.execCommand.secondCall.args[0], /sleep 3/);

		assert.strictEqual(fetchStub.callCount, 3);
		assert.strictEqual(fetchStub.getCall(0).args[0], 'http://192.168.7.2:8081/health');
		assert.strictEqual(fetchStub.getCall(1).args[0], 'http://192.168.7.2:8081/health');
		assert.strictEqual(fetchStub.getCall(2).args[0], 'http://192.168.7.2:8081/session');
		assert.deepStrictEqual(JSON.parse(fetchStub.getCall(2).args[1].body as string).controls, [
			{ stableId: 'btn-1', identifier: 'start' },
		]);
	});

	test('syncSnapshot should post pressed states for each control', async () => {
		fetchStub.resolves(jsonResponse({ ok: true, updatedAt: 987654321 }));

		const snapshot = await service.syncSnapshot('session-1', document, { 'btn-1': true });

		assert.strictEqual(snapshot.sessionId, 'session-1');
		assert.strictEqual(snapshot.updatedAt, 987654321);
		assert.deepStrictEqual(snapshot.controls, {
			'btn-1': { pressed: true },
		});
		assert.strictEqual(fetchStub.firstCall.args[0], 'http://192.168.7.2:8081/snapshot');
		assert.deepStrictEqual(JSON.parse(fetchStub.firstCall.args[1].body as string), {
			sessionId: 'session-1',
			controls: [{ stableId: 'btn-1', pressed: true }],
		});
	});

	test('virtual_controls_runtime.py should remain compatible with Python 3.6', async () => {
		const runtimePath = path.resolve(__dirname, '../../../txt-runtime/virtual_controls_runtime.py');
		const runtimeSource = await fs.readFile(runtimePath, 'utf-8');

		assert.ok(
			!runtimeSource.includes('from __future__ import annotations'),
			'TXT runtime must avoid Python 3.7+ future imports because the controller still runs Python 3.6'
		);
	});
});
