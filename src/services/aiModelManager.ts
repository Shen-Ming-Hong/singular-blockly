/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as vscode from 'vscode';
import { log } from './logging';

/** Copilot subscription tier */
export type CopilotTier = 'none' | 'free' | 'pro' | 'pro_plus';

/** Per-tier configuration for AI suggestions */
export interface TierConfig {
	enabled: boolean;
	triggerDelay: number;
	maxPerMinute: number;
	contextDepth: 'none' | 'minimal' | 'standard' | 'deep';
	maxSuggestions: number;
	multiSuggestion: boolean;
	autoModel: boolean;
	reasoningEffort: 'low' | 'medium' | 'high';
}

/** Default configurations for each Copilot tier */
export const TIER_DEFAULTS: Record<CopilotTier, TierConfig> = {
	none: {
		enabled: false,
		triggerDelay: 0,
		maxPerMinute: 0,
		contextDepth: 'none',
		maxSuggestions: 0,
		multiSuggestion: false,
		autoModel: false,
		reasoningEffort: 'low',
	},
	free: {
		enabled: false,
		triggerDelay: 3000,
		maxPerMinute: 2,
		contextDepth: 'minimal',
		maxSuggestions: 3,
		multiSuggestion: true,
		autoModel: false,
		reasoningEffort: 'low',
	},
	pro: {
		enabled: false,
		triggerDelay: 1500,
		maxPerMinute: 10,
		contextDepth: 'standard',
		maxSuggestions: 3,
		multiSuggestion: true,
		autoModel: true,
		reasoningEffort: 'low',
	},
	pro_plus: {
		enabled: false,
		triggerDelay: 1000,
		maxPerMinute: 15,
		contextDepth: 'deep',
		maxSuggestions: 5,
		multiSuggestion: true,
		autoModel: true,
		reasoningEffort: 'low',
	},
};

/** Model info returned by listAvailableModels */
export interface ModelInfo {
	family: string;
	name: string;
	id: string;
}

// Model family sets for tier detection
const PRO_PLUS_FAMILIES = new Set(['claude-opus-4.6', 'o3', 'o4-mini']);
const PRO_FAMILIES = new Set(['gpt-4.1', 'claude-3.7-sonnet', 'gemini-2.5-pro']);

// Exclude heavy reasoning/async models that are too slow or expensive for inline suggestions
const EXCLUDED_MODEL_PATTERNS = ['o1', 'o3', 'o4', 'opus', 'codex'];

const REDETECT_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const DEFAULT_MODEL_FAMILY = 'gpt-5-mini';

// 0x included models that don't consume premium requests on paid plans
// Ordered by quality: best first
const BASE_MODEL_FAMILIES = ['gpt-5-mini', 'gpt-4.1', 'gpt-4o'];
const RETRY_BACKOFF_MS = 2000;
const MAX_RETRIES = 3;
const MODEL_DISCOVERY_TIMEOUT_MS = 10_000;

/**
 * AI 模型管理器
 * 管理 Copilot LLM 的偵測、選取與呼叫
 */
export class AIModelManager implements vscode.Disposable {
	private _tier: CopilotTier = 'none';
	private _cachedModel: vscode.LanguageModelChat | undefined;
	private _redetectTimer: ReturnType<typeof setInterval> | undefined;
	private _initialization: Promise<void> | undefined;
	private _ready = false;
	private _disposed = false;
	private _generation = 0;
	private readonly _pendingQueries = new Set<() => void>();
	private readonly _onDidChangeReadiness = new vscode.EventEmitter<boolean>();
	readonly onDidChangeReadiness = this._onDidChangeReadiness.event;

	private readonly _onTierChanged = new vscode.EventEmitter<CopilotTier>();
	/** Fires when the detected Copilot tier changes */
	readonly onTierChanged: vscode.Event<CopilotTier> = this._onTierChanged.event;

	private readonly _onQuotaExhausted = new vscode.EventEmitter<void>();
	/** Fires when the model quota is exhausted */
	readonly onQuotaExhausted: vscode.Event<void> = this._onQuotaExhausted.event;

	/**
	 * Initialize the manager: detect tier, restore saved model preference,
	 * and start periodic re-detection.
	 */
	initialize(): Promise<void> {
		if (this._disposed) { return Promise.resolve(); }
		if (!this.isConfiguredEnabled()) {
			this.stop();
			return Promise.resolve();
		}
		if (this._initialization) { return this._initialization; }
		if (this.isReady()) { return Promise.resolve(); }

		this._cachedModel = undefined;
		const generation = this._generation;
		const initialization = this.initializeModels(generation).finally(() => {
			if (this._initialization === initialization) { this._initialization = undefined; }
		});
		this._initialization = initialization;
		return initialization;
	}

