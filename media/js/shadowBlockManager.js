// @ts-check
'use strict';

/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shadow Block Manager for AI Suggestions.
 * Creates, positions, renders, and removes semi-transparent "shadow" blocks
 * that appear as AI suggestions in the Blockly workspace.
 *
 * Runs in WebView (browser) environment — no require/Node.js APIs.
 */
(function () {
	// ===== State =====
	/** @type {*} Currently rendered shadow block (or null) */
	var currentSuggestion = null;
	/** @type {Array<Object>} All suggestions for multi-suggestion mode */
	var allSuggestions = [];
	/** @type {number} Index of currently displayed suggestion */
	var currentIndex = 0;
	/** @type {HTMLElement|null} Floating Tab hint element */
	var hintElement = null;
	/** @type {boolean} Whether the manager is active */
	var enabled = true;
	/** @type {Object|null} Tier configuration from Extension Host */
	var config = null;
	/** @type {*} VS Code API reference (set via init) */
	var vsCodeApi = null;
	/** @type {boolean} Guard flag to prevent concurrent showSuggestion renders */
	var isRendering = false;
	/** @type {boolean} Guard for rAF-throttled hint repositioning */
	var hintUpdateScheduled = false;
	/** @type {Function|null} Workspace change listener reference for cleanup */
	var workspaceChangeListener = null;
	/** @type {*} Block currently in exit-animation, not yet disposed */
	var pendingDisposeBlock = null;
	/** @type {ReturnType<typeof setTimeout>|null} Timer for deferred dispose */
	var pendingDisposeTimer = null;

	/**
	 * Set field values on a block, resolving variable names to IDs for FieldVariable fields.
	 * @param {*} block - Blockly block
	 * @param {Object} fields - Map of field name → value
	 * @param {*} workspace - Blockly workspace
	 */
	function setBlockFields(block, fields, workspace) {
		if (!fields) {
			return;
		}
		var fieldNames = Object.keys(fields);
		for (var i = 0; i < fieldNames.length; i++) {
			var name = fieldNames[i];
			var value = fields[name];
			try {
				// Check if this is a FieldVariable — resolve name to ID
				var field = block.getField(name);
				if (field && typeof field.getVariable === 'function') {
					// Look up existing variable by name
					var allVars = workspace.getAllVariables ? workspace.getAllVariables() : [];
					var found = false;
					for (var vi = 0; vi < allVars.length; vi++) {
						if (allVars[vi].name === value) {
							block.setFieldValue(allVars[vi].getId(), name);
							found = true;
							break;
						}
					}
					if (!found) {
						// Variable doesn't exist — create it
						var newVar = workspace.createVariable(value);
						if (newVar) {
							block.setFieldValue(newVar.getId(), name);
						}
					}
				} else {
					// Guard: skip non-string values (e.g. objects accidentally placed in fields by AI)
					if (typeof value !== 'string') {
						console.warn('[SB] setBlockFields: skipping non-string value for field', name, '(type:', typeof value, ')');
						continue;
					}
					block.setFieldValue(value, name);
				}
			} catch (e) {
				console.warn('[SB] setBlockFields error for field', name, ':', e);
			}
		}
	}

	/**
	 * Initialize the manager with VS Code API reference.
	 * @param {*} api - The VS Code API object from acquireVsCodeApi()
	 */
	function init(api) {
		vsCodeApi = api;
	}

	/**
	 * Get the Blockly main workspace.
	 * @returns {*}
	 */
	function getWorkspace() {
		if (typeof Blockly !== 'undefined') {
			return Blockly.getMainWorkspace();
		}
		return null;
	}

	/**
	 * Post a message to the Extension Host (if API available).
	 * @param {Object} message
	 */
	function postMessage(message) {
		if (vsCodeApi && typeof vsCodeApi.postMessage === 'function') {
			vsCodeApi.postMessage(message);
		}
	}

	/**
	 * Auto-connect a shadow block to the best available connection point.
	 * Scans the workspace for compatible empty connections starting from
	 * the focus block (selected or most recently interacted).
	 * @param {*} block - The shadow block
	 * @param {*} workspace - Blockly workspace
	 * @returns {boolean} true if a connection was made, false if fallback positioning
	 */
	function autoConnect(block, workspace) {
		var isStatement = !!block.previousConnection;
		var isValue = !!block.outputConnection;

		// Find the focus block
		var focusBlock = null;
		if (typeof Blockly !== 'undefined' && Blockly.common && typeof Blockly.common.getSelected === 'function') {
			var sel = Blockly.common.getSelected();
			if (sel && typeof sel.type === 'string' && !sel.isShadowSuggestion_ && sel.workspace === workspace) {
				focusBlock = sel;
			}
		}

		// Fallback: check contextExtractor event history for recent block
		if (!focusBlock && typeof window.contextExtractor === 'object' && typeof window.contextExtractor.extractContext === 'function') {
			// Scan event history stored in contextExtractor for last modified block
			var ctx = window.contextExtractor.extractContext('minimal', workspace);
			if (ctx && ctx.eventHistory) {
				for (var ei = ctx.eventHistory.length - 1; ei >= 0; ei--) {
					var evt = ctx.eventHistory[ei];
					if (evt.blockId) {
						var candidate = workspace.getBlockById(evt.blockId);
						if (candidate && !candidate.isShadowSuggestion_ && !candidate.disposed) {
							focusBlock = candidate;
							break;
						}
					}
				}
			}
		}

		// Fallback: use contextExtractor.getFocusBlockId if available
		if (!focusBlock && typeof window.contextExtractor === 'object' && typeof window.contextExtractor.getFocusBlockId === 'function') {
			var focusId = window.contextExtractor.getFocusBlockId();
			if (focusId) {
				var fb = workspace.getBlockById(focusId);
				if (fb && !fb.isShadowSuggestion_ && !fb.disposed) {
					focusBlock = fb;
				}
			}
		}

		// Fallback: last top-level block
		if (!focusBlock) {
			var topBlocks = workspace.getTopBlocks(true);
			for (var ti = topBlocks.length - 1; ti >= 0; ti--) {
				if (!topBlocks[ti].isShadowSuggestion_) {
					focusBlock = topBlocks[ti];
					break;
				}
			}
		}

		if (!focusBlock) {
			// No blocks at all — place at center
			var metrics = workspace.getMetrics();
			block.moveBy(metrics.viewLeft + metrics.viewWidth / 2, metrics.viewTop + metrics.viewHeight / 2);
			return false;
		}

		// Collect candidate connections from focus block
		var candidates = [];

		if (isStatement) {
			// a. Focus block's nextConnection (if empty)
			if (focusBlock.nextConnection && !focusBlock.nextConnection.isConnected()) {
				candidates.push(focusBlock.nextConnection);
			}

			// b. Focus block's statement inputs (empty ones)
			if (focusBlock.inputList) {
				for (var si = 0; si < focusBlock.inputList.length; si++) {
					var inp = focusBlock.inputList[si];
					// Statement input: has a connection that accepts NEXT_STATEMENT (type 4)
					if (inp.connection && inp.connection.type === 3 && !inp.connection.isConnected()) {
						candidates.push(inp.connection);
					}
				}
			}

			// d. Walk the chain from focus block to the last block, try its nextConnection
			var walker = focusBlock;
			var steps = 0;
			while (walker.nextConnection && walker.nextConnection.isConnected() && steps < 100) {
				walker = walker.nextConnection.targetBlock();
				steps++;
			}
			if (walker !== focusBlock && walker.nextConnection && !walker.nextConnection.isConnected()) {
				candidates.push(walker.nextConnection);
			}

			// d2. Walk INTO connected statement inputs to find chain ends inside containers
			if (focusBlock.inputList) {
				for (var sii = 0; sii < focusBlock.inputList.length; sii++) {
					var stInp = focusBlock.inputList[sii];
					if (stInp.connection && stInp.connection.type === 3 && stInp.connection.isConnected()) {
						var stWalker = stInp.connection.targetBlock();
						var stSteps = 0;
						while (stWalker && stWalker.nextConnection && stWalker.nextConnection.isConnected() && stSteps < 100) {
							stWalker = stWalker.nextConnection.targetBlock();
							stSteps++;
						}
						if (stWalker && stWalker.nextConnection && !stWalker.nextConnection.isConnected()) {
							candidates.push(stWalker.nextConnection);
						}
					}
				}
			}

			// e. Scan ALL top-level blocks for empty nextConnection at end of chain
			var allTop = workspace.getTopBlocks(true);
			for (var ai = 0; ai < allTop.length; ai++) {
				var tb = allTop[ai];
				if (tb.isShadowSuggestion_ || tb === focusBlock) {
					continue;
				}
				var end = tb;
				var chainSteps = 0;
				while (end.nextConnection && end.nextConnection.isConnected() && chainSteps < 100) {
					end = end.nextConnection.targetBlock();
					chainSteps++;
				}
				if (end.nextConnection && !end.nextConnection.isConnected()) {
					candidates.push(end.nextConnection);
				}
				// e2. Walk INTO connected statement inputs of this top block
				if (tb.inputList) {
					for (var tsi = 0; tsi < tb.inputList.length; tsi++) {
						var tbInp = tb.inputList[tsi];
						if (tbInp.connection && tbInp.connection.type === 3 && tbInp.connection.isConnected()) {
							var tbWalker = tbInp.connection.targetBlock();
							var tbSteps = 0;
							while (tbWalker && tbWalker.nextConnection && tbWalker.nextConnection.isConnected() && tbSteps < 100) {
								tbWalker = tbWalker.nextConnection.targetBlock();
								tbSteps++;
							}
							if (tbWalker && tbWalker.nextConnection && !tbWalker.nextConnection.isConnected()) {
								candidates.push(tbWalker.nextConnection);
							}
						}
					}
				}
			}
		}

		if (isValue) {
			// c. Search focus block AND all blocks in its chain for empty value inputs
			var valueScanBlocks = [focusBlock];
			// Walk chain from focus block's root to collect all blocks
			var chainBlock = focusBlock;
			// Walk UP to find root of chain
			while (chainBlock.previousConnection && chainBlock.previousConnection.isConnected()) {
				chainBlock = chainBlock.previousConnection.targetBlock();
				if (!chainBlock || chainBlock.isShadowSuggestion_) {
					break;
				}
			}
			// Now walk DOWN from root collecting all blocks
			var scanBlock = chainBlock;
			var scanSteps = 0;
			while (scanBlock && scanSteps < 100) {
				if (scanBlock !== focusBlock && !scanBlock.isShadowSuggestion_) {
					valueScanBlocks.push(scanBlock);
				}
				// Also add children connected to statement inputs
				if (scanBlock.inputList) {
					for (var sci = 0; sci < scanBlock.inputList.length; sci++) {
						var scInp = scanBlock.inputList[sci];
						if (scInp.connection && scInp.connection.type === 3 && scInp.connection.isConnected()) {
							var stChild = scInp.connection.targetBlock();
							if (stChild && !stChild.isShadowSuggestion_) {
								valueScanBlocks.push(stChild);
							}
						}
					}
				}
				if (scanBlock.nextConnection && scanBlock.nextConnection.isConnected()) {
					scanBlock = scanBlock.nextConnection.targetBlock();
				} else {
					break;
				}
				scanSteps++;
			}
			// Search all collected blocks for empty value inputs
			for (var vbi = 0; vbi < valueScanBlocks.length; vbi++) {
				var vb = valueScanBlocks[vbi];
				if (!vb.inputList) {
					continue;
				}
				for (var vi = 0; vi < vb.inputList.length; vi++) {
					var vInp = vb.inputList[vi];
					// Value input: connection type INPUT_VALUE (1)
					if (vInp.connection && vInp.connection.type === 1 && !vInp.connection.isConnected()) {
						candidates.push(vInp.connection);
					}
				}
			}
		}

		// Try connecting to each candidate
		var connected = false;
		for (var ci = 0; ci < candidates.length; ci++) {
			try {
				var conn = candidates[ci];
				if (isStatement && block.previousConnection) {
					conn.connect(block.previousConnection);
				} else if (isValue && block.outputConnection) {
					conn.connect(block.outputConnection);
				}
				connected = true;
				break;
			} catch (e) {
				// Connection incompatible — try next candidate
				console.warn('[SB] Connection attempt failed:', candidates[ci], e.message || e);
			}
		}

		// Fallback: position near focus block with offset (statement blocks only)
		if (!connected) {
			if (isStatement) {
				var focusXY = focusBlock.getRelativeToSurfaceXY();
				block.moveBy(focusXY.x + 20, focusXY.y + focusBlock.height + 10);
			}
			// Value blocks without a connection are useless — caller should skip
		}
		return connected;
	}

	/**
	 * Position the hint overlay at the bottom-right corner of the shadow block.
	 * @param {*} block - The shadow block
	 */
	function positionHint(block) {
		if (!hintElement || !block) return;
		var injectionDiv = document.querySelector('.injectionDiv');
		if (!injectionDiv) return;
		var svgRoot = block.getSvgRoot();
		if (!svgRoot) return;
		var blockRect = svgRoot.getBoundingClientRect();
		var containerRect = injectionDiv.getBoundingClientRect();
		// Position at bottom-right corner of the shadow block, offset slightly outside
		hintElement.style.left = blockRect.right - containerRect.left + 4 + 'px';
		hintElement.style.top = blockRect.bottom - containerRect.top + 4 + 'px';
	}

	/**
	 * Handle workspace changes to reposition hint overlay.
	 * Throttled via requestAnimationFrame to avoid performance issues.
	 * @param {*} event - Blockly workspace event
	 */
	function onWorkspaceChangeForHint(event) {
		if (!currentSuggestion || !hintElement) return;
		var type = event.type;
		if (type === Blockly.Events.VIEWPORT_CHANGE || type === Blockly.Events.BLOCK_MOVE || type === Blockly.Events.BLOCK_DRAG) {
			if (!hintUpdateScheduled) {
				hintUpdateScheduled = true;
				requestAnimationFrame(function () {
					hintUpdateScheduled = false;
					if (currentSuggestion && hintElement) {
						positionHint(currentSuggestion);
					}
				});
			}
		}
	}

	/**
	 * Create or update the Tab hint overlay.
	 */
	function showHint() {
		if (!currentSuggestion) return;
		var injectionDiv = document.querySelector('.injectionDiv');
		if (!injectionDiv) return;
		if (!hintElement) {
			hintElement = document.createElement('div');
			hintElement.className = 'shadow-suggestion-hint';
			injectionDiv.appendChild(hintElement);
			// Register workspace listener for hint repositioning
			var ws = getWorkspace();
			if (ws && !workspaceChangeListener) {
				workspaceChangeListener = onWorkspaceChangeForHint;
				ws.addChangeListener(workspaceChangeListener);
			}
		}
		var isMulti = allSuggestions.length > 1;
		if (isMulti) {
			var multiHintText =
				window.MSG && window.MSG['AI_SUGGESTION_TAB_HINT_MULTI'] ? ' ' + window.MSG['AI_SUGGESTION_TAB_HINT_MULTI'] : '';
			hintElement.innerHTML =
				'<span class="shadow-hint-arrow" data-action="prev">◁</span>' +
				' <span class="shadow-hint-counter">' +
				(currentIndex + 1) +
				'/' +
				allSuggestions.length +
				'</span> ' +
				'<span class="shadow-hint-arrow" data-action="next">▷</span>' +
				' <span class="shadow-hint-tab">⇥</span>' +
				'<span class="shadow-hint-text">' +
				multiHintText +
				'</span>';
		} else {
			var tabHintText = window.MSG && window.MSG['AI_SUGGESTION_TAB_HINT'] ? ' ' + window.MSG['AI_SUGGESTION_TAB_HINT'] : '';
			hintElement.innerHTML = '<span class="shadow-hint-tab">⇥</span>' + '<span class="shadow-hint-text">' + tabHintText + '</span>';
		}
		// Attach click handlers to arrows
		var arrows = hintElement.querySelectorAll('.shadow-hint-arrow');
		for (var i = 0; i < arrows.length; i++) {
			arrows[i].addEventListener('click', function (e) {
				e.stopPropagation();
				var action = this.getAttribute('data-action');
				if (action === 'prev' && window.shadowBlockManager) {
					window.shadowBlockManager.prevSuggestion();
				} else if (action === 'next' && window.shadowBlockManager) {
					window.shadowBlockManager.nextSuggestion();
				}
			});
		}
		positionHint(currentSuggestion);
	}

	/**
	 * Remove the hint overlay from the DOM.
	 */
	function removeHint() {
		// Unregister workspace change listener
		if (workspaceChangeListener) {
			var ws = getWorkspace();
			if (ws) {
				ws.removeChangeListener(workspaceChangeListener);
			}
			workspaceChangeListener = null;
		}
		if (hintElement && hintElement.parentNode) {
			hintElement.parentNode.removeChild(hintElement);
		}
		hintElement = null;
	}

	/**
	 * Recursively create and connect child blocks for value inputs.
	 * @param {*} parentBlock - The parent Blockly block
	 * @param {Object} inputs - Map of input name → child block spec {blockType, fields, inputs}
	 * @param {*} workspace - Blockly workspace
	 */
	function createChildBlocks(parentBlock, inputs, workspace) {
		if (!inputs || typeof inputs !== 'object') {
			return;
		}
		var inputNames = Object.keys(inputs);
		for (var i = 0; i < inputNames.length; i++) {
			var inputName = inputNames[i];
			var childSpec = inputs[inputName];
			if (!childSpec || !childSpec.blockType) {
				continue;
			}

			// Verify parent has this input with a connection
			var parentInput = parentBlock.getInput(inputName);
			if (!parentInput || !parentInput.connection) {
				console.warn(
					'[SB] Parent',
					parentBlock.type,
					'has no input:',
					inputName,
					'available:',
					parentBlock.inputList
						? parentBlock.inputList.map(function (inp) {
								return inp.name;
							})
						: []
				);
				continue;
			}

			// Handle already-connected inputs
			if (parentInput.connection.isConnected()) {
				var existingBlock = parentInput.connection.targetBlock();
				if (existingBlock && typeof existingBlock.isShadow === 'function' && existingBlock.isShadow()) {
					// Existing Blockly shadow block — check if AI wants same type
					if (existingBlock.type === childSpec.blockType) {
						// Same type: just update fields
						setBlockFields(existingBlock, childSpec.fields, workspace);
						existingBlock.isShadowSuggestion_ = true;
						if (childSpec.inputs) {
							createChildBlocks(existingBlock, childSpec.inputs, workspace);
						}
					} else {
						// Different type: disconnect shadow, create AI's block
						parentInput.connection.disconnect();
						try {
							existingBlock.dispose(false);
						} catch (_) {
							/* ignore */
						}
						try {
							var childBlock = workspace.newBlock(childSpec.blockType);
							childBlock.isShadowSuggestion_ = true;
							setBlockFields(childBlock, childSpec.fields, workspace);
							if (childSpec.inputs) {
								createChildBlocks(childBlock, childSpec.inputs, workspace);
							}
							childBlock.initSvg();
							if (childBlock.outputConnection) {
								parentInput.connection.connect(childBlock.outputConnection);
							} else if (childBlock.previousConnection) {
								parentInput.connection.connect(childBlock.previousConnection);
							}
						} catch (e) {
							console.warn('[SB] Failed to replace shadow block:', childSpec.blockType, e);
						}
					}
				} else {
					// Non-shadow block already connected — skip
				}
				continue;
			}

			// Verify child block type exists in registry
			if (typeof Blockly !== 'undefined' && Blockly.Blocks && !Blockly.Blocks[childSpec.blockType]) {
				console.warn('[SB] Unknown child block type:', childSpec.blockType);
				continue;
			}

			try {
				var childBlock = workspace.newBlock(childSpec.blockType);
				childBlock.isShadowSuggestion_ = true;

				// Set child field values (resolves variable names to IDs)
				setBlockFields(childBlock, childSpec.fields, workspace);

				// Recursion: child may also have inputs
				if (childSpec.inputs) {
					createChildBlocks(childBlock, childSpec.inputs, workspace);
				}

				childBlock.initSvg();

				// Connect child to parent's input
				if (childBlock.outputConnection) {
					parentInput.connection.connect(childBlock.outputConnection);
				} else if (childBlock.previousConnection) {
					parentInput.connection.connect(childBlock.previousConnection);
				} else {
					console.warn('[SB]  child', childSpec.blockType, 'has no output or previous connection!');
				}

				// Handle "next" chain — append blocks after this one via nextConnection
				if (childSpec.next) {
					connectNextChain(childBlock, childSpec.next, workspace);
				}
			} catch (e) {
				console.warn('[SB] Failed to create child block:', childSpec.blockType, e);
			}
		}
	}

	/**
	 * Create and connect a chain of "next" blocks after a given block.
	 * @param {*} currentBlock - The block to append after
	 * @param {Object} nextSpec - The next block spec {blockType, fields, inputs, next}
	 * @param {*} workspace - Blockly workspace
	 */
	function connectNextChain(currentBlock, nextSpec, workspace) {
		if (!nextSpec || !nextSpec.blockType) {
			return;
		}
		if (!currentBlock.nextConnection) {
			console.warn('[SB] Block', currentBlock.type, 'has no nextConnection for chain');
			return;
		}
		if (typeof Blockly !== 'undefined' && Blockly.Blocks && !Blockly.Blocks[nextSpec.blockType]) {
			console.warn('[SB] Unknown next block type:', nextSpec.blockType);
			return;
		}
		try {
			var nextBlock = workspace.newBlock(nextSpec.blockType);
			nextBlock.isShadowSuggestion_ = true;
			setBlockFields(nextBlock, nextSpec.fields, workspace);
			if (nextSpec.inputs) {
				createChildBlocks(nextBlock, nextSpec.inputs, workspace);
			}
			nextBlock.initSvg();
			if (nextBlock.previousConnection) {
				currentBlock.nextConnection.connect(nextBlock.previousConnection);
			}
			// Recurse for further chaining
			if (nextSpec.next) {
				connectNextChain(nextBlock, nextSpec.next, workspace);
			}
		} catch (e) {
			console.warn('[SB] Failed to create next block:', nextSpec.blockType, e);
		}
	}

	/**
	 * Recursively add shadow suggestion CSS class to all child blocks marked as suggestions.
	 * @param {*} block - Parent block to scan
	 */
	function addShadowClassToChildren(block) {
		if (!block || !block.inputList) {
			return;
		}
		for (var i = 0; i < block.inputList.length; i++) {
			var input = block.inputList[i];
			if (input.connection && input.connection.isConnected()) {
				var child = input.connection.targetBlock();
				if (child && child.isShadowSuggestion_) {
					var childSvg = child.getSvgRoot();
					if (childSvg) {
						childSvg.classList.add('blockly-shadow-suggestion', 'blockly-shadow-suggestion-enter');
					}
					addShadowClassToChildren(child);
				}
			}
		}
		// Also traverse nextConnection chain
		if (block.nextConnection && block.nextConnection.isConnected()) {
			var nextBlock = block.nextConnection.targetBlock();
			if (nextBlock && nextBlock.isShadowSuggestion_) {
				var nextSvg = nextBlock.getSvgRoot();
				if (nextSvg) {
					nextSvg.classList.add('blockly-shadow-suggestion', 'blockly-shadow-suggestion-enter');
				}
				addShadowClassToChildren(nextBlock);
			}
		}
	}

	/**
	 * Recursively remove shadow suggestion markers and CSS from child blocks.
	 * @param {*} block - Parent block to scan
	 */
	function acceptChildBlocks(block) {
		if (!block || !block.inputList) {
			return;
		}
		for (var i = 0; i < block.inputList.length; i++) {
			var input = block.inputList[i];
			if (input.connection && input.connection.isConnected()) {
				var child = input.connection.targetBlock();
				if (child && child.isShadowSuggestion_) {
					delete child.isShadowSuggestion_;
					var childSvg = child.getSvgRoot ? child.getSvgRoot() : null;
					if (childSvg) {
						childSvg.classList.remove('blockly-shadow-suggestion', 'blockly-shadow-suggestion-enter');
						childSvg.style.opacity = '1';
						childSvg.style.pointerEvents = '';
					}
					acceptChildBlocks(child);
				}
			}
		}
		// Also accept nextConnection chain
		if (block.nextConnection && block.nextConnection.isConnected()) {
			var nextBlock = block.nextConnection.targetBlock();
			if (nextBlock && nextBlock.isShadowSuggestion_) {
				delete nextBlock.isShadowSuggestion_;
				var nextSvg = nextBlock.getSvgRoot ? nextBlock.getSvgRoot() : null;
				if (nextSvg) {
					nextSvg.classList.remove('blockly-shadow-suggestion', 'blockly-shadow-suggestion-enter');
					nextSvg.style.opacity = '1';
					nextSvg.style.pointerEvents = '';
				}
				acceptChildBlocks(nextBlock);
			}
		}
	}

	/**
	 * Render a shadow block suggestion in the workspace.
	 * Uses requestAnimationFrame for rendering to avoid layout thrashing.
	 * Only one render operation is allowed at a time.
	 * @param {Object} suggestion - { blockType, fields, connectionType, connectionTarget, inputName }
	 * @returns {*} The created block, or null on failure
	 */
	function showSuggestion(suggestion) {
		console.log('[SB] showSuggestion:', suggestion ? suggestion.blockType : 'null', 'isRendering=' + isRendering);
		if (!suggestion || !suggestion.blockType) {
			console.warn('[SB] Early exit: suggestion=' + JSON.stringify(suggestion));
			return null;
		}

		if (isRendering) {
			console.warn('[SB] Render already in progress, skipping');
			return null;
		}

		var workspace = getWorkspace();
		if (!workspace) {
			console.warn('[SB] No workspace available');
			return null;
		}

		// Verify block type exists in Blockly registry
		if (typeof Blockly !== 'undefined' && Blockly.Blocks && !Blockly.Blocks[suggestion.blockType]) {
			console.warn('[SB] Unknown block type: ' + suggestion.blockType);
			return null;
		}

		// Flush any block still in exit-animation before creating the new one.
		// clearSuggestion(true) sets currentSuggestion=null immediately but defers
		// the actual dispose by 200 ms, leaving the block connected and occupying
		// the connection point. Disposing it now frees the slot for the new block.
		if (pendingDisposeBlock) {
			disposeBlock(pendingDisposeBlock);
			pendingDisposeBlock = null;
		}

		// Clear any existing suggestion first
		clearSuggestion(false);

		isRendering = true;

		var block = null;
		try {
			// Suppress workspace events during shadow block creation
			Blockly.Events.disable();

			block = workspace.newBlock(suggestion.blockType);

			// Set field values (resolves variable names to IDs)
			setBlockFields(block, suggestion.fields, workspace);

			// Create and connect child blocks for value inputs
			if (suggestion.inputs) {
				createChildBlocks(block, suggestion.inputs, workspace);
			}

			// Mark as shadow suggestion (custom flag, NOT Blockly's setShadow)
			block.isShadowSuggestion_ = true;

			// Initialize SVG — defer render to requestAnimationFrame to avoid layout thrashing
			block.initSvg();

			var renderBlock = block;
			requestAnimationFrame(function () {
				try {
					// Suppress events during shadow block rendering and connection
					Blockly.Events.disable();
					try {
						renderBlock.render();

						// Connect AFTER render so block has proper dimensions/coordinates
						var didConnect = autoConnect(renderBlock, workspace);

						// Value blocks that couldn't find a connection are useless — discard
						if (!didConnect && !renderBlock.previousConnection) {
							disposeBlock(renderBlock);
							if (currentSuggestion === renderBlock) {
								currentSuggestion = null;
							}
							isRendering = false;
							return;
						}

						// Re-render after connection to update SVG coordinates
						if (didConnect) {
							renderBlock.render();
						}
					} finally {
						Blockly.Events.enable();
					}

					// Add shadow CSS classes to main block and all child blocks
					var svgRoot = renderBlock.getSvgRoot();
					if (svgRoot) {
						svgRoot.classList.add('blockly-shadow-suggestion', 'blockly-shadow-suggestion-enter');
					}
					addShadowClassToChildren(renderBlock);

					// Defer hint to next frame so browser layout has updated getBoundingClientRect
					requestAnimationFrame(function () {
						if (currentSuggestion === renderBlock) {
							showHint();
						}
					});
				} catch (e) {
					// render error — block is already in workspace, just log
					console.warn('[SB] Render error:', e);
				} finally {
					isRendering = false;
				}
			});
		} catch (e) {
			// Block creation failed — clean up
			console.error('[SB] Block creation failed:', e);
			if (block) {
				try {
					block.dispose(false);
				} catch (_) {
					// ignore
				}
			}
			block = null;
			isRendering = false;
		} finally {
			Blockly.Events.enable();
		}

		if (block) {
			currentSuggestion = block;
			// showHint() is called inside rAF after render for correct positioning
		}

		return block;
	}

	/**
	 * Remove the current shadow block.
	 * @param {boolean} [animate=false] - Whether to play exit animation
	 */
	function clearSuggestion(animate) {
		if (!currentSuggestion) {
			return;
		}

		var block = currentSuggestion;
		currentSuggestion = null;
		removeHint();

		try {
			if (animate) {
				var svgRoot = block.getSvgRoot ? block.getSvgRoot() : null;
				if (svgRoot) {
					svgRoot.classList.add('blockly-shadow-suggestion-exit');
				}
				clearTimeout(pendingDisposeTimer);
				pendingDisposeBlock = block;
				pendingDisposeTimer = setTimeout(function () {
					pendingDisposeTimer = null;
					if (pendingDisposeBlock === block) {
						pendingDisposeBlock = null;
					}
					disposeBlock(block);
				}, 200);
			} else {
				disposeBlock(block);
			}
		} catch (e) {
			console.warn('[SB] Error during clearSuggestion:', e);
			disposeBlock(block);
		}
	}

	/**
	 * Safely dispose of a shadow block with events suppressed.
	 * Checks if block is already disposed before attempting disposal.
	 * @param {*} block
	 */
	function disposeBlock(block) {
		if (!block) {
			return;
		}
		// Guard: check if block has already been disposed
		if (block.disposed || (typeof block.isDeadOrDying === 'function' && block.isDeadOrDying())) {
			return;
		}
		try {
			Blockly.Events.disable();

			// Recursively dispose next-chained shadow blocks first
			if (block.nextConnection && block.nextConnection.isConnected()) {
				var nextBlock = block.nextConnection.targetBlock();
				if (nextBlock && nextBlock.isShadowSuggestion_) {
					disposeBlock(nextBlock);
				}
			}

			// Disconnect any connections before disposal
			if (block.previousConnection && block.previousConnection.isConnected()) {
				block.previousConnection.disconnect();
			}
			if (block.outputConnection && block.outputConnection.isConnected()) {
				block.outputConnection.disconnect();
			}
			if (block.nextConnection && block.nextConnection.isConnected()) {
				block.nextConnection.disconnect();
			}

			block.dispose(false);
		} catch (e) {
			// ignore disposal errors
		} finally {
			Blockly.Events.enable();
		}
	}

	/**
	 * Convert the current shadow block into a real workspace block.
	 * @returns {*} The accepted block, or null if none active
	 */
	function acceptSuggestion() {
		if (!currentSuggestion) {
			return null;
		}

		var block = currentSuggestion;
		currentSuggestion = null;
		removeHint();

		try {
			// Remove shadow markers from main block and all children
			delete block.isShadowSuggestion_;
			acceptChildBlocks(block);

			var svgRoot = block.getSvgRoot ? block.getSvgRoot() : null;
			if (svgRoot) {
				svgRoot.classList.remove('blockly-shadow-suggestion', 'blockly-shadow-suggestion-enter');
				svgRoot.classList.add('blockly-shadow-suggestion-accept');
				svgRoot.style.opacity = '1';
				svgRoot.style.pointerEvents = '';

				// Remove accept animation class after animation completes
				setTimeout(function () {
					if (svgRoot) {
						svgRoot.classList.remove('blockly-shadow-suggestion-accept');
					}
				}, 200);
			}

			// Clear multi-suggestion state
			allSuggestions = [];
			currentIndex = 0;

			// Record complete undo-able operation as an event group
			var groupId = Blockly.utils.idGenerator.genUid();
			Blockly.Events.setGroup(groupId);
			try {
				// Fire BlockCreate for the main block
				Blockly.Events.fire(new Blockly.Events.BlockCreate(block));

				// Fire BlockMove to record connection state for proper undo
				if (
					(block.previousConnection && block.previousConnection.isConnected()) ||
					(block.outputConnection && block.outputConnection.isConnected())
				) {
					var moveEvent = new Blockly.Events.BlockMove(block);
					moveEvent.oldParentId = undefined;
					moveEvent.oldInputName = undefined;
					moveEvent.oldCoordinate = block.getRelativeToSurfaceXY();
					Blockly.Events.fire(moveEvent);
				}

				// Fire events for child blocks (also created with events disabled)
				function fireChildEvents(parentBlock) {
					if (!parentBlock) {
						return;
					}
					// Traverse input children
					if (parentBlock.inputList) {
						for (var ci = 0; ci < parentBlock.inputList.length; ci++) {
							var childInput = parentBlock.inputList[ci];
							if (childInput.connection && childInput.connection.isConnected()) {
								var childBlock = childInput.connection.targetBlock();
								if (childBlock) {
									Blockly.Events.fire(new Blockly.Events.BlockCreate(childBlock));
									var childMove = new Blockly.Events.BlockMove(childBlock);
									childMove.oldParentId = undefined;
									childMove.oldInputName = undefined;
									childMove.oldCoordinate = undefined;
									Blockly.Events.fire(childMove);
									fireChildEvents(childBlock);
								}
							}
						}
					}
					// Traverse next chain
					if (parentBlock.nextConnection && parentBlock.nextConnection.isConnected()) {
						var nextBlock = parentBlock.nextConnection.targetBlock();
						if (nextBlock) {
							Blockly.Events.fire(new Blockly.Events.BlockCreate(nextBlock));
							var nextMove = new Blockly.Events.BlockMove(nextBlock);
							nextMove.oldParentId = undefined;
							nextMove.oldInputName = undefined;
							nextMove.oldCoordinate = undefined;
							Blockly.Events.fire(nextMove);
							fireChildEvents(nextBlock);
						}
					}
				}
				fireChildEvents(block);
			} finally {
				Blockly.Events.setGroup(false);
			}

			// Notify Extension Host
			postMessage({
				command: 'acceptShadowSuggestion',
				blockType: block.type,
			});

			return block;
		} catch (e) {
			console.warn('[SB] Error during acceptSuggestion:', e);
			allSuggestions = [];
			currentIndex = 0;
			return null;
		}
	}

	/**
	 * Set multiple suggestions for cycling (Pro/Pro+ tiers).
	 * @param {Array<Object>} suggestions
	 */
	function setSuggestions(suggestions) {
		console.log('[SB] setSuggestions called with', suggestions ? suggestions.length : 0, 'suggestions');
		if (!Array.isArray(suggestions) || suggestions.length === 0) {
			console.warn('[SB] setSuggestions: no valid suggestions');
			return;
		}
		allSuggestions = suggestions.slice();
		currentIndex = 0;

		// Try to render the first suggestion, removing failures
		while (allSuggestions.length > 0) {
			var result = showSuggestion(allSuggestions[currentIndex]);
			if (result) {
				return;
			}
			// Remove failed suggestion
			allSuggestions.splice(currentIndex, 1);
			if (currentIndex >= allSuggestions.length) {
				currentIndex = 0;
			}
		}
		// All suggestions failed
		console.warn('[SB] All suggestions failed to render');
		allSuggestions = [];
		currentIndex = 0;
	}

	/**
	 * Show the next suggestion (wraps around, skips failed ones).
	 */
	function nextSuggestion() {
		if (allSuggestions.length <= 1) {
			return;
		}
		clearSuggestion(false);
		var startIndex = currentIndex;
		var nextIdx = (currentIndex + 1) % allSuggestions.length;

		while (nextIdx !== startIndex) {
			var result = showSuggestion(allSuggestions[nextIdx]);
			if (result) {
				currentIndex = nextIdx;
				return;
			}
			// Remove failed suggestion
			allSuggestions.splice(nextIdx, 1);
			if (allSuggestions.length <= 1) {
				return;
			}
			// Adjust startIndex if it was after the removed element
			if (startIndex > nextIdx) {
				startIndex--;
			}
			// nextIdx now points to the next element (or wraps)
			if (nextIdx >= allSuggestions.length) {
				nextIdx = 0;
			}
		}
	}

	/**
	 * Show the previous suggestion (wraps around, skips failed ones).
	 */
	function prevSuggestion() {
		if (allSuggestions.length <= 1) {
			return;
		}
		clearSuggestion(false);
		var startIndex = currentIndex;
		var prevIdx = (currentIndex - 1 + allSuggestions.length) % allSuggestions.length;

		while (prevIdx !== startIndex) {
			var result = showSuggestion(allSuggestions[prevIdx]);
			if (result) {
				currentIndex = prevIdx;
				return;
			}
			// Remove failed suggestion
			allSuggestions.splice(prevIdx, 1);
			if (allSuggestions.length <= 1) {
				return;
			}
			// Adjust startIndex if it was after the removed element
			if (startIndex > prevIdx) {
				startIndex--;
			}
			// Recalculate prevIdx
			prevIdx = (prevIdx - 1 + allSuggestions.length) % allSuggestions.length;
			if (prevIdx === startIndex) {
				break;
			}
		}
	}

	/**
	 * Update manager configuration from Extension Host.
	 * @param {Object} newConfig - { enabled, ... }
	 */
	function updateConfig(newConfig) {
		if (!newConfig) {
			return;
		}
		config = newConfig;
	}

	/**
	 * Check if there is a currently displayed suggestion.
	 * @returns {boolean}
	 */
	function isActive() {
		return currentSuggestion !== null;
	}

	// ===== Public API =====
	window.shadowBlockManager = {
		init: init,
		showSuggestion: showSuggestion,
		clearSuggestion: clearSuggestion,
		acceptSuggestion: acceptSuggestion,
		setSuggestions: setSuggestions,
		nextSuggestion: nextSuggestion,
		prevSuggestion: prevSuggestion,
		showHint: showHint,
		updateConfig: updateConfig,
		isActive: isActive,
	};
})();
