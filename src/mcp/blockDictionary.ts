/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 積木字典資料結構與載入器
 */

import blockDictionaryData from './block-dictionary.json';

// === 型別定義 ===

export type SupportedLocale =
	| 'en'
	| 'zh-hant'
	| 'ja'
	| 'ko'
	| 'es'
	| 'pt-br'
	| 'fr'
	| 'de'
	| 'it'
	| 'ru'
	| 'pl'
	| 'hu'
	| 'tr'
	| 'bg'
	| 'cs';

export type BoardType = 'arduino_uno' | 'arduino_nano' | 'arduino_mega' | 'esp32' | 'esp32_supermini';

export type FieldType = 'text' | 'number' | 'dropdown' | 'checkbox' | 'angle' | 'colour';

export type InputType = 'value' | 'statement';

export interface LocalizedStrings {
	[locale: string]: string;
}

export interface FieldOption {
	value: string;
	label: LocalizedStrings;
}

export interface BlockField {
	name: string;
	type: FieldType;
	label: LocalizedStrings;
	default?: string | number | boolean;
	options?: FieldOption[] | string; // string 表示動態選項
	min?: number;
	max?: number;
	precision?: number;
	required?: boolean;
}

export interface BlockInput {
	name: string;
	type: InputType;
	label?: LocalizedStrings;
	check?: string | string[];
}

export interface BlockOutput {
	type: string | string[] | null;
}

export interface BlockDefinition {
	type: string;
	category: string;
	names: LocalizedStrings;
	descriptions: LocalizedStrings;
	fields: BlockField[];
	inputs: BlockInput[];
	output?: BlockOutput;
	boards: string[];
	tags: string[];
	relatedBlocks?: string[];
	notes?: LocalizedStrings;
	experimental?: boolean;
}

export interface CategoryInfo {
	id: string;
	name: LocalizedStrings;
	colour: string;
	icon?: string;
	weight?: number;
}

export interface BlockDictionary {
	version: string;
	generatedAt: string;
	blocks: BlockDefinition[];
	categories: CategoryInfo[];
	indices: {
		byType: Record<string, number>;
		byCategory: Record<string, number[]>;
		searchIndex: Record<string, string[]>;
	};
}

// === 字典載入與快取 ===

let cachedDictionary: BlockDictionary | null = null;

/**
 * 取得積木字典
 */
export function getBlockDictionary(): BlockDictionary {
	if (!cachedDictionary) {
		cachedDictionary = blockDictionaryData as BlockDictionary;
	}
	return cachedDictionary;
}

/**
 * 根據類型取得積木定義
 */
export function getBlockByType(blockType: string): BlockDefinition | undefined {
	const dictionary = getBlockDictionary();
	const index = dictionary.indices.byType[blockType];
	if (index !== undefined) {
		return dictionary.blocks[index];
	}
	return undefined;
}

/**
 * 根據分類取得積木列表
 */
export function getBlocksByCategory(category: string): BlockDefinition[] {
	const dictionary = getBlockDictionary();
	const indices = dictionary.indices.byCategory[category];
	if (!indices) {
		return [];
	}
	return indices.map(index => dictionary.blocks[index]);
}

/**
 * 取得分類資訊
 */
export function getCategoryInfo(categoryId: string): CategoryInfo | undefined {
	const dictionary = getBlockDictionary();
	return dictionary.categories.find(c => c.id === categoryId);
}

/**
 * 取得所有分類列表
 */
export function getAllCategories(): CategoryInfo[] {
	return getBlockDictionary().categories;
}

// === 搜尋功能 ===

export interface SearchOptions {
	category?: string;
	board?: BoardType;
	language?: SupportedLocale;
	limit?: number;
}

export interface SearchResult {
	type: string;
	name: string;
	category: string;
	description: string;
	relevanceScore: number;
}

/**
 * 搜尋積木
 */