	private async initializeModels(generation: number): Promise<void> {
		await this.detectCopilotTier();
		if (!this.isCurrent(generation) || !this.isConfiguredEnabled()) { return; }
		if (this._tier !== 'none') {
			const savedFamily = vscode.workspace.getConfiguration('singularBlockly.ai').get<string>('model');
			await this.selectModel(savedFamily || undefined);
		}
		if (!this.isCurrent(generation) || !this.isConfiguredEnabled()) { return; }
		this.setReady(this._tier !== 'none' && !!this._cachedModel);
		if (!this.isCurrent(generation)) { return; }

		if (!this._redetectTimer) {
			this._redetectTimer = setInterval(() => {
				// Refresh through the same single-flight path, including model selection.
				this.setReady(false);
				void this.initialize().catch(err => log(`Periodic model re-detection failed: ${err}`, 'warn'));
			}, REDETECT_INTERVAL_MS);
		}
	}

	/** Suggestions are available only after discovery and selection have completed. */
	isReady(): boolean {
		return !this._disposed && this._ready && !!this._cachedModel && this._tier !== 'none' && this.isConfiguredEnabled();
	}

	/** Stop background discovery and reset state; initialize may be called after re-enabling. */
	stop(): void {
		this._generation++;
		for (const cancel of this._pendingQueries) { cancel(); }
		this._initialization = undefined;
		if (this._redetectTimer) {
			clearInterval(this._redetectTimer);
			this._redetectTimer = undefined;
		}
		this._cachedModel = undefined;
		this.setReady(false);
		if (this._tier !== 'none') {
			this._tier = 'none';
			this._onTierChanged.fire(this._tier);
		}
	}

	private isConfiguredEnabled(): boolean {
		return vscode.workspace.getConfiguration('singularBlockly.ai').get<boolean>('enabled', false);
	}

	private isCurrent(generation: number): boolean {
		return !this._disposed && generation === this._generation;
	}

	private setReady(ready: boolean): void {
		if (this._ready !== ready) {
			this._ready = ready;
			this._onDidChangeReadiness.fire(ready);
		}
	}

	/** The LM discovery API has no cancellation token; ignore results after stop or timeout. */
	private queryModels(selector: vscode.LanguageModelChatSelector): Promise<readonly vscode.LanguageModelChat[]> {
		if (this._disposed) { return Promise.resolve([]); }
		return new Promise((resolve, reject) => {
			let settled = false;
			const finish = (models: readonly vscode.LanguageModelChat[], error?: unknown) => {
				if (settled) { return; }
				settled = true;
				clearTimeout(timeout);
				this._pendingQueries.delete(cancel);
				if (error) { reject(error); } else { resolve(models); }
			};
			const cancel = () => finish([]);
			const timeout = setTimeout(() => finish([], new Error('AI model discovery timed out')), MODEL_DISCOVERY_TIMEOUT_MS);
			this._pendingQueries.add(cancel);
			Promise.resolve()
				.then(() => settled ? [] : vscode.lm.selectChatModels(selector))
				.then(models => finish(models || []), err => finish([], err));
		});
	}

	/**
	 * Detect the Copilot subscription tier based on available model families
	 */
	async detectCopilotTier(): Promise<CopilotTier> {
		const generation = this._generation;
		if (!this.isCurrent(generation)) { return 'none'; }
		const previousTier = this._tier;

		if (typeof vscode.lm === 'undefined' || typeof vscode.lm.selectChatModels !== 'function') {
			this._tier = 'none';
			if (previousTier !== this._tier) {
				log('vscode.lm API not available, tier set to none', 'info');
				this._onTierChanged.fire(this._tier);
			}
			return this._tier;
		}

		try {
			const models = await this.queryModels({ vendor: 'copilot' });
			if (!this.isCurrent(generation)) { return 'none'; }
			if (!models || models.length === 0) {
				this._tier = 'none';
			} else {
				const families = new Set(models.map(m => m.family));
				if ([...families].some(f => PRO_PLUS_FAMILIES.has(f))) {
					this._tier = 'pro_plus';
				} else if ([...families].some(f => PRO_FAMILIES.has(f))) {
					this._tier = 'pro';
				} else {
					this._tier = 'free';
				}
			}
		} catch (err) {
			if (!this.isCurrent(generation)) { return 'none'; }
			log(`Failed to detect Copilot tier: ${err}`, 'warn');
			this._tier = 'none';
		}
		if (this._tier === 'none') {
			this._cachedModel = undefined;
			this.setReady(false);
		}

		if (previousTier !== this._tier) {
			log(`Copilot tier changed: ${previousTier} → ${this._tier}`, 'info');
			this._onTierChanged.fire(this._tier);
		}

		return this._tier;
	}

