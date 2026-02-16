/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './logging';
import { AIModelManager } from './aiModelManager';

/** A single block suggestion from the AI model */
export interface BlockSuggestion {
	blockType: string;
	fields?: Record<string, string>;
	inputs?: Record<string, BlockSuggestion>;
	next?: BlockSuggestion;
	connectionType?: 'next' | 'input' | 'output';
	connectionTarget?: string;
	inputName?: string;
}

/** Result of a suggestion request */
export interface SuggestionResult {
	suggestions: BlockSuggestion[];
	modelUsed: string;
	promptTokens?: number;
}

/** Workspace context sent from the WebView contextExtractor */
export interface WorkspaceContext {
	depth: 'minimal' | 'standard' | 'deep';
	board: string;
	language: 'arduino' | 'micropython';
	selectedBlock: {
		type: string;
		id: string;
		fields: Record<string, string>;
		parentType: string | null;
		childTypes: string[];
		connectionType: 'next' | 'input' | 'output' | null;
	} | null;
	blockTree?: string[];
	workspaceTree?: Array<{
		type: string;
		id: string;
		fields: Record<string, string>;
		children: any[];
		inputs?: Record<string, any>;
	}>;
	eventHistory?: Array<{
		type: string;
		blockId: string | null;
		timestamp: number;
	}>;
	variables?: Array<{ name: string; type: string }>;
	codeSnippet?: string;
	functions?: Array<{ name: string; blockId: string }>;
	existingBlockTypes?: string[];
}

// Regex patterns for extracting JSON from LLM responses
const FENCED_JSON_RE = /```(?:json)?\s*([\s\S]*?)```/;
const BARE_ARRAY_RE = /\[[\s\S]*\]/;

/** Default timeout for AI requests (ms) */
const REQUEST_TIMEOUT_MS = 15_000;

/** Maximum number of cached suggestion results */
const CACHE_MAX_ENTRIES = 20;

/** Cache entry time-to-live (ms) */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Cached suggestion entry */
interface CacheEntry {
	result: SuggestionResult;
	timestamp: number;
}

/**
 * Shadow Block 建議服務
 * 接收工作區上下文，透過 AIModelManager 呼叫 LLM 產生積木建議
 */
export class ShadowSuggestionService {
	private _blockDictionaryCache = new Map<string, string>();
	private _blockTypeSet: Set<string> | undefined;
	private _blockTypeCategoryMap: Map<string, string> | undefined;
	private _blockInputsMap: Map<string, Array<{name: string, check?: string | string[]}>> = new Map();
	private readonly _extensionPath: string;
	private _activeCancellationSource: vscode.CancellationTokenSource | undefined;
	private readonly _cache = new Map<string, CacheEntry>();

	constructor(
		private readonly _modelManager: AIModelManager,
		extensionPath: string
	) {
		this._extensionPath = extensionPath;
	}

	/**
	 * Build a cache key from the context fields that affect the suggestion.
	 */
	private buildCacheKey(context: WorkspaceContext): string {
		const selectedKey = context.selectedBlock ? JSON.stringify(context.selectedBlock) : 'none';
		const treeKey = context.workspaceTree ? JSON.stringify(context.workspaceTree.map(b => b.type)) : '';
		return context.board + '|' + context.language + '|' + selectedKey + '|' + treeKey;
	}

	/**
	 * Clear the suggestion result cache.
	 */
	clearCache(): void {
		this._cache.clear();
	}

	/**
	 * Evict stale and excess entries from the cache.
	 */
	private evictCache(): void {
		const now = Date.now();
		for (const [key, entry] of this._cache) {
			if (now - entry.timestamp > CACHE_TTL_MS) {
				this._cache.delete(key);
			}
		}
		// If still over limit, remove oldest entries
		while (this._cache.size > CACHE_MAX_ENTRIES) {
			const firstKey = this._cache.keys().next().value;
			if (firstKey !== undefined) {
				this._cache.delete(firstKey);
			}
		}
	}

	/**
	 * Request AI-generated block suggestions for the current workspace context
	 */
	async requestSuggestion(context: WorkspaceContext): Promise<SuggestionResult | null> {
		const config = this._modelManager.getEffectiveConfig();
		if (!config.enabled) {
			log('AI suggestions disabled by configuration', 'debug');
			return null;
		}

		const hasBlocks = (context.workspaceTree && context.workspaceTree.length > 0) ||
			(context.blockTree && context.blockTree.length > 0);
		if (!context.selectedBlock && !hasBlocks) {
			log('No selected block and empty workspace, skipping suggestion', 'debug');
			return null;
		}

		// Check cache first
		const cacheKey = this.buildCacheKey(context);
		const cached = this._cache.get(cacheKey);
		if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
			log('Returning cached suggestion result', 'debug');
			return cached.result;
		}

		// Cancel any in-flight request
		if (this._activeCancellationSource) {
			this._activeCancellationSource.cancel();
			this._activeCancellationSource.dispose();
			this._activeCancellationSource = undefined;
		}