export function searchBlocks(query: string, options: SearchOptions = {}): SearchResult[] {
	const dictionary = getBlockDictionary();
	const normalizedQuery = query.toLowerCase().trim();
	const language = options.language || 'zh-hant';
	const results: Map<string, number> = new Map();

	// 1. 精確匹配 type (最高分)
	if (dictionary.indices.byType[normalizedQuery] !== undefined) {
		results.set(normalizedQuery, 100);
	}

	// 2. 搜尋索引匹配
	const searchIndex = dictionary.indices.searchIndex;
	for (const [tag, types] of Object.entries(searchIndex)) {
		if (tag.includes(normalizedQuery) || normalizedQuery.includes(tag)) {
			for (const type of types) {
				const currentScore = results.get(type) || 0;
				// 完全匹配標籤得分更高
				const score = tag === normalizedQuery ? 90 : 70;
				results.set(type, Math.max(currentScore, score));
			}
		}
	}

	// 3. 名稱/描述模糊匹配
	for (const block of dictionary.blocks) {
		const name = block.names[language] || block.names['en'] || '';
		const description = block.descriptions[language] || block.descriptions['en'] || '';

		if (name.toLowerCase().includes(normalizedQuery)) {
			const currentScore = results.get(block.type) || 0;
			results.set(block.type, Math.max(currentScore, 60));
		}

		if (description.toLowerCase().includes(normalizedQuery)) {
			const currentScore = results.get(block.type) || 0;
			results.set(block.type, Math.max(currentScore, 40));
		}
	}

	// 4. 過濾與排序
	const filteredResults = Array.from(results.entries())
		.filter(([type]) => {
			const block = getBlockByType(type);
			if (!block) {
				return false;
			}

			if (options.category && block.category !== options.category) {
				return false;
			}

			if (options.board && !block.boards.includes(options.board)) {
				return false;
			}

			return true;
		})
		.sort((a, b) => b[1] - a[1])
		.slice(0, options.limit || 10);

	// 5. 格式化結果
	return filteredResults.map(([type, score]) => {
		const block = getBlockByType(type)!;
		return {
			type: block.type,
			name: block.names[language] || block.names['en'] || block.type,
			category: block.category,
			description: block.descriptions[language] || block.descriptions['en'] || '',
			relevanceScore: score,
		};
	});
}

// === 格式化輸出 ===

export interface FormattedBlockUsage {
	type: string;
	name: string;
	category: string;
	description: string;
	fields: Array<{
		name: string;
		type: FieldType;
		label: string;
		default?: string | number | boolean;
		options?: Array<{ value: string; label: string }>;
		min?: number;
		max?: number;
	}>;
	inputs: Array<{
		name: string;
		type: InputType;
		label?: string;
		check?: string | string[];
	}>;
	output?: { type: string | string[] | null };
	boards: string[];
	tags: string[];
	relatedBlocks?: string[];
	notes?: string;
	experimental?: boolean;
}

/**
 * 格式化積木用法（依語言）
 */
export function formatBlockUsage(block: BlockDefinition, language: SupportedLocale = 'zh-hant'): FormattedBlockUsage {
	return {
		type: block.type,
		name: block.names[language] || block.names['en'] || block.type,
		category: block.category,
		description: block.descriptions[language] || block.descriptions['en'] || '',
		fields: block.fields.map(field => ({
			name: field.name,
			type: field.type,
			label: field.label[language] || field.label['en'] || field.name,
			default: field.default,
			options:
				typeof field.options === 'string'
					? undefined
					: field.options?.map(opt => ({
							value: opt.value,
							label: opt.label[language] || opt.label['en'] || opt.value,
					  })),
			min: field.min,
			max: field.max,
		})),
		inputs: block.inputs.map(input => ({
			name: input.name,
			type: input.type,
			label: input.label ? input.label[language] || input.label['en'] : undefined,
			check: input.check,
		})),
		output: block.output,
		boards: block.boards,
		tags: block.tags,
		relatedBlocks: block.relatedBlocks,
		notes: block.notes ? block.notes[language] || block.notes['en'] : undefined,
		experimental: block.experimental,
	};
}