	/** Return the current detected tier */
	getTier(): CopilotTier {
		return this._tier;
	}

	/** Return the currently cached model instance */
	getCachedModel(): vscode.LanguageModelChat | undefined {
		return this._cachedModel;
	}

	/**
	 * List available Copilot models suitable for block suggestions.
	 * Filters out heavy reasoning models (o3, opus, etc.) that are too slow for inline suggestions.
	 */
	async listAvailableModels(): Promise<ModelInfo[]> {
		if (typeof vscode.lm === 'undefined' || typeof vscode.lm.selectChatModels !== 'function') {
			return [];
		}

		try {
			const models = await this.queryModels({ vendor: 'copilot' });
			return (models || [])
				.filter(m => {
					const familyLower = m.family.toLowerCase();
					return !EXCLUDED_MODEL_PATTERNS.some(p => familyLower.includes(p));
				})
				.map(m => ({ family: m.family, name: m.name, id: m.id }));
		} catch (err) {
			log(`Failed to list available models: ${err}`, 'warn');
			return [];
		}
	}

	/**
	 * Select and cache a model instance
	 * @param family Model family to select, defaults to gpt-4o
	 */
	async selectModel(family?: string): Promise<vscode.LanguageModelChat | undefined> {
		const generation = this._generation;
		if (!this.isCurrent(generation)) { return undefined; }
		if (typeof vscode.lm === 'undefined' || typeof vscode.lm.selectChatModels !== 'function') {
			log('vscode.lm API not available, cannot select model', 'warn');
			return undefined;
		}

		const targetFamily = family || DEFAULT_MODEL_FAMILY;

		try {
			const models = await this.queryModels({ vendor: 'copilot', family: targetFamily });
			if (!this.isCurrent(generation)) { return undefined; }
			if (models && models.length > 0) {
				this._cachedModel = models[0];
				log(`Selected model: ${this._cachedModel.name} (${this._cachedModel.family})`, 'info');
				log(`Model limits: maxInput=${this._cachedModel.maxInputTokens}`, 'debug');
				return this._cachedModel;
			}

			log(`No model found for family "${targetFamily}", falling back to any available`, 'warn');
			const fallback = await this.queryModels({ vendor: 'copilot' });
			if (!this.isCurrent(generation)) { return undefined; }
			if (fallback && fallback.length > 0) {
				this._cachedModel = fallback[0];
				log(`Fallback model selected: ${this._cachedModel.name} (${this._cachedModel.family})`, 'info');
				log(`Model limits: maxInput=${this._cachedModel.maxInputTokens}`, 'debug');
				return this._cachedModel;
			}

			log('No Copilot models available', 'warn');
			return undefined;
		} catch (err) {
			if (!this.isCurrent(generation)) { return undefined; }
			log(`Failed to select model: ${err}`, 'error');
			return undefined;
		}
	}

