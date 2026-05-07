/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { TxtTestService, SshTestClient, FetchFunction, JsonResponse } from '../../services/txtTestService';
import { TxtConnectionService } from '../../services/txtConnectionService';
import { TxtIoSnapshot } from '../../types/txt';

suite('TxtTestService Test Suite', () => {
	let sandbox: sinon.SinonSandbox;
	let mockContext: vscode.ExtensionContext;
	let mockSecrets: {
		store: sinon.SinonStub;
		get: sinon.SinonStub;
		delete: sinon.SinonStub;
	};
	let mockExtensionUri: vscode.Uri;

	setup(() => {
		sandbox = sinon.createSandbox();

		mockSecrets = {
			store: sandbox.stub().resolves(),
			get: sandbox.stub().resolves('ftc'),
			delete: sandbox.stub().resolves(),
		};

		mockContext = {
			secrets: mockSecrets as unknown as vscode.SecretStorage,
		} as unknown as vscode.ExtensionContext;

		mockExtensionUri = vscode.Uri.file('/fake/extension');

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

	// ─── SSH Mock Helper ────────────────────────────────────────────────────────

	function makeMockSsh(overrides: Partial<SshTestClient> = {}): SshTestClient {
		return {
			connect: sandbox.stub().resolves(),
			putFile: sandbox.stub().resolves(),
			execCommand: sandbox.stub().resolves({ stdout: '', stderr: '', code: 0 }),
			dispose: sandbox.stub(),
			...overrides,
		};
	}

	// ─── Fetch Mock Helper ──────────────────────────────────────────────────────

	function makeMockFetch(body: unknown, ok = true, status = 200): FetchFunction {
		const response: JsonResponse = {
			ok,
			status,
			json: () => Promise.resolve(body),
		};
		return sandbox.stub().resolves(response);
	}

	// ─── installRuntime() ───────────────────────────────────────────────────────

	suite('installRuntime()', () => {
		test('should connect via SSH with default password', async () => {
			mockSecrets.get.resolves(undefined); // 無自訂密碼，使用預設 ftc
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.installRuntime();

			assert.ok((mockSsh.connect as sinon.SinonStub).calledOnce);
			const connectArg = (mockSsh.connect as sinon.SinonStub).firstCall.args[0];
			assert.strictEqual(connectArg.host, '192.168.7.2');
			assert.strictEqual(connectArg.username, 'ftc');
			assert.strictEqual(connectArg.password, 'ftc'); // default password
		});

		test('should create remote directory via SSH', async () => {
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.installRuntime();

			const execCalls = (mockSsh.execCommand as sinon.SinonStub).getCalls();
			const mkdirCall = execCalls.find(c => (c.args[0] as string).startsWith('mkdir'));
			assert.ok(mkdirCall, 'should call mkdir -p on remote');
			assert.ok((mkdirCall.args[0] as string).includes('/tmp/singular_blockly'));
		});

		test('should upload io_server.py via putFile', async () => {
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.installRuntime();

			assert.ok((mockSsh.putFile as sinon.SinonStub).calledOnce);
			const [localPath, remotePath] = (mockSsh.putFile as sinon.SinonStub).firstCall.args as [string, string];
			assert.ok(localPath.endsWith('io_server.py'), `local path should end with io_server.py, got: ${localPath}`);
			assert.strictEqual(remotePath, '/tmp/singular_blockly/io_server.py');
		});

		test('should set execute permission via chmod', async () => {
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.installRuntime();

			const execCalls = (mockSsh.execCommand as sinon.SinonStub).getCalls();
			const chmodCall = execCalls.find(c => (c.args[0] as string).startsWith('chmod'));
			assert.ok(chmodCall, 'should call chmod on remote file');
			assert.ok((chmodCall.args[0] as string).includes('io_server.py'));
		});

		test('should dispose SSH even when putFile throws', async () => {
			const mockSsh = makeMockSsh({
				putFile: sandbox.stub().rejects(new Error('SCP failed')),
			});
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await assert.rejects(() => service.installRuntime(), /SCP failed/);
			assert.ok((mockSsh.dispose as sinon.SinonStub).calledOnce, 'should dispose SSH on error');
		});
	});

	// ─── startServer() ──────────────────────────────────────────────────────────

	suite('startServer()', () => {
		test('should start io_server.py via SSH in background', async () => {
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.startServer();

			const execCalls = (mockSsh.execCommand as sinon.SinonStub).getCalls();
			const startCall = execCalls.find(c => (c.args[0] as string).includes('python3'));
			assert.ok(startCall, 'should call python3 to start server');
			assert.ok((startCall.args[0] as string).includes('io_server.py'));
			assert.ok((startCall.args[0] as string).includes('8080'), 'should pass port 8080');
			assert.ok((startCall.args[0] as string).endsWith('&'), 'should run in background with &');
		});

		test('should dispose SSH after starting server', async () => {
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.startServer();

			assert.ok((mockSsh.dispose as sinon.SinonStub).calledOnce);
		});
	});

	// ─── stopServer() ───────────────────────────────────────────────────────────

	suite('stopServer()', () => {
		test('should kill io_server.py via pkill', async () => {
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.stopServer();

			const execCalls = (mockSsh.execCommand as sinon.SinonStub).getCalls();
			const pkillCall = execCalls.find(c => (c.args[0] as string).startsWith('pkill'));
			assert.ok(pkillCall, 'should call pkill');
			assert.ok((pkillCall.args[0] as string).includes('io_server.py'));
		});

		test('should dispose SSH after stopping server', async () => {
			const mockSsh = makeMockSsh();
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(
				connectionService,
				mockExtensionUri,
				() => Promise.resolve(mockSsh)
			);

			await service.stopServer();

			assert.ok((mockSsh.dispose as sinon.SinonStub).calledOnce);
		});
	});

	// ─── pollIo() ───────────────────────────────────────────────────────────────

	suite('pollIo()', () => {
		const sampleSnapshot: TxtIoSnapshot = {
			motors: [0, 0, 0, 0],
			outputs: [false, false, false, false, false, false, false, false],
			inputs: [1, 1, 0, 1, 1, 1, 1, 1],
			timestamp: 1714742400000,
		};

		test('should fetch GET /io and return TxtIoSnapshot', async () => {
			const mockFetch = makeMockFetch(sampleSnapshot);
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			const result = await service.pollIo();

			assert.ok((mockFetch as sinon.SinonStub).calledOnce);
			const [url] = (mockFetch as sinon.SinonStub).firstCall.args as [string];
			assert.strictEqual(url, 'http://192.168.7.2:8080/io');
			assert.deepStrictEqual(result.motors, [0, 0, 0, 0]);
			assert.deepStrictEqual(result.inputs, [1, 1, 0, 1, 1, 1, 1, 1]);
		});

		test('should throw when server returns non-ok status', async () => {
			const mockFetch = makeMockFetch({ error: 'ftrobopy connection failed' }, false, 503);
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await assert.rejects(() => service.pollIo(), /HTTP 503/);
		});

		test('should throw when fetch rejects (network error)', async () => {
			const mockFetch: FetchFunction = sandbox.stub().rejects(new Error('ECONNREFUSED'));
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await assert.rejects(() => service.pollIo(), /ECONNREFUSED/);
		});
	});

	// ─── setMotor() ─────────────────────────────────────────────────────────────

	suite('setMotor()', () => {
		test('should POST /motor with correct motor and speed', async () => {
			const mockFetch = makeMockFetch({ ok: true });
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await service.setMotor(2, 300);

			assert.ok((mockFetch as sinon.SinonStub).calledOnce);
			const [url, init] = (mockFetch as sinon.SinonStub).firstCall.args as [string, { method: string; body: string }];
			assert.strictEqual(url, 'http://192.168.7.2:8080/motor');
			assert.strictEqual(init.method, 'POST');
			const body = JSON.parse(init.body) as { motor: number; speed: number };
			assert.strictEqual(body.motor, 2);
			assert.strictEqual(body.speed, 300);
		});

		test('should POST /motor with negative speed for reverse', async () => {
			const mockFetch = makeMockFetch({ ok: true });
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await service.setMotor(1, -512);

			const [, init] = (mockFetch as sinon.SinonStub).firstCall.args as [string, { body: string }];
			const body = JSON.parse(init.body) as { motor: number; speed: number };
			assert.strictEqual(body.speed, -512);
		});
	});

	// ─── setOutput() ────────────────────────────────────────────────────────────

	suite('setOutput()', () => {
		test('should POST /output with output and level', async () => {
			const mockFetch = makeMockFetch({ ok: true });
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await service.setOutput(3, 512);

			assert.ok((mockFetch as sinon.SinonStub).calledOnce);
			const [url, init] = (mockFetch as sinon.SinonStub).firstCall.args as [string, { method: string; body: string }];
			assert.strictEqual(url, 'http://192.168.7.2:8080/output');
			assert.strictEqual(init.method, 'POST');
			const body = JSON.parse(init.body) as { output: number; level: number };
			assert.strictEqual(body.output, 3);
			assert.strictEqual(body.level, 512);
		});

		test('should POST level 0 to turn output off', async () => {
			const mockFetch = makeMockFetch({ ok: true });
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await service.setOutput(5, 0);

			const [, init] = (mockFetch as sinon.SinonStub).firstCall.args as [string, { body: string }];
			const body = JSON.parse(init.body) as { output: number; level: number };
			assert.strictEqual(body.level, 0);
		});
	});

	// ─── stopAll() ──────────────────────────────────────────────────────────────

	suite('stopAll()', () => {
		test('should POST /stop_all with empty body', async () => {
			const mockFetch = makeMockFetch({ ok: true, stopped: { motors: 4, outputs: 8 } });
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await service.stopAll();

			assert.ok((mockFetch as sinon.SinonStub).calledOnce);
			const [url, init] = (mockFetch as sinon.SinonStub).firstCall.args as [string, { method: string; body: string }];
			assert.strictEqual(url, 'http://192.168.7.2:8080/stop_all');
			assert.strictEqual(init.method, 'POST');
			// body 應該是空物件或空 JSON
			const body = JSON.parse(init.body) as Record<string, unknown>;
			assert.deepStrictEqual(body, {});
		});

		test('should use custom runtimePort from config', async () => {
			// 覆蓋 runtimePort 為 9090
			sandbox.restore();
			sandbox = sinon.createSandbox();
			mockSecrets = {
				store: sandbox.stub().resolves(),
				get: sandbox.stub().resolves('ftc'),
				delete: sandbox.stub().resolves(),
			};
			mockContext = {
				secrets: mockSecrets as unknown as vscode.SecretStorage,
			} as unknown as vscode.ExtensionContext;

			sandbox.stub(vscode.workspace, 'getConfiguration').returns({
				get: (key: string, defaultValue?: unknown) => {
					const overrides: Record<string, unknown> = {
						'txt.host': '192.168.7.2',
						'txt.username': 'ftc',
						'txt.remotePath': '/tmp/singular_blockly/main.py',
						'txt.runtimePort': 9090,
					};
					return key in overrides ? overrides[key] : defaultValue;
				},
				update: sandbox.stub().resolves(),
			} as unknown as vscode.WorkspaceConfiguration);

			const mockFetch = makeMockFetch({ ok: true });
			const connectionService = new TxtConnectionService(mockContext);
			const service = new TxtTestService(connectionService, mockExtensionUri, undefined, mockFetch);

			await service.stopAll();

			const [url] = (mockFetch as sinon.SinonStub).firstCall.args as [string];
			assert.ok(url.includes(':9090/'), `URL should use custom port 9090, got: ${url}`);
		});
	});
});
