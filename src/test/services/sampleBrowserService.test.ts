/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import {
	fetchWithTimeout,
	fetchSampleIndex,
	fetchSampleWorkspace,
	validateSampleWorkspace,
	SampleIndex,
	SampleWorkspace,
} from '../../services/sampleBrowserService';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_INDEX: SampleIndex = {
	version: 1,
	samples: [
		{
			id: 'cyberbrick-soccer-robot',
			filename: 'cyberbrick-soccer-robot.json',
			board: 'cyberbrick',
			title: { en: 'Soccer Robot', 'zh-hant': '足球機器人' },
			description: { en: 'A CyberBrick soccer robot demo.', 'zh-hant': 'CyberBrick 足球機器人示範。' },
		},
	],
};

const MOCK_WORKSPACE: SampleWorkspace = {
	workspace: { blocks: [] },
	board: 'cyberbrick',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOkResponse(json: object): Response {
	return {
		ok: true,
		status: 200,
		json: async () => json,
	} as unknown as Response;
}

function makeErrorResponse(status: number): Response {
	return {
		ok: false,
		status,
		json: async () => {
			throw new Error('error body');
		},
	} as unknown as Response;
}

// ─── Suite ───────────────────────────────────────────────────────────────────

suite('sampleBrowserService', () => {
	let sandbox: sinon.SinonSandbox;
	let fetchStub: sinon.SinonStub;
	let readFileSyncMock: sinon.SinonStub;

	setup(() => {
		sandbox = sinon.createSandbox();
		// Stub global fetch (Node 22+ / VS Code test environment)
		fetchStub = sandbox.stub(global, 'fetch' as any);
		// Create a plain stub for readFileSync injection (not on fs module)
		readFileSyncMock = sandbox.stub();
	});

	teardown(() => {
		sandbox.restore();
	});

	// ── fetchWithTimeout ──────────────────────────────────────────────────

	suite('fetchWithTimeout', () => {
		test('returns response on success', async () => {
			const mockResponse = makeOkResponse({ ok: true });
			fetchStub.resolves(mockResponse);

			const result = await fetchWithTimeout('https://example.com/data.json', 5000);
			assert.ok(result.ok);
		});

		test('throws AbortError on timeout', async () => {
			// Simulate a fetch that never resolves until aborted
			fetchStub.callsFake((_url: string, options: RequestInit) => {
				return new Promise<Response>((_resolve, reject) => {
					const signal = options?.signal as AbortSignal;
					if (signal) {
						signal.addEventListener('abort', () => {
							const err = new Error('The operation was aborted');
							err.name = 'AbortError';
							reject(err);
						});
					}
				});
			});

			try {
				await fetchWithTimeout('https://example.com/slow.json', 50);
				assert.fail('Expected error was not thrown');
			} catch (err: unknown) {
				assert.ok(err instanceof Error);
				assert.strictEqual((err as Error).name, 'AbortError');
			}
		});
	});

	// ── fetchSampleIndex ──────────────────────────────────────────────────

	suite('fetchSampleIndex', () => {
		test('returns cloud data with isOffline=false on success', async () => {
			fetchStub.resolves(makeOkResponse(MOCK_INDEX));

			const result = await fetchSampleIndex('/ext');

			assert.strictEqual(result.isOffline, false);
			assert.deepStrictEqual(result.data, MOCK_INDEX);
		});

		test('falls back to local on HTTP error, isOffline=true', async () => {
			fetchStub.resolves(makeErrorResponse(404));
			readFileSyncMock.returns(JSON.stringify(MOCK_INDEX));

			const result = await fetchSampleIndex('/ext', readFileSyncMock);

			assert.strictEqual(result.isOffline, true);
			assert.deepStrictEqual(result.data, MOCK_INDEX);
		});

		test('falls back to local on fetch rejection, isOffline=true', async () => {
			fetchStub.rejects(new Error('network failure'));
			readFileSyncMock.returns(JSON.stringify(MOCK_INDEX));

			const result = await fetchSampleIndex('/ext', readFileSyncMock);

			assert.strictEqual(result.isOffline, true);
		});

		test('throws when local fallback also fails', async () => {
			fetchStub.rejects(new Error('network failure'));
			readFileSyncMock.throws(new Error('file not found'));

			await assert.rejects(() => fetchSampleIndex('/ext', readFileSyncMock), /Cannot load sample index/);
		});
	});

	// ── fetchSampleWorkspace ──────────────────────────────────────────────

	suite('fetchSampleWorkspace', () => {
		test('returns cloud data with isOffline=false on success', async () => {
			fetchStub.resolves(makeOkResponse(MOCK_WORKSPACE));

			const result = await fetchSampleWorkspace('cyberbrick-soccer-robot.json', '/ext');

			assert.strictEqual(result.isOffline, false);
			assert.deepStrictEqual(result.data, MOCK_WORKSPACE);
		});

		test('falls back to local on HTTP error, isOffline=true', async () => {
			fetchStub.resolves(makeErrorResponse(500));
			readFileSyncMock.returns(JSON.stringify(MOCK_WORKSPACE));

			const result = await fetchSampleWorkspace('cyberbrick-soccer-robot.json', '/ext', readFileSyncMock);

			assert.strictEqual(result.isOffline, true);
			assert.deepStrictEqual(result.data, MOCK_WORKSPACE);
		});

		test('throws when local fallback also fails', async () => {
			fetchStub.rejects(new Error('network failure'));
			readFileSyncMock.throws(new Error('file not found'));

			await assert.rejects(
				() => fetchSampleWorkspace('cyberbrick-soccer-robot.json', '/ext', readFileSyncMock),
				/Cannot load sample workspace/
			);
		});
	});

	// ── validateSampleWorkspace ───────────────────────────────────────────

	suite('validateSampleWorkspace', () => {
		test('returns true for valid SampleWorkspace', () => {
			assert.strictEqual(validateSampleWorkspace(MOCK_WORKSPACE), true);
		});

		test('returns false when workspace field is missing', () => {
			assert.strictEqual(validateSampleWorkspace({ board: 'cyberbrick' }), false);
		});

		test('returns false when workspace field is null', () => {
			assert.strictEqual(validateSampleWorkspace({ workspace: null, board: 'cyberbrick' }), false);
		});

		test('returns false when board !== cyberbrick', () => {
			assert.strictEqual(validateSampleWorkspace({ workspace: {}, board: 'esp32' }), false);
		});

		test('returns false for null input', () => {
			assert.strictEqual(validateSampleWorkspace(null), false);
		});

		test('returns false for string input', () => {
			assert.strictEqual(validateSampleWorkspace('not-an-object'), false);
		});
	});
});
