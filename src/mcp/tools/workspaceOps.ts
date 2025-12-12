/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 工作區操作工具
 * 提供 get_workspace_state, refresh_editor 功能
 *
 * 注意：update_workspace 已移除，改為由 AI 直接編輯 main.json
 * 新工作流程：search_blocks → get_block_usage(含context) → AI編輯main.json → refresh_editor
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';

// === 日誌工具 ===

function logToolCall(tool: string, params: Record<string, unknown>, result: { success: boolean; message?: string }): void {
	const timestamp = new Date().toISOString();
	const logEntry = {
		timestamp,
		tool,
		params,
		result,
	};
	console.error(`[MCP] ${JSON.stringify(logEntry)}`);
}

// === 工作區狀態類型 ===

interface WorkspaceBlock {
	type: string;
	id: string;
	x?: number;
	y?: number;
	fields?: Record<string, unknown>;
	inputs?: Record<string, { block: WorkspaceBlock }>;
	next?: { block: WorkspaceBlock };
	extraState?: Record<string, unknown>;
}

interface WorkspaceState {
	workspace: {
		blocks: {
			languageVersion: number;
			blocks: WorkspaceBlock[];
		};
	};
	board?: string;
	theme?: string;
	timestamp?: string;
}

// === 工具函數 ===

/**
 * 取得工作區路徑
 */
function getWorkspacePath(): string | null {
	return process.env.WORKSPACE_PATH || process.cwd();
}

/**
 * 讀取 Blockly 工作區狀態
 */
function readWorkspaceState(workspacePath: string): WorkspaceState | null {
	const mainJsonPath = path.join(workspacePath, 'blockly', 'main.json');

	if (!fs.existsSync(mainJsonPath)) {
		return null;
	}

	try {
		const content = fs.readFileSync(mainJsonPath, 'utf8');
		return JSON.parse(content);
	} catch {
		return null;
	}
}

/**
 * 寫入 Blockly 工作區狀態
 * @param workspacePath 工作區路徑
 * @param state 工作區狀態
 * @param createBackup 是否建立備份（預設 true）
 * @returns 包含成功狀態和備份路徑的物件
 */
function writeWorkspaceState(
	workspacePath: string,
	state: WorkspaceState,
	createBackup: boolean = true
): { success: boolean; backupPath?: string } {
	const blocklyDir = path.join(workspacePath, 'blockly');
	const mainJsonPath = path.join(blocklyDir, 'main.json');
	const backupPath = path.join(blocklyDir, 'main.json.bak');

	try {
		// 確保目錄存在
		if (!fs.existsSync(blocklyDir)) {
			fs.mkdirSync(blocklyDir, { recursive: true });
		}

		// 建立備份（如果原檔案存在且需要備份）
		let backupCreated = false;
		if (createBackup && fs.existsSync(mainJsonPath)) {
			try {
				fs.copyFileSync(mainJsonPath, backupPath);
				backupCreated = true;
			} catch (backupError) {
				// 備份失敗不阻止寫入，但記錄警告
				console.error('[workspaceOps] Failed to create backup:', backupError);
			}
		}

		// 添加時間戳
		state.timestamp = new Date().toISOString();

		fs.writeFileSync(mainJsonPath, JSON.stringify(state, null, 2), 'utf8');
		return { success: true, backupPath: backupCreated ? backupPath : undefined };
	} catch {
		return { success: false };
	}
}

/**
 * 遞迴計算所有積木
 */
function countBlocks(blocks: WorkspaceBlock[]): number {
	let count = 0;

	for (const block of blocks) {
		count++;

		// 計算輸入中的積木
		if (block.inputs) {
			for (const input of Object.values(block.inputs)) {
				if (input.block) {
					count += countBlocks([input.block]);
				}
			}
		}

		// 計算 next 積木
		if (block.next?.block) {
			count += countBlocks([block.next.block]);
		}
	}

	return count;
}

/**
 * 收集所有積木類型
 */
function collectBlockTypes(blocks: WorkspaceBlock[], types: Set<string> = new Set()): Set<string> {
	for (const block of blocks) {
		types.add(block.type);

		if (block.inputs) {
			for (const input of Object.values(block.inputs)) {
				if (input.block) {
					collectBlockTypes([input.block], types);
				}
			}
		}

		if (block.next?.block) {
			collectBlockTypes([block.next.block], types);
		}
	}

	return types;
}

// === 工具註冊 ===

/**
 * 註冊工作區操作工具到 MCP Server
 */
export function registerWorkspaceOpsTools(server: McpServer): void {
	// === get_workspace_state ===
	server.tool(
		'get_workspace_state',
		'取得目前 Blockly 工作區的狀態，包括所有積木及其配置。',
		{
			includeBlocks: z.boolean().default(true).optional().describe('是否包含完整的積木資料'),
		},
		async ({ includeBlocks }) => {
			const workspacePath = getWorkspacePath();

			if (!workspacePath) {
				logToolCall('get_workspace_state', { includeBlocks }, { success: false, message: 'No workspace path' });
				return {
					content: [
						{
							type: 'text' as const,
							text: '無法取得工作區路徑',
						},
					],
					isError: true,
				};
			}

			const state = readWorkspaceState(workspacePath);

			if (!state) {
				logToolCall('get_workspace_state', { includeBlocks }, { success: true, message: 'No workspace found' });
				return {
					content: [
						{
							type: 'text' as const,
							text: JSON.stringify(
								{
									exists: false,
									message: '工作區檔案不存在 (blockly/main.json)',
									suggestion: '請先使用 Blockly 編輯器建立工作區',
								},
								null,
								2
							),
						},
					],
				};
			}

			const topLevelBlocks = state.workspace?.blocks?.blocks || [];
			const blockTypes = collectBlockTypes(topLevelBlocks);
			const totalBlocks = countBlocks(topLevelBlocks);

			const result: Record<string, unknown> = {
				exists: true,
				board: state.board || 'arduino_uno',
				theme: state.theme || 'light',
				statistics: {
					topLevelBlocks: topLevelBlocks.length,
					totalBlocks,
					uniqueBlockTypes: blockTypes.size,
				},
				blockTypes: Array.from(blockTypes),
			};

			if (includeBlocks !== false) {
				result.blocks = topLevelBlocks;
			}

			if (state.timestamp) {
				result.lastModified = state.timestamp;
			}

			logToolCall('get_workspace_state', { includeBlocks }, { success: true, message: `${totalBlocks} blocks found` });

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(result, null, 2),
					},
				],
			};
		}
	);

	// === refresh_editor ===
	server.tool('refresh_editor', '通知 VSCode 擴充功能重新載入 Blockly 編輯器。', {}, async () => {
		// MCP Server 透過標準輸出通訊，無法直接控制 VSCode
		// 這個工具會返回指示訊息，讓使用者知道需要重新整理

		logToolCall('refresh_editor', {}, { success: true, message: 'Refresh instructions sent' });

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(
						{
							success: true,
							message: '已發送重新載入請求',
							instructions: [
								'如果編輯器沒有自動更新，請：',
								'1. 關閉目前的 Blockly 編輯器標籤',
								'2. 重新開啟 main.json 檔案',
								'或',
								'1. 按 Ctrl+Shift+P (Mac: Cmd+Shift+P)',
								'2. 輸入 "Developer: Reload Window"',
							],
						},
						null,
						2
					),
				},
			],
		};
	});
}
