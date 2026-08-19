/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import { FileService } from '../../services/fileService';
import { getWorkspaceCandidateService, WorkspaceCandidateService } from '../../services/workspaceCandidateService';
import {
	isWorkspaceDocument,
	isWorkspaceValidationIssue,
	isWorkspaceLiveLoadResultMessage,
	normalizeWorkspaceBoardId,
	normalizeWorkspaceDocumentBoard,
	WorkspaceCandidateValidationResult,
	WorkspaceDocument,
	WorkspaceLiveLoadResultMessage,
} from '../../types/workspaceValidation';

suite('WorkspaceCandidateService Tests', () => {
	let workspace: string;
	const valid: WorkspaceDocument = {
		board: 'uno',
		workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'arduino_setup_loop' }] } },
	};

	setup(() => {
		workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'sb-candidate-'));
		fs.mkdirSync(path.join(workspace, 'blockly'), { recursive: true });
	});

	teardown(() => fs.rmSync(workspace, { recursive: true, force: true }));
	teardown(() => sinon.restore());

	function writeMain(value: unknown): void {
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), JSON.stringify(value));
	}

	function liveLoadSucceeded(
		requestId: string,
		generation: number,
		document: WorkspaceDocument
	): WorkspaceLiveLoadResultMessage {
		return { command: 'workspaceLiveLoadResult', requestId, generation, success: true, normalizedDocument: document };
	}

	test('commits only the correlated runtime-normalized candidate after live load acknowledgement', async () => {
		writeMain(valid);
		const service = new WorkspaceCandidateService(workspace, undefined, 100);
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult',
				requestId: request.requestId,
				generation: request.generation,
				valid: true,
				normalizedDocument: { ...request.document, normalized: true },
			}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(
				requestId,
				generation,
				{ ...document, normalized: 'live-runtime' }
			)
		);
		await service.processCandidate();
		const main = JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8'));
		const backup = JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8'));
		assert.strictEqual(main.normalized, 'live-runtime');
		assert.deepStrictEqual(backup, main);
	});

	test('normalizes legacy board ids before validation and commits the live canonical document', async () => {
		writeMain({ ...valid, board: 'arduino_uno' });
		let validatedBoard = '';
		const service = new WorkspaceCandidateService(workspace, undefined, 100);
		service.attachChannels(
			async request => {
				validatedBoard = request.document.board;
				return {
					command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
					valid: true, normalizedDocument: request.document,
				};
			},
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await service.processCandidate();

		assert.strictEqual(validatedBoard, 'uno');
		assert.strictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')).board, 'uno');
		assert.strictEqual(normalizeWorkspaceBoardId('esp32_super_mini'), 'supermini');
		assert.strictEqual(normalizeWorkspaceDocumentBoard(valid).board, 'uno');
		assert.strictEqual(isWorkspaceLiveLoadResultMessage({
			command: 'workspaceLiveLoadResult', requestId: 'missing-document', generation: 1, success: true,
		}), false);
	});

	test('does not let a rejected candidate overwrite a normal editor save completed during validation', async () => {
		writeMain({ ...valid, candidate: 'external' });
		let resolveValidation!: (result: WorkspaceCandidateValidationResult) => void;
		let request: any;
		const service = new WorkspaceCandidateService(workspace, undefined, 1000);
		service.attachChannels(
			message => {
				request = message;
				return new Promise(resolve => {resolveValidation = resolve;});
			},
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		const candidate = service.processCandidate();
		for (let attempt = 0; attempt < 20 && !request; attempt++) {await new Promise(resolve => setTimeout(resolve, 5));}
		const editorDocument = { ...valid, editorSave: true };
		await service.recordValidDocument(editorDocument);
		resolveValidation({
			command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
			valid: false, issue: { code: 'INVALID_FIELD' },
		});
		await candidate;

		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')), editorDocument);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8')), editorDocument);
	});

	test('dispose invalidates pending validation before it can write workspace files', async () => {
		writeMain(valid);
		let resolveValidation!: (result: WorkspaceCandidateValidationResult) => void;
		let request: any;
		const service = new WorkspaceCandidateService(workspace, undefined, 1000).start({
			createFileSystemWatcher: () => ({
				onDidChange: () => ({ dispose() {} }), onDidCreate: () => ({ dispose() {} }),
				onDidDelete: () => ({ dispose() {} }), dispose() {},
			}),
		} as any);
		service.attachChannels(
			message => {
				request = message;
				return new Promise(resolve => {resolveValidation = resolve;});
			},
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		const candidate = service.processCandidate();
		for (let attempt = 0; attempt < 20 && !request; attempt++) {await new Promise(resolve => setTimeout(resolve, 5));}
		service.dispose();
		assert.strictEqual(await service.recordValidDocument(valid), false);
		service.dispose();
		resolveValidation({
			command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
			valid: false, issue: { code: 'INVALID_FIELD' },
		});
		await candidate;

		assert.strictEqual(fs.existsSync(path.join(workspace, 'blockly', 'main.invalid.json')), false);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')), valid);
	});

	test('quarantines invalid JSON and restores the last valid disk backup', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		const service = new WorkspaceCandidateService(workspace);
		await service.processCandidate();
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.invalid.json')), Buffer.from('{'));
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), recovery);
	});

	test('reports whether rejection restored a valid version or only quarantined the candidate', async () => {
		const outcomes: string[] = [];
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		await new WorkspaceCandidateService(
			workspace,
			undefined,
			undefined,
			undefined,
			(_issue, outcome) => {outcomes.push(outcome);}
		).processCandidate();

		fs.rmSync(path.join(workspace, 'blockly', 'main.json.bak'));
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		await new WorkspaceCandidateService(
			workspace,
			undefined,
			undefined,
			undefined,
			(_issue, outcome) => {outcomes.push(outcome);}
		).processCandidate();

		assert.deepStrictEqual(outcomes, ['restored', 'quarantined']);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), Buffer.from('{'));
	});

	test('does not wait for rejection UI before completing automatic recovery', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		const service = new WorkspaceCandidateService(
			workspace,
			undefined,
			undefined,
			undefined,
			async () => await new Promise<void>(() => {})
		);

		await Promise.race([
			service.processCandidate(),
			new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('recovery blocked on UI')), 500)),
		]);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), recovery);
	});

	test('never restores over a newer observed candidate during rejection handling', async () => {
		for (const phase of ['validation', 'timeout', 'live-load'] as const) {
			const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
			fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
			writeMain({ ...valid, candidate: phase });
			const newer = { ...valid, candidate: `${phase}-newer` };
			const fileService = new FileService(workspace);
			const originalWrite = fileService.writeFileAtomic.bind(fileService);
			let injected = false;
			const service = new WorkspaceCandidateService(workspace, fileService, 5);
			sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
				await originalWrite(relative, content);
				if (!injected && relative === 'blockly/main.invalid.json') {
					injected = true;
					writeMain(newer);
					(service as any).observationRevision++;
				}
			});
			service.attachChannels(
				async request => {
					if (phase === 'timeout') {return await new Promise<WorkspaceCandidateValidationResult>(() => {});}
					if (phase === 'validation') {
						return {
							command: 'workspaceCandidateValidationResult', requestId: request.requestId,
							generation: request.generation, valid: false, issue: { code: 'INVALID_FIELD' },
						};
					}
					return {
						command: 'workspaceCandidateValidationResult', requestId: request.requestId,
						generation: request.generation, valid: true, normalizedDocument: request.document,
					};
				},
				async (requestId, generation) => ({
					command: 'workspaceLiveLoadResult', requestId, generation, success: phase !== 'live-load',
				})
			);

			await service.processCandidate(false, 0);
			assert.deepStrictEqual(
				JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')),
				newer,
				phase
			);
		}
	});

	test('rechecks the candidate after reading recovery bytes', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		writeMain({ ...valid, candidate: 'rejected' });
		const newer = { ...valid, candidate: 'newer-during-recovery-read' };
		const fileService = new FileService(workspace);
		const originalRead = fileService.readBuffer.bind(fileService);
		const service = new WorkspaceCandidateService(workspace, fileService, 100);
		sinon.stub(fileService, 'readBuffer').callsFake(async relative => {
			const bytes = await originalRead(relative);
			if (relative === 'blockly/main.json.bak') {
				writeMain(newer);
				(service as any).observationRevision++;
			}
			return bytes;
		});

		await service.processCandidate();
		assert.deepStrictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')),
			newer
		);
	});

	test('does not commit over a newer candidate observed while preparing the disk transaction', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		writeMain({ ...valid, candidate: 'validated' });
		const newer = { ...valid, candidate: 'newer-before-commit' };
		const fileService = new FileService(workspace);
		const originalRead = fileService.readBuffer.bind(fileService);
		const service = new WorkspaceCandidateService(workspace, fileService, 100);
		let backupRead = false;
		sinon.stub(fileService, 'readBuffer').callsFake(async relative => {
			const bytes = await originalRead(relative);
			if (relative === 'blockly/main.json.bak' && !backupRead) {
				backupRead = true;
				writeMain(newer);
				(service as any).observationRevision++;
			}
			return bytes;
		});
		const liveDocuments: WorkspaceDocument[] = [];
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => {
				liveDocuments.push(document);
				return liveLoadSucceeded(requestId, generation, document);
			}
		);

		await service.processCandidate();
		assert.deepStrictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')),
			newer
		);
		assert.deepStrictEqual(liveDocuments.map(document => document.candidate), ['validated', undefined]);
	});

	test('channel unavailability and timeout never promote a candidate', async () => {
		const original = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), original);
		writeMain({ ...valid, candidate: 'unavailable' });
		const noChannel = new WorkspaceCandidateService(workspace);
		await noChannel.processCandidate();
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), original);

		writeMain({ ...valid, candidate: 'timeout' });
		const timeout = new WorkspaceCandidateService(workspace, undefined, 10);
		timeout.attachChannels(
			async () => await new Promise<WorkspaceCandidateValidationResult>(() => {}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await timeout.processCandidate();
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), original);
	});

	test('covers invalid documents and negative runtime responses without promotion', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		const service = new WorkspaceCandidateService(workspace, undefined, 100);

		writeMain({ board: 'uno', workspace: { blocks: { blocks: [] } } });
		await service.processCandidate();

		writeMain({ ...valid, rejected: 'validation' });
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: false, issue: { code: 'INVALID_FIELD', blockType: 'text', field: 'TEXT' },
			}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await service.processCandidate();

		writeMain({ ...valid, rejected: 'live-error' });
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async () => {throw new Error('live channel failed');}
		);
		await service.processCandidate();

		writeMain({ ...valid, rejected: 'live-result' });
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation) => ({
				command: 'workspaceLiveLoadResult', requestId, generation, success: false, issue: { code: 'LIVE_LOAD_FAILED' },
			})
		);
		await service.processCandidate();

		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), recovery);
	});

	test('rejects malformed validation and live-load channel payloads with stable codes', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);

		writeMain({ ...valid, malformed: 'validation' });
		const malformedValidation = new WorkspaceCandidateService(workspace, undefined, 100);
		malformedValidation.attachChannels(
			async () => ({ command: 'workspaceCandidateValidationResult', valid: false } as any),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await malformedValidation.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'ROUND_TRIP_FAILED'
		);

		writeMain({ ...valid, malformed: 'live-load' });
		const malformedLiveLoad = new WorkspaceCandidateService(workspace, undefined, 100);
		malformedLiveLoad.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async () => ({ command: 'workspaceLiveLoadResult', success: 'yes' } as any)
		);
		await malformedLiveLoad.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'LIVE_LOAD_FAILED'
		);
	});

	test('handles exact-byte read failure and an immediately rejected validator promise', async () => {
		writeMain(valid);
		const readFailureService = new FileService(workspace);
		const originalRead = readFailureService.readBuffer.bind(readFailureService);
		let failed = false;
		sinon.stub(readFailureService, 'readBuffer').callsFake(async relative => {
			if (relative === 'blockly/main.json' && !failed) {
				failed = true;
				throw new Error('read failed');
			}
			return await originalRead(relative);
		});
		await new WorkspaceCandidateService(workspace, readFailureService).processCandidate();

		writeMain(valid);
		const rejected = new WorkspaceCandidateService(workspace, undefined, 100);
		rejected.attachChannels(
			async () => {throw new Error('validator rejected');},
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await rejected.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'CHANNEL_UNAVAILABLE'
		);
	});

	test('classifies immediate live-load rejection separately from an actual validation timeout', async () => {
		writeMain(valid);
		const liveFailure = new WorkspaceCandidateService(workspace, undefined, 100);
		liveFailure.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async () => {throw new Error('live load rejected');}
		);
		await liveFailure.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'LIVE_LOAD_FAILED'
		);

		writeMain(valid);
		const timeout = new WorkspaceCandidateService(workspace, undefined, 5);
		timeout.attachChannels(
			async () => await new Promise<WorkspaceCandidateValidationResult>(() => {}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await timeout.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'VALIDATION_TIMEOUT'
		);
	});

	test('keeps the fixed latest quarantine and only the five newest exact-pattern histories', async () => {
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), JSON.stringify(valid));
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.invalid.keep.json'), 'do not delete');
		const service = new WorkspaceCandidateService(workspace, undefined, 10, () => new Date('2026-08-12T08:15:30.123Z'));
		for (let index = 0; index < 6; index++) {
			writeMain({ ...valid, invalid: index });
			await service.processCandidate();
		}
		const names = fs.readdirSync(path.join(workspace, 'blockly'));
		assert.ok(names.includes('main.invalid.json'));
		assert.ok(names.includes('main.invalid.keep.json'));
		assert.strictEqual(names.filter(name => /^main\.invalid\.\d{8}T\d{9}Z-\d+\.json$/.test(name)).length, 5);
	});

	test('ignores a superseded late validation result', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		let resolveFirst!: (result: WorkspaceCandidateValidationResult) => void;
		const service = new WorkspaceCandidateService(workspace, undefined, 1000);
		service.attachChannels(
			request => new Promise(resolve => {
				resolveFirst = result => resolve(result);
			}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		writeMain({ ...valid, candidate: 1 });
		const first = service.processCandidate();
		for (let attempt = 0; attempt < 20 && !resolveFirst; attempt++) {
			await new Promise(resolve => setTimeout(resolve, 5));
		}
		assert.ok(resolveFirst, 'first validation must be pending before it is superseded');
		service.detachChannels();
		writeMain({ ...valid, candidate: 2 });
		await service.processCandidate();
		resolveFirst({
			command: 'workspaceCandidateValidationResult', requestId: 'late', generation: 1, valid: true, normalizedDocument: valid,
		});
		await first;
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), recovery);
	});

	test('supersedes an in-flight candidate as soon as a newer watcher event is observed', async () => {
		let firstRequest: any;
		let resolveFirst!: (result: WorkspaceCandidateValidationResult) => void;
		const liveDocuments: WorkspaceDocument[] = [];
		const service = new WorkspaceCandidateService(workspace, undefined, 1000);
		service.attachChannels(
			request => {
				if (request.document.candidate === 'A') {
					firstRequest = request;
					return new Promise(resolve => {resolveFirst = resolve;});
				}
				return Promise.resolve({
					command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
					valid: true, normalizedDocument: request.document,
				});
			},
			async (requestId, generation, _deadlineAt, document) => {
				liveDocuments.push(document);
				return liveLoadSucceeded(requestId, generation, document);
			}
		);

		writeMain({ ...valid, candidate: 'A' });
		const first = service.processCandidate();
		for (let attempt = 0; attempt < 20 && !firstRequest; attempt++) {
			await new Promise(resolve => setTimeout(resolve, 5));
		}
		assert.ok(firstRequest, 'candidate A must be validating');

		writeMain({ ...valid, candidate: 'B' });
		(service as any).scheduleCandidate(false);
		resolveFirst({
			command: 'workspaceCandidateValidationResult', requestId: firstRequest.requestId,
			generation: firstRequest.generation, valid: true, normalizedDocument: firstRequest.document,
		});
		await first;
		assert.strictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')).candidate, 'B');
		assert.strictEqual(liveDocuments.length, 0);

		for (let attempt = 0; attempt < 40 && !fs.existsSync(path.join(workspace, 'blockly', 'main.json.bak')); attempt++) {
			await new Promise(resolve => setTimeout(resolve, 25));
		}
		assert.strictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')).candidate, 'B');
		assert.deepStrictEqual(liveDocuments.map(document => document.candidate), ['B']);
		service.dispose();
	});

	test('serializes live transactions and rolls back a candidate superseded during formal load', async () => {
		const recovery = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), recovery);
		writeMain({ ...valid, candidate: 'A' });
		let firstRequestId = '';
		let firstGeneration = 0;
		let resolveFirst!: (result: WorkspaceLiveLoadResultMessage) => void;
		const liveDocuments: WorkspaceDocument[] = [];
		const service = new WorkspaceCandidateService(workspace, undefined, 1000);
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => {
				liveDocuments.push(document);
				if (document.candidate === 'A') {
					firstRequestId = requestId;
					firstGeneration = generation;
					return await new Promise<WorkspaceLiveLoadResultMessage>(resolve => {resolveFirst = resolve;});
				}
					return liveLoadSucceeded(requestId, generation, document);
			}
		);

		const first = service.processCandidate(false, 0);
		for (let attempt = 0; attempt < 20 && !resolveFirst; attempt++) {
			await new Promise(resolve => setTimeout(resolve, 5));
		}
		assert.ok(resolveFirst, 'candidate A must be loading before candidate B supersedes it');

		writeMain({ ...valid, candidate: 'B' });
		(service as any).observationRevision = 1;
		const second = service.processCandidate(false, 1);
			resolveFirst({
				...liveLoadSucceeded(firstRequestId, firstGeneration, liveDocuments[0]),
			});
		await Promise.all([first, second]);

		assert.deepStrictEqual(liveDocuments.map(document => document.candidate), ['A', undefined, 'B']);
		assert.strictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')).candidate, 'B');
	});

	test('seeds initial recovery only while the originally loaded main bytes are still current', async () => {
		const original = Buffer.from(JSON.stringify({ ...valid, legacy: true }));
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), original);
		const service = new WorkspaceCandidateService(workspace);
		const normalized = { ...valid, legacy: true, normalized: true };

		assert.strictEqual(await service.seedInitialValidDocument(normalized, original), true);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), original);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8')), normalized);

		const changed = Buffer.from(JSON.stringify({ ...valid, external: true }));
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), changed);
		assert.strictEqual(await service.seedInitialValidDocument({ ...valid, stale: true }, original), false);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8')), normalized);
	});

	test('transactionally commits and rolls back repaired initial documents', async () => {
		const originalMain = Buffer.from(JSON.stringify({ ...valid, disabled: true }));
		const originalBackup = Buffer.from(`${JSON.stringify({ ...valid, recovery: true })}\n`);
		const repaired = { ...valid, repaired: true };
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), originalMain);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), originalBackup);
		const success = new WorkspaceCandidateService(workspace);
		assert.strictEqual(
			await (success as any).seedInitialValidDocument(repaired, originalMain, true),
			true
		);
		const committed = Buffer.from(`${JSON.stringify(repaired, null, 2)}\n`);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), committed);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak')), committed);

		for (const scenario of [
			{ failPath: 'blockly/main.json', failAfterWrite: false, backupExists: true },
			{ failPath: 'blockly/main.json.bak', failAfterWrite: false, backupExists: true },
			{ failPath: 'blockly/main.json.bak', failAfterWrite: true, backupExists: true },
			{ failPath: 'blockly/main.json.bak', failAfterWrite: true, backupExists: false },
		]) {
			fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), originalMain);
			if (scenario.backupExists) {
				fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), originalBackup);
			} else if (fs.existsSync(path.join(workspace, 'blockly', 'main.json.bak'))) {
				fs.unlinkSync(path.join(workspace, 'blockly', 'main.json.bak'));
			}
			const fileService = new FileService(workspace);
			const originalWrite = fileService.writeFileAtomic.bind(fileService);
			let failureInjected = false;
			sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
				if (relative === scenario.failPath && !failureInjected) {
					failureInjected = true;
					if (scenario.failAfterWrite) {await originalWrite(relative, content);}
					throw new Error('injected initial repair failure');
				}
				await originalWrite(relative, content);
			});
			const service = new WorkspaceCandidateService(workspace, fileService);
			(service as any).lastValidMemory = Buffer.from('memory-before');
			await assert.rejects(
				(service as any).seedInitialValidDocument(repaired, originalMain, true),
				/injected initial repair failure/
			);
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), originalMain);
			if (scenario.backupExists) {
				assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak')), originalBackup);
			} else {
				assert.strictEqual(fs.existsSync(path.join(workspace, 'blockly', 'main.json.bak')), false);
			}
			assert.deepStrictEqual((service as any).lastValidMemory, Buffer.from('memory-before'));
			sinon.restore();
		}
	});

	test('commits the formally normalized external document after required-main repair', async () => {
		const external = {
			board: 'cyberbrick',
			workspace: {
				blocks: {
					languageVersion: 0,
					blocks: [{
						type: 'micropython_main', id: 'main', disabledReasons: ['MANUALLY_DISABLED', 'UNKNOWN'],
						inputs: { MAIN: { block: { type: 'text_print', id: 'content' } } },
					}],
				},
			},
		};
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), JSON.stringify(external));
		const service = new WorkspaceCandidateService(workspace, undefined, 100);
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId,
				generation: request.generation, valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => {
				const normalized = JSON.parse(JSON.stringify(document));
				delete normalized.workspace.blocks.blocks[0].disabledReasons;
				return liveLoadSucceeded(requestId, generation, normalized);
			}
		);
		await service.processCandidate();
		const main = JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8'));
		const backup = JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8'));
		assert.strictEqual(main.workspace.blocks.blocks[0].disabledReasons, undefined);
		assert.strictEqual(main.workspace.blocks.blocks[0].inputs.MAIN.block.id, 'content');
		assert.deepStrictEqual(backup, main);
	});

	test('rejects invalid or unreadable initial recovery seeds', async () => {
		const service = new WorkspaceCandidateService(workspace);
		assert.strictEqual(await service.seedInitialValidDocument({ workspace: {}, board: 1 } as any, Buffer.from('')), false);
		assert.strictEqual(await service.seedInitialValidDocument(valid, Buffer.from('')), false);

		writeMain(valid);
		const fileService = new FileService(workspace);
		sinon.stub(fileService, 'readBuffer').rejects(new Error('initial source unreadable'));
		assert.strictEqual(await new WorkspaceCandidateService(workspace, fileService).seedInitialValidDocument(
			valid,
			Buffer.from(JSON.stringify(valid))
		), false);
	});

	test('rejects an initial candidate only while its exact source bytes are still current', async () => {
		const expected = Buffer.from(JSON.stringify(valid));
		const service = new WorkspaceCandidateService(workspace);
		assert.strictEqual(await service.rejectInitialCandidate(expected, { code: 'INVALID_FIELD' }), false);

		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), expected);
		service.dispose();
		assert.strictEqual(await service.rejectInitialCandidate(expected, { code: 'INVALID_FIELD' }), false);

		const unreadableFileService = new FileService(workspace);
		sinon.stub(unreadableFileService, 'readBuffer').rejects(new Error('initial candidate unreadable'));
		assert.strictEqual(await new WorkspaceCandidateService(workspace, unreadableFileService).rejectInitialCandidate(
			expected,
			{ code: 'INVALID_FIELD' }
		), false);
		sinon.restore();

		writeMain({ ...valid, changed: true });
		const currentService = new WorkspaceCandidateService(workspace);
		assert.strictEqual(await currentService.rejectInitialCandidate(expected, { code: 'INVALID_FIELD' }), false);

		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), expected);
		assert.strictEqual(await currentService.rejectInitialCandidate(
			expected,
			{ code: 'INVALID_FIELD' },
			false
		), true);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), expected);
	});

	test('rechecks source bytes and channel availability after validation completes', async () => {
		writeMain(valid);
		const detached = new WorkspaceCandidateService(workspace, undefined, 100);
		detached.attachChannels(
			async request => {
				detached.detachChannels();
				return {
					command: 'workspaceCandidateValidationResult', requestId: request.requestId,
					generation: request.generation, valid: true, normalizedDocument: request.document,
				};
			},
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await detached.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'CHANNEL_UNAVAILABLE'
		);

		writeMain({ ...valid, candidate: 'validated' });
		const changed = { ...valid, candidate: 'changed-after-validation' };
		const liveLoad = sinon.spy(async (
			requestId: string,
			generation: number,
			_deadlineAt: number,
			document: WorkspaceDocument
		) => liveLoadSucceeded(requestId, generation, document));
		const changedSource = new WorkspaceCandidateService(workspace, undefined, 100);
		changedSource.attachChannels(
			async request => {
				writeMain(changed);
				return {
					command: 'workspaceCandidateValidationResult', requestId: request.requestId,
					generation: request.generation, valid: true, normalizedDocument: request.document,
				};
			},
			liveLoad
		);
		await changedSource.processCandidate();
		assert.strictEqual(liveLoad.callCount, 0);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')), changed);
	});

	test('ignores candidates superseded during read, validation rejection, or live-load rejection', async () => {
		writeMain(valid);
		const failedReadFileService = new FileService(workspace);
		const failedRead = new WorkspaceCandidateService(workspace, failedReadFileService);
		sinon.stub(failedReadFileService, 'readBuffer').callsFake(async () => {
			(failedRead as any).observationRevision++;
			throw new Error('stale read failed');
		});
		await failedRead.processCandidate();
		assert.strictEqual(fs.existsSync(path.join(workspace, 'blockly', 'main.invalid.json')), false);

		writeMain(valid);
		const staleReadFileService = new FileService(workspace);
		const originalRead = staleReadFileService.readBuffer.bind(staleReadFileService);
		const staleRead = new WorkspaceCandidateService(workspace, staleReadFileService);
		sinon.stub(staleReadFileService, 'readBuffer').callsFake(async relative => {
			const bytes = await originalRead(relative);
			(staleRead as any).observationRevision++;
			return bytes;
		});
		await staleRead.processCandidate();

		let rejectValidation!: (error: Error) => void;
		const validationRejected = new WorkspaceCandidateService(workspace, undefined, 1000);
		validationRejected.attachChannels(
			async () => await new Promise<WorkspaceCandidateValidationResult>((_resolve, reject) => {rejectValidation = reject;}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		const validationProcess = validationRejected.processCandidate();
		for (let attempt = 0; attempt < 20 && !rejectValidation; attempt++) {await new Promise(resolve => setTimeout(resolve, 5));}
		(validationRejected as any).scheduleCandidate(false);
		rejectValidation(new Error('stale validator rejection'));
		await validationProcess;
		validationRejected.dispose();

		let rejectLiveLoad!: (error: Error) => void;
		const liveRejected = new WorkspaceCandidateService(workspace, undefined, 1000);
		liveRejected.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async () => await new Promise((_resolve, reject) => {rejectLiveLoad = reject;})
		);
		const liveProcess = liveRejected.processCandidate();
		for (let attempt = 0; attempt < 20 && !rejectLiveLoad; attempt++) {await new Promise(resolve => setTimeout(resolve, 5));}
		(liveRejected as any).scheduleCandidate(false);
		rejectLiveLoad(new Error('stale live-load rejection'));
		await liveProcess;
		liveRejected.dispose();
	});

	test('rejects uncorrelated live acknowledgements and candidates whose disk bytes changed before commit', async () => {
		writeMain(valid);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), `${JSON.stringify(valid)}\n`);
		let liveCalled = false;
		const wrongValidation = new WorkspaceCandidateService(workspace, undefined, 100);
		wrongValidation.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: 'wrong-validation-id', generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => {
				liveCalled = true;
				return liveLoadSucceeded(requestId, generation, document);
			}
		);
		await wrongValidation.processCandidate();
		assert.strictEqual(liveCalled, false);

		const wrongLive = new WorkspaceCandidateService(workspace, undefined, 100);
		wrongLive.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (_requestId, generation, _deadlineAt, document) => ({
				...liveLoadSucceeded('wrong-live-id', generation, document),
			})
		);
		await wrongLive.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'LIVE_LOAD_FAILED'
		);

		const changedBeforeCommit = new WorkspaceCandidateService(workspace, undefined, 100);
		changedBeforeCommit.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => {
				writeMain({ ...valid, changedWhileLoading: true });
				return liveLoadSucceeded(requestId, generation, document);
			}
		);
		await changedBeforeCommit.processCandidate();
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')).changedWhileLoading,
			true
		);

		const staleObservation = sinon.spy(changedBeforeCommit, 'processCandidate');
		(changedBeforeCommit as any).observationRevision = 2;
		await (changedBeforeCommit as any).processObservedCandidate(false, 1);
		assert.strictEqual(staleObservation.callCount, 0);
		assert.strictEqual(await (changedBeforeCommit as any).isCandidateCurrent(999, 2, Buffer.from('stale')), false);
		assert.deepStrictEqual(
			(changedBeforeCommit as any).classifyChannelError(new Error('VALIDATION_TIMEOUT'), 'validation'),
			{ code: 'VALIDATION_TIMEOUT' }
		);
		assert.deepStrictEqual(
			(changedBeforeCommit as any).classifyChannelError(new Error('CHANNEL_UNAVAILABLE'), 'live-load'),
			{ code: 'CHANNEL_UNAVAILABLE' }
		);

		const unreadableCurrentFileService = new FileService(workspace);
		sinon.stub(unreadableCurrentFileService, 'readBuffer').rejects(new Error('current candidate unreadable'));
		const unreadableCurrent = new WorkspaceCandidateService(workspace, unreadableCurrentFileService);
		assert.strictEqual(await (unreadableCurrent as any).isCandidateCurrent(0, 0, Buffer.from('candidate')), false);
	});

	test('preserves an invalid initial main after quarantine when no recovery source exists', async () => {
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		const service = new WorkspaceCandidateService(workspace);
		await service.processCandidate();
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), Buffer.from('{'));
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.invalid.json')), Buffer.from('{'));
	});

	test('does not reprocess an internal main deletion as a new external candidate', async () => {
		const clock = sinon.useFakeTimers();
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		const fileService = new FileService(workspace);
		let onDelete: (() => void) | undefined;
		const workspaceApi = {
			createFileSystemWatcher: () => ({
				onDidChange: () => ({ dispose() {} }),
				onDidCreate: () => ({ dispose() {} }),
				onDidDelete: (callback: () => void) => {
					onDelete = callback;
					return { dispose() {} };
				},
				dispose() {},
			}),
		};
		const originalDelete = fileService.deleteFile.bind(fileService);
		sinon.stub(fileService, 'deleteFile').callsFake(async relative => {
			await originalDelete(relative);
			if (relative === 'blockly/main.json') {onDelete?.();}
		});
		const service = new WorkspaceCandidateService(workspace, fileService).start(workspaceApi as any);
		const process = sinon.spy(service, 'processCandidate');

		await (service as any).restoreBytes('blockly/main.json', undefined);
		await clock.tickAsync(501);

		assert.strictEqual(process.callCount, 0);
		service.dispose();
	});

	test('suppresses an expected internal write but processes a different observed hash', async () => {
		const service = new WorkspaceCandidateService(workspace);
		await service.recordValidDocument(valid);
		const process = sinon.spy(service, 'processCandidate');
		await (service as any).processObservedCandidate(false);
		assert.strictEqual(process.callCount, 0);

		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), JSON.stringify({ ...valid, external: true }));
		await (service as any).processObservedCandidate(false);
		assert.strictEqual(process.callCount, 1);
	});

	test('idempotently suppresses every duplicate event for one internal write', async () => {
		const service = new WorkspaceCandidateService(workspace);
		await service.recordValidDocument(valid);
		const process = sinon.spy(service, 'processCandidate');

		for (let event = 0; event < 5; event++) {
			await (service as any).processObservedCandidate(false);
		}

		assert.strictEqual(process.callCount, 0);
	});

	test('idempotently suppresses duplicate events for one internal deletion', async () => {
		writeMain(valid);
		const service = new WorkspaceCandidateService(workspace);
		await (service as any).restoreBytes('blockly/main.json', undefined);
		const process = sinon.spy(service, 'processCandidate');

		await (service as any).processObservedCandidate(true);
		await (service as any).processObservedCandidate(true);

		assert.strictEqual(process.callCount, 0);
	});

	test('seeds the exact initial main bytes as an idempotent watcher baseline', async () => {
		const initialBytes = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), initialBytes);
		const service = new WorkspaceCandidateService(workspace);

		assert.strictEqual(await service.seedInitialValidDocument(valid, initialBytes), true);
		const process = sinon.spy(service, 'processCandidate');
		await (service as any).processObservedCandidate(false);
		await (service as any).processObservedCandidate(false);

		assert.strictEqual(process.callCount, 0);
	});

	test('keeps the newest rapid internal save as the watcher baseline', async () => {
		const service = new WorkspaceCandidateService(workspace);
		const first = { ...valid, revision: 'A' };
		const second = { ...valid, revision: 'B' };
		await service.recordValidDocument(first);
		await service.recordValidDocument(second);
		const process = sinon.spy(service, 'processCandidate');

		await (service as any).processObservedCandidate(false);
		await (service as any).processObservedCandidate(false);

		assert.strictEqual(process.callCount, 0);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')), second);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8')), second);
	});

	test('covers watcher, disposal, deletion, and stale defensive branches', async () => {
		const clock = sinon.useFakeTimers();
		const watcher = {
			onDidChange: () => ({ dispose() {} }),
			onDidCreate: () => ({ dispose() {} }),
			onDidDelete: () => ({ dispose() {} }),
			dispose() {},
		};
		const service = new WorkspaceCandidateService(workspace);
		const workspaceApi = { createFileSystemWatcher: () => watcher };
		assert.strictEqual(service.start(workspaceApi as any), service);
		assert.strictEqual(getWorkspaceCandidateService(workspace), service);
		assert.strictEqual(service.start(workspaceApi as any), service);
		await service.recordValidDocument(valid);
		await service.recordValidDocument({ ...valid, second: true });
		await service.processCandidate(true);
		await (service as any).quarantineAndRecover({
			generation: 999,
			observationRevision: 0,
			candidate: Buffer.from('stale'),
			issue: { code: 'INVALID_JSON' },
			deleted: false,
		});
		await (service as any).restoreLiveWorkspace(1);
		(service as any).scheduleCandidate(false);
		(service as any).scheduleCandidate(false);
		service.dispose();
		(service as any).scheduleCandidate(false);
		await service.processCandidate();
		await clock.runAllAsync();
	});

	test('processes watcher hash read failures and failed live results without issue details', async () => {
		writeMain(valid);
		const fileService = new FileService(workspace);
		const originalRead = fileService.readBuffer.bind(fileService);
		let failExpectedHashRead = true;
		sinon.stub(fileService, 'readBuffer').callsFake(async relative => {
			if (relative === 'blockly/main.json' && failExpectedHashRead) {
				failExpectedHashRead = false;
				throw new Error('watcher hash read failed');
			}
			return await originalRead(relative);
		});
		const service = new WorkspaceCandidateService(workspace, fileService, 100);
		(service as any).expectedInternalMainState = { kind: 'present', hash: 'not-the-current-hash' };
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation) => ({ command: 'workspaceLiveLoadResult', requestId, generation, success: false })
		);

		await (service as any).processObservedCandidate(false);
		const status = JSON.parse(fs.readFileSync(
			path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'),
			'utf8'
		));
		assert.deepStrictEqual(status.issue, { code: 'LIVE_LOAD_FAILED' });
	});

	test('ignores invalid in-memory live rollback documents and malformed document shapes', async () => {
		const service = new WorkspaceCandidateService(workspace);
		(service as any).lastValidMemory = Buffer.from(JSON.stringify({ board: 1, workspace: {} }));
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);
		await (service as any).restoreLiveWorkspace(1);
		assert.strictEqual(isWorkspaceDocument(null), false);
		assert.strictEqual(isWorkspaceDocument({ board: 1, workspace: {} }), false);
		assert.strictEqual(isWorkspaceValidationIssue({ code: 'UNKNOWN_BLOCK_TYPE', blockType: 'a'.repeat(128) }), true);
		assert.strictEqual(isWorkspaceValidationIssue({ code: 'UNKNOWN_BLOCK_TYPE', blockType: 'a'.repeat(129) }), false);
		assert.strictEqual(isWorkspaceValidationIssue({ code: 'NOT_ALLOWED' }), false);
	});

	test('degrades safely when quarantine, recovery, deletion, or status writes fail', async () => {
		const cases: Array<{ setup: () => void; failPath: string; failOperation: 'write' | 'delete' }> = [
			{ setup: () => writeMain(valid), failPath: 'blockly/main.invalid.json', failOperation: 'write' },
			{
				setup: () => {
					fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), JSON.stringify(valid));
					writeMain(valid);
				},
				failPath: 'blockly/main.json', failOperation: 'write',
			},
			{ setup: () => writeMain(valid), failPath: 'blockly/main.json', failOperation: 'delete' },
			{
				setup: () => {
					fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), JSON.stringify(valid));
					writeMain(valid);
				},
				failPath: 'blockly/.singular-blockly/workspace-validation-status.json', failOperation: 'write',
			},
		];

		for (const testCase of cases) {
			for (const name of fs.readdirSync(path.join(workspace, 'blockly'))) {
				fs.rmSync(path.join(workspace, 'blockly', name), { recursive: true, force: true });
			}
			testCase.setup();
			const fileService = new FileService(workspace);
			if (testCase.failOperation === 'write') {
				const original = fileService.writeFileAtomic.bind(fileService);
				sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
					if (relative === testCase.failPath) {throw new Error('injected write failure');}
					await original(relative, content);
				});
			} else {
				sinon.stub(fileService, 'deleteFile').callsFake(async relative => {
					if (relative === testCase.failPath) {throw new Error('injected delete failure');}
				});
			}
			await new WorkspaceCandidateService(workspace, fileService).processCandidate();
			sinon.restore();
		}
	});

	test('contains recovery writes, current-byte checks, and synchronous rejection callback failures', async () => {
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), JSON.stringify(valid));
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		const recoveryFileService = new FileService(workspace);
		const originalWrite = recoveryFileService.writeFileAtomic.bind(recoveryFileService);
		sinon.stub(recoveryFileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === 'blockly/main.json') {throw new Error('recovery write failed');}
			await originalWrite(relative, content);
		});
		await new WorkspaceCandidateService(workspace, recoveryFileService).processCandidate();
		sinon.restore();

		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		const readFileService = new FileService(workspace);
		const originalRead = readFileService.readBuffer.bind(readFileService);
		let mainReads = 0;
		sinon.stub(readFileService, 'readBuffer').callsFake(async relative => {
			if (relative === 'blockly/main.json' && ++mainReads === 2) {throw new Error('current bytes unreadable');}
			return await originalRead(relative);
		});
		await new WorkspaceCandidateService(workspace, readFileService).processCandidate();
		sinon.restore();

		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), '{');
		await new WorkspaceCandidateService(
			workspace,
			undefined,
			undefined,
			undefined,
			() => {throw new Error('synchronous callback failure');}
		).processCandidate();
	});

	test('falls back to memory when the disk backup cannot be read', async () => {
		const fileService = new FileService(workspace);
		const service = new WorkspaceCandidateService(workspace, fileService);
		await service.recordValidDocument(valid);
		writeMain({ ...valid, invalid: true });
		const originalRead = fileService.readBuffer.bind(fileService);
		sinon.stub(fileService, 'readBuffer').callsFake(async relative => {
			if (relative === 'blockly/main.json.bak') {throw new Error('backup read failed');}
			return await originalRead(relative);
		});

		await service.processCandidate();
		assert.deepStrictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')),
			valid
		);
	});

	test('deletes fresh transaction files when the paired backup write fails', async () => {
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === 'blockly/main.json.bak') {throw new Error('backup failed');}
			await original(relative, content);
		});

		const service = new WorkspaceCandidateService(workspace, fileService);
		await assert.rejects(service.recordValidDocument(valid), /backup failed/);
		assert.strictEqual(fs.existsSync(path.join(workspace, 'blockly', 'main.json')), false);
		assert.deepStrictEqual((service as any).expectedInternalMainState, { kind: 'absent' });
		await (service as any).restoreBytes('blockly/main.json', undefined);
		assert.deepStrictEqual((service as any).expectedInternalMainState, { kind: 'absent' });
	});

	test('rolls back both main and backup when a valid editor save cannot commit both files', async () => {
		const previous = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json'), previous);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), previous);
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		let injected = false;
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === 'blockly/main.json.bak' && !injected) {
				injected = true;
				throw new Error('injected backup failure');
			}
			await original(relative, content);
		});
		const service = new WorkspaceCandidateService(workspace, fileService);

		await assert.rejects(service.recordValidDocument({ ...valid, changed: true }), /injected backup failure/);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), previous);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak')), previous);
	});

	test('serializes consecutive editor saves so main and backup cannot come from different documents', async () => {
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		let releaseFirstBackup!: () => void;
		let firstBackupReached!: () => void;
		const firstBackupPending = new Promise<void>(resolve => {firstBackupReached = resolve;});
		const firstBackupRelease = new Promise<void>(resolve => {releaseFirstBackup = resolve;});
		let delayed = false;
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === 'blockly/main.json.bak' && !delayed) {
				delayed = true;
				firstBackupReached();
				await firstBackupRelease;
			}
			await original(relative, content);
		});
		const service = new WorkspaceCandidateService(workspace, fileService);
		const firstDocument = { ...valid, editorSave: 1 };
		const secondDocument = { ...valid, editorSave: 2 };

		const first = service.recordValidDocument(firstDocument);
		await firstBackupPending;
		const second = service.recordValidDocument(secondDocument);
		releaseFirstBackup();
		await Promise.all([first, second]);

		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')), secondDocument);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak'), 'utf8')), secondDocument);
	});

	test('restores the live and disk workspace after every formal live-load failure', async () => {
		const modes = ['throw', 'timeout', 'malformed', 'rejected'] as const;
		for (const mode of modes) {
			for (const name of fs.readdirSync(path.join(workspace, 'blockly'))) {
				fs.rmSync(path.join(workspace, 'blockly', name), { recursive: true, force: true });
			}
			const previous = Buffer.from(`${JSON.stringify(valid)}\n`);
			fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), previous);
			writeMain({ ...valid, candidate: mode });
			const liveDocuments: WorkspaceDocument[] = [];
			const service = new WorkspaceCandidateService(workspace, undefined, 10);
			service.attachChannels(
				async request => ({
					command: 'workspaceCandidateValidationResult',
					requestId: request.requestId,
					generation: request.generation,
					valid: true,
					normalizedDocument: request.document,
				}),
				async (requestId, generation, _deadlineAt, document) => {
					liveDocuments.push(document);
					if (liveDocuments.length > 1) {
						return liveLoadSucceeded(requestId, generation, document);
					}
					if (mode === 'throw') {throw new Error('formal live load failed');}
					if (mode === 'timeout') {
						return await new Promise<WorkspaceLiveLoadResultMessage>(() => {});
					}
					if (mode === 'malformed') {
						return { command: 'workspaceLiveLoadResult', success: 'yes' } as any;
					}
					return { command: 'workspaceLiveLoadResult', requestId, generation, success: false };
				}
			);

			await service.processCandidate();
			assert.strictEqual(liveDocuments.length, 2, `${mode} must trigger candidate load and rollback`);
			assert.strictEqual(liveDocuments[0].candidate, mode);
			assert.strictEqual(liveDocuments[1].candidate, undefined);
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), previous);
			assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak')), previous);
		}
	});

	test('restores the live and disk workspace when post-acknowledgement disk commit fails', async () => {
		const previous = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), previous);
		writeMain({ ...valid, candidate: 'must-not-commit' });
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		let injected = false;
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === 'blockly/main.json.bak' && !injected) {
				injected = true;
				throw new Error('injected disk commit failure');
			}
			await original(relative, content);
		});
		const liveDocuments: WorkspaceDocument[] = [];
		const service = new WorkspaceCandidateService(workspace, fileService, 1000);
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult',
				requestId: request.requestId,
				generation: request.generation,
				valid: true,
				normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => {
				liveDocuments.push(document);
				return liveLoadSucceeded(requestId, generation, document);
			}
		);

		await service.processCandidate();
		assert.strictEqual(liveDocuments.length, 2, 'candidate load and live rollback must both be acknowledged');
		assert.strictEqual(liveDocuments[0].candidate, 'must-not-commit');
		assert.strictEqual(liveDocuments[1].candidate, undefined);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), previous);
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json.bak')), previous);
		assert.strictEqual(
			JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'), 'utf8')).issue.code,
			'DISK_COMMIT_FAILED'
		);
	});

	test('does not restore over a newer candidate after a disk commit failure', async () => {
		const previous = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), previous);
		writeMain({ ...valid, candidate: 'failed-commit' });
		const newer = { ...valid, candidate: 'newer-after-failed-commit' };
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		let backupFailed = false;
		let newerInjected = false;
		const service = new WorkspaceCandidateService(workspace, fileService, 1000);
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === 'blockly/main.json.bak' && !backupFailed) {
				backupFailed = true;
				throw new Error('injected disk commit failure');
			}
			await original(relative, content);
			if (relative === 'blockly/main.invalid.json' && !newerInjected) {
				newerInjected = true;
				writeMain(newer);
				(service as any).observationRevision++;
			}
		});
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => liveLoadSucceeded(requestId, generation, document)
		);

		await service.processCandidate(false, 0);
		assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(workspace, 'blockly', 'main.json'), 'utf8')), newer);
	});

	test('keeps disk recovery authoritative when live rollback acknowledgement fails', async () => {
		const previous = Buffer.from(`${JSON.stringify(valid)}\n`);
		fs.writeFileSync(path.join(workspace, 'blockly', 'main.json.bak'), previous);
		writeMain({ ...valid, candidate: 'rollback-live-failure' });
		const fileService = new FileService(workspace);
		const original = fileService.writeFileAtomic.bind(fileService);
		let diskFailed = false;
		sinon.stub(fileService, 'writeFileAtomic').callsFake(async (relative, content) => {
			if (relative === 'blockly/main.json.bak' && !diskFailed) {
				diskFailed = true;
				throw new Error('disk failure');
			}
			await original(relative, content);
		});
		let liveCalls = 0;
		const service = new WorkspaceCandidateService(workspace, fileService, 100);
		service.attachChannels(
			async request => ({
				command: 'workspaceCandidateValidationResult', requestId: request.requestId, generation: request.generation,
				valid: true, normalizedDocument: request.document,
			}),
			async (requestId, generation, _deadlineAt, document) => {
				liveCalls++;
				if (liveCalls === 2) {throw new Error('rollback acknowledgement failed');}
				return liveLoadSucceeded(requestId, generation, document);
			}
		);

		await service.processCandidate();
		assert.deepStrictEqual(fs.readFileSync(path.join(workspace, 'blockly', 'main.json')), previous);
	});

	test('rejection callback and status expose only a stable issue summary', async () => {
		writeMain({ ...valid, projectSecret: 'do-not-log-or-diagnose' });
		let observed: any;
		const service = new WorkspaceCandidateService(workspace, undefined, 10, undefined, issue => {
			observed = issue;
		});
		await service.processCandidate();
		assert.deepStrictEqual(observed, { code: 'CHANNEL_UNAVAILABLE' });
		const status = fs.readFileSync(
			path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'),
			'utf8'
		);
		assert.ok(!status.includes('do-not-log-or-diagnose'));
		assert.ok(!status.includes(workspace));
	});

	test('rejection callback failure cannot escape the recovery state machine', async () => {
		writeMain({ ...valid, projectSecret: 'do-not-log-or-diagnose' });
		const service = new WorkspaceCandidateService(workspace, undefined, 10, undefined, async () => {
			throw new Error('notification channel failed');
		});

		await service.processCandidate();
		const status = JSON.parse(fs.readFileSync(
			path.join(workspace, 'blockly', '.singular-blockly', 'workspace-validation-status.json'),
			'utf8'
		));
		assert.strictEqual(status.status, 'rejected');
		assert.deepStrictEqual(status.issue, { code: 'CHANNEL_UNAVAILABLE' });
	});
});
