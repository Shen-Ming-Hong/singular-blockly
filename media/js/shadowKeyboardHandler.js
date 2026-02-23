// @ts-check
'use strict';

/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Keyboard Shortcut Handler for Shadow Block AI Suggestions.
 * Handles Tab (accept), Escape (dismiss), Ctrl+Shift+Space (trigger),
 * and Alt+]/[ (cycle multi-suggestions).
 *
 * Runs in WebView (browser) environment — no require/Node.js APIs.
 */
(function () {
	/** @type {*} VS Code API reference */
	var vsCodeApi = null;
	/** @type {((e: KeyboardEvent) => void)|null} Stored handler for disposal */
	var keydownHandler = null;
	/** @type {Object|null} AI config from Extension Host */
	var config = null;

	/**
	 * Check whether the shadow block manager is active.
	 * @returns {boolean}
	 */
	function isSuggestionActive() {
		return (
			window.shadowBlockManager && typeof window.shadowBlockManager.isActive === 'function' && window.shadowBlockManager.isActive()
		);
	}

	/**
	 * Main keydown handler for shadow suggestion shortcuts.
	 * @param {KeyboardEvent} e
	 */
	function handleKeyDown(e) {
		// --- Ctrl+Shift+Space: manually trigger suggestion ---
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ' ') {
			e.preventDefault();
			requestSuggestion();
			return;
		}

		// --- Tab: accept active suggestion ---
		if (e.key === 'Tab' && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
			if (isSuggestionActive()) {
				e.preventDefault();
				e.stopPropagation();
				window.shadowBlockManager.acceptSuggestion();
				return;
			}
			// Not active — let Tab propagate normally
			return;
		}

		// --- Escape: dismiss active suggestion ---
		if (e.key === 'Escape') {
			if (isSuggestionActive()) {
				e.preventDefault();
				window.shadowBlockManager.clearSuggestion(true);
				// Notify Extension Host to stop the loading spinner and cancel
				// any still-in-flight request.
				if (vsCodeApi) {
					vsCodeApi.postMessage({ command: 'cancelShadowSuggestion' });
				}
				return;
			}
			// Not active — let Escape propagate to other handlers
			return;
		}

		// --- Alt+]: next suggestion ---
		if (e.altKey && e.key === ']') {
			if (isSuggestionActive()) {
				e.preventDefault();
				window.shadowBlockManager.nextSuggestion();
				return;
			}
			return;
		}

		// --- Alt+[: previous suggestion ---
		if (e.altKey && e.key === '[') {
			if (isSuggestionActive()) {
				e.preventDefault();
				window.shadowBlockManager.prevSuggestion();
				return;
			}
			return;
		}
	}

	/**
	 * Request an AI suggestion from the Extension Host.
	 */
	function requestSuggestion() {
		if (!vsCodeApi) {
			return;
		}

		var workspace = null;
		if (typeof Blockly !== 'undefined') {
			workspace = Blockly.getMainWorkspace();
		}
		if (!workspace) {
			return;
		}

		var depth = (config && config.contextDepth) || 'minimal';
		var context = null;

		if (window.contextExtractor && typeof window.contextExtractor.extractContext === 'function') {
			context = window.contextExtractor.extractContext(depth, workspace);
		}

		vsCodeApi.postMessage({
			command: 'requestShadowSuggestion',
			context: context,
		});
	}

	/**
	 * Update AI configuration (called when Extension Host sends updateAIConfig).
	 * @param {Object} newConfig
	 */
	function updateConfig(newConfig) {
		config = newConfig;
	}

	/**
	 * Initialize the keyboard handler.
	 * @param {*} api - The VS Code API object from acquireVsCodeApi()
	 */
	function init(api) {
		vsCodeApi = api;
		if (keydownHandler) {
			dispose();
		}
		keydownHandler = handleKeyDown;
		document.addEventListener('keydown', keydownHandler, { capture: true });
	}

	/**
	 * Remove the keyboard event listener and clean up.
	 */
	function dispose() {
		if (keydownHandler) {
			document.removeEventListener('keydown', keydownHandler, {
				capture: true,
			});
			keydownHandler = null;
		}
	}

	// ===== Public API =====
	window.shadowKeyboardHandler = {
		init: init,
		dispose: dispose,
		updateConfig: updateConfig,
		getConfig: function () {
			return config;
		},
	};
})();
