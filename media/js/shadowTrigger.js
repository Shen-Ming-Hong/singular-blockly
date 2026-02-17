// @ts-check
'use strict';

/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Auto-Trigger Logic for Shadow Block AI Suggestions.
 * Handles debouncing, throttling, and context deduplication
 * for automatic AI suggestion requests based on workspace changes.
 *
 * Runs in WebView (browser) environment — no require/Node.js APIs.
 */
(function () {
	// ===== State =====
	/** @type {Object|null} AI config from Extension Host */
	var config = null;
	/** @type {boolean} Whether auto-trigger is active */
	var enabled = false;
	/** @type {ReturnType<typeof setTimeout>|null} Debounce timer */
	var debounceTimer = null;
	/** @type {number} Requests in current minute window */
	var requestCount = 0;
	/** @type {ReturnType<typeof setInterval>|null} Minute reset timer */
	var minuteTimer = null;
	/** @type {*} VS Code postMessage API */
	var vsCodeApi = null;
	/** @type {boolean} Whether a block is currently being dragged */
	var isDragging = false;
	/** @type {string|null} Hash of last request context */
	var lastRequestContext = null;
	/** @type {HTMLElement|null} Loading indicator element */
	var _loadingElement = null;
	/** @type {ReturnType<typeof setTimeout>|null} Loading auto-hide timer */
	var _loadingTimeout = null;

	/**
	 * Show a loading indicator in the bottom-right corner.
	 */
	function _showLoadingIndicator() {
		if (!_loadingElement) {
			_loadingElement = document.createElement('div');
			_loadingElement.className = 'shadow-suggestion-loading';
			_loadingElement.textContent = 'AI ✨';
			document.body.appendChild(_loadingElement);
		}
		requestAnimationFrame(function () {
			_loadingElement.classList.add('visible');
		});
	}

	/**
	 * Hide the loading indicator.
	 */
	function _hideLoadingIndicator() {
		if (_loadingElement) {
			_loadingElement.classList.remove('visible');
		}
	}

	/**
	 * Create a simple hash string from context key fields for deduplication.
	 * @param {Object} context
	 * @returns {string}
	 */
	function hashContext(context) {
		try {
			var key = {
				blockTree: context.blockTree || null,
				selectedBlock: context.selectedBlock || null,
				language: context.language || null,
			};
			return JSON.stringify(key);
		} catch (_e) {
			return '';
		}
	}

	/**
	 * Check whether an event originates from a shadow suggestion block.
	 * @param {*} event - Blockly event
	 * @param {*} workspace - Blockly workspace
	 * @returns {boolean}
	 */
	function isShadowSuggestionEvent(event, workspace) {
		if (!event.blockId) {
			return false;
		}
		var block = workspace.getBlockById(event.blockId);
		return !!(block && block.isShadowSuggestion_);
	}

	/**
	 * Determine if an event qualifies for triggering a suggestion request.
	 * @param {*} event - Blockly event
	 * @returns {boolean}
	 */
	function isTriggerEvent(event) {
		/* global Blockly */
		if (!Blockly || !Blockly.Events) {
			return false;
		}

		// BLOCK_MOVE with new parent (connection completed)
		if (
			event.type === Blockly.Events.BLOCK_MOVE &&
			event.newParentId !== undefined
		) {
			return true;
		}

		// BLOCK_CREATE (new block added) — always trigger, drag state is irrelevant
		// When dragging from toolbox, BLOCK_CREATE fires while isDragging is still true
		if (event.type === Blockly.Events.BLOCK_CREATE) {
			return true;
		}

		// BLOCK_CHANGE with field change
		if (
			event.type === Blockly.Events.BLOCK_CHANGE &&
			event.element === 'field'
		) {
			return true;
		}

		// BLOCK_DRAG end (block dropped)
		if (
			event.type === Blockly.Events.BLOCK_DRAG &&
			event.isStart === false
		) {
			return true;
		}

		return false;
	}

	/**
	 * Initialize the trigger module.
	 * @param {*} api - The VS Code API object from acquireVsCodeApi()
	 */
	function init(api) {
		vsCodeApi = api;
		requestCount = 0;
		// Reset request count every 60 seconds
		minuteTimer = setInterval(function () {
			requestCount = 0;
		}, 60000);
	}

	/**
	 * Handle a Blockly workspace event. Called from the existing workspace
	 * change listener in blocklyEdit.js.
	 * @param {*} event - Blockly event
	 * @param {*} workspace - Blockly workspace
	 */
	function handleWorkspaceEvent(event, workspace) {
		try {
			// Early exit: module or feature disabled
			if (!enabled || !config || !config.enabled || !config.autoTrigger) {
				if (event && !event.isUiEvent && event.type !== 'viewport_change') {
					console.log('[SB] Skipped: enabled=' + enabled + ' config.enabled=' + (config && config.enabled) + ' autoTrigger=' + (config && config.autoTrigger));
				}
				return;
			}

			// Early exit: UI events (viewport changes, etc.)
			if (event.isUiEvent) {
				return;
			}

			// Early exit: events from shadow suggestion blocks
			if (isShadowSuggestionEvent(event, workspace)) {
				return;
			}

			// Record event for context history (always, regardless of trigger)
			if (
				window.contextExtractor &&
				typeof window.contextExtractor.recordEvent === 'function'
			) {
				window.contextExtractor.recordEvent({
					type: event.type,
					blockId: event.blockId || null,
				});
			}

			// Track drag state
			/* global Blockly */
			if (Blockly && Blockly.Events && event.type === Blockly.Events.BLOCK_DRAG) {
				isDragging = !!event.isStart;
				if (isDragging) {
					return;
				}
			}

			// Only trigger on qualifying events
			if (!isTriggerEvent(event)) {
				return;
			}

			// Skip if drag is active (safety check)
			if (isDragging) {
				return;
			}

			// Debounce: reset timer on every qualifying event
			if (debounceTimer !== null) {
				clearTimeout(debounceTimer);
			}

			var delay =
				config.triggerDelay !== undefined ? config.triggerDelay : 1500;

			debounceTimer = setTimeout(function () {
				debounceTimer = null;

				try {
					// Throttle check
					var maxPerMinute =
						config.maxPerMinute !== undefined ? config.maxPerMinute : 10;
					if (requestCount >= maxPerMinute) {
						return;
					}
					requestCount++;

					// Extract context (skip if contextExtractor unavailable)
					if (
						!window.contextExtractor ||
						typeof window.contextExtractor.extractContext !== 'function'
					) {
						return;
					}
					// Default to 'standard' for richer context; auto-downgrade for large workspaces
					var depth = config.contextDepth || 'standard';

					// Smart fallback: large workspaces use minimal to save tokens
					if (depth === 'standard' && workspace) {
						var allBlocks = workspace.getAllBlocks(false);
						if (allBlocks && allBlocks.length > 50) {
							depth = 'minimal';
						}
					}
					var context = window.contextExtractor.extractContext(
						depth,
						workspace
					);
					if (!context) {
						return;
					}

					// Context deduplication
					var hash = hashContext(context);
					if (hash && hash === lastRequestContext) {
						return;
					}
					lastRequestContext = hash;

					// Clear existing suggestion before requesting new one
					if (
						window.shadowBlockManager &&
						typeof window.shadowBlockManager.clearSuggestion === 'function'
					) {
						window.shadowBlockManager.clearSuggestion(false);
					}

					// Send request to Extension Host
					console.log('[SB] Sending requestShadowSuggestion to Extension Host');
					_showLoadingIndicator();
					// Auto-hide loading after timeout (matches REQUEST_TIMEOUT_MS + buffer)
					if (_loadingTimeout) clearTimeout(_loadingTimeout);
					_loadingTimeout = setTimeout(_hideLoadingIndicator, 30000);
					if (vsCodeApi && typeof vsCodeApi.postMessage === 'function') {
						vsCodeApi.postMessage({
							command: 'requestShadowSuggestion',
							context: context,
						});
					}
				} catch (innerErr) {
					console.warn('[SB] Error in debounced handler:', innerErr);
				}
			}, delay);
		} catch (e) {
			console.warn('[SB] Error in handleWorkspaceEvent:', e);
		}
	}

	/**
	 * Update the AI configuration.
	 * @param {Object} newConfig
	 */
	function updateConfig(newConfig) {
		config = newConfig;
		enabled = !!(newConfig && newConfig.enabled && newConfig.autoTrigger);

		if (!enabled) {
			// Clear debounce timer
			if (debounceTimer !== null) {
				clearTimeout(debounceTimer);
				debounceTimer = null;
			}
			// Clear any active suggestion
			if (
				window.shadowBlockManager &&
				typeof window.shadowBlockManager.clearSuggestion === 'function'
			) {
				window.shadowBlockManager.clearSuggestion(false);
			}
		}

		// Pass config downstream
		if (
			window.shadowBlockManager &&
			typeof window.shadowBlockManager.updateConfig === 'function'
		) {
			window.shadowBlockManager.updateConfig(newConfig);
		}
	}

	/**
	 * Dispose all timers and reset state.
	 */
	function dispose() {
		if (debounceTimer !== null) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		if (minuteTimer !== null) {
			clearInterval(minuteTimer);
			minuteTimer = null;
		}
		if (_loadingTimeout) {
			clearTimeout(_loadingTimeout);
			_loadingTimeout = null;
		}
		_hideLoadingIndicator();
		requestCount = 0;
		isDragging = false;
		lastRequestContext = null;
		enabled = false;
		config = null;
		vsCodeApi = null;
	}

	// ===== Public API =====
	window.shadowTrigger = {
		init: init,
		handleWorkspaceEvent: handleWorkspaceEvent,
		updateConfig: updateConfig,
		dispose: dispose,
		getConfig: function () { return config; },
	};
})();