	/**
	 * Send a prompt to the cached model with retry and error handling
	 * @param messages Chat messages to send
	 * @param token Cancellation token
	 * @returns The model response, or null on failure
	 */
	async sendPrompt(
		messages: vscode.LanguageModelChatMessage[],
		token: vscode.CancellationToken
	): Promise<vscode.LanguageModelChatResponse | null> {
		const generation = this._generation;
		if (!this.isCurrent(generation) || token.isCancellationRequested) { return null; }
		if (!this._cachedModel) {
			// Re-read saved preference so we never silently fall through to gpt-5-mini
			const savedFamily = vscode.workspace.getConfiguration('singularBlockly.ai').get<string>('model');
			const model = await this.selectModel(savedFamily || undefined);
			if (!this.isCurrent(generation) || token.isCancellationRequested) { return null; }
			if (!model) {
				log('No model available for sendPrompt', 'warn');
				return null;
			}
		}

		const config = this.getEffectiveConfig();

		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			if (!this.isCurrent(generation) || token.isCancellationRequested || !this._cachedModel) { return null; }
			try {
				const modelOpts = this.buildModelOptions(this._cachedModel!, config.reasoningEffort);
				const response = await this._cachedModel!.sendRequest(messages, { modelOptions: modelOpts }, token);
				if (!this.isCurrent(generation) || token.isCancellationRequested) { return null; }
				return response;
			} catch (err) {
				if (!this.isCurrent(generation) || token.isCancellationRequested) { return null; }
				if (err instanceof vscode.LanguageModelError) {
					if (err.code === 'rate_limit') {
						if (attempt < MAX_RETRIES) {
							const delay = RETRY_BACKOFF_MS * Math.pow(2, attempt);
							log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`, 'warn');
							await this.sleep(delay);
							continue;
						}
						log('Rate limit exceeded after max retries', 'warn');
						return null;
					}

					if (err.code === 'quota_exceeded') {
						const currentFamily = this._cachedModel?.family;
						for (const family of BASE_MODEL_FAMILIES) {
							if (family === currentFamily) {
								continue;
							}
							log(`Premium quota exhausted, trying base model: ${family}`, 'info');
							const fallbackModel = await this.selectModel(family);
							if (!this.isCurrent(generation) || token.isCancellationRequested) { return null; }
							if (fallbackModel) {
								try {
									const fallbackOpts = this.buildModelOptions(fallbackModel, config.reasoningEffort);
									const retryResponse = await fallbackModel.sendRequest(messages, { modelOptions: fallbackOpts }, token);
									if (!this.isCurrent(generation) || token.isCancellationRequested) { return null; }
									return retryResponse;
								} catch (retryErr) {
									if (!this.isCurrent(generation) || token.isCancellationRequested) { return null; }
									log(`Base model ${family} also failed: ${retryErr}`, 'warn');
								}
							}
						}
						log('All base model fallbacks exhausted', 'warn');
						this._onQuotaExhausted.fire();
						return null;
					}
				}

				log(`Model request failed: ${err}`, 'error');
				return null;
			}
		}

		return null;
	}

	/**
	 * Get effective config by merging tier defaults with user settings
	 */
	getEffectiveConfig(): TierConfig {
		const defaults = { ...TIER_DEFAULTS[this._tier] };
		const userConfig = vscode.workspace.getConfiguration('singularBlockly.ai');

		// Only read settings that exist in package.json; the rest come from tier defaults
		return {
			enabled: this.isReady() && userConfig.get<boolean>('enabled', defaults.enabled),
			triggerDelay: userConfig.get<number>('triggerDelay', defaults.triggerDelay),
			maxPerMinute: userConfig.get<number>('maxSuggestionsPerMinute', defaults.maxPerMinute),
			contextDepth: defaults.contextDepth,
			maxSuggestions: defaults.maxSuggestions,
			multiSuggestion: defaults.multiSuggestion,
			autoModel: defaults.autoModel,
			reasoningEffort: userConfig.get<'low' | 'medium' | 'high'>('reasoningEffort', defaults.reasoningEffort),
		};
	}

	/**
	 * List raw LanguageModelChat objects for models suitable for block suggestions.
	 * Used by QuickPick UI to access full model metadata (e.g., multiplier).
	 */
	async listRawModels(): Promise<vscode.LanguageModelChat[]> {
		if (typeof vscode.lm === 'undefined' || typeof vscode.lm.selectChatModels !== 'function') {
			return [];
		}

		try {
			const models = await this.queryModels({ vendor: 'copilot' });
			return (models || []).filter(m => {
				const familyLower = m.family.toLowerCase();
				return !EXCLUDED_MODEL_PATTERNS.some(p => familyLower.includes(p));
			});
		} catch (err) {
			log(`Failed to list raw models: ${err}`, 'warn');
			return [];
		}
	}

	/** Clean up resources */
	dispose(): void {
		if (this._disposed) { return; }
		this._disposed = true;
		this.stop();
		this._onDidChangeReadiness.dispose();
		this._onTierChanged.dispose();
		this._onQuotaExhausted.dispose();
		this._cachedModel = undefined;
	}

	/**
	 * Build model-specific request options.
	 *
	 * **Token limit** (3-layer fallback, same as `getModelMaxOutputTokens`):
	 *   Layer 1 → `(model as any).maxOutputTokens` (non-standard; Copilot extension may expose it, not guaranteed)
	 *   Layer 2 → `KNOWN_MAX_OUTPUT_TOKENS` table
	 *   Layer 3 → 16384
	 *
	 * **Why three token keys** (`max_output_tokens`, `max_completion_tokens`, `max_tokens`):
	 *   Different backend providers use different key names; all three are sent so the correct one
	 *   is picked up regardless of which provider is routing the request.
	 *
	 * **Reasoning effort mapping** (model family → key name):
	 *   - `gpt*` / `o1` / `o3` / `o4` → `reasoning_effort: <effort>`  (OpenAI)
	 *   - `claude*`                    → `effort: <effort>`             (Anthropic; budget_tokens deprecated as of Opus 4.6)
	 *   - Gemini / others              → omitted (no known equivalent via vscode.lm)
	 *
	 * Note: `modelOptions` is a pass-through bag; unsupported keys are silently ignored by the provider.
	 * The Copilot backend may also override these values entirely (known issue: vscode-copilot-release#1352).
	 */
	private buildModelOptions(
		model: vscode.LanguageModelChat,
		reasoningEffort: 'low' | 'medium' | 'high' = 'low'
	): Record<string, unknown> {
		const maxTokens = getModelMaxOutputTokens(model);
		const opts: Record<string, unknown> = {
			max_output_tokens: maxTokens,
			max_completion_tokens: maxTokens,
			max_tokens: maxTokens,
		};

		const family = model.family.toLowerCase();
		if (family.includes('gpt') || family.includes('o1') || family.includes('o3') || family.includes('o4')) {
			// OpenAI reasoning models use reasoning_effort
			opts.reasoning_effort = reasoningEffort;
		} else if (family.includes('claude')) {
			// Anthropic models use effort (budget_tokens is deprecated as of Opus 4.6)
			opts.effort = reasoningEffort;
		}
		// Gemini and others: no known equivalent via vscode.lm; omit to avoid confusion

		return opts;
	}

	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// ─── Known model metadata tables ───────────────────────────────────────────
// These are maintained manually since the vscode.lm API does not expose all
// model metadata to extension consumers (only LanguageModelChatInformation,
// which is the provider side, has full metadata).

/**
 * Known max output tokens for common Copilot models.
 * `maxOutputTokens` is NOT exposed on the `LanguageModelChat` consumer interface
 * (only on `LanguageModelChatInformation` which is the provider side). We use
 * `(model as any).maxOutputTokens` as a best-effort Layer 1 read, then fall back
 * to this table as Layer 2 in `getModelMaxOutputTokens`.
 * Updated: 2026-02-18
 */
const KNOWN_MAX_OUTPUT_TOKENS: Record<string, number> = {
	'gpt-5-mini': 16384,
	'gpt-5': 32768,
	'gpt-4.1': 32768,
	'gpt-4o': 16384,
	'gpt-4o-mini': 16384,
	'claude-haiku-4.5': 8192,
	'claude-sonnet-4': 16000,
	'claude-sonnet-4.5': 16000,
	'claude-opus-4.5': 32000,
	'claude-opus-4.6': 32000,
	'gemini-2.0-flash': 8192,
	'gemini-2.5-pro': 65536,
};

/**
 * Get the max output tokens for a model.
 *
 * 3-layer fallback strategy:
 * - Layer 1: `(model as any).maxOutputTokens` — non-standard property; the Copilot
 *   extension may expose it, but it is not part of the official `LanguageModelChat`
 *   consumer interface and is therefore not guaranteed to be present.
 * - Layer 2: `KNOWN_MAX_OUTPUT_TOKENS` table — manually maintained fallback for
 *   well-known model families (fuzzy-matched on family name).
 * - Layer 3: 16384 — conservative default when the model is unknown.
 */
export function getModelMaxOutputTokens(model: vscode.LanguageModelChat): number {
	// Layer 1: Try API (non-standard property that Copilot extension may expose)
	const apiMax = (model as any).maxOutputTokens;
	if (typeof apiMax === 'number' && apiMax > 0) {
		return apiMax;
	}

	// Layer 2: Known values - match by family name with fuzzy matching
	const family = model.family.toLowerCase();
	for (const [key, max] of Object.entries(KNOWN_MAX_OUTPUT_TOKENS)) {
		if (family.includes(key) || key.includes(family)) {
			return max;
		}
	}

	// Layer 3: Default fallback
	return 16384;
}
