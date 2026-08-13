/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

(function () {
	const injectedConfig = window.BLOCKLY_RUNTIME_CONFIG || {};
	const config = Object.freeze({
		mode: injectedConfig.mode === 'preview' ? 'preview' : 'edit',
		renderer: 'thrasos',
		mediaUri: String(window.BLOCKLY_MEDIA_URL || injectedConfig.mediaUri || ''),
		localeUris: Object.freeze({ ...(window.BLOCKLY_CORE_LOCALE_URIS || injectedConfig.localeUris || {}) }),
	});

	let canonicalWorkspace = null;
	let lastWorkspaceContainer = null;
	let lastWorkspaceOptions = null;
	let lifecycleStatus = 'uninitialized';
	let rebuildDepth = 0;
	let localeApplySequence = 0;
	let localeLoadQueue = Promise.resolve();
	let activeCoreMessageKeys = new Set(Object.keys(window.BLOCKLY_INITIAL_CORE_MESSAGES || {}));
	const coreLocaleCache = new Map();
	const coreLocalePromises = new Map();
	let dialogHostApi = null;
	let dialogBoardProvider = null;
	let dialogSequence = 0;
	let dialogListenerInstalled = false;
	const pendingDialogs = new Map();
	if (window.languageManager && window.languageManager.currentLanguage && window.BLOCKLY_INITIAL_CORE_MESSAGES) {
		coreLocaleCache.set(window.languageManager.currentLanguage, { ...window.BLOCKLY_INITIAL_CORE_MESSAGES });
	}

	function ensureBlockly() {
		if (typeof Blockly === 'undefined' || typeof Blockly.inject !== 'function') {
			throw new Error('Blockly runtime is not available');
		}
	}

	function isImeCompositionEvent(event) {
		return Boolean(
			(event &&
				(event.isComposing || event.key === 'Process' || event.keyCode === 229 || event.which === 229)) ||
				(typeof window.isBlocklyTextInputCompositionActive === 'function' &&
					window.isBlocklyTextInputCompositionActive())
		);
	}

	class ImeSafeFieldTextInput extends Blockly.FieldTextInput {
		onHtmlInputKeyDown_(event) {
			if (isImeCompositionEvent(event)) {
				return;
			}
			super.onHtmlInputKeyDown_(event);
		}
	}

	function createImeSafeFieldTextInput(initialValue, validator) {
		ensureBlockly();
		return new ImeSafeFieldTextInput(initialValue, validator);
	}

	function getWorkspace() {
		return canonicalWorkspace;
	}

	function getStatus() {
		return lifecycleStatus;
	}

	function isRebuilding() {
		return rebuildDepth > 0;
	}

	function createWorkspace(container, options) {
		ensureBlockly();
		if (canonicalWorkspace) {
			throw new Error('Dispose the current Blockly workspace before creating another one');
		}

		lifecycleStatus = isRebuilding() ? 'rebuilding' : 'initializing';
		try {
			lastWorkspaceContainer = container;
			lastWorkspaceOptions = { ...(options || {}) };
			canonicalWorkspace = Blockly.inject(container, {
				renderer: config.renderer,
				media: config.mediaUri,
				...options,
				readOnly: config.mode === 'preview' ? true : Boolean(options && options.readOnly),
			});
			lifecycleStatus = isRebuilding() ? 'rebuilding' : 'ready';
			window.dispatchEvent(new CustomEvent('blocklyWorkspaceCreated', { detail: { workspace: canonicalWorkspace } }));
			return canonicalWorkspace;
		} catch (error) {
			canonicalWorkspace = null;
			lifecycleStatus = 'failed';
			throw error;
		}
	}

	function recreateWorkspace() {
		if (!lastWorkspaceContainer || !lastWorkspaceOptions) {
			throw new Error('Blockly workspace configuration is not available for rebuild');
		}
		const container = lastWorkspaceContainer;
		const options = lastWorkspaceOptions;
		disposeWorkspace();
		return createWorkspace(container, options);
	}

	function disposeWorkspace() {
		const workspace = canonicalWorkspace;
		canonicalWorkspace = null;
		if (!workspace) {
			lifecycleStatus = isRebuilding() ? 'rebuilding' : 'disposed';
			return;
		}

		lifecycleStatus = isRebuilding() ? 'rebuilding' : 'disposing';
		workspace.dispose();
		lifecycleStatus = isRebuilding() ? 'rebuilding' : 'disposed';
	}

	function beginRebuild() {
		rebuildDepth++;
		lifecycleStatus = 'rebuilding';
	}

	function endRebuild(succeeded) {
		if (rebuildDepth > 0) {
			rebuildDepth--;
		}
		if (rebuildDepth > 0) {
			return;
		}
		lifecycleStatus = succeeded === false ? 'failed' : canonicalWorkspace ? 'ready' : 'uninitialized';
	}

	async function rebuild(callback) {
		if (typeof callback !== 'function') {
			throw new TypeError('Blockly rebuild callback must be a function');
		}
		beginRebuild();
		try {
			const result = await callback();
			endRebuild(true);
			return result;
		} catch (error) {
			endRebuild(false);
			throw error;
		}
	}

	function saveWorkspaceState(workspace = canonicalWorkspace) {
		if (!workspace) {
			return null;
		}
		return Blockly.serialization.workspaces.save(workspace);
	}

	function decodeXmlAttribute(value) {
		const namedEntities = {
			amp: '&',
			apos: "'",
			gt: '>',
			lt: '<',
			quot: '"',
		};
		return String(value || '').replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|quot);/gi, (match, entity) => {
			const normalized = entity.toLowerCase();
			if (normalized[0] !== '#') {
				return namedEntities[normalized] || match;
			}
			const isHex = normalized.startsWith('#x');
			const codePoint = Number.parseInt(normalized.slice(isHex ? 2 : 1), isHex ? 16 : 10);
			return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
				? String.fromCodePoint(codePoint)
				: match;
		});
	}

	function parseXmlTagAttributes(fragment) {
		const attributes = Object.create(null);
		const attributePattern = /([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
		let match;
		while ((match = attributePattern.exec(fragment))) {
			attributes[match[1]] = decodeXmlAttribute(match[2] === undefined ? match[3] : match[2]);
		}
		return attributes;
	}

	function parseLegacyFunctionExtraState(blockType, extraState) {
		if (typeof extraState !== 'string' || extraState.length === 0 || extraState.length > 100000) {
			return null;
		}
		const mutationMatch = /^\s*<mutation\b([^>]*)>/i.exec(extraState);
		if (!mutationMatch) {
			return null;
		}
		const mutationAttributes = parseXmlTagAttributes(mutationMatch[1]);
		const arguments_ = [];
		const argumentTypes = [];
		const argumentPattern = /<arg\b([^>]*)\/?\s*>/gi;
		let argumentMatch;
		while ((argumentMatch = argumentPattern.exec(extraState))) {
			const attributes = parseXmlTagAttributes(argumentMatch[1]);
			arguments_.push(attributes.name || '');
			argumentTypes.push(attributes.type || 'int');
		}

		if (blockType === 'arduino_function_call') {
			if (!mutationAttributes.name) {
				return null;
			}
			return {
				version: 1,
				name: mutationAttributes.name,
				arguments: arguments_,
				argumentTypes,
			};
		}
		if (blockType === 'arduino_function') {
			return {
				version: 1,
				arguments: arguments_,
				argumentTypes,
				...(['1', 'true'].includes(String(mutationAttributes.locked).toLowerCase()) ? { locked: true } : {}),
			};
		}
		return null;
	}

	function visitSerializedBlock(blockState, visitor) {
		if (!blockState || typeof blockState !== 'object') {
			return;
		}
		visitor(blockState);
		for (const input of Object.values(blockState.inputs || {})) {
			visitSerializedBlock(input && input.block, visitor);
			visitSerializedBlock(input && input.shadow, visitor);
		}
		visitSerializedBlock(blockState.next && blockState.next.block, visitor);
	}

	function normalizeWorkspaceState(state) {
		if (!state || typeof state !== 'object') {
			return state;
		}
		for (const topBlock of (state.blocks && state.blocks.blocks) || []) {
			visitSerializedBlock(topBlock, blockState => {
				if (
					(blockState.type === 'arduino_function' || blockState.type === 'arduino_function_call') &&
					typeof blockState.extraState === 'string'
				) {
					const normalized = parseLegacyFunctionExtraState(blockState.type, blockState.extraState);
					if (normalized) {
						blockState.extraState = normalized;
					}
				}
			});
		}
		return state;
	}

	function loadWorkspaceState(state, workspace = canonicalWorkspace) {
		if (!workspace || !state) {
			return false;
		}
		Blockly.serialization.workspaces.load(normalizeWorkspaceState(state), workspace);
		return true;
	}

	function findNewOrphanStatementBlock(candidateWorkspace, baselineWorkspace, allowedRootTypes) {
		const allowedRoots = allowedRootTypes instanceof Set ? allowedRootTypes : new Set(allowedRootTypes || []);
		const getSignature = block => {
			if (!block || !block.previousConnection || block.outputConnection || allowedRoots.has(block.type)) {
				return null;
			}
			return JSON.stringify([String(block.id || ''), String(block.type || '')]);
		};
		const baselineSignatures = new Set(
			(baselineWorkspace?.getTopBlocks?.(false) || []).map(getSignature).filter(Boolean)
		);
		return (
			(candidateWorkspace?.getTopBlocks?.(false) || []).find(block => {
				const signature = getSignature(block);
				return signature && !baselineSignatures.has(signature);
			}) || null
		);
	}

	function serializedConnectionsPreserved(candidateState, normalizedState) {
		const candidateRoots = candidateState?.blocks?.blocks || [];
		const normalizedRoots = normalizedState?.blocks?.blocks || [];
		const compareBlock = (candidateBlock, normalizedBlock) => {
			if (!candidateBlock || !normalizedBlock || candidateBlock.type !== normalizedBlock.type) {
				return false;
			}
			if (typeof candidateBlock.id === 'string' && candidateBlock.id !== normalizedBlock.id) {
				return false;
			}
			for (const [inputName, candidateInput] of Object.entries(candidateBlock.inputs || {})) {
				const normalizedInput = normalizedBlock.inputs?.[inputName];
				if (!normalizedInput) {return false;}
				for (const slot of ['block', 'shadow']) {
					const candidateChild = candidateInput?.[slot];
					if (candidateChild && !compareBlock(candidateChild, normalizedInput[slot])) {return false;}
				}
			}
			const candidateNext = candidateBlock.next?.block;
			if (candidateNext && !compareBlock(candidateNext, normalizedBlock.next?.block)) {return false;}
			return true;
		};

		return candidateRoots.every((candidateRoot, index) => {
			const normalizedRoot = typeof candidateRoot.id === 'string'
				? normalizedRoots.find(root => root.id === candidateRoot.id)
				: normalizedRoots[index];
			return compareBlock(candidateRoot, normalizedRoot);
		});
	}

	function restoreBlocklyMessages(snapshot) {
		for (const key of Object.keys(Blockly.Msg)) {
			delete Blockly.Msg[key];
		}
		Object.assign(Blockly.Msg, snapshot);
	}

	function loadCoreLocaleScript(locale, uri) {
		return new Promise((resolve, reject) => {
			const previousMessages = { ...Blockly.Msg };
			for (const key of activeCoreMessageKeys) {
				delete Blockly.Msg[key];
			}

			const script = document.createElement('script');
			script.async = true;
			script.src = uri;
			script.dataset.blocklyCoreLocale = locale;
			const finish = error => {
				const loadedMessages = Object.fromEntries(
					Object.keys(window.BLOCKLY_INITIAL_CORE_MESSAGES || {}).flatMap(key =>
						typeof Blockly.Msg[key] === 'string' ? [[key, Blockly.Msg[key]]] : []
					)
				);
				restoreBlocklyMessages(previousMessages);
				script.remove();
				if (error) {
					reject(error);
				} else if (Object.keys(loadedMessages).length === 0) {
					reject(new Error(`Blockly core locale ${locale} did not provide messages`));
				} else {
					resolve(loadedMessages);
				}
			};
			script.addEventListener('load', () => finish(null), { once: true });
			script.addEventListener('error', () => finish(new Error(`Failed to load Blockly core locale ${locale}`)), {
				once: true,
			});
			document.head.appendChild(script);
		});
	}

	function loadCoreLocale(locale) {
		if (coreLocaleCache.has(locale)) {
			return Promise.resolve(coreLocaleCache.get(locale));
		}
		if (coreLocalePromises.has(locale)) {
			return coreLocalePromises.get(locale);
		}
		const uri = config.localeUris[locale];
		if (typeof uri !== 'string' || !uri) {
			return Promise.reject(new Error(`Unsupported Blockly core locale: ${locale}`));
		}

		const loadPromise = localeLoadQueue.then(() => loadCoreLocaleScript(locale, uri));
		localeLoadQueue = loadPromise.catch(() => undefined);
		coreLocalePromises.set(locale, loadPromise);
		loadPromise.then(
			messages => coreLocaleCache.set(locale, messages),
			() => coreLocalePromises.delete(locale)
		);
		return loadPromise;
	}

	async function applyLocale(locale, projectMessages) {
		ensureBlockly();
		const sequence = ++localeApplySequence;
		const coreMessages = await loadCoreLocale(locale);
		if (sequence !== localeApplySequence) {
			return false;
		}

		for (const key of activeCoreMessageKeys) {
			delete Blockly.Msg[key];
		}
		activeCoreMessageKeys = new Set(Object.keys(coreMessages));
		Blockly.setLocale(coreMessages);
		if (projectMessages && typeof projectMessages === 'object') {
			const safeProjectMessages = Object.fromEntries(
				Object.entries(projectMessages).filter(([key, value]) => key !== '__proto__' && typeof value === 'string')
			);
			Blockly.setLocale(safeProjectMessages);
		}
		return true;
	}

	function createDialogRequestId() {
		if (window.crypto && typeof window.crypto.randomUUID === 'function') {
			return `dlg-${window.crypto.randomUUID()}`;
		}
		dialogSequence++;
		return `dlg-${Date.now().toString(36)}-${dialogSequence.toString(36)}`;
	}

	function restoreDialogFocus(target) {
		if (target && target.isConnected && typeof target.focus === 'function') {
			target.focus();
		}
	}

	function handleDialogResult(event) {
		const message = event && event.data;
		if (!message || typeof message !== 'object' || typeof message.requestId !== 'string') {
			return;
		}
		const pending = pendingDialogs.get(message.requestId);
		if (!pending) {
			return;
		}

		if (pending.kind === 'prompt' && message.command === 'blocklyDialogPromptResult') {
			if (message.value !== null && typeof message.value !== 'string') {
				return;
			}
			pendingDialogs.delete(message.requestId);
			pending.callback(message.value);
			restoreDialogFocus(pending.focusTarget);
		} else if (pending.kind === 'confirm' && message.command === 'blocklyDialogConfirmResult') {
			if (typeof message.confirmed !== 'boolean') {
				return;
			}
			pendingDialogs.delete(message.requestId);
			pending.callback(message.confirmed);
			restoreDialogFocus(pending.focusTarget);
		}
	}

	function requestDialog(kind, message, defaultValue, callback) {
		if (!dialogHostApi || typeof dialogHostApi.postMessage !== 'function') {
			callback(kind === 'prompt' ? null : false);
			return;
		}
		const requestId = createDialogRequestId();
		pendingDialogs.set(requestId, {
			kind,
			callback,
			focusTarget: document.activeElement,
		});
		const request = {
			command: kind === 'prompt' ? 'blocklyDialogPrompt' : 'blocklyDialogConfirm',
			requestId,
			message: String(message || ''),
		};
		if (kind === 'prompt') {
			request.defaultValue = String(defaultValue || '');
			request.board = typeof dialogBoardProvider === 'function' ? String(dialogBoardProvider() || 'none') : 'none';
		}
		dialogHostApi.postMessage(request);
	}

	function installDialogAdapter(hostApi, boardProvider) {
		ensureBlockly();
		dialogHostApi = hostApi;
		dialogBoardProvider = typeof boardProvider === 'function' ? boardProvider : null;
		if (!dialogListenerInstalled) {
			window.addEventListener('message', handleDialogResult);
			dialogListenerInstalled = true;
		}
		Blockly.dialog.setPrompt((message, defaultValue, callback) => {
			requestDialog('prompt', message, defaultValue, callback);
		});
		Blockly.dialog.setConfirm((message, callback) => {
			requestDialog('confirm', message, '', callback);
		});
	}

	function disposeDialogAdapter() {
		for (const pending of pendingDialogs.values()) {
			pending.callback(pending.kind === 'prompt' ? null : false);
			restoreDialogFocus(pending.focusTarget);
		}
		pendingDialogs.clear();
		dialogHostApi = null;
		dialogBoardProvider = null;
		if (dialogListenerInstalled) {
			window.removeEventListener('message', handleDialogResult);
			dialogListenerInstalled = false;
		}
	}

	function disposeRuntime() {
		disposeDialogAdapter();
		disposeWorkspace();
	}

	window.BLOCKLY_MEDIA_URL = config.mediaUri;
	window.BLOCKLY_CORE_LOCALE_URIS = config.localeUris;
	window.getBlocklyWorkspace = getWorkspace;
	window.blocklyRuntime = Object.freeze({
		config,
		createImeSafeFieldTextInput,
		createWorkspace,
		recreateWorkspace,
		disposeWorkspace,
		getStatus,
		isRebuilding,
		beginRebuild,
		endRebuild,
		rebuild,
		saveWorkspaceState,
		normalizeWorkspaceState,
		loadWorkspaceState,
		findNewOrphanStatementBlock,
		serializedConnectionsPreserved,
		loadCoreLocale,
		applyLocale,
		installDialogAdapter,
		disposeDialogAdapter,
	});

	window.addEventListener('pagehide', disposeRuntime, { once: true });
})();
