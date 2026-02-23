// @ts-check
'use strict';

/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Context Extractor for Shadow Block AI Suggestions.
 * Analyzes the current Blockly workspace and builds context objects
 * at three depth levels (minimal, standard, deep) for AI suggestions.
 *
 * Runs in WebView (browser) environment — no require/Node.js APIs.
 */
(function () {
	/** @type {Array<{type: string, blockId: string|null, timestamp: number}>} */
	const eventHistory = [];
	const MAX_EVENT_HISTORY = 10;

	/**
	 * Determine language mode from board ID.
	 * @param {string} board
	 * @returns {'arduino'|'micropython'}
	 */
	function getBoardLanguage(board) {
		return board === 'cyberbrick' ? 'micropython' : 'arduino';
	}

	/**
	 * Extract field name→value pairs from a block.
	 * @param {*} block - Blockly block
	 * @returns {Object<string, string>}
	 */
	function extractFields(block) {
		const fields = {};
		if (!block || !block.inputList) {
			return fields;
		}
		for (const input of block.inputList) {
			if (!input.fieldRow) {
				continue;
			}
			for (const field of input.fieldRow) {
				if (field.name && typeof field.getValue === 'function') {
					var val = field.getValue();
					if (val !== undefined && val !== null) {
						// FieldVariable returns internal ID — resolve to human-readable name
						if (typeof field.getVariable === 'function') {
							var variable = field.getVariable();
							if (variable && variable.name) {
								fields[field.name] = variable.name;
								continue;
							}
						}
						fields[field.name] = String(val);
					}
				}
			}
		}
		return fields;
	}

	/**
	 * Get types of immediate child blocks (value/statement inputs + next).
	 * @param {*} block - Blockly block
	 * @returns {string[]}
	 */
	function getChildTypes(block) {
		if (!block) {
			return [];
		}
		const children = block.getChildren(true);
		return children
			.filter(function (c) { return !c.isShadowSuggestion_; })
			.map(function (c) { return c.type; });
	}

	/**
	 * Determine how a block connects to its parent.
	 * @param {*} block - Blockly block
	 * @returns {'next'|'input'|'output'|null}
	 */
	function getConnectionType(block) {
		if (!block) {
			return null;
		}
		const parent = block.getParent();
		if (!parent) {
			return null;
		}
		// Check if connected via previous/next statement
		if (block.previousConnection && block.previousConnection.isConnected()) {
			const target = block.previousConnection.targetBlock();
			if (target === parent) {
				return 'next';
			}
		}
		// Check if connected via output
		if (block.outputConnection && block.outputConnection.isConnected()) {
			return 'output';
		}
		// Otherwise it's a statement input connection
		return 'input';
	}

	/**
	 * Serialize a single block into a context-friendly object.
	 * @param {*} block - Blockly block
	 * @returns {{type: string, id: string, fields: Object<string, string>, parentType: string|null, childTypes: string[], connectionType: string|null}}
	 */
	function serializeBlock(block) {
		const parent = block.getParent();
		return {
			type: block.type,
			id: block.id,
			fields: extractFields(block),
			parentType: parent ? parent.type : null,
			childTypes: getChildTypes(block),
			connectionType: getConnectionType(block),
		};
	}

	/**
	 * Get info about the currently selected block.
	 * @param {*} workspace - Blockly workspace
	 * @returns {Object|null}
	 */
	function getSelectedBlockContext(workspace) {
		// Blockly.common.getSelected() or Blockly.getSelected() or Blockly.selected
		var selected = null;
		if (typeof Blockly !== 'undefined') {
			if (Blockly.common && typeof Blockly.common.getSelected === 'function') {
				selected = Blockly.common.getSelected();
			} else if (typeof Blockly.getSelected === 'function') {
				selected = Blockly.getSelected();
			} else {
				selected = Blockly.selected || null;
			}
		}
		if (!selected || typeof selected.type !== 'string') {
			return null;
		}
		if (selected.isShadowSuggestion_) {
			return null;
		}
		// Verify block belongs to this workspace
		if (workspace && selected.workspace !== workspace) {
			return null;
		}
		return serializeBlock(selected);
	}

	/**
	 * Build a simplified tree of all top-level blocks and their descendants.
	 * @param {*} workspace - Blockly workspace
	 * @returns {Array<Object>}
	 */
	function getWorkspaceTree(workspace) {
		if (!workspace) {
			return [];
		}
		var topBlocks = workspace.getTopBlocks(true);
		return topBlocks
			.filter(function (b) { return !b.isShadowSuggestion_; })
			.map(function (block) { return buildSubtree(block); });
	}

	/**
	 * Recursively build a subtree for a block.
	 * @param {*} block
	 * @returns {{type: string, id: string, fields: Object, children: Array, inputs?: Object}}
	 */
	function buildSubtree(block) {
		var inputs = {};
		var children = [];

		if (block.inputList) {
			for (var i = 0; i < block.inputList.length; i++) {
				var input = block.inputList[i];
				if (!input.connection) {
					continue;
				}
				var targetBlock = input.connection.targetBlock();
				if (!targetBlock || targetBlock.isShadowSuggestion_) {
					continue;
				}

				// Blockly input types: VALUE = 1, STATEMENT = 3
				var inputType = input.type;
				var isValue = (inputType === 1) ||
					(typeof Blockly !== 'undefined' && Blockly.inputTypes && inputType === Blockly.inputTypes.VALUE);
				var isStatement = (inputType === 3) ||
					(typeof Blockly !== 'undefined' && Blockly.inputTypes && inputType === Blockly.inputTypes.STATEMENT);

				if (isValue) {
					inputs[input.name] = buildSubtree(targetBlock);
				} else if (isStatement) {
					var stmtBlock = targetBlock;
					while (stmtBlock) {
						if (!stmtBlock.isShadowSuggestion_) {
							children.push(buildSubtree(stmtBlock));
						}
						stmtBlock = stmtBlock.getNextBlock ? stmtBlock.getNextBlock() : null;
					}
				}
			}
		}

		var result = {
			type: block.type,
			id: block.id,
			fields: extractFields(block),
			children: children,
		};

		if (Object.keys(inputs).length > 0) {
			result.inputs = inputs;
		}

		return result;
	}

	/**
	 * List all workspace variables.
	 * @param {*} workspace - Blockly workspace
	 * @returns {Array<{name: string, type: string, id: string}>}
	 */
	function getVariables(workspace) {
		if (!workspace || !workspace.getVariableMap) {
			return [];
		}
		var allVars = workspace.getVariableMap().getAllVariables();
		return allVars.map(function (v) {
			return {
				name: v.name,
				type: v.type || '',
				id: v.getId(),
			};
		});
	}

	/**
	 * Get function definitions from the workspace.
	 * @param {*} workspace - Blockly workspace
	 * @returns {Array<{name: string, type: string, id: string, hasReturn: boolean}>}
	 */
	function getFunctions(workspace) {
		if (!workspace) {
			return [];
		}
		var funcTypes = ['procedures_defnoreturn', 'procedures_defreturn'];
		var allBlocks = workspace.getAllBlocks(false);
		var funcs = [];
		for (var i = 0; i < allBlocks.length; i++) {
			var block = allBlocks[i];
			if (block.isShadowSuggestion_) {
				continue;
			}
			if (funcTypes.indexOf(block.type) !== -1) {
				var name = '';
				if (typeof block.getFieldValue === 'function') {
					name = block.getFieldValue('NAME') || '';
				}
				funcs.push({
					name: name,
					type: block.type,
					id: block.id,
					hasReturn: block.type === 'procedures_defreturn',
				});
			}
		}
		return funcs;
	}

	/**
	 * Get generated code from the workspace using the active generator.
	 * Uses the existing generateCode() function from blocklyEdit.js.
	 * @param {*} workspace - Blockly workspace
	 * @returns {string|null}
	 */
	function getGeneratedCode(workspace) {
		try {
			if (typeof window.generateCode === 'function') {
				var code = window.generateCode(workspace);
				if (code && typeof code === 'string') {
					// Limit to ~100 lines to keep token count reasonable
					var lines = code.split('\n');
					if (lines.length > 100) {
						return lines.slice(0, 100).join('\n') + '\n// ... (truncated)';
					}
					return code;
				}
			}
			// Fallback: try direct generator call
			var lang = window.currentProgrammingLanguage;
			if (lang === 'micropython' && window.micropythonGenerator) {
				return window.micropythonGenerator.workspaceToCode(workspace);
			}
			if (window.arduinoGenerator) {
				return window.arduinoGenerator.workspaceToCode(workspace);
			}
		} catch (e) {
			// Code generation may fail for invalid workspace states
		}
		return null;
	}

	/**
	 * Record a workspace event into the history buffer (FIFO, max 10).
	 * Stores simplified info only — NOT the full Blockly event object.
	 * @param {*} event - Blockly event
	 */
	function recordEvent(event) {
		if (!event) {
			return;
		}
		// Only record meaningful event types
		var type = event.type || '';
		if (!type) {
			return;
		}
		eventHistory.push({
			type: type,
			blockId: event.blockId || null,
			timestamp: Date.now(),
		});
		while (eventHistory.length > MAX_EVENT_HISTORY) {
			eventHistory.shift();
		}
	}

	/**
	 * Get the event history, trimmed to requested count.
	 * @param {number} count
	 * @returns {Array<{type: string, blockId: string|null, timestamp: number}>}
	 */
	function getEventHistory(count) {
		var start = Math.max(0, eventHistory.length - count);
		return eventHistory.slice(start);
	}

	/**
	 * Compress a selected block for minimal depth:
	 * - Only include the block and its immediate parent (no deep children)
	 * - If childTypes > 5, replace with count
	 * - Strip empty-string field values
	 * @param {Object} blockCtx - serialized block from serializeBlock()
	 * @returns {Object} compressed block context
	 */
	function compressSelectedBlock(blockCtx) {
		if (!blockCtx) {
			return blockCtx;
		}
		var compressed = {
			type: blockCtx.type,
			id: blockCtx.id,
			connectionType: blockCtx.connectionType,
			parentType: blockCtx.parentType,
		};

		// Strip empty-string field values
		var fields = {};
		var keys = Object.keys(blockCtx.fields || {});
		for (var i = 0; i < keys.length; i++) {
			if (blockCtx.fields[keys[i]] !== '') {
				fields[keys[i]] = blockCtx.fields[keys[i]];
			}
		}
		compressed.fields = fields;

		// Limit children: if > 5, just include count
		if (blockCtx.childTypes && blockCtx.childTypes.length > 5) {
			compressed.childCount = blockCtx.childTypes.length;
		} else {
			compressed.childTypes = blockCtx.childTypes || [];
		}

		return compressed;
	}

	/**
	 * Insert a "INSERT NEW BLOCK HERE" marker into generated code
	 * at the position corresponding to the selected/focus block.
	 * @param {string} code - Generated source code
	 * @param {Object} selectedBlock - The selected block context (has .type, .id)
	 * @param {string} language - 'arduino' or 'micropython'
	 * @returns {string} Code with insertion marker
	 */
	function insertCodeMarker(code, selectedBlock, language) {
		if (!code) { return code; }

		var marker = language === 'micropython'
			? '    # ← INSERT NEW BLOCK HERE'
			: '  // ← INSERT NEW BLOCK HERE';

		// Helper: find the last line inside def main(): body (before if __name__)
		function findMainBodyEnd(lines) {
			var mainStart = -1;
			for (var i = 0; i < lines.length; i++) {
				if (lines[i].match(/^def\s+main\s*\(/)) {
					mainStart = i;
					break;
				}
			}
			if (mainStart < 0) { return -1; }
			// Walk forward from mainStart: any indented line is part of main()
			// Stop when hitting a top-level (0-indent) non-empty line
			var mainEnd = -1;
			for (var j = mainStart + 1; j < lines.length; j++) {
				var line = lines[j];
				if (line.trim() === '') { continue; }
				// Top-level non-empty line → main() body has ended
				if (line.match(/^\S/)) { break; }
				// Any indented line within main() body
				mainEnd = j;
			}
			return mainEnd;
		}

		if (language === 'micropython') {
			var lines = code.split('\n');
			var insertPos = findMainBodyEnd(lines);
			if (insertPos >= 0) {
				lines.splice(insertPos + 1, 0, marker);
				return lines.join('\n');
			}
			return code + '\n' + marker;
		} else {
			if (!selectedBlock || !selectedBlock.type) {
				// Arduino: insert before the last closing brace of loop()
				var loopEnd = code.lastIndexOf('}');
				if (loopEnd > 0) {
					return code.substring(0, loopEnd) + marker + '\n' + code.substring(loopEnd);
				}
			} else {
				// Arduino with selected block: insert before last }
				var aLoopEnd = code.lastIndexOf('}');
				if (aLoopEnd > 0) {
					return code.substring(0, aLoopEnd) + marker + '\n' + code.substring(aLoopEnd);
				}
			}
			return code + '\n' + marker;
		}
	}

	/**
	 * Extract workspace context at the specified depth level.
	 * @param {'minimal'|'standard'|'deep'} depth
	 * @param {*} workspace - Blockly workspace
	 * @returns {Object} JSON-serializable context object
	 */
	function extractContext(depth, workspace) {
		var board = (typeof window.getCurrentBoard === 'function')
			? window.getCurrentBoard()
			: (window.currentBoard || 'unknown');
		var language = getBoardLanguage(board);

		var selectedBlock = getSelectedBlockContext(workspace);

		// Compress context for minimal depth to reduce payload size
		if (depth === 'minimal' && selectedBlock) {
			selectedBlock = compressSelectedBlock(selectedBlock);
		}

		// Always include generated code — it's the most effective context for AI
		var codeSnippet = getGeneratedCode(workspace);

		// Add FIM-style insertion point marker
		codeSnippet = insertCodeMarker(codeSnippet, selectedBlock, language);

		// Collect deduplicated list of all block types in the workspace
		var allBlocks = workspace ? workspace.getAllBlocks(false) : [];
		var blockTypeSet = {};
		for (var bi = 0; bi < allBlocks.length; bi++) {
			var b = allBlocks[bi];
			if (typeof b.isShadow === 'function' && b.isShadow()) continue;
			if (!b.isShadowSuggestion_ && b.type) {
				blockTypeSet[b.type] = true;
			}
		}
		var existingBlockTypes = Object.keys(blockTypeSet);

		var context = {
			depth: depth,
			board: board,
			language: language,
			selectedBlock: selectedBlock,
			workspaceTree: null,
			eventHistory: null,
			variables: null,
			codeSnippet: codeSnippet,
			functions: null,
			existingBlockTypes: existingBlockTypes,
		};

		if (depth === 'standard' || depth === 'deep') {
			context.workspaceTree = getWorkspaceTree(workspace);
			context.variables = getVariables(workspace);
			context.eventHistory = getEventHistory(depth === 'deep' ? 10 : 5);
		} else if (depth === 'minimal') {
			// Include lightweight block type list for minimal depth
			var topBlocks = workspace ? workspace.getTopBlocks(true) : [];
			context.blockTree = topBlocks
				.filter(function (b) { return !b.isShadowSuggestion_; })
				.map(function (b) { return b.type; });
		}

		if (depth === 'deep') {
			context.functions = getFunctions(workspace);
		}

		return context;
	}

	/**
	 * Find the block ID of the most recently interacted block from event history.
	 * Looks for BLOCK_CREATE or BLOCK_MOVE events.
	 * @returns {string|null}
	 */
	function findFocusBlockId() {
		for (var i = eventHistory.length - 1; i >= 0; i--) {
			var evt = eventHistory[i];
			if (evt.blockId && (evt.type === Blockly.Events.BLOCK_CREATE || evt.type === Blockly.Events.BLOCK_MOVE)) {
				return evt.blockId;
			}
		}
		return null;
	}

	// Expose public API
	window.contextExtractor = {
		extractContext: extractContext,
		recordEvent: recordEvent,
		getSelectedBlockContext: getSelectedBlockContext,
		getWorkspaceTree: getWorkspaceTree,
		getVariables: getVariables,
		getFocusBlockId: findFocusBlockId,
	};
})();
