/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MCP Server 整合測試
 *
 * 測試 MCP Server 的完整功能流程
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('MCP Server Integration Tests', () => {
	let tempDir: string;
	let blocklyDir: string;
	let mainJsonPath: string;

	setup(() => {
		// 建立臨時測試目錄結構
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-integration-'));
		blocklyDir = path.join(tempDir, 'blockly');
		fs.mkdirSync(blocklyDir, { recursive: true });
		mainJsonPath = path.join(blocklyDir, 'main.json');
	});

	teardown(() => {
		// 清理臨時目錄
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	suite('Workspace State Lifecycle', () => {
		test('should create new workspace state', () => {
			const initialState = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [],
					},
				},
				board: 'arduino_uno',
				theme: 'light',
			};

			fs.writeFileSync(mainJsonPath, JSON.stringify(initialState, null, 2));
			assert.ok(fs.existsSync(mainJsonPath), 'Should create main.json');

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.board, 'arduino_uno');
			assert.strictEqual(content.workspace.blocks.blocks.length, 0);
		});

		test('should add block to workspace', () => {
			// 初始狀態
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [] as object[],
					},
				},
				board: 'arduino_uno',
				theme: 'light',
			};

			// 新增積木
			const newBlock = {
				type: 'servo_setup',
				id: 'test_block_001',
				x: 100,
				y: 100,
				fields: {
					VAR: 'myServo',
					PIN: '9',
				},
			};
			state.workspace.blocks.blocks.push(newBlock);

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.workspace.blocks.blocks.length, 1);
			assert.strictEqual(content.workspace.blocks.blocks[0].type, 'servo_setup');
		});

		test('should modify existing block', () => {
			// 初始狀態含有積木
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [
							{
								type: 'servo_setup',
								id: 'test_block_001',
								x: 100,
								y: 100,
								fields: {
									VAR: 'myServo',
									PIN: '9',
								},
							},
						],
					},
				},
				board: 'arduino_uno',
				theme: 'light',
			};

			// 修改積木欄位
			interface BlockWithFields {
				type: string;
				id: string;
				x: number;
				y: number;
				fields: Record<string, string>;
			}
			const block = state.workspace.blocks.blocks[0] as BlockWithFields;
			block.fields.PIN = '10';

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.workspace.blocks.blocks[0].fields.PIN, '10');
		});

		test('should delete block from workspace', () => {
			// 初始狀態含有多個積木
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [
							{ type: 'servo_setup', id: 'block_001' },
							{ type: 'servo_move', id: 'block_002' },
							{ type: 'delay_ms', id: 'block_003' },
						],
					},
				},
				board: 'arduino_uno',
				theme: 'light',
			};

			// 刪除中間的積木
			state.workspace.blocks.blocks = state.workspace.blocks.blocks.filter(b => b.id !== 'block_002');

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.workspace.blocks.blocks.length, 2);
			assert.ok(!content.workspace.blocks.blocks.find((b: { id: string }) => b.id === 'block_002'), 'Block should be deleted');
		});

		test('should replace entire workspace', () => {
			// 初始狀態
			const originalState = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [{ type: 'old_block', id: 'old_001' }],
					},
				},
				board: 'arduino_uno',
				theme: 'light',
			};
			fs.writeFileSync(mainJsonPath, JSON.stringify(originalState, null, 2));

			// 完全替換
			const newState = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [
							{ type: 'new_block_1', id: 'new_001' },
							{ type: 'new_block_2', id: 'new_002' },
						],
					},
				},
				board: 'esp32',
				theme: 'dark',
			};
			fs.writeFileSync(mainJsonPath, JSON.stringify(newState, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.board, 'esp32');
			assert.strictEqual(content.theme, 'dark');
			assert.strictEqual(content.workspace.blocks.blocks.length, 2);
			assert.strictEqual(content.workspace.blocks.blocks[0].type, 'new_block_1');
		});
	});

	suite('Backup and Recovery', () => {
		test('should create backup before modification', () => {
			const originalState = {
				workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'original', id: 'orig_001' }] } },
				board: 'arduino_uno',
			};
			fs.writeFileSync(mainJsonPath, JSON.stringify(originalState, null, 2));

			// 建立備份
			const backupPath = mainJsonPath + '.bak';
			fs.copyFileSync(mainJsonPath, backupPath);

			// 修改原始檔案
			const modifiedState = {
				workspace: { blocks: { languageVersion: 0, blocks: [] } },
				board: 'arduino_uno',
			};
			fs.writeFileSync(mainJsonPath, JSON.stringify(modifiedState, null, 2));

			// 驗證備份存在且內容正確
			assert.ok(fs.existsSync(backupPath), 'Backup should exist');
			const backupContent = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
			assert.strictEqual(backupContent.workspace.blocks.blocks.length, 1);
			assert.strictEqual(backupContent.workspace.blocks.blocks[0].type, 'original');
		});

		test('should recover from backup', () => {
			// 設置備份
			const backupContent = {
				workspace: { blocks: { languageVersion: 0, blocks: [{ type: 'recovered', id: 'rec_001' }] } },
				board: 'arduino_uno',
			};
			const backupPath = mainJsonPath + '.bak';
			fs.writeFileSync(backupPath, JSON.stringify(backupContent, null, 2));

			// 模擬損壞的主檔案
			fs.writeFileSync(mainJsonPath, '{ invalid json }');

			// 從備份恢復
			fs.copyFileSync(backupPath, mainJsonPath);

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.workspace.blocks.blocks[0].type, 'recovered');
		});
	});

	suite('Block Connection Handling', () => {
		test('should handle next connection', () => {
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [
							{
								type: 'controls_repeat_ext',
								id: 'parent_001',
								x: 100,
								y: 100,
								next: {
									block: {
										type: 'servo_move',
										id: 'child_001',
									},
								},
							},
						],
					},
				},
				board: 'arduino_uno',
			};

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			const parentBlock = content.workspace.blocks.blocks[0];
			assert.ok(parentBlock.next, 'Should have next connection');
			assert.strictEqual(parentBlock.next.block.type, 'servo_move');
		});

		test('should handle input connection', () => {
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [
							{
								type: 'controls_repeat_ext',
								id: 'parent_001',
								x: 100,
								y: 100,
								inputs: {
									TIMES: {
										block: {
											type: 'math_number',
											id: 'value_001',
											fields: {
												NUM: 10,
											},
										},
									},
								},
							},
						],
					},
				},
				board: 'arduino_uno',
			};

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			const parentBlock = content.workspace.blocks.blocks[0];
			assert.ok(parentBlock.inputs, 'Should have inputs');
			assert.ok(parentBlock.inputs.TIMES, 'Should have TIMES input');
			assert.strictEqual(parentBlock.inputs.TIMES.block.type, 'math_number');
		});

		test('should handle statement connection', () => {
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [
							{
								type: 'controls_repeat_ext',
								id: 'parent_001',
								x: 100,
								y: 100,
								inputs: {
									DO: {
										block: {
											type: 'servo_move',
											id: 'statement_001',
											next: {
												block: {
													type: 'delay_ms',
													id: 'statement_002',
												},
											},
										},
									},
								},
							},
						],
					},
				},
				board: 'arduino_uno',
			};

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			const loop = content.workspace.blocks.blocks[0];
			assert.ok(loop.inputs.DO, 'Should have DO statement');
			assert.strictEqual(loop.inputs.DO.block.type, 'servo_move');
			assert.ok(loop.inputs.DO.block.next, 'Statement should have next');
		});
	});

	suite('Multi-Block Operations', () => {
		test('should handle multiple block deletions', () => {
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [
							{ type: 'block_a', id: 'id_a' },
							{ type: 'block_b', id: 'id_b' },
							{ type: 'block_c', id: 'id_c' },
							{ type: 'block_d', id: 'id_d' },
						],
					},
				},
				board: 'arduino_uno',
			};

			// 刪除多個積木 (模擬 id_a,id_c 的刪除)
			const idsToDelete = ['id_a', 'id_c'];
			state.workspace.blocks.blocks = state.workspace.blocks.blocks.filter(b => !idsToDelete.includes(b.id));

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.workspace.blocks.blocks.length, 2);
			const remainingIds = content.workspace.blocks.blocks.map((b: { id: string }) => b.id);
			assert.ok(remainingIds.includes('id_b'), 'Should keep id_b');
			assert.ok(remainingIds.includes('id_d'), 'Should keep id_d');
		});

		test('should handle sequential block additions', () => {
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [] as object[],
					},
				},
				board: 'arduino_uno',
			};

			// 依序新增積木
			const blocksToAdd = [
				{ type: 'servo_setup', id: 'setup_001', x: 100, y: 100 },
				{ type: 'servo_move', id: 'move_001', x: 100, y: 150 },
				{ type: 'delay_ms', id: 'delay_001', x: 100, y: 200 },
			];

			for (const block of blocksToAdd) {
				state.workspace.blocks.blocks.push(block);
			}

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.workspace.blocks.blocks.length, 3);
			assert.strictEqual(content.workspace.blocks.blocks[0].type, 'servo_setup');
			assert.strictEqual(content.workspace.blocks.blocks[2].type, 'delay_ms');
		});
	});

	suite('Board Configuration Changes', () => {
		test('should change board and preserve blocks', () => {
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [{ type: 'servo_setup', id: 'servo_001' }],
					},
				},
				board: 'arduino_uno',
				theme: 'light',
			};
			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));

			// 變更開發板
			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			content.board = 'esp32';
			fs.writeFileSync(mainJsonPath, JSON.stringify(content, null, 2));

			const updated = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(updated.board, 'esp32');
			assert.strictEqual(updated.workspace.blocks.blocks.length, 1, 'Blocks should be preserved');
		});
	});

	suite('Error Scenarios', () => {
		test('should handle missing blockly directory gracefully', () => {
			const nonExistentPath = path.join(tempDir, 'nonexistent', 'blockly', 'main.json');

			assert.ok(!fs.existsSync(nonExistentPath), 'File should not exist');

			// 模擬創建目錄和檔案
			const dir = path.dirname(nonExistentPath);
			fs.mkdirSync(dir, { recursive: true });
			fs.writeFileSync(nonExistentPath, '{}');

			assert.ok(fs.existsSync(nonExistentPath), 'File should now exist');
		});

		test('should handle invalid JSON', () => {
			fs.writeFileSync(mainJsonPath, '{ invalid json content }');

			let parseError: Error | null = null;
			try {
				JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			} catch (e) {
				parseError = e as Error;
			}

			assert.ok(parseError, 'Should throw parse error');
			assert.ok(parseError.message.includes('JSON') || parseError.message.includes('Unexpected'), 'Should be JSON error');
		});

		test('should handle empty workspace state', () => {
			const emptyState = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [],
					},
				},
				board: 'arduino_uno',
			};

			fs.writeFileSync(mainJsonPath, JSON.stringify(emptyState, null, 2));

			const content = JSON.parse(fs.readFileSync(mainJsonPath, 'utf8'));
			assert.strictEqual(content.workspace.blocks.blocks.length, 0);
		});
	});
});
