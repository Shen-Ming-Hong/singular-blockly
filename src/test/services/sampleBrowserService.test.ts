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
	applyNameTranslations,
	SampleIndex,
	SampleWorkspace,
	NameTranslations,
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

	// ── applyNameTranslations ─────────────────────────────────────────────

	suite('applyNameTranslations', () => {
		// SC1: 替換工作區變數名稱
		test('SC1 替換工作區 variables[].name', () => {
			const workspace = {
				variables: [{ name: '前後搖桿數值', id: 'var1' }],
				blocks: { blocks: [] },
			};
			const nameTranslations: NameTranslations = {
				variables: { 前後搖桿數值: { en: 'joystick_forward_back' } },
			};
			const result = applyNameTranslations(workspace, nameTranslations, 'en') as Record<string, unknown>;
			const vars = result['variables'] as Array<Record<string, unknown>>;
			assert.strictEqual(vars[0]['name'], 'joystick_forward_back');
		});

		// SC2: 替換 arduino_function fields.NAME
		test('SC2 替換 arduino_function fields.NAME', () => {
			const workspace = {
				variables: [],
				blocks: {
					blocks: [
						{
							type: 'arduino_function',
							id: 'fn1',
							fields: { NAME: '遙控器' },
						},
					],
				},
			};
			const nameTranslations: NameTranslations = {
				functions: { 遙控器: { en: 'controller' } },
			};
			const result = applyNameTranslations(workspace, nameTranslations, 'en') as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const fields = blocks[0]['fields'] as Record<string, unknown>;
			assert.strictEqual(fields['NAME'], 'controller');
		});

		// SC3: 替換 arduino_function_call extraState，且定義與呼叫名稱同步（SC-002）
		test('SC3 函式呼叫 extraState 替換，且定義與呼叫名稱完全一致（SC-002）', () => {
			const workspace = {
				variables: [],
				blocks: {
					blocks: [
						{
							type: 'arduino_function',
							id: 'fn_def',
							fields: { NAME: '車燈' },
							extraState: '<mutation xmlns="http://www.w3.org/1999/xhtml"><arg name="紅色" type="int"></arg></mutation>',
						},
						{
							type: 'arduino_function_call',
							id: 'fn_call',
							extraState:
								'<mutation xmlns="http://www.w3.org/1999/xhtml" version="1" name="車燈" has_return="false" return_type="void"><arg name="紅色" type="int"></arg></mutation>',
						},
					],
				},
			};
			const nameTranslations: NameTranslations = {
				variables: { 紅色: { en: 'red' } },
				functions: { 車燈: { en: 'set_car_lights' } },
			};
			const result = applyNameTranslations(workspace, nameTranslations, 'en') as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const defBlock = blocks[0];
			const callBlock = blocks[1];

			// 函式定義名稱已翻譯
			const defFields = defBlock['fields'] as Record<string, unknown>;
			assert.strictEqual(defFields['NAME'], 'set_car_lights');

			// 函式呼叫 extraState 中的 name= 已翻譯
			const callExtraState = callBlock['extraState'] as string;
			assert.ok(
				callExtraState.includes(' name="set_car_lights"'),
				`callExtraState 應含 name="set_car_lights"，實際: ${callExtraState}`
			);

			// 定義與呼叫名稱同步（SC-002 核心斷言）
			const callNameMatch = / name="([^"]+)"/.exec(callExtraState);
			assert.ok(callNameMatch, 'extraState 應含 name= 屬性');
			assert.strictEqual(callNameMatch![1], defFields['NAME'], '函式呼叫的 name= 必須與函式定義 fields.NAME 完全一致（SC-002）');

			// 參數名稱也已翻譯
			const defExtraState = defBlock['extraState'] as string;
			assert.ok(defExtraState.includes('<arg name="red"'), `defExtraState 應含 <arg name="red"，實際: ${defExtraState}`);
			assert.ok(callExtraState.includes('<arg name="red"'), `callExtraState 應含 <arg name="red"，實際: ${callExtraState}`);
		});

		// SC4: 深層巢狀積木遞迴
		test('SC4 深層巢狀積木遞迴替換', () => {
			const workspace = {
				variables: [],
				blocks: {
					blocks: [
						{
							type: 'controls_if',
							id: 'if1',
							inputs: {
								DO0: {
									block: {
										type: 'arduino_function_call',
										id: 'nested_call',
										extraState:
											'<mutation xmlns="http://www.w3.org/1999/xhtml" version="1" name="馬達移動" has_return="false" return_type="void"><arg name="左輪速度" type="int"></arg></mutation>',
									},
								},
							},
						},
					],
				},
			};
			const nameTranslations: NameTranslations = {
				variables: { 左輪速度: { en: 'left_wheel_speed' } },
				functions: { 馬達移動: { en: 'motor_move' } },
			};
			const result = applyNameTranslations(workspace, nameTranslations, 'en') as Record<string, unknown>;
			const topBlocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const ifBlock = topBlocks[0];
			const inputs = ifBlock['inputs'] as Record<string, unknown>;
			const do0 = inputs['DO0'] as Record<string, unknown>;
			const nestedCall = do0['block'] as Record<string, unknown>;
			const extraState = nestedCall['extraState'] as string;

			assert.ok(extraState.includes(' name="motor_move"'), `巢狀呼叫 extraState 應含 name="motor_move"，實際: ${extraState}`);
			assert.ok(
				extraState.includes('<arg name="left_wheel_speed"'),
				`巢狀呼叫 extraState 應含 arg left_wheel_speed，實際: ${extraState}`
			);
		});

		// SC5: 無效翻譯識別字回退（保留原始名稱）
		test('SC5 無效翻譯值回退保留原始名稱', () => {
			const workspace = {
				variables: [{ name: '前後搖桿數值', id: 'var1' }],
				blocks: { blocks: [] },
			};
			const nameTranslations: NameTranslations = {
				variables: {
					前後搖桿數值: {
						en: 'invalid name!', // 含空格與驚嘆號，不合法
					},
				},
			};
			const result = applyNameTranslations(workspace, nameTranslations, 'en') as Record<string, unknown>;
			const vars = result['variables'] as Array<Record<string, unknown>>;
			// en 翻譯不合法，無其他回退，應保留原始名稱
			assert.strictEqual(vars[0]['name'], '前後搖桿數值');
		});

		// SC6: 語系三層回退策略
		test('SC6 語系三層回退：目標語系缺翻譯時回退到 en，en 也缺時保留原始', () => {
			const workspace = {
				variables: [
					{ name: '連線編號', id: 'var1' }, // 無 ja 翻譯，有 en 翻譯 → 回退 en
					{ name: '搖桿數值', id: 'var2' }, // 無 ja、無 en 翻譯 → 保留原始
				],
				blocks: { blocks: [] },
			};
			const nameTranslations: NameTranslations = {
				variables: {
					連線編號: { en: 'connection_id' }, // 無 ja，回退 en
					搖桿數值: {}, // 無任何翻譯，保留原始
				},
			};
			const result = applyNameTranslations(workspace, nameTranslations, 'ja') as Record<string, unknown>;
			const vars = result['variables'] as Array<Record<string, unknown>>;
			// 連線編號：ja 缺 → en 回退
			assert.strictEqual(vars[0]['name'], 'connection_id');
			// 搖桿數值：全缺 → 原始名稱
			assert.strictEqual(vars[1]['name'], '搖桿數值');
		});

		// 純函式特性驗證
		test('不修改輸入 workspace 物件（純函式）', () => {
			const workspace = {
				variables: [{ name: '前後搖桿數值', id: 'var1' }],
				blocks: { blocks: [] },
			};
			const nameTranslations: NameTranslations = {
				variables: { 前後搖桿數值: { en: 'joystick_forward_back' } },
			};
			const original = JSON.stringify(workspace);
			applyNameTranslations(workspace, nameTranslations, 'en');
			assert.strictEqual(JSON.stringify(workspace), original, '輸入 workspace 不應被修改');
		});
	});

	// ── applyNameTranslations with stringTranslations ──────────────────────
	suite('applyNameTranslations - stringTranslations', () => {
		function makeTextWorkspace(textValue: unknown) {
			return {
				blocks: {
					blocks: [
						{
							type: 'text',
							fields: { TEXT: textValue },
						},
					],
				},
			};
		}

		test('text 積木字串依目標語系翻譯', () => {
			const workspace = makeTextWorkspace('前:');
			const stringTranslations = { '前:': { en: 'Fwd:', ja: '前:' } };
			const result = applyNameTranslations(workspace, {}, 'en', stringTranslations) as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const fields = blocks[0]['fields'] as Record<string, unknown>;
			assert.strictEqual(fields['TEXT'], 'Fwd:', '應翻譯為英文');
		});

		test('目標語系缺值時回退到 en', () => {
			const workspace = makeTextWorkspace('前:');
			const stringTranslations = { '前:': { en: 'Fwd:' } };
			const result = applyNameTranslations(workspace, {}, 'de', stringTranslations) as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const fields = blocks[0]['fields'] as Record<string, unknown>;
			assert.strictEqual(fields['TEXT'], 'Fwd:', 'de 缺值應回退到 en');
		});

		test('en 也缺值時保留原始字串', () => {
			const workspace = makeTextWorkspace('前:');
			const stringTranslations = { '前:': {} };
			const result = applyNameTranslations(workspace, {}, 'de', stringTranslations) as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const fields = blocks[0]['fields'] as Record<string, unknown>;
			assert.strictEqual(fields['TEXT'], '前:', 'en 也缺值應保留原始字串');
		});

		test('zh-hant 語系不替換（保留原始字串）', () => {
			const workspace = makeTextWorkspace('前:');
			const stringTranslations = { '前:': { en: 'Fwd:' } };
			const result = applyNameTranslations(workspace, {}, 'zh-hant', stringTranslations) as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const fields = blocks[0]['fields'] as Record<string, unknown>;
			assert.strictEqual(fields['TEXT'], '前:', 'zh-hant 應保留原始字串');
		});

		test('無 stringTranslations 時不影響 text 積木', () => {
			const workspace = makeTextWorkspace('前:');
			const result = applyNameTranslations(workspace, {}, 'en') as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const fields = blocks[0]['fields'] as Record<string, unknown>;
			assert.strictEqual(fields['TEXT'], '前:', '未提供 stringTranslations 應保留原始字串');
		});

		test('非字串的 fields.TEXT 不做翻譯（防禦型）', () => {
			const workspace = makeTextWorkspace(null);
			const stringTranslations = { '前:': { en: 'Fwd:' } };
			const result = applyNameTranslations(workspace, {}, 'en', stringTranslations) as Record<string, unknown>;
			const blocks = (result['blocks'] as Record<string, unknown>)['blocks'] as Array<Record<string, unknown>>;
			const fields = blocks[0]['fields'] as Record<string, unknown>;
			assert.strictEqual(fields['TEXT'], null, 'null 值不應被翻譯');
		});
	});
});
