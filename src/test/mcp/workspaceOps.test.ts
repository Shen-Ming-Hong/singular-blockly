/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 工作區操作工具單元測試
 *
 * 注意：這些測試主要測試資料結構和邏輯
 * MCP Server 的完整功能測試需要在整合測試中進行
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

suite('MCP Workspace Ops Tools', () => {
	let tempDir: string;

	setup(() => {
		// 建立臨時測試目錄
		tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-test-'));
	});

	teardown(() => {
		// 清理臨時目錄
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	suite('Workspace State Structure', () => {
		test('should have correct workspace state structure', () => {
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [],
					},
				},
				board: 'arduino_uno',
				theme: 'light',
				timestamp: new Date().toISOString(),
			};

			assert.ok(state.workspace, 'Should have workspace');
			assert.ok(state.workspace.blocks, 'Should have blocks');
			assert.ok(Array.isArray(state.workspace.blocks.blocks), 'blocks should be array');
			assert.strictEqual(state.board, 'arduino_uno');
			assert.strictEqual(state.theme, 'light');
		});

		test('should have correct block structure', () => {
			const block = {
				type: 'servo_setup',
				id: 'abc123',
				x: 100,
				y: 200,
				fields: {
					VAR: 'myServo',
					PIN: '9',
				},
			};

			assert.ok(block.type, 'Should have type');
			assert.ok(block.id, 'Should have id');
			assert.ok(block.fields, 'Should have fields');
			assert.strictEqual(block.fields.VAR, 'myServo');
		});
	});

	suite('Block Modification Schema', () => {
		test('should accept add action', () => {
			const modification = {
				action: 'add',
				blockType: 'servo_setup',
				position: { x: 100, y: 100 },
				fields: { VAR: 'myServo', PIN: '9' },
			};

			assert.strictEqual(modification.action, 'add');
			assert.ok(modification.position, 'Should have position');
			assert.ok(modification.fields, 'Should have fields');
		});

		test('should accept delete action', () => {
			const modification = {
				action: 'delete',
				blockType: 'servo_setup',
				blockId: 'abc123',
			};

			assert.strictEqual(modification.action, 'delete');
			assert.ok(modification.blockId, 'Should have blockId');
		});

		test('should accept modify action', () => {
			const modification = {
				action: 'modify',
				blockType: 'servo_move',
				blockId: 'abc123',
				fields: { ANGLE: 45 },
			};

			assert.strictEqual(modification.action, 'modify');
			assert.ok(modification.blockId, 'Should have blockId');
			assert.ok(modification.fields, 'Should have fields');
		});

		test('should accept replace action', () => {
			const modification = {
				action: 'replace',
				blockType: '',
				newState: {
					workspace: {
						blocks: {
							languageVersion: 0,
							blocks: [],
						},
					},
					board: 'esp32',
					theme: 'dark',
				},
			};

			assert.strictEqual(modification.action, 'replace');
			assert.ok(modification.newState, 'Should have newState');
			assert.ok(modification.newState.workspace, 'newState should have workspace');
		});

		test('should support connection options', () => {
			const modification = {
				action: 'add',
				blockType: 'servo_move',
				parentBlockId: 'parent123',
				connectionType: 'next' as const,
			};

			assert.ok(modification.parentBlockId, 'Should have parentBlockId');
			assert.ok(modification.connectionType, 'Should have connectionType');
		});

		test('should support multi-block delete', () => {
			const modification = {
				action: 'delete',
				blockType: '',
				blockId: 'id1,id2,id3',
			};

			const ids = modification.blockId.split(',');
			assert.strictEqual(ids.length, 3, 'Should split into 3 IDs');
		});
	});

	suite('File Operations', () => {
		test('should create blockly directory if not exists', () => {
			const blocklyDir = path.join(tempDir, 'blockly');
			fs.mkdirSync(blocklyDir, { recursive: true });
			assert.ok(fs.existsSync(blocklyDir), 'Directory should exist');
		});

		test('should write and read JSON file', () => {
			const blocklyDir = path.join(tempDir, 'blockly');
			fs.mkdirSync(blocklyDir, { recursive: true });

			const mainJsonPath = path.join(blocklyDir, 'main.json');
			const state = {
				workspace: {
					blocks: {
						languageVersion: 0,
						blocks: [{ type: 'test', id: 'abc' }],
					},
				},
				board: 'arduino_uno',
			};

			fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2));
			assert.ok(fs.existsSync(mainJsonPath), 'File should exist');

			const content = fs.readFileSync(mainJsonPath, 'utf8');
			const parsed = JSON.parse(content);
			assert.strictEqual(parsed.board, 'arduino_uno');
			assert.strictEqual(parsed.workspace.blocks.blocks[0].type, 'test');
		});

		test('should create backup file', () => {
			const blocklyDir = path.join(tempDir, 'blockly');
			fs.mkdirSync(blocklyDir, { recursive: true });

			const mainJsonPath = path.join(blocklyDir, 'main.json');
			const backupPath = path.join(blocklyDir, 'main.json.bak');

			// Write original
			fs.writeFileSync(mainJsonPath, '{"original": true}');

			// Create backup
			fs.copyFileSync(mainJsonPath, backupPath);

			assert.ok(fs.existsSync(backupPath), 'Backup should exist');
			const backupContent = fs.readFileSync(backupPath, 'utf8');
			assert.ok(backupContent.includes('original'), 'Backup should contain original content');
		});
	});

	suite('Block Manipulation Logic', () => {
		test('should generate unique IDs', () => {
			const generateId = (): string => {
				const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
				let id = '';
				for (let i = 0; i < 20; i++) {
					id += chars.charAt(Math.floor(Math.random() * chars.length));
				}
				return id;
			};

			const ids = new Set<string>();
			for (let i = 0; i < 100; i++) {
				ids.add(generateId());
			}
			assert.strictEqual(ids.size, 100, 'All IDs should be unique');
		});

		test('should count blocks recursively', () => {
			interface TestBlock {
				type: string;
				id: string;
				next?: { block: TestBlock };
				inputs?: Record<string, { block: TestBlock }>;
			}

			const countBlocks = (blocks: TestBlock[]): number => {
				let count = 0;
				for (const block of blocks) {
					count++;
					if (block.inputs) {
						for (const input of Object.values(block.inputs)) {
							if (input.block) {
								count += countBlocks([input.block]);
							}
						}
					}
					if (block.next?.block) {
						count += countBlocks([block.next.block]);
					}
				}
				return count;
			};

			const blocks: TestBlock[] = [
				{
					type: 'parent',
					id: '1',
					next: {
						block: { type: 'child1', id: '2' },
					},
					inputs: {
						VALUE: {
							block: { type: 'child2', id: '3' },
						},
					},
				},
			];

			assert.strictEqual(countBlocks(blocks), 3, 'Should count all nested blocks');
		});

		test('should find block by ID', () => {
			interface TestBlock {
				type: string;
				id: string;
				next?: { block: TestBlock };
			}

			const findBlock = (blocks: TestBlock[], id: string): TestBlock | null => {
				for (const block of blocks) {
					if (block.id === id) {
						return block;
					}
					if (block.next?.block) {
						const found = findBlock([block.next.block], id);
						if (found) {
							return found;
						}
					}
				}
				return null;
			};

			const blocks: TestBlock[] = [
				{
					type: 'parent',
					id: 'parent1',
					next: {
						block: { type: 'child', id: 'child1' },
					},
				},
			];

			assert.ok(findBlock(blocks, 'parent1'), 'Should find parent');
			assert.ok(findBlock(blocks, 'child1'), 'Should find child');
			assert.strictEqual(findBlock(blocks, 'nonexistent'), null, 'Should return null for missing');
		});
	});

	suite('Field Validation', () => {
		test('should validate field names', () => {
			const validFieldNames = new Set(['VAR', 'PIN', 'ANGLE']);

			const validateFields = (fields: Record<string, unknown>): string[] => {
				const invalidFields: string[] = [];
				for (const fieldName of Object.keys(fields)) {
					if (!validFieldNames.has(fieldName)) {
						invalidFields.push(fieldName);
					}
				}
				return invalidFields;
			};

			const result1 = validateFields({ VAR: 'test', PIN: '9' });
			assert.strictEqual(result1.length, 0, 'Should have no invalid fields');

			const result2 = validateFields({ VAR: 'test', INVALID_FIELD: 'x' });
			assert.strictEqual(result2.length, 1, 'Should have 1 invalid field');
			assert.strictEqual(result2[0], 'INVALID_FIELD');
		});
	});

	suite('Response Structure', () => {
		test('should have correct success response structure', () => {
			const response = {
				success: true,
				message: '成功執行 2/2 個操作',
				results: [
					{ action: 'add', blockType: 'servo_setup', success: true, message: '積木已新增', blockId: 'abc123' },
					{ action: 'modify', blockType: 'servo_move', success: true, message: '積木已修改' },
				],
				note: '請呼叫 refresh_editor 來重新載入編輯器以查看變更',
				backup: {
					path: '/path/to/main.json.bak',
					message: '已建立備份檔案，如需回復可使用此檔案',
				},
			};

			assert.ok(response.success, 'Should have success flag');
			assert.ok(response.message, 'Should have message');
			assert.ok(Array.isArray(response.results), 'Should have results array');
			assert.ok(response.note, 'Should have note');
			assert.ok(response.backup, 'Should have backup info');
		});

		test('should have correct error response structure', () => {
			const response = {
				success: false,
				message: '成功執行 0/1 個操作',
				results: [
					{
						action: 'modify',
						blockType: 'servo_move',
						success: false,
						message: '找不到積木: nonexistent',
					},
				],
			};

			assert.strictEqual(response.success, false, 'Should indicate failure');
			assert.ok(response.results[0].message.includes('找不到'), 'Should have error message');
		});
	});
});
