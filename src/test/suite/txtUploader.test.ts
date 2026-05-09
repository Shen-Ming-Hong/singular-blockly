/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { TxtUploader, SshUploaderClient } from '../../services/txtUploader';
import { TxtConnectionService } from '../../services/txtConnectionService';

suite('TxtUploader Test Suite', () => {
	let sandbox: sinon.SinonSandbox;
	let mockContext: vscode.ExtensionContext;
	let mockSecrets: { store: sinon.SinonStub; get: sinon.SinonStub; delete: sinon.SinonStub };
	let mockOutputChannel: vscode.OutputChannel;
	let configValues: Record<string, unknown>;

	setup(() => {
		sandbox = sinon.createSandbox();
		configValues = {
			'txt.host': '192.168.7.2',
			'txt.username': 'ftc',
			'txt.remotePath': '/tmp/singular_blockly/main.py',
			'txt.runtimePort': 8080,
		};

		mockSecrets = {
			store: sandbox.stub().resolves(),
			get: sandbox.stub().resolves('testpassword'),
			delete: sandbox.stub().resolves(),
		};

		mockContext = {
			secrets: mockSecrets as unknown as vscode.SecretStorage,
		} as unknown as vscode.ExtensionContext;

		mockOutputChannel = {
			appendLine: sandbox.stub(),
			append: sandbox.stub(),
			show: sandbox.stub(),
			dispose: sandbox.stub(),
			clear: sandbox.stub(),
			hide: sandbox.stub(),
			replace: sandbox.stub(),
			name: 'TXT Controller',
		} as unknown as vscode.OutputChannel;

		sandbox.stub(vscode.workspace, 'getConfiguration').returns({
			get: (key: string, defaultValue?: unknown) => {
				return key in configValues ? configValues[key] : defaultValue;
			},
			update: sandbox.stub().resolves(),
		} as unknown as vscode.WorkspaceConfiguration);
	});

	teardown(() => {
		sandbox.restore();
	});

	function makeMockSsh(overrides: Partial<SshUploaderClient> = {}): SshUploaderClient {
		return {
			connect: sandbox.stub().resolves(),
			putFile: sandbox.stub().resolves(),
			execCommand: sandbox.stub().resolves({ stdout: '', stderr: '', code: 0 }),
			dispose: sandbox.stub(),
			...overrides,
		};
	}

	suite('upload()', () => {
		test('should use default password ftc when no custom password stored', async () => {
			mockSecrets.get.resolves(undefined); // 無自訂密碼
			const mockSsh = makeMockSsh({
				execCommand: sandbox.stub().callsFake((cmd: string) => {
					if (cmd.startsWith('mkdir')) {return Promise.resolve({ stdout: '', stderr: '', code: 0 });}
					if (cmd.startsWith('python3')) {return Promise.resolve({ stdout: '', stderr: '', code: 0 });}
					return Promise.resolve({ stdout: '', stderr: '', code: 0 });
				}),
			});
			const connectionService = new TxtConnectionService(mockContext);
			const uploader = new TxtUploader(connectionService, mockOutputChannel, () => Promise.resolve(mockSsh));

			const result = await uploader.upload('print("hello")');

			// 使用預設密碼 ftc 仍可成功連線上傳
			assert.strictEqual(result.success, true);
			const connectArg = (mockSsh.connect as sinon.SinonStub).firstCall.args[0] as { password: string };
			assert.strictEqual(connectArg.password, 'ftc');
		});

		test('should fail when SSH connection fails', async () => {
			const mockSsh = makeMockSsh({
				connect: sandbox.stub().rejects(new Error('Connection refused')),
			});

			const connectionService = new TxtConnectionService(mockContext);
			const uploader = new TxtUploader(connectionService, mockOutputChannel, () => Promise.resolve(mockSsh));

			const result = await uploader.upload('print("hello")');

			assert.strictEqual(result.success, false);
			assert.ok(result.error?.includes('Connection refused'));
		});

		test('should upload and execute successfully', async () => {
			const mockSsh = makeMockSsh({
				execCommand: sandbox.stub().callsFake((cmd: string) => {
					if (cmd.startsWith('mkdir')) {return Promise.resolve({ stdout: '', stderr: '', code: 0 });}
					if (cmd.startsWith('python3')) {return Promise.resolve({ stdout: 'done\n', stderr: '', code: 0 });}
					return Promise.resolve({ stdout: '', stderr: '', code: 0 });
				}),
			});

			const connectionService = new TxtConnectionService(mockContext);
			const uploader = new TxtUploader(connectionService, mockOutputChannel, () => Promise.resolve(mockSsh));

			const result = await uploader.upload('print("hello")');

			assert.strictEqual(result.success, true);
			assert.ok(result.duration >= 0);
			assert.ok((mockSsh.dispose as sinon.SinonStub).calledOnce);
		});

		test('should report progress stages', async () => {
			const mockSsh = makeMockSsh({
				execCommand: sandbox.stub().callsFake((cmd: string) => {
					if (cmd.startsWith('mkdir')) {return Promise.resolve({ stdout: '', stderr: '', code: 0 });}
					if (cmd.startsWith('python3')) {return Promise.resolve({ stdout: '', stderr: '', code: 0 });}
					return Promise.resolve({ stdout: '', stderr: '', code: 0 });
				}),
			});

			const connectionService = new TxtConnectionService(mockContext);
			const uploader = new TxtUploader(connectionService, mockOutputChannel, () => Promise.resolve(mockSsh));

			const stages: string[] = [];
			await uploader.upload('print("hello")', progress => {
				stages.push(progress.stage);
			});

			assert.ok(stages.includes('connecting'));
			assert.ok(stages.includes('uploading'));
			assert.ok(stages.includes('executing'));
			assert.ok(stages.includes('completed'));
		});

		test('should return failure when program exits with non-zero code', async () => {
			const mockSsh = makeMockSsh({
				execCommand: sandbox.stub().callsFake((cmd: string) => {
					if (cmd.startsWith('mkdir')) {return Promise.resolve({ stdout: '', stderr: '', code: 0 });}
					if (cmd.startsWith('python3')) {return Promise.resolve({ stdout: '', stderr: 'SyntaxError', code: 1 });}
					return Promise.resolve({ stdout: '', stderr: '', code: 0 });
				}),
			});

			const connectionService = new TxtConnectionService(mockContext);
			const uploader = new TxtUploader(connectionService, mockOutputChannel, () => Promise.resolve(mockSsh));

			const result = await uploader.upload('bad code');

			assert.strictEqual(result.success, false);
			assert.strictEqual(result.exitCode, 1);
		});

			test('should derive remote directory and quote configured remote path', async () => {
				configValues['txt.remotePath'] = '/tmp/custom dir/main script.py';
				const mockSsh = makeMockSsh({
					execCommand: sandbox.stub().callsFake((cmd: string) => {
						if (cmd.startsWith('python3')) {return Promise.resolve({ stdout: '', stderr: '', code: 0 });}
						return Promise.resolve({ stdout: '', stderr: '', code: 0 });
					}),
				});

				const connectionService = new TxtConnectionService(mockContext);
				const uploader = new TxtUploader(connectionService, mockOutputChannel, () => Promise.resolve(mockSsh));

				const result = await uploader.upload('print("hello")');

				assert.strictEqual(result.success, true);
				const execCalls = (mockSsh.execCommand as sinon.SinonStub).getCalls().map(call => call.args[0] as string);
				const stopCall = execCalls.find(command => command.includes('pkill -f --'));
				const mkdirCall = execCalls.find(command => command.startsWith('mkdir -p'));
				const pythonCall = execCalls.find(command => command.startsWith('python3 '));

				assert.ok(stopCall?.includes('python3[[:space:]]+/tmp/custom dir/main script\\.py'));
				assert.strictEqual(mkdirCall, "mkdir -p '/tmp/custom dir'");
				assert.strictEqual(pythonCall, "python3 '/tmp/custom dir/main script.py'");
			});
	});

	suite('stopExecution()', () => {
		test('should use configured remote path when issuing fallback pkill', async () => {
			configValues['txt.remotePath'] = '/tmp/custom dir/main script.py';
			const mockSsh = makeMockSsh();

			const connectionService = new TxtConnectionService(mockContext);
			const uploader = new TxtUploader(connectionService, mockOutputChannel, () => Promise.resolve(mockSsh));

			await uploader.stopExecution();

			const pkillCommand = (mockSsh.execCommand as sinon.SinonStub).firstCall.args[0] as string;
			assert.ok(pkillCommand.includes('python3[[:space:]]+/tmp/custom dir/main script\\.py'));
		});
	});
});
