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
const REQUEST_TIMEOUT_MS = 25_000;

/** Map WebView board IDs to block-dictionary.json board names */
const BOARD_NAME_MAP: Record<string, string> = {
	uno: 'arduino_uno',
	nano: 'arduino_nano',
	mega: 'arduino_mega',
	esp32: 'esp32',
	supermini: 'esp32_supermini',
	cyberbrick: 'cyberbrick',
};

/** Categories that are universal across all boards — skip board filtering */
const UNIVERSAL_CATEGORIES = new Set(['logic', 'loops', 'math', 'text', 'lists', 'variables', 'functions']);

/**
 * Shadow Block 建議服務
 * 接收工作區上下文，透過 AIModelManager 呼叫 LLM 產生積木建議
 */
export class ShadowSuggestionService {
	private _blockDictionaryCache = new Map<string, string>();
	private _blockTypeSet: Set<string> | undefined;
	private _blockTypeCategoryMap: Map<string, string> | undefined;
	private _blockInputsMap: Map<string, Array<{ name: string; check?: string | string[] }>> = new Map();
	private _blockStatementInputsMap: Map<string, string[]> = new Map();
	private readonly _extensionPath: string;
	private _activeCancellationSource: vscode.CancellationTokenSource | undefined;

	constructor(
		private readonly _modelManager: AIModelManager,
		extensionPath: string
	) {
		this._extensionPath = extensionPath;
	}

	/**
	 * Request AI-generated block suggestions for the current workspace context
	 */
	async requestSuggestion(context: WorkspaceContext): Promise<SuggestionResult | null> {
		const config = this._modelManager.getEffectiveConfig();

		const hasBlocks =
			(context.workspaceTree && context.workspaceTree.length > 0) || (context.blockTree && context.blockTree.length > 0);
		if (!context.selectedBlock && !hasBlocks) {
			log('No selected block and empty workspace, skipping suggestion', 'debug');
			return null;
		}

		// Cancel any in-flight request
		if (this._activeCancellationSource) {
			this._activeCancellationSource.cancel();
			this._activeCancellationSource.dispose();
			this._activeCancellationSource = undefined;
		}

		const t0 = performance.now();
		try {
			const messages = this.buildPrompt(context);
			const t1 = performance.now();
			log(`[AI Perf] Prompt built in ${(t1 - t0).toFixed(0)}ms`, 'info');
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
			const t2 = performance.now();
			log(`[AI Perf] Model responded in ${(t2 - t1).toFixed(0)}ms`, 'info');

			if (!response) {
				cts.dispose();
				this._activeCancellationSource = undefined;
				log('No response from AI model', 'debug');
				return null;
			}

			// Collect the streamed response text
			let text = '';

			for await (const fragment of response.text) {
				if (cts.token.isCancellationRequested) {
					break;
				}
				text += fragment;
			}
			const t3 = performance.now();
			log(`[AI Perf] Streaming collected in ${(t3 - t2).toFixed(0)}ms (${text.length} chars)`, 'info');

			// If this request was superseded by a newer one, discard the result
			if (cts.token.isCancellationRequested) {
				cts.dispose();
				return null;
			}

			cts.dispose();
			this._activeCancellationSource = undefined;

			log(`[AI Debug] Raw response (first 500 chars): ${text.substring(0, 500)}`, 'debug');
			if (text.length > 500) {
				log(`[AI Debug] Raw response (last 100 chars): ...${text.substring(text.length - 100)}`, 'debug');
			}
			let suggestions = this.parseResponse(text);
			const t4 = performance.now();
			log(`[AI Perf] Parsed ${suggestions.length} suggestions in ${(t4 - t3).toFixed(0)}ms`, 'info');
			log(`Parsed ${suggestions.length} suggestions from AI response (${text.length} chars)`, 'debug');
			this.ensureRequiredInputs(suggestions);
			this.normalizeEmptyFields(suggestions);
			this.ensureStatementInputs(suggestions);
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

			log(`[AI Perf] Total pipeline: ${(performance.now() - t0).toFixed(0)}ms`, 'info');
			return result;
		} catch (err) {
			this._activeCancellationSource = undefined;
			if (err instanceof vscode.CancellationError) {
				log(`[AI Perf] Request cancelled/timed out after ${(performance.now() - t0).toFixed(0)}ms`, 'info');
				log('Shadow suggestion request cancelled or timed out', 'debug');
				return null;
			}
			log(`Shadow suggestion request failed: ${err}`, 'error');
			return null;
		}
	}