		try {
			const messages = this.buildPrompt(context);
			const cts = new vscode.CancellationTokenSource();
			this._activeCancellationSource = cts;

			// Apply configurable timeout
			const timeoutId = setTimeout(() => cts.cancel(), REQUEST_TIMEOUT_MS);

			let response: vscode.LanguageModelChatResponse | null;
			try {
				response = await this._modelManager.sendPrompt(messages, cts.token);
			} finally {
				clearTimeout(timeoutId);
			}

			if (!response) {
				cts.dispose();
				this._activeCancellationSource = undefined;
				log('No response from AI model', 'debug');
				return null;
			}

			// Collect the streamed response text
			let text = '';
			for await (const fragment of response.text) {
				text += fragment;
			}
			cts.dispose();
			this._activeCancellationSource = undefined;

			let suggestions = this.parseResponse(text);
			log(`Parsed ${suggestions.length} suggestions from AI response (${text.length} chars)`, 'debug');
			this.ensureRequiredInputs(suggestions);
			if (suggestions.length > 0 && context.existingBlockTypes) {
				const beforeCount = suggestions.length;
				suggestions = this.filterForDiversity(suggestions, context.existingBlockTypes, context.selectedBlock?.type);
				if (suggestions.length < beforeCount) {
					log(`Diversity filter: ${beforeCount} → ${suggestions.length} suggestions`, 'debug');
				}
			}
			if (suggestions.length === 0) {
				log('No valid suggestions parsed from AI response', 'info');
				return null;
			}

			const result: SuggestionResult = {
				suggestions,
				modelUsed: this._modelManager.getTier(),
			};

			// Store in cache
			this._cache.set(cacheKey, { result, timestamp: Date.now() });
			this.evictCache();

			return result;
		} catch (err) {
			this._activeCancellationSource = undefined;
			if (err instanceof vscode.CancellationError) {
				log('Shadow suggestion request cancelled or timed out', 'debug');
				return null;
			}
			log(`Shadow suggestion request failed: ${err}`, 'error');
			return null;
		}
	}

	/**
	 * Build the prompt messages for the AI model.
	 * Three-message structure: User(static instructions) → Assistant(confirmation) → User(dynamic context).
	 * Static content placed first for prompt caching benefits.
	 */
	private buildPrompt(context: WorkspaceContext): vscode.LanguageModelChatMessage[] {
		const config = this._modelManager.getEffectiveConfig();
		const blockList = this.loadBlockDictionary(context.language);

		// Message 1: Static identity + instructions + few-shot examples (User)
		const systemParts: string[] = [
			'# Identity',
			'',
			'You are an embedded systems programming assistant for Singular Blockly, a visual block-based IDE. Your task is to suggest the NEXT logical block the user most likely needs to advance their program\'s functionality.',
			'',
			'# Instructions',
			'',
			'## Output Format',
			'- Respond with ONLY a JSON array. No explanation, no markdown fences, no commentary.',
			'- Each element: {"blockType":"block_type_name"} or {"blockType":"block_type_name","fields":{"FIELD_NAME":"value"}}',
			'- Only include "fields" when you know a meaningful, non-default value.',
			'- For blocks with value inputs (e.g., text_print has a TEXT input), include an "inputs" object mapping input names to child blocks.',
			'- Example: {"blockType":"text_print","inputs":{"TEXT":{"blockType":"text","fields":{"TEXT":"hello"}}}}',
			'- Inputs can be nested: {"blockType":"math_arithmetic","fields":{"OP":"ADD"},"inputs":{"A":{"blockType":"math_number","fields":{"NUM":"1"}},"B":{"blockType":"math_number","fields":{"NUM":"2"}}}}',
			'- For blocks with statement inputs (shown as `| stmts: NAME` in the block list), you can include child blocks that go INSIDE the statement slot.',
			'- Statement children use the same "inputs" key: {"blockType":"controls_for","inputs":{"FROM":...,"TO":...,"BY":...,"DO":{"blockType":"cyberbrick_led_set_color",...}}}',
			'- To chain multiple blocks inside a statement slot, use "next": {"blockType":"...", ...} to append a block after the current one.',
			'- Example with chained statement children: {"blockType":"controls_for","inputs":{"FROM":...,"TO":...,"BY":...,"DO":{"blockType":"cyberbrick_led_set_color","inputs":{...},"next":{"blockType":"cyberbrick_delay_ms","inputs":{"TIME":{"blockType":"math_number","fields":{"NUM":"10"}}}}}}}',
			'- For blocks with Number value inputs (e.g., ANGLE, SPEED, TIME), ALWAYS include a math_number child block with a reasonable default value.',
			'- For blocks with String value inputs (e.g., TEXT, TOPIC), ALWAYS include a text child block with a meaningful default.',
			'- Empty value input slots make suggestions unusable — always fill them with appropriate child blocks.',
			'- To reference a user variable, use: {"blockType":"variables_get","fields":{"VAR":"variable_name"}} — use the variable NAME from the User Variables section, not an ID.',
			'- For controls_for and controls_forEach blocks, ALWAYS include "fields":{"VAR":"variable_name"} using an existing variable from the User Variables section.',
			'- The code contains a `← INSERT NEW BLOCK HERE` marker showing where new blocks will be inserted. Focus your suggestions on what makes sense at THAT position.',
			'',
			'## Output Schema',
			'Each suggestion object MUST conform to this structure:',
			'```',
			'{ "blockType": "string (must exist in Available Block Types)",',
			'  "fields": { "FIELD_NAME": "value (must match listed dropdown options)" },',
			'  "inputs": { "INPUT_NAME": { "blockType": "...", "fields": {...}, "inputs": {...} } }',
			'}',
			'```',
			'- "fields" and "inputs" are optional, but if a block has required value inputs (shown as `| inputs: NAME(Type)` in the block list), you MUST include them.',
			'- If a block has dropdown fields (shown as `| fields: NAME[opt1|opt2]`), field values MUST be one of the listed options.',
			'',
			'## DO',
			'- Suggest blocks that ADVANCE the program\'s current purpose or logically extend its behavior.',
			'- The first suggestion should be the most natural and useful next step given the code context.',
			'- Consider what a beginner or intermediate embedded-systems student would logically need next.',
			'- When the code shows a clear pattern (e.g., color sequence, sensor readings), continue or enhance that pattern.',
			'- Prefer statement blocks (blocks that connect vertically) over standalone value blocks.',
			'',
			'## DON\'T',
			'- Do NOT suggest setup/configuration blocks (like arduino_setup_loop) — they already exist.',
			'- Do NOT suggest blocks that are unrelated to the user\'s current program context or purpose.',
			'- Do NOT suggest the exact same block type with the same field values that the user already has, unless continuing a meaningful sequence.',
			'',
			'## Self-Check (verify before responding)',
			'1. Every blockType exists in the Available Block Types list.',
			'2. Every value input listed in the block dictionary has a child block.',
			'3. Every dropdown field value matches the options shown in `fields: NAME[options]`.',
			'4. The suggestion is compatible with the insertion point\'s connection type (if specified).',
			'',
			'## Strategy',
			'1. FIRST, analyze the user\'s code to understand its PURPOSE (e.g., "LED color animation", "sensor monitoring", "serial data logging").',
			'2. THEN, suggest blocks that ADVANCE that purpose:',
			'   - Animation/sequence code → suggest delay between steps, loop to repeat, more sequence items',
			'   - Sensor reading code → suggest conditional logic, display output, threshold comparison',
			'   - Setup without action → suggest the natural action that uses the setup',
			'3. When you see REPEATED STRUCTURAL PATTERNS in the Block Structure:',
			'   a. IDENTIFY: What structure repeats? (e.g., "multiple for-loops with LED color settings inside")',
			'   b. ANALYZE: How do values change across repetitions? (e.g., "RGB channels rotate: (i,255-i,0) → (0,i,255-i)")',
			'   c. PREDICT: Continue the mathematical or logical pattern. (e.g., "next rotation is (255-i,0,i)")',
			'   d. COMPLETE: If the pattern appears finished (e.g., all 3 RGB rotations done), suggest what naturally follows (delay, loop wrapper, etc.).',
			'4. The FIRST suggestion should be the most obvious and useful next step for the current program context.',
			'5. Subsequent suggestions should offer alternative ways to advance the SAME purpose, not random unrelated blocks.',
			'6. Only suggest blocks from a genuinely different purpose if the current program\'s purpose appears complete.',
			'',
			'## Common Mistakes',
			'BAD: {"blockType":"servo_move"} ← missing required ANGLE input',
			'GOOD: {"blockType":"servo_move","inputs":{"ANGLE":{"blockType":"math_number","fields":{"NUM":"90"}}}}',
			'',
			'BAD: {"blockType":"digital_write","fields":{"VALUE":"1"}} ← VALUE must be HIGH or LOW',
			'GOOD: {"blockType":"digital_write","fields":{"VALUE":"HIGH"}}',
			'',
			'BAD: {"blockType":"nonexistent_block"} ← blockType not in dictionary',
			'',
			'BAD: {"blockType":"controls_for","inputs":{"FROM":...,"TO":...,"BY":...}} ← missing DO statement children when pattern requires them',
			'GOOD: {"blockType":"controls_for","inputs":{"FROM":...,"TO":...,"BY":...,"DO":{"blockType":"cyberbrick_led_set_color",...}}}',
			'',
			'# Examples',
			'',
			'<user_code id="example-1">',
			'Board: uno (Arduino C++)',
			'Code:',
			'void loop() {',
			'  Serial.println("1");',
			'  Serial.println("2");',
			'  Serial.println("3");',
			'}',
			'Already used blocks: arduino_setup_loop, text_print, text',
			'</user_code>',
			'',
			'<assistant_response id="example-1">',
			'[{"blockType":"text_print","inputs":{"TEXT":{"blockType":"text","fields":{"TEXT":"4"}}}},{"blockType":"arduino_delay","inputs":{"DELAY_TIME":{"blockType":"math_number","fields":{"NUM":"1000"}}}},{"blockType":"controls_if"},{"blockType":"analog_read","fields":{"PIN":"A0"}}]',
			'</assistant_response>',
			'',
			'<user_code id="example-2">',
			'Board: cyberbrick (MicroPython)',
			'Code:',
			'def main():',
			'    onboard_led[0] = (255, 0, 0)',
			'    onboard_led.write()',
			'    onboard_led[0] = (0, 255, 0)',
			'    onboard_led.write()',
			'    onboard_led[0] = (0, 0, 255)',
			'    onboard_led.write()',
			'    # ← INSERT NEW BLOCK HERE',
			'Already used blocks: micropython_main, cyberbrick_led_set_color',
			'</user_code>',
			'',
			'<assistant_response id="example-2">',
			'[{"blockType":"cyberbrick_delay_ms","inputs":{"TIME":{"blockType":"math_number","fields":{"NUM":"500"}}}},{"blockType":"controls_repeat_ext","inputs":{"TIMES":{"blockType":"math_number","fields":{"NUM":"3"}}}},{"blockType":"cyberbrick_led_set_color","inputs":{"RED":{"blockType":"math_number","fields":{"NUM":"255"}},"GREEN":{"blockType":"math_number","fields":{"NUM":"255"}},"BLUE":{"blockType":"math_number","fields":{"NUM":"0"}}}}]',
			'</assistant_response>',
			'',
			'<user_code id="example-3">',
			'Board: uno (Arduino C++)',
			'Code:',
			'void loop() {',
			'  int sensor = digitalRead(7);',
			'}',
			'Already used blocks: arduino_setup_loop, digital_read, math_number',
			'</user_code>',
			'',
			'<assistant_response id="example-3">',
			'[{"blockType":"controls_if"},{"blockType":"text_print","inputs":{"TEXT":{"blockType":"text","fields":{"TEXT":"sensor triggered"}}}},{"blockType":"digital_write","fields":{"PIN":"13"}},{"blockType":"arduino_delay","inputs":{"DELAY_TIME":{"blockType":"math_number","fields":{"NUM":"100"}}}}]',
			'</assistant_response>',
			'',
			'<user_code id="example-4">',
			'Board: esp32 (Arduino C++)',
			'Code:',
			'void loop() {',
			'  int val = analogRead(A0);',
			'  // ← INSERT NEW BLOCK HERE',
			'  delay(500);',
			'}',
			'Already used blocks: arduino_setup_loop, analog_read, arduino_delay, math_number',
			'</user_code>',
			'',
			'<assistant_response id="example-4">',
			'[{"blockType":"controls_if"},{"blockType":"text_print","inputs":{"TEXT":{"blockType":"text","fields":{"TEXT":"sensor value"}}}},{"blockType":"digital_write","fields":{"PIN":"13"}},{"blockType":"analog_write","fields":{"PIN":"13"},"inputs":{"VALUE":{"blockType":"math_number","fields":{"NUM":"128"}}}}]',
			'</assistant_response>',
			'',
			'<user_code id="example-5">',
			'Board: cyberbrick (MicroPython)',
			'Code:',
			'from machine import Pin',
			'from neopixel import NeoPixel',
			'import time',
			'',
			'onboard_led = NeoPixel(Pin(8), 1)',
			'',
			'def main():',
			'    for i in range(int(1), int(256), int(1)):',
			'        onboard_led[0] = (i, 255 - i, 0)',
			'        onboard_led.write()',
			'        time.sleep_ms(10)',
			'    for i in range(int(1), int(256), int(1)):',
			'        onboard_led[0] = (0, i, 255 - i)',
			'        onboard_led.write()',
			'        time.sleep_ms(10)',
			'    # ← INSERT NEW BLOCK HERE',
			'',
			'Block Structure:',
			'micropython_main',
			'  controls_for (VAR=i, FROM=1, TO=255, BY=1)',
			'    cyberbrick_led_set_color (RED=i, GREEN=255-i, BLUE=0)',
			'    cyberbrick_delay_ms (TIME=10)',
			'  controls_for (VAR=i, FROM=1, TO=255, BY=1)',
			'    cyberbrick_led_set_color (RED=0, GREEN=i, BLUE=255-i)',
			'    cyberbrick_delay_ms (TIME=10)',
			'',
			'Already used blocks: micropython_main, controls_for, cyberbrick_led_set_color, cyberbrick_delay_ms, math_number, math_arithmetic, variables_get',
			'</user_code>',
			'',
			'<assistant_response id="example-5">',
			'[{"blockType":"controls_for","inputs":{"FROM":{"blockType":"math_number","fields":{"NUM":"1"}},"TO":{"blockType":"math_number","fields":{"NUM":"255"}},"BY":{"blockType":"math_number","fields":{"NUM":"1"}},"DO":{"blockType":"cyberbrick_led_set_color","inputs":{"RED":{"blockType":"math_arithmetic","fields":{"OP":"MINUS"},"inputs":{"A":{"blockType":"math_number","fields":{"NUM":"255"}},"B":{"blockType":"variables_get","fields":{"VAR":"i"}}}},"GREEN":{"blockType":"math_number","fields":{"NUM":"0"}},"BLUE":{"blockType":"variables_get","fields":{"VAR":"i"}}}}}},{"blockType":"cyberbrick_delay_ms","inputs":{"TIME":{"blockType":"math_number","fields":{"NUM":"500"}}}},{"blockType":"controls_repeat_ext","inputs":{"TIMES":{"blockType":"math_number","fields":{"NUM":"10"}}}}]',
			'</assistant_response>',
		];

		// Platform-specific guidance (appended to static prompt)
		systemParts.push('', '## Platform Notes');
		if (context.language === 'arduino') {
			systemParts.push(
				'- Arduino setup blocks (servo_setup, encoder_setup, etc.) are always-generate blocks placed outside loop() — do NOT suggest them.',
				'- Use appropriate pin numbers: uno (0-13, A0-A5), esp32 (0-39), mega (0-53, A0-A15).',
				'- Blocks marked with `fields: PIN[dynamic]` accept board-specific pin numbers.'
			);
		} else {
			systemParts.push(
				'- CyberBrick uses hardware init pattern — imports and initialization are auto-managed by the generator.',
				'- Prefer cyberbrick_* specific blocks over generic blocks when both are available.',
				'- MicroPython code runs inside a `def main():` function.'
			);
		}

		// Message 2: Assistant confirmation (establishes few-shot pattern)
		const assistantConfirm = 'Understood. I will analyze the program\'s purpose first, then suggest blocks that advance that purpose, with the most natural next step as the first suggestion.';

		// Message 3: Dynamic context (User) — changes every request
		const contextParts: string[] = [];

		// Board
		contextParts.push(`## Board: ${context.board} (${context.language === 'arduino' ? 'Arduino C++' : 'MicroPython'})`);

		// Generated code
		if (context.codeSnippet) {
			contextParts.push('', '## Current Code', '```', context.codeSnippet, '```');
		}

		// Workspace structure (AST-like tree)
		if (context.workspaceTree && context.workspaceTree.length > 0) {
			const treeText = this.formatWorkspaceTree(context.workspaceTree);
			if (treeText) {
				contextParts.push('', '## Block Structure', treeText);
			}
		}

		// Focus block
		if (context.selectedBlock) {
			contextParts.push('', '## Focus Block', `Last edited: \`${context.selectedBlock.type}\` — new blocks will be inserted after this block.`);
			if (context.selectedBlock.parentType) {
				contextParts.push(`Parent: \`${context.selectedBlock.parentType}\``);
			}
		}

		// User-defined variables — helps LLM suggest variable-related blocks
		if (context.variables && context.variables.length > 0) {
			contextParts.push('', '## User Variables',
				context.variables.map(v => `- ${v.name} (${v.type || 'any'})`).join('\n'));
		}

		// User-defined functions — helps LLM suggest function call blocks
		if (context.functions && context.functions.length > 0) {
			contextParts.push('', '## User Functions',
				context.functions.map(f => `- ${f.name}`).join('\n'));
		}

		// Connection type constraint — tells LLM what block types fit the insertion point
		if (context.selectedBlock?.connectionType) {
			const connDesc = context.selectedBlock.connectionType === 'next'
				? 'statement blocks (blocks that connect vertically via previous/next connections)'
				: context.selectedBlock.connectionType === 'input'
					? 'value blocks (blocks that plug into input slots)'
					: context.selectedBlock.connectionType;
			contextParts.push('', '## Connection Constraint',
				`The insertion point accepts: ${connDesc}. Only suggest compatible block types.`);
		}

		// Already used blocks
		if (context.existingBlockTypes && context.existingBlockTypes.length > 0) {
			contextParts.push('', '## Already Used Blocks', context.existingBlockTypes.join(', '));
		}

		// Available block types
		contextParts.push('', '## Available Block Types', blockList);

		// Final instruction
		contextParts.push('', `Suggest 1 to ${config.maxSuggestions} blocks as a JSON array.`);

		// Token budget control: estimate total prompt size
		// Rough estimate: 1 token ≈ 4 chars for English/code
		const staticLength = systemParts.join('\n').length;
		const dynamicLength = contextParts.join('\n').length;
		const totalChars = staticLength + dynamicLength;
		const estimatedTokens = Math.ceil(totalChars / 4);

		// If estimated tokens > 12000, apply priority-based truncation
		if (estimatedTokens > 12000) {
			// Strategy 1: Truncate codeSnippet to ±30 lines around INSERT marker
			if (context.codeSnippet) {
				const lines = context.codeSnippet.split('\n');
				const markerIdx = lines.findIndex(l => l.includes('INSERT NEW BLOCK HERE'));
				if (markerIdx >= 0 && lines.length > 60) {
					const start = Math.max(0, markerIdx - 30);
					const end = Math.min(lines.length, markerIdx + 30);
					const truncatedCode = lines.slice(start, end).join('\n');
					// Replace the code section in contextParts
					for (let i = 0; i < contextParts.length; i++) {
						if (contextParts[i] === '## Current Code' || contextParts[i].includes('## Current Code')) {
							// The code is at i+2 (after '' and '```')
							if (i + 2 < contextParts.length) {
								contextParts[i + 2] = truncatedCode;
							}
							break;
						}
					}
				}
			}
		}

		return [
			vscode.LanguageModelChatMessage.User(systemParts.join('\n')),
			vscode.LanguageModelChatMessage.Assistant(assistantConfirm),
			vscode.LanguageModelChatMessage.User(contextParts.join('\n')),
		];
	}

	/**
	 * Parse the LLM response text into validated BlockSuggestion[]
	 */
	private parseResponse(text: string): BlockSuggestion[] {
		let parsed: unknown;

		// Strategy 1: direct JSON.parse
		try {
			parsed = JSON.parse(text);
		} catch {
			// Strategy 2: extract from markdown fences
			const fenceMatch = text.match(FENCED_JSON_RE);
			if (fenceMatch) {
				try {
					parsed = JSON.parse(fenceMatch[1]);
				} catch {
					// fall through
				}
			}

			// Strategy 3: extract bare JSON array
			if (!parsed) {
				const arrayMatch = text.match(BARE_ARRAY_RE);
				if (arrayMatch) {
					try {
						parsed = JSON.parse(arrayMatch[0]);
					} catch {
						log('Failed to parse any JSON from AI response', 'debug');
						return [];
					}
				}
			}
		}

		if (!Array.isArray(parsed)) {
			log('AI response is not a JSON array', 'debug');
			return [];
		}

		return parsed.filter((item: any) => this.validateSuggestion(item));
	}

	/**
	 * Load and cache a block dictionary summary with one-line descriptions, filtered by language.
	 * Format: "### Category\ntype — description\n..."
	 */
	private loadBlockDictionary(language: 'arduino' | 'micropython'): string {
		const cached = this._blockDictionaryCache.get(language);
		if (cached) {
			return cached;
		}

		// Categories exclusive to each platform
		const arduinoOnlyCategories = new Set(['arduino', 'vision', 'x11', 'x12', 'motors', 'sensors', 'rc', 'displays', 'communication']);
		const micropythonOnlyCategories = new Set(['cyberbrick']);

		try {
			const dictPath = path.join(this._extensionPath, 'src', 'mcp', 'block-dictionary.json');
			const raw = fs.readFileSync(dictPath, 'utf-8');
			const dict = JSON.parse(raw) as {
				blocks: Array<{
					type: string;
					category: string;
					descriptions?: Record<string, string>;
					inputs?: Array<{ name: string; type: string; check?: string | string[] }>;
					fields?: Array<{ name: string; type: string; options?: any }>;
					internal?: boolean;
					experimental?: boolean;
				}>;
			};

			// Build block type set for validation (all blocks, unfiltered)
			this._blockTypeSet = new Set(dict.blocks.map(b => b.type));

			// Filter blocks by language
			const filtered = dict.blocks.filter(b => {
				if (language === 'micropython' && arduinoOnlyCategories.has(b.category)) {
					return false;
				}
				if (language === 'arduino' && micropythonOnlyCategories.has(b.category)) {
					return false;
				}
				// Exclude internal and experimental blocks from AI suggestions
				if (b.internal === true || b.experimental === true) {
					return false;
				}
				return true;
			});

			// Build blockType → category map and inputs map
			this._blockTypeCategoryMap = new Map<string, string>();
			this._blockInputsMap.clear();
			for (const block of filtered) {
				this._blockTypeCategoryMap.set(block.type, block.category);
				const valueInputs = block.inputs?.filter(i => i.type === 'value');
				if (valueInputs && valueInputs.length > 0) {
					this._blockInputsMap.set(block.type, valueInputs.map(i => ({ name: i.name, check: i.check })));
				}
			}

			// Group by category with descriptions
			const byCategory = new Map<string, string[]>();
			for (const block of filtered) {
				const cat = block.category;
				if (!byCategory.has(cat)) {
					byCategory.set(cat, []);
				}
				const desc = block.descriptions?.en ?? block.type;
				const valueInputs = block.inputs?.filter(i => i.type === 'value') ?? [];
				const inputsSummary = valueInputs.length
					? ' | inputs: ' + valueInputs.map(i => `${i.name}(${Array.isArray(i.check) ? i.check.join('|') : i.check || 'Any'})`).join(', ')
					: '';
				const stmtInputs = block.inputs?.filter(i => i.type === 'statement') ?? [];
				const stmtsSummary = stmtInputs.length
					? ' | stmts: ' + stmtInputs.map(i => i.name).join(', ')
					: '';

				// Build field dropdown summary
				const dropdownFields = (block.fields ?? [])
					.filter(f => f.type === 'dropdown' && f.options)
					.map(f => {
						if (typeof f.options === 'string') {
							return `${f.name}[dynamic]`;
						}
						if (Array.isArray(f.options)) {
							const values = (f.options as Array<{ value: string }>).map(o => o.value).filter(Boolean);
							if (values.length > 6) {
								return `${f.name}[${values.slice(0, 5).join('|')}|...]`;
							}
							return `${f.name}[${values.join('|')}]`;
						}
						return null;
					})
					.filter(Boolean);
				const fieldsSummary = dropdownFields.length
					? ' | fields: ' + dropdownFields.join(', ')
					: '';

				byCategory.get(cat)!.push(`${block.type} — ${desc}${inputsSummary}${stmtsSummary}${fieldsSummary}`);
			}

			const lines: string[] = [];
			for (const [category, entries] of byCategory) {
				lines.push(`### ${category}`);
				lines.push(...entries);
				lines.push('');
			}

			const result = lines.join('\n').trimEnd();
			this._blockDictionaryCache.set(language, result);
			log(`Block dictionary loaded (${language}): ${filtered.length} blocks in ${byCategory.size} categories`, 'info');
			return result;
		} catch (err) {
			log(`Failed to load block dictionary: ${err}`, 'warn');
			const fallback = '(block dictionary unavailable)';
			this._blockDictionaryCache.set(language, fallback);
			return fallback;
		}
	}

	/**
	 * Convert workspaceTree JSON into a concise AST-like indented text for the LLM prompt.
	 */
	private formatWorkspaceTree(tree: WorkspaceContext['workspaceTree']): string {
		if (!tree || tree.length === 0) { return ''; }

		const MAX_LINES = 80;
		const MAX_DEPTH = 4;
		const lines: string[] = [];
		let totalNodes = 0;

		const opMap: Record<string, string> = {
			ADD: '+', MINUS: '-', MULTIPLY: '×', DIVIDE: '÷', POWER: '^'
		};

		const resolveValue = (node: any): string => {
			if (!node || !node.type) { return '?'; }
			switch (node.type) {
				case 'math_number': return node.fields?.NUM ?? '0';
				case 'variables_get': return node.fields?.VAR ?? '?';
				case 'text': return `"${node.fields?.TEXT ?? ''}"`;
				case 'logic_boolean': return node.fields?.BOOL ?? 'TRUE';
				case 'math_arithmetic': {
					const op = opMap[node.fields?.OP] ?? node.fields?.OP ?? '?';
					const a = node.inputs?.A ? resolveValue(node.inputs.A) : '?';
					const b = node.inputs?.B ? resolveValue(node.inputs.B) : '?';
					return `${a} ${op} ${b}`;
				}
				default: return node.type;
			}
		};

		const buildParams = (node: any): string => {
			const parts: string[] = [];
			if (node.fields) {
				for (const [key, val] of Object.entries(node.fields)) {
					parts.push(`${key}=${val}`);
				}
			}
			if (node.inputs) {
				for (const [key, child] of Object.entries(node.inputs)) {
					if (child) {
						parts.push(`${key}=${resolveValue(child)}`);
					}
				}
			}
			return parts.length > 0 ? ` (${parts.join(', ')})` : '';
		};

		const walk = (nodes: any[], depth: number): boolean => {
			for (const node of nodes) {
				if (lines.length >= MAX_LINES) { return false; }
				totalNodes++;

				if (depth >= MAX_DEPTH) {
					lines.push(`${'  '.repeat(depth)}...`);
					continue;
				}

				const indent = '  '.repeat(depth);
				lines.push(`${indent}${node.type}${buildParams(node)}`);

				if (node.children && node.children.length > 0) {
					if (!walk(node.children, depth + 1)) { return false; }
				}
			}
			return true;
		};

		const completed = walk(tree, 0);
		if (!completed && lines.length >= MAX_LINES) {
			lines.push(`... (truncated, ${totalNodes} blocks total)`);
		}

		return lines.join('\n');
	}

	/**
	 * Auto-fill missing value inputs with appropriate default child blocks.
	 * Recursively processes nested inputs so child blocks also get their inputs filled.
	 */
	private ensureRequiredInputs(suggestions: BlockSuggestion[]): void {
		for (const suggestion of suggestions) {
			const requiredInputs = this._blockInputsMap.get(suggestion.blockType);
			if (!requiredInputs) { continue; }

			if (!suggestion.inputs) { suggestion.inputs = {}; }

			for (const input of requiredInputs) {
				if (suggestion.inputs[input.name] !== undefined) {
					// Already filled — recursively ensure its own inputs
					this.ensureRequiredInputs([suggestion.inputs[input.name]]);
					continue;
				}

				const check = Array.isArray(input.check) ? input.check[0] : input.check;
				switch (check) {
					case 'Number':
						suggestion.inputs[input.name] = { blockType: 'math_number', fields: { NUM: '0' } };
						break;
					case 'String':
						suggestion.inputs[input.name] = { blockType: 'text', fields: { TEXT: '' } };
						break;
					case 'Boolean':
						suggestion.inputs[input.name] = { blockType: 'logic_boolean', fields: { BOOL: 'TRUE' } };
						break;
					default:
						suggestion.inputs[input.name] = { blockType: 'math_number', fields: { NUM: '0' } };
						break;
				}
			}

			// Clean up empty inputs object
			if (Object.keys(suggestion.inputs).length === 0) {
				delete suggestion.inputs;
			}
		}
	}

	/**
	 * Filter suggestions to ensure diversity across categories
	 * and avoid duplicating blocks the user already has.
	 */
	private filterForDiversity(
		suggestions: BlockSuggestion[],
		existingBlockTypes: string[],
		focusBlockType?: string
	): BlockSuggestion[] {
		const existingSet = new Set(existingBlockTypes);
		const categoryCounts = new Map<string, number>();
		const filtered: BlockSuggestion[] = [];
		const utilityBlocks = new Set([
			'text', 'math_number', 'math_arithmetic', 'logic_boolean', 'text_print',
			'cyberbrick_delay_ms', 'cyberbrick_delay_s', 'delay_ms', 'arduino_delay'
		]);
		// Control/flow blocks are inherently reusable — don't filter by existence
		const reusableBlocks = new Set([
			'controls_repeat_ext', 'controls_repeat', 'controls_whileUntil',
			'controls_for', 'controls_forEach', 'controls_if', 'controls_ifelse',
			'controls_flow_statements', 'controls_duration',
		]);

		// Determine focus block's category for relaxed filtering
		const focusCategory = focusBlockType ? this._blockTypeCategoryMap?.get(focusBlockType) : undefined;

		for (const suggestion of suggestions) {
			// Skip if user already has this exact block type
			// Exempt: utility blocks, reusable control blocks, and composite blocks with statement children
			const hasStatementChildren = suggestion.inputs && Object.values(suggestion.inputs).some(
				(v: any) => v && typeof v === 'object' && v.blockType
			);
			if (existingSet.has(suggestion.blockType)
				&& !utilityBlocks.has(suggestion.blockType)
				&& !reusableBlocks.has(suggestion.blockType)
				&& !hasStatementChildren) {
				continue;
			}

			// Category limit: max 2 per category (3 if same category as focus block)
			const category = this._blockTypeCategoryMap?.get(suggestion.blockType);
			if (category) {
				const currentCount = categoryCounts.get(category) || 0;
				const maxForCategory = (category === focusCategory) ? 3 : 2;
				if (currentCount >= maxForCategory) {
					continue;
				}
				categoryCounts.set(category, currentCount + 1);
			}

			filtered.push(suggestion);
		}

		// Fallback: if everything filtered out, return first suggestion
		if (filtered.length === 0 && suggestions.length > 0) {
			return [suggestions[0]];
		}

		return filtered;
	}

	/**
	 * Validate that a suggestion object has correct shape and a known block type
	 */
	private validateSuggestion(suggestion: any): suggestion is BlockSuggestion {
		if (!suggestion || typeof suggestion !== 'object') {
			return false;
		}

		if (typeof suggestion.blockType !== 'string' || !suggestion.blockType) {
			return false;
		}

		// Validate against block dictionary if loaded
		// Allow variable blocks which are dynamic and not in the static dictionary
		const dynamicBlocks = new Set(['variables_get', 'variables_set']);
		if (this._blockTypeSet && !this._blockTypeSet.has(suggestion.blockType) && !dynamicBlocks.has(suggestion.blockType)) {
			log(`Unknown block type in suggestion: ${suggestion.blockType}`, 'debug');
			return false;
		}

		// Recursively validate inputs (child blocks)
		if (suggestion.inputs && typeof suggestion.inputs === 'object') {
			const inputNames = Object.keys(suggestion.inputs);
			for (const name of inputNames) {
				let child = suggestion.inputs[name];

				// Normalize array-format statement children to single object
				// LLM may return "DO": [{...}, {...}] instead of "DO": {...}
				if (Array.isArray(child)) {
					if (child.length > 0 && child[0] && child[0].blockType) {
						child = child[0];
						suggestion.inputs[name] = child;
					} else {
						delete suggestion.inputs[name];
						continue;
					}
				}

				if (child && typeof child === 'object' && child.blockType) {
					if (!this.validateSuggestion(child)) {
						// Remove invalid child input rather than rejecting entire suggestion
						delete suggestion.inputs[name];
					}
				} else {
					// Invalid input entry — remove it
					delete suggestion.inputs[name];
				}
			}
			// Clean up empty inputs object
			if (Object.keys(suggestion.inputs).length === 0) {
				delete suggestion.inputs;
			}
		}

		// Recursively validate "next" chain (block stacking within statement slots)
		if (suggestion.next && typeof suggestion.next === 'object' && suggestion.next.blockType) {
			if (!this.validateSuggestion(suggestion.next)) {
				delete suggestion.next;
			}
		} else if (suggestion.next) {
			delete suggestion.next;
		}

		return true;
	}
}