export interface FormattedCategoryBlocks {
	category: {
		id: string;
		name: string;
		colour: string;
	};
	blocks: Array<{
		type: string;
		name: string;
		description: string;
	}>;
	totalCount: number;
}

/**
 * 格式化分類積木列表
 */
export function formatCategoryBlocks(categoryId: string, language: SupportedLocale = 'zh-hant'): FormattedCategoryBlocks | null {
	const categoryInfo = getCategoryInfo(categoryId);
	if (!categoryInfo) {
		return null;
	}

	const blocks = getBlocksByCategory(categoryId);

	return {
		category: {
			id: categoryInfo.id,
			name: categoryInfo.name[language] || categoryInfo.name['en'] || categoryInfo.id,
			colour: categoryInfo.colour,
		},
		blocks: blocks.map(block => ({
			type: block.type,
			name: block.names[language] || block.names['en'] || block.type,
			description: block.descriptions[language] || block.descriptions['en'] || '',
		})),
		totalCount: blocks.length,
	};
}

// === JSON 模板生成 ===

export interface BlockContext {
	// arduino_function_call
	functionName?: string;
	arguments?: Array<{ name: string; type: string; defaultValue?: number | string | boolean }>;

	// encoder_pid_setup
	pidName?: string;
	encoderName?: string;
	kp?: number;
	ki?: number;
	kd?: number;
	mode?: 'POSITION' | 'SPEED';

	// encoder_pid_compute
	targetValue?: number;

	// encoder_setup
	pinA?: number;
	pinB?: number;
	useInterrupt?: boolean;

	// controls_if
	hasElse?: boolean;
	elseIfCount?: number;

	// arduino_analog_write, math_number, etc.
	pin?: number;
	value?: number | string | boolean;

	// variables_get
	variableName?: string;
	variableId?: string;

	// 允許使用任意 key（支援直接使用 field name）
	[key: string]: unknown;
}

export interface JsonTemplate {
	type: string;
	id: string;
	extraState?: string | Record<string, unknown>;
	fields?: Record<string, unknown>;
	inputs?: Record<string, { block: JsonTemplate }>;
}

export interface InsertionGuide {
	canConnectTo: string[];
	hasOutput: boolean;
	hasPrevious: boolean;
	hasNext: boolean;
}

/**
 * 創建值積木（用於填充 value 類型輸入端）
 */
function createValueBlock(value: unknown): JsonTemplate | null {
	if (value === undefined || value === null) {
		return null;
	}

	if (typeof value === 'number') {
		return {
			type: 'math_number',
			id: '__UNIQUE_ID__',
			fields: { NUM: value },
		};
	} else if (typeof value === 'string') {
		return {
			type: 'text',
			id: '__UNIQUE_ID__',
			fields: { TEXT: value },
		};
	} else if (typeof value === 'boolean') {
		return {
			type: 'logic_boolean',
			id: '__UNIQUE_ID__',
			fields: { BOOL: value ? 'TRUE' : 'FALSE' },
		};
	}

	// 如果是物件且有 type 屬性，視為完整的積木定義
	if (typeof value === 'object' && 'type' in (value as object)) {
		return value as JsonTemplate;
	}

	return null;
}

/**
 * 生成積木 JSON 模板
 * 支援所有積木類型，根據 BlockDefinition 自動生成欄位和輸入端
 */
