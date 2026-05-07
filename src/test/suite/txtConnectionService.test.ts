/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { TxtConnectionService, SshClientInterface } from '../../services/txtConnectionService';

suite('TxtConnectionService Test Suite', () => {
	let sandbox: sinon.SinonSandbox;
	let mockContext: vscode.ExtensionContext;
	let mockSecrets: {
		store: sinon.SinonStub;
		get: sinon.SinonStub;
		delete: sinon.SinonStub;
	};

	setup(() => {
		sandbox = sinon.createSandbox();

		mockSecrets = {
			store: sandbox.stub().resolves(),
			get: sandbox.stub().resolves(undefined),
			delete: sandbox.stub().resolves(),
		};

		mockContext = {
			secrets: mockSecrets as unknown as vscode.SecretStorage,
		} as unknown as vscode.ExtensionContext;

		// Stub vscode.workspace.getConfiguration
		sandbox.stub(vscode.workspace, 'getConfiguration').returns({
			get: (key: string, defaultValue?: unknown) => {
				const defaults: Record<string, unknown> = {
					'txt.host': '192.168.7.2',
					'txt.username': 'ftc',
					'txt.remotePath': '/tmp/singular_blockly/main.py',
					'txt.runtimePort': 8080,
				};
				return key in defaults ? defaults[key] : defaultValue;
			},
			update: sandbox.stub().resolves(),
		} as unknown as vscode.WorkspaceConfiguration);
	});

	teardown(() => {
		sandbox.restore();
	});

	suite('loadConfig()', () => {
		test('should return default config values', () => {
			const service = new TxtConnectionService(mockContext);
			const config = service.loadConfig();

			assert.strictEqual(config.host, '192.168.7.2');
			assert.strictEqual(config.username, 'ftc');
			assert.strictEqual(config.remotePath, '/tmp/singular_blockly/main.py');
			assert.strictEqual(config.runtimePort, 8080);
		});
	});

	suite('storePassword() / getPassword()', () => {
		test('should store password via SecretStorage', async () => {
			const service = new TxtConnectionService(mockContext);
			await service.storePassword('mypassword');

			assert.ok(mockSecrets.store.calledOnce);
			assert.ok(mockSecrets.store.calledWith('singular-blockly.txt.password', 'mypassword'));
		});

		test('should retrieve password via SecretStorage', async () => {
			mockSecrets.get.resolves('mypassword');
			const service = new TxtConnectionService(mockContext);
			const password = await service.getPassword();

			assert.strictEqual(password, 'mypassword');
			assert.ok(mockSecrets.get.calledWith('singular-blockly.txt.password'));
		});

		test('should return undefined when no password stored', async () => {
			const service = new TxtConnectionService(mockContext);
			const password = await service.getPassword();
			assert.strictEqual(password, undefined);
		});
	});

	suite('deletePassword()', () => {
		test('should delete password via SecretStorage', async () => {
			const service = new TxtConnectionService(mockContext);
			await service.deletePassword();

			assert.ok(mockSecrets.delete.calledOnce);
			assert.ok(mockSecrets.delete.calledWith('singular-blockly.txt.password'));
		});
	});

	suite('testConnection()', () => {
		test('should use default password ftc when no custom password stored', async () => {
			mockSecrets.get.resolves(undefined); // 無自訂密碼

			const mockSsh: SshClientInterface = {
				connect: sandbox.stub().resolves(),
				execCommand: sandbox.stub().resolves({ stdout: 'ok', stderr: '', code: 0 }),
				dispose: sandbox.stub(),
			};

			const service = new TxtConnectionService(mockContext, () => Promise.resolve(mockSsh));
			const result = await service.testConnection();

			// 使用預設密碼仍可成功連線
			assert.strictEqual(result.success, true);
			const connectArg = (mockSsh.connect as sinon.SinonStub).firstCall.args[0] as { password: string };
			assert.strictEqual(connectArg.password, 'ftc');
		});

		test('should return success when SSH echo responds with ok', async () => {
			mockSecrets.get.resolves('secret');

			const mockSsh: SshClientInterface = {
				connect: sandbox.stub().resolves(),
				execCommand: sandbox.stub().resolves({ stdout: 'ok', stderr: '', code: 0 }),
				dispose: sandbox.stub(),
			};

			const service = new TxtConnectionService(mockContext, () => Promise.resolve(mockSsh));
			const result = await service.testConnection();

			assert.strictEqual(result.success, true);
			assert.ok(result.message.includes('192.168.7.2'));
			assert.ok((mockSsh.dispose as sinon.SinonStub).calledOnce);
		});

		test('should return failure when SSH connect throws', async () => {
			mockSecrets.get.resolves('wrongpassword');

			const mockSsh: SshClientInterface = {
				connect: sandbox.stub().rejects(new Error('Authentication failed')),
				execCommand: sandbox.stub().resolves({ stdout: '', stderr: '', code: 1 }),
				dispose: sandbox.stub(),
			};

			const service = new TxtConnectionService(mockContext, () => Promise.resolve(mockSsh));
			const result = await service.testConnection();

			assert.strictEqual(result.success, false);
			assert.ok(result.message.includes('Authentication failed'));
			assert.ok((mockSsh.dispose as sinon.SinonStub).calledOnce);
		});

		test('should return failure when SSH echo returns unexpected output', async () => {
			mockSecrets.get.resolves('secret');

			const mockSsh: SshClientInterface = {
				connect: sandbox.stub().resolves(),
				execCommand: sandbox.stub().resolves({ stdout: 'error', stderr: '', code: 1 }),
				dispose: sandbox.stub(),
			};

			const service = new TxtConnectionService(mockContext, () => Promise.resolve(mockSsh));
			const result = await service.testConnection();

			assert.strictEqual(result.success, false);
		});
	});

	suite('setState() / getState()', () => {
		test('should start in Disconnected state', () => {
			const service = new TxtConnectionService(mockContext);
			assert.strictEqual(service.getState(), 'Disconnected');
		});

		test('should update state via setState', () => {
			const service = new TxtConnectionService(mockContext);
			service.setState('Running');
			assert.strictEqual(service.getState(), 'Running');
		});

		test('should transition through multiple states', () => {
			const service = new TxtConnectionService(mockContext);
			service.setState('Testing');
			assert.strictEqual(service.getState(), 'Testing');
			service.setState('Idle');
			assert.strictEqual(service.getState(), 'Idle');
			service.setState('Error');
			assert.strictEqual(service.getState(), 'Error');
		});
	});
});
