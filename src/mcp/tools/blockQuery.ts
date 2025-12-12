/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 積木查詢工具
 * 提供 get_block_usage, search_blocks, list_blocks_by_category 功能
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
	getBlockByType,
	searchBlocks,
	formatBlockUsage,
	formatCategoryBlocks,
	getAllCategories,
	generateBlockJsonTemplate,
	generateInsertionGuide,
	type SupportedLocale,
	type BoardType,
	type BlockContext,
} from '../blockDictionary.js';

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

// === Schema 定義 ===

const SupportedLocaleSchema = z
	.enum(['en', 'zh-hant', 'ja', 'ko', 'es', 'pt-br', 'fr', 'de', 'it', 'ru', 'pl', 'hu', 'tr', 'bg', 'cs'])
	.default('zh-hant')
	.describe('語言代碼，預設 zh-hant');

const BoardTypeSchema = z.enum(['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'esp32_supermini']).describe('板卡類型');

// Context Schema 定義
// 使用 .passthrough() 允許傳入任意欄位名稱（如 RX_PIN, TX_PIN, PIN_A 等）
// 這是因為不同積木有不同的欄位名稱，無法窮舉所有欄位
const BlockContextSchema = z
	.object({
		// arduino_function_call
		functionName: z.string().optional().describe('函數名稱 (arduino_function_call)'),
		arguments: z
			.array(
				z.object({
					name: z.string().describe('參數名稱'),
					type: z.string().describe('參數類型: int, float, String, bool'),
					defaultValue: z.union([z.number(), z.string(), z.boolean()]).optional().describe('預設值'),
				})
			)
			.optional()
			.describe('函數參數列表'),

		// encoder_pid_setup / encoder_pid_compute
		pidName: z.string().optional().describe('PID 變數名稱'),
		encoderName: z.string().optional().describe('編碼器變數名稱'),
		kp: z.number().optional().describe('PID Kp 值'),
		ki: z.number().optional().describe('PID Ki 值'),
		kd: z.number().optional().describe('PID Kd 值'),
		targetValue: z.number().optional().describe('目標值 (encoder_pid_compute)'),

		// encoder_setup
		pinA: z.number().optional().describe('編碼器 A 腳位'),
		pinB: z.number().optional().describe('編碼器 B 腳位'),
		useInterrupt: z.boolean().optional().describe('使用中斷'),

		// controls_if
		hasElse: z.boolean().optional().describe('是否有 else 分支'),
		elseIfCount: z.number().optional().describe('else if 分支數量'),

		// 通用
		pin: z.number().optional().describe('腳位編號'),
		value: z.union([z.number(), z.string(), z.boolean()]).optional().describe('值'),
		variableName: z.string().optional().describe('變數名稱'),
		variableId: z.string().optional().describe('變數 ID'),

		// 腳位相關（支援直接傳入欄位名稱）
		RX_PIN: z.union([z.string(), z.number()]).optional().describe('RX 腳位'),
		TX_PIN: z.union([z.string(), z.number()]).optional().describe('TX 腳位'),
		TRIG_PIN: z.union([z.string(), z.number()]).optional().describe('觸發腳位'),
		ECHO_PIN: z.union([z.string(), z.number()]).optional().describe('回聲腳位'),

		// 七段顯示器腳位
		PIN_A: z.union([z.string(), z.number()]).optional().describe('七段顯示器 A 腳位'),
		PIN_B: z.union([z.string(), z.number()]).optional().describe('七段顯示器 B 腳位'),
		PIN_C: z.union([z.string(), z.number()]).optional().describe('七段顯示器 C 腳位'),
		PIN_D: z.union([z.string(), z.number()]).optional().describe('七段顯示器 D 腳位'),
		PIN_E: z.union([z.string(), z.number()]).optional().describe('七段顯示器 E 腳位'),
		PIN_F: z.union([z.string(), z.number()]).optional().describe('七段顯示器 F 腳位'),
		PIN_G: z.union([z.string(), z.number()]).optional().describe('七段顯示器 G 腳位'),
		PIN_DP: z.union([z.string(), z.number()]).optional().describe('七段顯示器 DP 腳位'),

		// 時間相關
		duration: z.number().optional().describe('持續時間 (毫秒)'),
		time: z.number().optional().describe('時間值'),

		// 感測器相關
		algorithm: z.string().optional().describe('HuskyLens 演算法'),
		color: z.string().optional().describe('顏色設定'),
		mode: z.string().optional().describe('模式設定'),

		// 列表相關
		itemCount: z.number().optional().describe('清單項目數量'),
	})
	.passthrough() // 允許傳入未定義的欄位（如 SOME_OTHER_PIN）
	.optional()
	.describe('積木上下文，用於生成可直接使用的 JSON 模板。支援直接傳入欄位名稱（如 RX_PIN: "16"）或駝峰式命名（如 rxPin: "16"）');

// === 工具註冊 ===

/**
 * 註冊積木查詢工具到 MCP Server
 */
export function registerBlockQueryTools(server: McpServer): void {
	// === get_block_usage ===
	server.tool(
		'get_block_usage',
		`查詢積木用法並生成 JSON 模板。

【基本用法】只傳 blockType 時返回積木完整定義（欄位、輸入、連接點等）。

【生成模板】傳入 context 時額外返回 jsonTemplate，可直接複製到 main.json 使用。

【context 參數範例】
- arduino_function_call: { "functionName": "馬達", "arguments": [{"name": "L", "type": "int", "defaultValue": 0}] }
- encoder_pid_setup: { "pidName": "leftPID", "encoderName": "leftEncoder", "kp": 1, "ki": 0, "kd": 0 }
- encoder_pid_compute: { "pidName": "leftPID", "targetValue": 200 }
- math_number: { "value": 100 }
- controls_if: { "hasElse": true, "elseIfCount": 1 }`,
		{
			blockType: z.string().describe('積木類型識別碼，例如 "servo_setup", "huskylens_init_i2c"'),
			language: SupportedLocaleSchema.optional(),
			context: BlockContextSchema,
		},
		async ({ blockType, language, context }) => {
			const lang = (language || 'zh-hant') as SupportedLocale;
			const block = getBlockByType(blockType);

			if (!block) {
				// 取得所有可用的積木類型供參考
				const categories = getAllCategories();
				const categoryList = categories.map(c => c.id).join(', ');

				logToolCall('get_block_usage', { blockType, language: lang, context }, { success: false, message: 'Block not found' });

				return {
					content: [
						{
							type: 'text' as const,
							text: `找不到積木類型: ${blockType}\n\n可用的分類: ${categoryList}\n\n請使用 search_blocks 或 list_blocks_by_category 工具搜尋可用的積木。`,
						},
					],
					isError: true,
				};
			}

			const formatted = formatBlockUsage(block, lang);
			const insertionGuide = generateInsertionGuide(block);

			// 基本回應
			const response: Record<string, unknown> = {
				...formatted,
				insertionGuide,
			};

			// 如果有 context，生成 JSON 模板
			if (context) {
				const jsonTemplate = generateBlockJsonTemplate(block, context as BlockContext);
				if (jsonTemplate) {
					response.jsonTemplate = jsonTemplate;
					response.templateUsage = {
						instructions: [
							'1. 將 jsonTemplate 複製到 main.json 的適當位置',
							'2. 替換所有 __UNIQUE_ID__ 為唯一識別碼（例如使用 Blockly.utils.idGenerator.genUid()）',
							'3. 如有 __VAR_ID__，替換為實際的變數 ID',
							'4. 使用 refresh_editor 工具重新載入編輯器',
						],
						insertAs: insertionGuide.hasOutput
							? '將此積木作為其他積木的輸入值（放入 inputs 物件中）'
							: '將此積木放入 setup/loop 區塊的 STACK/LOOP 輸入中，或連接到其他積木的 next',
					};
				} else {
					response.templateError = `無法為此積木生成模板，context 可能缺少必要參數。請檢查積木 fields 定義。`;
				}
			}

			logToolCall('get_block_usage', { blockType, language: lang, hasContext: !!context }, { success: true });

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(response, null, 2),
					},
				],
			};
		}
	);

	// === search_blocks ===
	server.tool(
		'search_blocks',
		'使用關鍵字搜尋積木，支援中英文搜尋。返回相關度排序的積木列表。',
		{
			query: z.string().describe('搜尋關鍵字，支援中英文'),
			category: z.string().optional().describe('限定搜尋分類，例如 "motors", "sensors"'),
			board: BoardTypeSchema.optional().describe('限定支援的板卡'),
			language: SupportedLocaleSchema.optional(),
			limit: z.number().min(1).max(50).default(10).optional().describe('返回結果數量上限'),
		},
		async ({ query, category, board, language, limit }) => {
			const lang = (language || 'zh-hant') as SupportedLocale;
			const boardType = board as BoardType | undefined;

			const results = searchBlocks(query, {
				category,
				board: boardType,
				language: lang,
				limit: limit || 10,
			});

			const response = {
				query,
				totalResults: results.length,
				results,
			};

			logToolCall(
				'search_blocks',
				{ query, category, board, language: lang, limit },
				{ success: true, message: `Found ${results.length} results` }
			);

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(response, null, 2),
					},
				],
			};
		}
	);

	// === list_blocks_by_category ===
	server.tool(
		'list_blocks_by_category',
		'列出特定分類下的所有積木。',
		{
			category: z.string().describe('分類 ID，例如 "motors", "sensors", "arduino", "vision"'),
			language: SupportedLocaleSchema.optional(),
		},
		async ({ category, language }) => {
			const lang = (language || 'zh-hant') as SupportedLocale;
			const result = formatCategoryBlocks(category, lang);

			if (!result) {
				const categories = getAllCategories();
				const categoryList = categories.map(c => `${c.id} (${c.name['zh-hant'] || c.name['en']})`).join('\n');

				logToolCall('list_blocks_by_category', { category, language: lang }, { success: false, message: 'Category not found' });

				return {
					content: [
						{
							type: 'text' as const,
							text: `找不到分類: ${category}\n\n可用的分類:\n${categoryList}`,
						},
					],
					isError: true,
				};
			}

			logToolCall(
				'list_blocks_by_category',
				{ category, language: lang },
				{ success: true, message: `Found ${result.totalCount} blocks` }
			);

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
}