export function generateBlockJsonTemplate(block: BlockDefinition, context: BlockContext): JsonTemplate | null {
	const template: JsonTemplate = {
		type: block.type,
		id: '__UNIQUE_ID__',
	};

	// === 特殊積木處理（需要 extraState 的動態積木）===
	switch (block.type) {
		case 'arduino_function_call': {
			if (!context.functionName) {
				// 沒有 context 時，生成基本範例模板
				template.extraState = `<mutation xmlns="http://www.w3.org/1999/xhtml" version="1" name="myFunction" has_return="false" return_type="void"></mutation>`;
				break;
			}
			const args = context.arguments || [];

			// 生成 mutation XML 字串
			const argXml = args.map(arg => `<arg name="${arg.name}" type="${arg.type}"></arg>`).join('');
			template.extraState = `<mutation xmlns="http://www.w3.org/1999/xhtml" version="1" name="${context.functionName}" has_return="false" return_type="void">${argXml}</mutation>`;

			// 生成輸入端
			if (args.length > 0) {
				template.inputs = {};
				args.forEach((arg, index) => {
					const inputName = `ARG${index}`;
					const valueBlock = createValueBlock(arg.defaultValue ?? 0);
					if (valueBlock) {
						template.inputs![inputName] = { block: valueBlock };
					}
				});
			}
			return template;
		}

		case 'encoder_pid_setup': {
			const pidName = context.pidName || 'myPID';
			const encoderName = context.encoderName || 'myEncoder';
			const mode = context.mode || 'POSITION';
			// 使用物件格式的 extraState（Blockly 12.x 推薦）
			template.extraState = { encoder: encoderName };
			template.fields = {
				PID_VAR: pidName,
				VAR: encoderName,
				MODE: mode,
				KP: context.kp ?? 1,
				KI: context.ki ?? 0,
				KD: context.kd ?? 0,
			};
			return template;
		}

		case 'encoder_pid_compute': {
			const pidName = context.pidName || 'myPID';
			// 使用物件格式的 extraState（Blockly 12.x 推薦）
			template.extraState = { pid: pidName };
			template.fields = { PID_VAR: pidName };
			if (context.targetValue !== undefined) {
				template.inputs = {
					TARGET: {
						block: createValueBlock(context.targetValue)!,
					},
				};
			}
			return template;
		}

		case 'encoder_pid_reset': {
			const pidName = context.pidName || 'myPID';
			// 使用物件格式的 extraState（Blockly 12.x 推薦）
			template.extraState = { pid: pidName };
			template.fields = { PID_VAR: pidName };
			return template;
		}

		case 'controls_if': {
			const elseIfCount = context.elseIfCount ?? 0;
			const hasElse = context.hasElse ?? false;
			if (elseIfCount > 0 || hasElse) {
				let extraState = `<mutation xmlns="http://www.w3.org/1999/xhtml"`;
				if (elseIfCount > 0) {
					extraState += ` elseif="${elseIfCount}"`;
				}
				if (hasElse) {
					extraState += ` else="1"`;
				}
				extraState += `></mutation>`;
				template.extraState = extraState;
			}
			// 繼續通用處理以填充欄位
			break;
		}

		case 'controls_repeat_ext':
		case 'controls_for':
		case 'controls_forEach':
		case 'controls_whileUntil': {
			// 迴圈積木：繼續通用處理
			break;
		}

		case 'procedures_defnoreturn':
		case 'procedures_defreturn': {
			// 函數定義積木：需要 mutation
			const funcName = context.functionName || 'myFunction';
			template.extraState = `<mutation xmlns="http://www.w3.org/1999/xhtml"></mutation>`;
			template.fields = { NAME: funcName };
			return template;
		}

		case 'procedures_callnoreturn':
		case 'procedures_callreturn': {
			// 函數呼叫積木
			const funcName = context.functionName || 'myFunction';
			template.extraState = `<mutation xmlns="http://www.w3.org/1999/xhtml" name="${funcName}"></mutation>`;
			return template;
		}

		case 'lists_create_with': {
			// 清單建立積木：需要 mutation 指定項目數
			const itemCount = (context as { itemCount?: number }).itemCount ?? 3;
			template.extraState = `<mutation xmlns="http://www.w3.org/1999/xhtml" items="${itemCount}"></mutation>`;
			return template;
		}

		case 'text_join': {
			// 文字連接積木：需要 mutation 指定項目數
			const itemCount = (context as { itemCount?: number }).itemCount ?? 2;
			template.extraState = `<mutation xmlns="http://www.w3.org/1999/xhtml" items="${itemCount}"></mutation>`;
			return template;
		}
	}

	// === 通用處理：根據 BlockDefinition 生成欄位和輸入端 ===

	// 1. 處理欄位（Fields）
	if (block.fields && block.fields.length > 0) {
		template.fields = {};
		for (const field of block.fields) {
			// 從 context 中取得值，或使用預設值
			const contextValue = getContextValueForField(context, field.name);
			if (contextValue !== undefined) {
				template.fields[field.name] = contextValue;
			} else if (field.default !== undefined) {
				template.fields[field.name] = field.default;
			} else if (field.type === 'dropdown' && field.options) {
				// 對於 dropdown 類型，如果沒有 default，使用第一個 option 的值
				if (typeof field.options === 'string') {
					// 動態 options（如 "dynamic:digitalPins"），根據主板提供預設值
					const dynamicDefaults: Record<string, string> = {
						'dynamic:digitalPins': '2',
						'dynamic:analogPins': 'A0',
						'dynamic:pwmPins': '3',
						'dynamic:interruptPins': '2',
					};
					template.fields[field.name] = dynamicDefaults[field.options] || '0';
				} else if (Array.isArray(field.options) && field.options.length > 0) {
					// 靜態 options 陣列，使用第一個選項的 value
					template.fields[field.name] = field.options[0].value;
				}
			} else if (field.type === 'number') {
				// 對於 number 類型，如果沒有 default，使用 min 或 0
				template.fields[field.name] = field.min ?? 0;
			}
		}
	}

	// 2. 處理輸入端（Inputs）
	if (block.inputs && block.inputs.length > 0) {
		for (const input of block.inputs) {
			// 只處理 value 類型輸入，statement 類型由使用者連接
			if (input.type === 'value') {
				const contextValue = getContextValueForInput(context, input.name);
				if (contextValue !== undefined) {
					if (!template.inputs) {
						template.inputs = {};
					}
					const valueBlock = createValueBlock(contextValue);
					if (valueBlock) {
						template.inputs[input.name] = { block: valueBlock };
					}
				} else {
					// 如果沒有 context 值，為 Number 類型的輸入提供預設的 math_number 積木
					// 這確保 jsonTemplate 有完整的預設結構
					if (input.check === 'Number') {
						if (!template.inputs) {
							template.inputs = {};
						}
						template.inputs[input.name] = {
							block: {
								type: 'math_number',
								id: '__UNIQUE_ID__',
								fields: { NUM: 0 },
							},
						};
					} else if (input.check === 'String') {
						if (!template.inputs) {
							template.inputs = {};
						}
						template.inputs[input.name] = {
							block: {
								type: 'text',
								id: '__UNIQUE_ID__',
								fields: { TEXT: '' },
							},
						};
					} else if (input.check === 'Boolean') {
						if (!template.inputs) {
							template.inputs = {};
						}
						template.inputs[input.name] = {
							block: {
								type: 'logic_boolean',
								id: '__UNIQUE_ID__',
								fields: { BOOL: 'TRUE' },
							},
						};
					}
				}
			}
		}
	}

	return template;
}