	/**
	 * Cancel the currently in-flight suggestion request, if any.
	 * Called when the workspace changes so stale results are never delivered.
	 */
	cancelCurrentRequest(): void {
		if (this._activeCancellationSource) {
			this._activeCancellationSource.cancel();
			this._activeCancellationSource.dispose();
			this._activeCancellationSource = undefined;
		}
	}

	/**
	 * Build the prompt messages for the AI model.
	 * Three-message structure: User(static instructions) → Assistant(confirmation) → User(dynamic context).
	 * Static content placed first for prompt caching benefits.
	 */
	private buildPrompt(context: WorkspaceContext): vscode.LanguageModelChatMessage[] {
		const config = this._modelManager.getEffectiveConfig();
		const blockList = this.loadBlockDictionary(context.language, context.board);

		// Message 1: Static identity + instructions + few-shot examples (User)
		const systemParts: string[] = [
			'# Identity',
			'You are a Singular Blockly assistant that observes behavior patterns and predicts the next logical blocks.',
			'',
			'# Instructions',
			'',
			'## Output Format',
			'Respond ONLY with a single-element minified JSON array. No markdown, no explanation.',
			'The array MUST contain EXACTLY ONE element: `[{"blockType":"name","fields":{...},"inputs":{...}}]`',
			'fields/inputs optional. No whitespace between tokens.',
			'CRITICAL: Always close all braces/brackets. Response MUST end with `]`.',
			'CRITICAL: Output EXACTLY ONE element in the array. Never split into multiple separate top-level blocks.',
			'',
			'## Pattern Analysis',
			"1. Identify the user's behavior pattern from existing code",
			'2. Predict intent — infer the overall goal from the pattern',
			'3. Complete the pattern — if R→G and G→B exist, suggest B→R',
			'4. Focus on the `← INSERT NEW BLOCK HERE` marker position',
			'',
			'## Rules',
			'Output EXACTLY ONE deeply-nested block chain. Never output multiple separate top-level blocks.',
			'MANDATORY: ALL statement slots (DO/ELSE/DO0/BODY/THEN) MUST contain at least one inner block — never leave a statement slot empty.',
			'ALL value inputs MUST have concrete contextual values derived from the pattern — not arbitrary zeros unless context suggests zero.',
			'Use variable names from User Variables.',
			'Dropdown fields: values MUST exactly match the listed options.',
			"DON'T suggest: arduino_setup_loop, micropython_main, or unlisted blocks.",
			'CRITICAL: `inputs` MUST be a top-level key of the block object — NEVER nest `inputs` inside `fields`.',
			'CRITICAL: ALL field values MUST be plain strings. Never place a block object inside fields.',
			'WRONG: {"blockType":"math_arithmetic","fields":{"OP":"ADD","inputs":{"A":{...},"B":{...}}}}',
			'RIGHT: {"blockType":"math_arithmetic","fields":{"OP":"ADD"},"inputs":{"A":{...},"B":{...}}}',
			'',
			'# Examples',
			'',
			'<user_code id="ex1">',
			'Board: uno (Arduino C++)',
			'Code: void loop(){Serial.println("1");Serial.println("2");}',
			'Used: arduino_setup_loop,text_print,text',
			'</user_code>',
			'<response id="ex1">',
			'[{"blockType":"text_print","inputs":{"TEXT":{"blockType":"text","fields":{"TEXT":"3"}}}}]',
			'</response>',
			'',
			'<user_code id="ex2">',
			'Board: cyberbrick (MicroPython)',
			'Code: for i in range(256): led=(i,255-i,0); for i in range(256): led=(0,i,255-i)',
			'Pattern: RGB cycle — R→G done, G→B done, missing B→R',
			'Used: micropython_main,controls_for,cyberbrick_led_set_color,cyberbrick_delay_ms,math_number,math_arithmetic,variables_get',
			'</user_code>',
			'<response id="ex2">',
			'[{"blockType":"controls_for","fields":{"VAR":"i"},"inputs":{"FROM":{"blockType":"math_number","fields":{"NUM":"0"}},"TO":{"blockType":"math_number","fields":{"NUM":"255"}},"BY":{"blockType":"math_number","fields":{"NUM":"1"}},"DO":{"blockType":"cyberbrick_led_set_color","inputs":{"RED":{"blockType":"variables_get","fields":{"VAR":"i"}},"GREEN":{"blockType":"math_number","fields":{"NUM":"0"}},"BLUE":{"blockType":"math_arithmetic","fields":{"OP":"MINUS"},"inputs":{"A":{"blockType":"math_number","fields":{"NUM":"255"}},"B":{"blockType":"variables_get","fields":{"VAR":"i"}}}}}}}}]',
			'</response>',
			'',
			'<user_code id="ex3">',
			'Board: uno (Arduino C++)',
			'Code: int val = analogRead(A0); Serial.println(val);',
			'Pattern: read sensor → next step is to branch on value',
			'Used: arduino_setup_loop,variables_set,text_print,variables_get,math_number',
			'</user_code>',
			'<response id="ex3">',
			'[{"blockType":"controls_if","inputs":{"IF0":{"blockType":"logic_compare","fields":{"OP":"GT"},"inputs":{"A":{"blockType":"variables_get","fields":{"VAR":"val"}},"B":{"blockType":"math_number","fields":{"NUM":"512"}}}},"DO0":{"blockType":"text_print","inputs":{"TEXT":{"blockType":"text","fields":{"TEXT":"HIGH"}}}}}}]',
			'</response>',
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
		const assistantConfirm = 'Understood. I will analyze patterns, predict intent, output minified JSON array.';

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
			contextParts.push(
				'',
				'## Focus Block',
				`Last edited: \`${context.selectedBlock.type}\` — new blocks will be inserted after this block.`
			);
			if (context.selectedBlock.parentType) {
				contextParts.push(`Parent: \`${context.selectedBlock.parentType}\``);
			}
		}

		// User-defined variables — helps LLM suggest variable-related blocks
		if (context.variables && context.variables.length > 0) {
			contextParts.push('', '## User Variables', context.variables.map(v => `- ${v.name} (${v.type || 'any'})`).join('\n'));
		}

		// User-defined functions — helps LLM suggest function call blocks
		if (context.functions && context.functions.length > 0) {
			contextParts.push('', '## User Functions', context.functions.map(f => `- ${f.name}`).join('\n'));
		}

		// Connection type constraint — tells LLM what block types fit the insertion point
		if (context.selectedBlock?.connectionType) {
			const connDesc =
				context.selectedBlock.connectionType === 'next'
					? 'statement blocks (blocks that connect vertically via previous/next connections)'
					: context.selectedBlock.connectionType === 'input'
						? 'value blocks (blocks that plug into input slots)'
						: context.selectedBlock.connectionType;
			contextParts.push(
				'',
				'## Connection Constraint',
				`The insertion point accepts: ${connDesc}. Only suggest compatible block types.`
			);
		}

		// Already used blocks
		if (context.existingBlockTypes && context.existingBlockTypes.length > 0) {
			contextParts.push('', '## Already Used Blocks', context.existingBlockTypes.join(', '));
		}

		// Available block types
		contextParts.push('', '## Available Block Types', blockList);

		// Final instruction
		contextParts.push('', 'Output exactly 1 complete and deeply-nested block chain as a single-element JSON array.');

		// Token budget control: estimate total prompt size
		// Rough estimate: 1 token ≈ 4 chars for English/code
		const staticLength = systemParts.join('\n').length;
		const dynamicLength = contextParts.join('\n').length;
		const totalChars = staticLength + dynamicLength;
		const estimatedTokens = Math.ceil(totalChars / 4);

		// Dynamic truncation threshold: use 85% of the model's actual maxInputTokens
		// (reserves ~15% headroom for output tokens), falling back to 64000 if no model is cached yet.
		const cachedModel = this._modelManager.getCachedModel();
		const safeInputLimit = cachedModel ? Math.floor(cachedModel.maxInputTokens * 0.85) : 64000;
		if (estimatedTokens > safeInputLimit) {
			// Strategy 1: Truncate codeSnippet to ±15 lines around INSERT marker
			if (context.codeSnippet) {
				const lines = context.codeSnippet.split('\n');
				const markerIdx = lines.findIndex(l => l.includes('INSERT NEW BLOCK HERE'));
				if (markerIdx >= 0 && lines.length > 30) {
					const start = Math.max(0, markerIdx - 15);
					const end = Math.min(lines.length, markerIdx + 15);
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

		// Temporary debug: log full dynamic context sent to AI
		const dynamicContext = contextParts.join('\n');
		log(`[AI Debug] Dynamic context (${dynamicContext.length} chars)`, 'debug');

		return [
			vscode.LanguageModelChatMessage.User(systemParts.join('\n')),
			vscode.LanguageModelChatMessage.Assistant(assistantConfirm),
			vscode.LanguageModelChatMessage.User(dynamicContext),
		];
	}

	/**
	 * Parse the LLM response text into validated BlockSuggestion[]
	 */
	private parseResponse(text: string): BlockSuggestion[] {
		let parsed: unknown;
		let strategyUsed = 'direct-parse';

		// Strategy 1: direct JSON.parse
		try {
			parsed = JSON.parse(text);
		} catch (e) {
			log(`[AI Debug] Direct JSON.parse failed: ${(e as Error).message}`, 'debug');
			strategyUsed = 'none';
			// Strategy 2: extract from markdown fences
			const fenceMatch = text.match(FENCED_JSON_RE);
			if (fenceMatch) {
				try {
					parsed = JSON.parse(fenceMatch[1]);
					strategyUsed = 'fenced';
				} catch {
					// fall through
				}
				log(`[AI Debug] Fenced JSON extraction ${parsed ? 'succeeded' : 'failed'}`, 'debug');
			}

			// Strategy 3: extract bare JSON array
			if (!parsed) {
				const arrayMatch = text.match(BARE_ARRAY_RE);
				if (arrayMatch) {
					try {
						parsed = JSON.parse(arrayMatch[0]);
						strategyUsed = 'bare-array';
					} catch {
						// Strategy 3.5: bracket-balance repair
						// When JSON array is found but has unbalanced braces (e.g., truncated output),
						// try inserting missing closing braces before the final `]`
						const jsonStr = arrayMatch[0];
						let opens = 0;
						let closes = 0;
						let inStr = false;
						for (let ci = 0; ci < jsonStr.length; ci++) {
							const c = jsonStr[ci];
							if (c === '\\' && inStr) {
								ci++;
								continue;
							}
							if (c === '"') {
								inStr = !inStr;
								continue;
							}
							if (inStr) {
								continue;
							}
							if (c === '{') {
								opens++;
							} else if (c === '}') {
								closes++;
							}
						}
						const missing = opens - closes;
						if (missing > 0 && missing <= 5) {
							// Insert missing } before the final ]
							const repaired = jsonStr.slice(0, -1) + '}'.repeat(missing) + ']';
							try {
								parsed = JSON.parse(repaired);
								strategyUsed = 'bracket-balance';
								log(`[AI Debug] Bracket-balance: added ${missing} closing brace(s)`, 'debug');
							} catch {
								// fall through to Strategy 4
							}
						}
					}
				}
			}

			// Strategy 4: repair truncated JSON
			// When model output is truncated mid-JSON, try to find the last complete
			// top-level object and close the array
			if (!parsed) {
				parsed = this.repairTruncatedJson(text);
				if (parsed) {
					strategyUsed = 'truncation-repair';
				}
			}

			// Strategy 5: greedy extraction — find individual top-level JSON objects
			// Handles cases where the response looks like valid JSON but has internal syntax errors
			if (!parsed) {
				parsed = this.extractIndividualObjects(text);
				if (parsed) {
					strategyUsed = 'greedy-extraction';
				}
			}

			// Strategy 6: regex fallback — extract blockType names from broken JSON
			if (!parsed) {
				const blockTypeRegex = /"blockType"\s*:\s*"([^"]+)"/g;
				let match;
				const extractedTypes: string[] = [];
				while ((match = blockTypeRegex.exec(text)) !== null) {
					// Only keep top-level block types (skip children that might be duplicated)
					if (!extractedTypes.includes(match[1])) {
						extractedTypes.push(match[1]);
					}
				}
				if (extractedTypes.length > 0) {
					parsed = extractedTypes.map(bt => ({ blockType: bt }));
					strategyUsed = 'regex-fallback';
					log(`[AI Debug] Regex fallback extracted ${extractedTypes.length} blockTypes: ${extractedTypes.join(', ')}`, 'debug');
				}
			}

			if (!parsed) {
				log('Failed to parse any JSON from AI response', 'info');
				return [];
			}
		}

		if (!Array.isArray(parsed)) {
			log(`AI response is not a JSON array: ${String(parsed).substring(0, 200)}`, 'info');
			return [];
		}

		log(`[AI Debug] Parsed array with ${parsed.length} items via ${strategyUsed}, validating...`, 'info');
		this.repairMisplacedInputs(parsed);
		const validated = parsed.filter((item: any) => this.validateSuggestion(item));
		if (validated.length < parsed.length) {
			log(`[AI Debug] Validation rejected ${parsed.length - validated.length} of ${parsed.length} suggestions`, 'debug');
		}
		return validated;
	}

	/**
	 * Attempt to repair truncated JSON array by finding the last complete top-level object.
	 * Handles cases where model output token limit cuts off the JSON mid-response.
	 */
	private repairTruncatedJson(text: string): unknown | null {
		// Find the start of the JSON array
		const arrayStart = text.indexOf('[');
		if (arrayStart === -1) {
			return null;
		}

		const jsonPart = text.substring(arrayStart);

		// Walk through the string tracking bracket/brace depth to find complete objects
		let depth = 0;
		let inString = false;
		let escape = false;
		let lastCompleteObjectEnd = -1;

		for (let i = 0; i < jsonPart.length; i++) {
			const ch = jsonPart[i];

			if (escape) {
				escape = false;
				continue;
			}

			if (ch === '\\' && inString) {
				escape = true;
				continue;
			}

			if (ch === '"') {
				inString = !inString;
				continue;
			}

			if (inString) {
				continue;
			}

			if (ch === '[' || ch === '{') {
				depth++;
			} else if (ch === ']' || ch === '}') {
				depth--;
				// depth === 1 means we just closed a top-level object inside the array
				if (depth === 1 && ch === '}') {
					lastCompleteObjectEnd = i;
				}
				// depth === 0 means array is properly closed — should have been caught by Strategy 1/3
				if (depth === 0) {
					// Array looks closed - try parsing as-is first
					try {
						return JSON.parse(jsonPart);
					} catch {
						// Balanced brackets but internal errors - try truncation repair
						break;
					}
				}
			}
		}

		if (lastCompleteObjectEnd === -1) {
			return null;
		}

		// Truncate after last complete object and close the array
		const repaired = jsonPart.substring(0, lastCompleteObjectEnd + 1) + ']';
		try {
			const result = JSON.parse(repaired);
			log(
				`[AI Debug] Truncated JSON repaired: extracted ${Array.isArray(result) ? result.length : 0} items from ${jsonPart.length} chars`,
				'debug'
			);
			return result;
		} catch {
			return null;
		}
	}

	/**
	 * Extract individual JSON objects from a response that may have syntax errors.
	 * Walks through the text character by character, tracking brace depth and string state,
	 * to identify complete top-level objects within a JSON array.
	 */
	private extractIndividualObjects(text: string): unknown[] | null {
		const arrayStart = text.indexOf('[');
		if (arrayStart === -1) {
			return null;
		}

		const jsonPart = text.substring(arrayStart);
		const objects: unknown[] = [];
		let depth = 0;
		let inString = false;
		let escape = false;
		let objectStart = -1;

		for (let i = 0; i < jsonPart.length; i++) {
			const ch = jsonPart[i];

			if (escape) {
				escape = false;
				continue;
			}
			if (ch === '\\' && inString) {
				escape = true;
				continue;
			}
			if (ch === '"') {
				inString = !inString;
				continue;
			}
			if (inString) {
				continue;
			}

			if (ch === '{') {
				if (depth === 1) {
					objectStart = i;
				}
				depth++;
			} else if (ch === '}') {
				depth--;
				if (depth === 1 && objectStart !== -1) {
					const objStr = jsonPart.substring(objectStart, i + 1);
					try {
						const obj = JSON.parse(objStr);
						objects.push(obj);
					} catch {
						log(`[AI Debug] Skipped malformed object at position ${objectStart}`, 'debug');
					}
					objectStart = -1;
				}
			} else if (ch === '[' && depth === 0) {
				depth = 1;
			} else if (ch === ']' && depth === 1) {
				break;
			}
		}

		// If no complete objects found but we have an objectStart, try parsing partial
		if (objects.length === 0 && objectStart !== -1) {
			// Try to find the largest parseable substring
			for (let end = jsonPart.length - 1; end > objectStart; end--) {
				if (jsonPart[end] === '}') {
					const candidate = jsonPart.substring(objectStart, end + 1);
					try {
						const obj = JSON.parse(candidate);
						objects.push(obj);
						log(`[AI Debug] Greedy extraction recovered partial object from position ${objectStart} to ${end}`, 'debug');
						break;
					} catch {
						// Try next } position
					}
				}
			}
		}

		if (objects.length > 0) {
			log(`[AI Debug] Greedy extraction recovered ${objects.length} objects from malformed JSON`, 'debug');
			return objects;
		}
		return null;
	}

	/**
	 * Load and cache a block dictionary summary with one-line descriptions, filtered by language.
	 * Format: "### Category\ntype — description\n..."
	 */
	private loadBlockDictionary(language: 'arduino' | 'micropython', board: string): string {
		const cacheKey = `${language}:${board}`;
		const cached = this._blockDictionaryCache.get(cacheKey);
		if (cached) {
			return cached;
		}

		// Categories exclusive to each platform
		const arduinoOnlyCategories = new Set(['arduino', 'vision', 'motors', 'sensors', 'displays', 'communication']);
		const micropythonOnlyCategories = new Set(['cyberbrick']);

		try {
			// Try multiple possible locations (dist for production, src for development)
			const candidates = [
				path.join(this._extensionPath, 'dist', 'block-dictionary.json'),
				path.join(this._extensionPath, 'src', 'mcp', 'block-dictionary.json'),
				path.join(this._extensionPath, 'block-dictionary.json'),
			];
			const dictPath = candidates.find(p => fs.existsSync(p));
			if (!dictPath) {
				log('Block dictionary not found in any expected location', 'warn');
				const fallback = '(block dictionary unavailable)';
				this._blockDictionaryCache.set(language, fallback);
				return fallback;
			}
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
					boards?: string[];
				}>;
			};

			// Build block type set for validation (all blocks, unfiltered)
			this._blockTypeSet = new Set(dict.blocks.map(b => b.type));

			// Filter blocks by language and board
			const dictBoardName = BOARD_NAME_MAP[board] || board;
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
				// Filter by board compatibility (skip universal categories)
				if (!UNIVERSAL_CATEGORIES.has(b.category) && b.boards && Array.isArray(b.boards) && !b.boards.includes(dictBoardName)) {
					return false;
				}
				return true;
			});

			// Build blockType → category map and inputs map
			this._blockTypeCategoryMap = new Map<string, string>();
			this._blockInputsMap.clear();
			this._blockStatementInputsMap.clear();
			for (const block of filtered) {
				this._blockTypeCategoryMap.set(block.type, block.category);
				const valueInputs = block.inputs?.filter(i => i.type === 'value');
				if (valueInputs && valueInputs.length > 0) {
					this._blockInputsMap.set(
						block.type,
						valueInputs.map(i => ({ name: i.name, check: i.check }))
					);
				}
				const stmtInputs = block.inputs?.filter(i => i.type === 'statement');
				if (stmtInputs && stmtInputs.length > 0) {
					this._blockStatementInputsMap.set(
						block.type,
						stmtInputs.map(i => i.name)
					);
				}
			}

			// Group by category
			const byCategory = new Map<string, string[]>();
			for (const block of filtered) {
				const cat = block.category;
				if (!byCategory.has(cat)) {
					byCategory.set(cat, []);
				}
				const valueInputs = block.inputs?.filter(i => i.type === 'value') ?? [];
				const inputsSummary = valueInputs.length
					? ' | inputs: ' +
						valueInputs.map(i => `${i.name}(${Array.isArray(i.check) ? i.check.join('|') : i.check || 'Any'})`).join(', ')
					: '';
				const stmtInputs = block.inputs?.filter(i => i.type === 'statement') ?? [];
				const stmtsSummary = stmtInputs.length ? ' | stmts: ' + stmtInputs.map(i => i.name).join(', ') : '';

				// Build field dropdown summary
				const dropdownFields = (block.fields ?? [])
					.filter(f => f.type === 'dropdown' && f.options)
					.map(f => {
						if (typeof f.options === 'string') {
							return `${f.name}[dynamic]`;
						}
						if (Array.isArray(f.options)) {
							const values = (f.options as Array<{ value: string }>).map(o => o.value).filter(Boolean);
							if (values.length > 4) {
								return `${f.name}[${values.slice(0, 3).join('|')}|...]`;
							}
							return `${f.name}[${values.join('|')}]`;
						}
						return null;
					})
					.filter(Boolean);
				const fieldsSummary = dropdownFields.length ? ' | fields: ' + dropdownFields.join(', ') : '';

				byCategory.get(cat)!.push(`${block.type}${inputsSummary}${stmtsSummary}${fieldsSummary}`);
			}

			const lines: string[] = [];
			for (const [category, entries] of byCategory) {
				lines.push(`### ${category}`);
				lines.push(...entries);
				lines.push('');
			}

			const result = lines.join('\n').trimEnd();
			this._blockDictionaryCache.set(cacheKey, result);
			log(`Block dictionary loaded (${language}/${board}): ${filtered.length} blocks in ${byCategory.size} categories`, 'info');
			return result;
		} catch (err) {
			log(`Failed to load block dictionary: ${err}`, 'warn');
			const fallback = '(block dictionary unavailable)';
			this._blockDictionaryCache.set(cacheKey, fallback);
			return fallback;
		}
	}

	/**
	 * Convert workspaceTree JSON into a concise AST-like indented text for the LLM prompt.
	 */
	private formatWorkspaceTree(tree: WorkspaceContext['workspaceTree']): string {
		if (!tree || tree.length === 0) {
			return '';
		}

		const MAX_LINES = 40;
		const MAX_DEPTH = 4;
		const lines: string[] = [];
		let totalNodes = 0;

		const opMap: Record<string, string> = {
			ADD: '+',
			MINUS: '-',
			MULTIPLY: '×',
			DIVIDE: '÷',
			POWER: '^',
		};

		const resolveValue = (node: any): string => {
			if (!node || !node.type) {
				return '?';
			}
			switch (node.type) {
				case 'math_number':
					return node.fields?.NUM ?? '0';
				case 'variables_get':
					return node.fields?.VAR ?? '?';
				case 'text':
					return `"${node.fields?.TEXT ?? ''}"`;
				case 'logic_boolean':
					return node.fields?.BOOL ?? 'TRUE';
				case 'math_arithmetic': {
					const op = opMap[node.fields?.OP] ?? node.fields?.OP ?? '?';
					const a = node.inputs?.A ? resolveValue(node.inputs.A) : '?';
					const b = node.inputs?.B ? resolveValue(node.inputs.B) : '?';
					return `${a} ${op} ${b}`;
				}
				default:
					return node.type;
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
				if (lines.length >= MAX_LINES) {
					return false;
				}
				totalNodes++;

				if (depth >= MAX_DEPTH) {
					lines.push(`${'  '.repeat(depth)}...`);
					continue;
				}

				const indent = '  '.repeat(depth);
				lines.push(`${indent}${node.type}${buildParams(node)}`);

				if (node.children && node.children.length > 0) {
					if (!walk(node.children, depth + 1)) {
						return false;
					}
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
			if (!requiredInputs) {
				continue;
			}

			if (!suggestion.inputs) {
				suggestion.inputs = {};
			}

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
	 * Auto-fill missing statement inputs with a placeholder text_print block.
	 * Prevents empty statement slots (DO, ELSE, DO0, etc.) in container blocks like
	 * controls_for and controls_if after the AI generates a deeply-nested suggestion.
	 * Recursively processes nested inputs and next-chain blocks.
	 */
	private ensureStatementInputs(suggestions: BlockSuggestion[]): void {
		for (const suggestion of suggestions) {
			const statementSlots = this._blockStatementInputsMap.get(suggestion.blockType) ?? [];

			if (statementSlots.length > 0) {
				if (!suggestion.inputs) {
					suggestion.inputs = {};
				}
				for (const slotName of statementSlots) {
					if (suggestion.inputs[slotName] !== undefined) {
						// Already filled — recurse into it
						this.ensureStatementInputs([suggestion.inputs[slotName]]);
					} else {
						// Insert placeholder — gives user a visible slot to replace
						suggestion.inputs[slotName] = {
							blockType: 'text_print',
							inputs: { TEXT: { blockType: 'text', fields: { TEXT: '' } } },
						};
					}
				}
			}

			// Recurse into value inputs (non-statement child blocks)
			if (suggestion.inputs) {
				const stmtSlotSet = new Set(statementSlots);
				for (const [slotName, child] of Object.entries(suggestion.inputs)) {
					if (!stmtSlotSet.has(slotName) && child?.blockType) {
						this.ensureStatementInputs([child]);
					}
				}
			}

			// Recurse into next chain
			if (suggestion.next?.blockType) {
				this.ensureStatementInputs([suggestion.next]);
			}
		}
	}

	/**
	 * Find the first suggestion not duplicating an existing non-reusable block type.
	 * Since the AI now outputs exactly one deeply-nested block chain, category quota
	 * filtering is no longer applicable — we just need the deduplication guard.
	 */
	private filterForDiversity(suggestions: BlockSuggestion[], existingBlockTypes: string[], _focusBlockType?: string): BlockSuggestion[] {
		const existingSet = new Set(existingBlockTypes);
		const utilityBlocks = new Set([
			'text',
			'math_number',
			'math_arithmetic',
			'logic_boolean',
			'text_print',
			'cyberbrick_delay_ms',
			'cyberbrick_delay_s',
			'delay_ms',
			'arduino_delay',
		]);
		// Control/flow blocks are inherently reusable — don't filter by existence
		const reusableBlocks = new Set([
			'controls_repeat_ext',
			'controls_repeat',
			'controls_whileUntil',
			'controls_for',
			'controls_forEach',
			'controls_if',
			'controls_ifelse',
			'controls_flow_statements',
			'controls_duration',
		]);

		for (const suggestion of suggestions) {
			const hasStatementChildren =
				suggestion.inputs && Object.values(suggestion.inputs).some((v: any) => v && typeof v === 'object' && v.blockType);
			if (
				existingSet.has(suggestion.blockType) &&
				!utilityBlocks.has(suggestion.blockType) &&
				!reusableBlocks.has(suggestion.blockType) &&
				!hasStatementChildren
			) {
				continue;
			}
			return [suggestion];
		}

		// Fallback: if everything filtered out, return first suggestion unchanged
		return suggestions.length > 0 ? [suggestions[0]] : [];
	}

	/**
	 * Default field values for common blocks when the AI returns empty or missing field values.
	 */
	private static readonly FIELD_DEFAULTS: Record<string, Record<string, string>> = {
		math_number: { NUM: '0' },
		math_arithmetic: { OP: 'ADD' },
		logic_boolean: { BOOL: 'TRUE' },
		logic_compare: { OP: 'EQ' },
		logic_operation: { OP: 'AND' },
		math_single: { OP: 'ROOT' },
	};

	/**
	 * Repair the common gpt-4o-mini mistake of nesting `inputs` (or block specs) inside `fields`.
	 *
	 * Bad output:  {"fields": {"OP": "ADD", "inputs": {"A": {...}, "B": {...}}}}
	 * Fixed:       {"fields": {"OP": "ADD"}, "inputs": {"A": {...}, "B": {...}}}
	 *
	 * Also moves any other non-string field value (object with blockType) to inputs.
	 * Applied before validateSuggestion so the structure is correct before validation.
	 */
	private repairMisplacedInputs(suggestions: any[]): void {
		for (const suggestion of suggestions) {
			if (!suggestion || typeof suggestion !== 'object') {
				continue;
			}

			if (suggestion.fields && typeof suggestion.fields === 'object') {
				const fieldsToRemove: string[] = [];
				const inputsToAdd: Record<string, unknown> = {};

				for (const [key, value] of Object.entries(suggestion.fields)) {
					if (typeof value === 'string') {
						continue; // normal field — leave it
					}
					fieldsToRemove.push(key);
					if (key === 'inputs' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
						// The entire `inputs` map was accidentally placed inside fields — merge it out
						Object.assign(inputsToAdd, value);
					} else if (typeof value === 'object' && value !== null && (value as any).blockType) {
						// A block spec was placed in fields under its input slot name — move to inputs
						inputsToAdd[key] = value;
					}
				}

				for (const key of fieldsToRemove) {
					delete suggestion.fields[key];
				}

				if (Object.keys(inputsToAdd).length > 0) {
					if (!suggestion.inputs) {
						suggestion.inputs = {};
					}
					Object.assign(suggestion.inputs, inputsToAdd);
					log(
						`[AI Debug] repairMisplacedInputs: rescued ${Object.keys(inputsToAdd).join(', ')} from fields.inputs on "${suggestion.blockType}"`,
						'info'
					);
				}

				if (Object.keys(suggestion.fields).length === 0) {
					delete suggestion.fields;
				}
			}

			// Recurse into inputs
			if (suggestion.inputs && typeof suggestion.inputs === 'object') {
				this.repairMisplacedInputs(Object.values(suggestion.inputs).filter(v => v && typeof v === 'object'));
			}

			// Recurse into next chain
			if (suggestion.next && typeof suggestion.next === 'object') {
				this.repairMisplacedInputs([suggestion.next]);
			}
		}
	}

	/**
	 * Normalize missing or empty field values to sensible defaults.
	 * Handles the case where gpt-4o-mini outputs {"fields": {}} (empty fields object)
	 * or omits required dropdown fields entirely.
	 * Called after ensureRequiredInputs so inputs are already populated.
	 */
	private normalizeEmptyFields(suggestions: BlockSuggestion[]): void {
		for (const suggestion of suggestions) {
			const defaults = ShadowSuggestionService.FIELD_DEFAULTS[suggestion.blockType];
			if (defaults) {
				if (!suggestion.fields) {
					suggestion.fields = {};
				}
				for (const [field, defaultValue] of Object.entries(defaults)) {
					const current = suggestion.fields[field];
					if (current === undefined || current === '') {
						suggestion.fields[field] = defaultValue;
					}
				}
			}

			// Recurse into inputs
			if (suggestion.inputs) {
				this.normalizeEmptyFields(Object.values(suggestion.inputs).filter((v): v is BlockSuggestion => !!v?.blockType));
			}

			// Recurse into next chain
			if (suggestion.next?.blockType) {
				this.normalizeEmptyFields([suggestion.next]);
			}
		}
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
			log(`[AI Debug] Rejected: unknown blockType "${suggestion.blockType}"`, 'debug');
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
