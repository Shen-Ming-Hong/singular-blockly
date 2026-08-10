// @ts-check
'use strict';

/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Keyboard shortcuts for Shadow Block AI Suggestions. The app-owned commands
 * participate in Blockly's public ShortcutRegistry so inactive suggestions and
 * text/IME editing continue through Blockly's native keyboard navigation.
 */
(function () {
	/** @type {*} VS Code API reference */
	var vsCodeApi = null;
	/** @type {string[]} App-owned Blockly shortcuts registered by this module */
	var registeredShortcutNames = [];
	/** @type {Object|null} AI config from Extension Host */
	var config = null;
	/** @type {Function|null} Explicit canonical workspace provider */
	var workspaceProvider = null;

	/** @returns {boolean} */
	function isSuggestionActive() {
		return (
			window.shadowBlockManager && typeof window.shadowBlockManager.isActive === 'function' && window.shadowBlockManager.isActive()
		);
	}

	/**
	 * Avoid stealing keystrokes while the user is editing text or using an IME.
	 * @param {*} event
	 * @returns {boolean}
	 */
	function shouldIgnoreShortcut(event) {
		if (typeof window.shouldBypassBlocklyGlobalShortcut === 'function') {
			return window.shouldBypassBlocklyGlobalShortcut(event);
		}
		var target = event && event.target instanceof Element ? event.target : null;
		return Boolean(
			event &&
				(event.isComposing ||
					event.key === 'Process' ||
					event.keyCode === 229 ||
					event.which === 229 ||
					(target &&
						(target.matches('input, textarea') ||
							(target instanceof HTMLElement && target.isContentEditable))))
		);
	}

	/** @returns {boolean} */
	function isEditingContextActive() {
		if (
			typeof window.isBlocklyTextInputCompositionActive === 'function' &&
			window.isBlocklyTextInputCompositionActive()
		) {
			return true;
		}
		var target = document.activeElement instanceof Element ? document.activeElement : null;
		return Boolean(
			target &&
				(target.matches('input, textarea') || (target instanceof HTMLElement && target.isContentEditable))
		);
	}

	/**
	 * Only handle shortcuts for the canonical editable workspace.
	 * @param {*} workspace
	 * @param {boolean} requiresSuggestion
	 * @returns {boolean}
	 */
	function canHandleShortcut(workspace, requiresSuggestion) {
		var canonicalWorkspace = workspaceProvider ? workspaceProvider() : null;
		return Boolean(
			canonicalWorkspace &&
				workspace === canonicalWorkspace &&
				!workspace.isReadOnly() &&
				!workspace.isDragging() &&
				!isEditingContextActive() &&
				(!requiresSuggestion || isSuggestionActive())
		);
	}

	/** Request an AI suggestion from the Extension Host. */
	function requestSuggestion() {
		if (!vsCodeApi) return;
		var workspace = typeof Blockly !== 'undefined' && workspaceProvider ? workspaceProvider() : null;
		if (!workspace) return;

		var depth = (config && config.contextDepth) || 'minimal';
		var context = null;
		if (window.contextExtractor && typeof window.contextExtractor.extractContext === 'function') {
			context = window.contextExtractor.extractContext(depth, workspace);
		}
		vsCodeApi.postMessage({ command: 'requestShadowSuggestion', context: context });
	}

	/**
	 * @param {*} registry
	 * @param {*} shortcut
	 */
	function registerShortcut(registry, shortcut) {
		registry.register(shortcut);
		registeredShortcutNames.push(shortcut.name);
	}

	/** Register AI shortcuts through Blockly's public keyboard registry. */
	function registerShortcuts() {
		if (
			typeof Blockly === 'undefined' ||
			!Blockly.ShortcutRegistry ||
			!Blockly.ShortcutRegistry.registry ||
			!Blockly.utils ||
			!Blockly.utils.KeyCodes
		) {
			return;
		}

		var registry = Blockly.ShortcutRegistry.registry;
		var keys = Blockly.utils.KeyCodes;
		var serializedKey = function (keyCode, modifiers) {
			return registry.createSerializedKey(keyCode, modifiers);
		};
		var activePrecondition = function (workspace) {
			return canHandleShortcut(workspace, true);
		};
		var triggerPrecondition = function (workspace) {
			return canHandleShortcut(workspace, false);
		};

		registerShortcut(registry, {
			name: 'singular.shadowSuggestion.trigger',
			preconditionFn: triggerPrecondition,
			callback: function (workspace, event) {
				if (shouldIgnoreShortcut(event)) return false;
				event.preventDefault();
				requestSuggestion();
				return true;
			},
			keyCodes: [serializedKey(keys.SPACE, [keys.CTRL_CMD, keys.SHIFT])],
			allowCollision: true,
		});

		registerShortcut(registry, {
			name: 'singular.shadowSuggestion.accept',
			preconditionFn: activePrecondition,
			callback: function (workspace, event) {
				if (shouldIgnoreShortcut(event)) return false;
				event.preventDefault();
				event.stopPropagation();
				window.shadowBlockManager.acceptSuggestion();
				return true;
			},
			keyCodes: [keys.TAB],
			allowCollision: true,
		});

		registerShortcut(registry, {
			name: 'singular.shadowSuggestion.dismiss',
			preconditionFn: activePrecondition,
			callback: function (workspace, event) {
				if (shouldIgnoreShortcut(event)) return false;
				event.preventDefault();
				window.shadowBlockManager.clearSuggestion(true);
				if (vsCodeApi) vsCodeApi.postMessage({ command: 'cancelShadowSuggestion' });
				return true;
			},
			keyCodes: [keys.ESC],
			allowCollision: true,
		});

		registerShortcut(registry, {
			name: 'singular.shadowSuggestion.next',
			preconditionFn: activePrecondition,
			callback: function (workspace, event) {
				if (shouldIgnoreShortcut(event)) return false;
				event.preventDefault();
				window.shadowBlockManager.nextSuggestion();
				return true;
			},
			keyCodes: [serializedKey(keys.CLOSE_SQUARE_BRACKET, [keys.ALT])],
			allowCollision: true,
		});

		registerShortcut(registry, {
			name: 'singular.shadowSuggestion.previous',
			preconditionFn: activePrecondition,
			callback: function (workspace, event) {
				if (shouldIgnoreShortcut(event)) return false;
				event.preventDefault();
				window.shadowBlockManager.prevSuggestion();
				return true;
			},
			keyCodes: [serializedKey(keys.OPEN_SQUARE_BRACKET, [keys.ALT])],
			allowCollision: true,
		});
	}

	/** @param {Object} newConfig */
	function updateConfig(newConfig) {
		config = newConfig;
	}

	/**
	 * @param {*} api VS Code API object
	 * @param {Function} getWorkspaceProvider Canonical workspace accessor
	 */
	function init(api, getWorkspaceProvider) {
		dispose();
		vsCodeApi = api;
		workspaceProvider = typeof getWorkspaceProvider === 'function' ? getWorkspaceProvider : null;
		registerShortcuts();
	}

	/** Unregister app-owned shortcuts and clean up. */
	function dispose() {
		if (typeof Blockly !== 'undefined' && Blockly.ShortcutRegistry && Blockly.ShortcutRegistry.registry) {
			var registry = Blockly.ShortcutRegistry.registry;
			registeredShortcutNames.forEach(function (name) {
				registry.unregister(name);
			});
		}
		registeredShortcutNames = [];
		vsCodeApi = null;
		workspaceProvider = null;
	}

	window.shadowKeyboardHandler = {
		init: init,
		dispose: dispose,
		updateConfig: updateConfig,
		getConfig: function () {
			return config;
		},
	};
})();