/**
 * 從 context 中取得欄位值
 * 支援多種命名格式：
 * - 直接匹配：context.RX_PIN -> field RX_PIN
 * - 駝峰式：context.rxPin -> field RX_PIN
 * - 特定映射：context.pin -> field PIN
 */
function getContextValueForField(context: BlockContext, fieldName: string): unknown {
	const contextRecord = context as Record<string, unknown>;

	// 1. 直接匹配 field name（優先級最高）
	if (contextRecord[fieldName] !== undefined) {
		return contextRecord[fieldName];
	}

	// 2. 特定映射（常用縮寫）
	const fieldMappings: Record<string, string> = {
		PIN: 'pin',
		PIN_A: 'pinA',
		PIN_B: 'pinB',
		VAR: 'variableName',
		PID_VAR: 'pidName',
		KP: 'kp',
		KI: 'ki',
		KD: 'kd',
		NUM: 'value',
		TEXT: 'value',
		BOOL: 'value',
		USE_INTERRUPT: 'useInterrupt',
		NAME: 'functionName',
		// 時間相關
		TIME: 'time',
		MS: 'ms',
		// 腳位相關
		RX_PIN: 'rxPin',
		TX_PIN: 'txPin',
		TRIG_PIN: 'trigPin',
		ECHO_PIN: 'echoPin',
		// 七段顯示器
		PIN_C: 'pinC',
		PIN_D: 'pinD',
		PIN_E: 'pinE',
		PIN_F: 'pinF',
		PIN_G: 'pinG',
		PIN_DP: 'pinDP',
		TYPE: 'type',
		// 其他常用
		ALGORITHM: 'algorithm',
		COLOR: 'color',
		MODE: 'mode',
		FREQUENCY: 'frequency',
		RESOLUTION: 'resolution',
		FLOW: 'flow',
	};

	const contextKey = fieldMappings[fieldName];
	if (contextKey && contextRecord[contextKey] !== undefined) {
		return contextRecord[contextKey];
	}

	// 3. 駝峰式轉換（FIELD_NAME -> fieldName）
	const camelCaseKey = fieldName.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	if (contextRecord[camelCaseKey] !== undefined) {
		return contextRecord[camelCaseKey];
	}

	// 4. 不區分大小寫的模糊匹配
	const lowerFieldName = fieldName.toLowerCase();
	for (const [key, value] of Object.entries(context)) {
		if (key.toLowerCase() === lowerFieldName && value !== undefined) {
			return value;
		}
	}

	return undefined;
}

/**
 * 從 context 中取得輸入端值
 * 支援多種命名格式：
 * - 直接匹配：context.THRESHOLD -> input THRESHOLD
 * - 駝峰式：context.threshold -> input THRESHOLD
 * - 特定映射：context.value -> input VALUE
 */
function getContextValueForInput(context: BlockContext, inputName: string): unknown {
	const contextRecord = context as Record<string, unknown>;

	// 1. 直接匹配 input name（優先級最高）
	if (contextRecord[inputName] !== undefined) {
		return contextRecord[inputName];
	}

	// 2. 特定映射（常用縮寫）
	const inputMappings: Record<string, string> = {
		VALUE: 'value',
		TARGET: 'targetValue',
		NUM: 'value',
		TEXT: 'value',
		TIMES: 'times',
		FROM: 'from',
		TO: 'to',
		BY: 'by',
		// 門檻函式相關
		THRESHOLD: 'threshold',
		LOW_OUTPUT: 'lowOutput',
		HIGH_OUTPUT: 'highOutput',
		// 迴圈相關
		DURATION: 'duration',
	};

	const contextKey = inputMappings[inputName];
	if (contextKey) {
		const value = contextRecord[contextKey];
		if (value !== undefined) {
			return value;
		}
	}

	// 3. 駝峰式轉換（INPUT_NAME -> inputName）
	const camelCaseKey = inputName.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	if (contextRecord[camelCaseKey] !== undefined) {
		return contextRecord[camelCaseKey];
	}

	// 4. 不區分大小寫的模糊匹配
	const lowerInputName = inputName.toLowerCase();
	for (const [key, value] of Object.entries(context)) {
		if (key.toLowerCase() === lowerInputName && value !== undefined) {
			return value;
		}
	}

	return undefined;
}

/**
 * 生成插入指南
 */
export function generateInsertionGuide(block: BlockDefinition): InsertionGuide {
	const hasOutput = !!block.output;

	// 常見的 statement 輸入名稱
	const commonStatementInputs = ['LOOP', 'SETUP', 'STACK', 'DO', 'DO0', 'DO1', 'ELSE', 'SUBSTACK'];

	return {
		canConnectTo: hasOutput ? [] : commonStatementInputs,
		hasOutput,
		hasPrevious: !hasOutput,
		hasNext: !hasOutput,
	};
}
