/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick naming validation helper.
 *
 * This UMD boundary keeps the pure rules reusable by the WebView and Node tests.
 * The public API is populated by the user-story implementation tasks.
 */

(function (root, factory) {
	'use strict';

	const api = factory();
	if (typeof module === 'object' && module.exports) {
		module.exports = api;
	}
	if (root) {
		root.cyberbrickNameValidation = api;
	}
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
	'use strict';

	const HARD_KEYWORDS = Object.freeze(
		`False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`.split(' ')
	);
	const RUNTIME_NAMES = Object.freeze(['machine', 'time', 'network', 'Pin', 'PWM', 'ADC', 'UART', 'I2C', 'SPI', 'Timer', 'NeoPixel']);
	const BUILTIN_NAMES = Object.freeze([
		'print', 'input', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'min', 'max', 'sum', 'abs',
		'round', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'open',
	]);
	const HARD_KEYWORD_SET = new Set(HARD_KEYWORDS);
	const RUNTIME_NAME_SET = new Set(RUNTIME_NAMES);
	const BUILTIN_NAME_SET = new Set(BUILTIN_NAMES);
	const VALID_NAME_PATTERN = /^[A-Za-z_\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff][A-Za-z0-9_\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]*$/u;
	const MESSAGE_KEYS = Object.freeze({
		valid: '',
		empty: 'CYBERBRICK_NAME_ERROR_EMPTY',
		'starts-with-number': 'CYBERBRICK_NAME_ERROR_STARTS_WITH_NUMBER',
		'contains-whitespace': 'CYBERBRICK_NAME_ERROR_CONTAINS_WHITESPACE',
		'contains-hyphen': 'CYBERBRICK_NAME_ERROR_CONTAINS_HYPHEN',
		'invalid-character': 'CYBERBRICK_NAME_ERROR_INVALID_CHARACTER',
		'python-keyword': 'CYBERBRICK_NAME_ERROR_PYTHON_KEYWORD',
		'duplicate-function': 'CYBERBRICK_NAME_ERROR_DUPLICATE_FUNCTION',
		'duplicate-parameter': 'CYBERBRICK_NAME_ERROR_DUPLICATE_PARAMETER',
		'shadows-runtime-name': 'CYBERBRICK_NAME_WARNING_RUNTIME',
		'shadows-builtin-name': 'CYBERBRICK_NAME_WARNING_BUILTIN',
	});
	let hydrationDepth = 0;

	function createResult(rawName, normalizedName, severity, code) {
		return Object.freeze({ rawName, normalizedName, severity, code, messageKey: MESSAGE_KEYS[code] });
	}

	function validateName(options) {
		const safeOptions = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
		const rawName = typeof safeOptions.name === 'string' ? safeOptions.name : '';
		const normalizedName = rawName.trim();
		const error = code => createResult(rawName, normalizedName, 'error', code);

		if (!normalizedName) {
			return error('empty');
		}
		if (/^[0-9]/.test(normalizedName)) {
			return error('starts-with-number');
		}
		if (/\s/u.test(normalizedName)) {
			return error('contains-whitespace');
		}
		if (normalizedName.includes('-')) {
			return error('contains-hyphen');
		}
		if (!VALID_NAME_PATTERN.test(normalizedName)) {
			return error('invalid-character');
		}
		if (HARD_KEYWORD_SET.has(normalizedName)) {
			return error('python-keyword');
		}
		if (Array.isArray(safeOptions.duplicateNames) && safeOptions.duplicateNames.includes(normalizedName)) {
			if (safeOptions.kind === 'function') {
				return error('duplicate-function');
			}
			if (safeOptions.kind === 'parameter') {
				return error('duplicate-parameter');
			}
		}
		if (RUNTIME_NAME_SET.has(normalizedName)) {
			return createResult(rawName, normalizedName, 'warning', 'shadows-runtime-name');
		}
		if (BUILTIN_NAME_SET.has(normalizedName)) {
			return createResult(rawName, normalizedName, 'warning', 'shadows-builtin-name');
		}
		return createResult(rawName, normalizedName, 'valid', 'valid');
	}

	function beginHydration() {
		hydrationDepth += 1;
	}

	function endHydration() {
		hydrationDepth = Math.max(0, hydrationDepth - 1);
	}

	function isHydrating() {
		return hydrationDepth > 0;
	}

	function getFieldValue(block, name) {
		const value = typeof block?.getFieldValue === 'function' ? block.getFieldValue(name) : block?.fields?.[name];
		if (value && typeof value === 'object') {
			return value.id || value.name || value.value || '';
		}
		return typeof value === 'string' ? value : '';
	}

	function visitSerializedBlock(block, visitor) {
		if (!block || typeof block !== 'object') {
			return;
		}
		visitor(block);
		if (block.inputs && typeof block.inputs === 'object') {
			Object.values(block.inputs).forEach(input => {
				if (input?.block) {
					visitSerializedBlock(input.block, visitor);
				}
			});
		}
		if (block.next?.block) {
			visitSerializedBlock(block.next.block, visitor);
		}
	}

	function getAllBlocks(source) {
		if (typeof source?.getAllBlocks === 'function') {
			return source.getAllBlocks(false);
		}
		const blocks = [];
		const topBlocks = source?.workspace?.blocks?.blocks || source?.blocks?.blocks || [];
		topBlocks.forEach(block => visitSerializedBlock(block, nestedBlock => blocks.push(nestedBlock)));
		return blocks;
	}

	function getVariables(source) {
		if (typeof source?.getVariableMap === 'function') {
			return source.getVariableMap()?.getAllVariables?.() || [];
		}
		return source?.workspace?.variables || source?.variables || [];
	}

	function getVariableId(variable) {
		return typeof variable?.getId === 'function' ? variable.getId() : variable?.id || variable?.name || '';
	}

	function getVariableName(variable) {
		return typeof variable?.name === 'string' ? variable.name : '';
	}

	function getBlockId(block, fallback) {
		return typeof block?.id === 'string' && block.id ? block.id : fallback;
	}

	function createIssue(kind, name, result, blockIds, extra) {
		return Object.freeze({
			kind,
			name,
			severity: result.severity,
			code: result.code,
			messageKey: result.messageKey,
			blockIds: Object.freeze([...new Set(blockIds.filter(Boolean))]),
			...(extra || {}),
		});
	}

	function getFunctionArguments(block) {
		if (Array.isArray(block?.arguments_)) {
			return block.arguments_.map(value => (typeof value === 'string' ? value : ''));
		}
		if (Array.isArray(block?.extraState?.params)) {
			return block.extraState.params.map(value => (typeof value === 'string' ? value : value?.name || ''));
		}
		return [];
	}

	function collectWorkspaceIssues(source, board) {
		if (board !== 'cyberbrick') {
			return { issues: [], canUpload: true };
		}
		const blocks = getAllBlocks(source);
		const issues = [];
		const variableReferenceTypes = new Set(['variables_get', 'variables_set']);
		getVariables(source).forEach((variable, index) => {
			const name = getVariableName(variable);
			const result = validateName({ name, kind: 'variable' });
			if (result.severity === 'valid') {
				return;
			}
			const id = getVariableId(variable);
			const blockIds = blocks
				.filter(block => variableReferenceTypes.has(block.type) && [id, name].includes(getFieldValue(block, 'VAR')))
				.map((block, blockIndex) => getBlockId(block, `variable-${index}-${blockIndex}`));
			issues.push(createIssue('variable', name, result, blockIds));
		});

		const definitionTypes = new Set(['arduino_function', 'procedures_defnoreturn', 'procedures_defreturn']);
		const callTypes = new Set(['arduino_function_call', 'procedures_callnoreturn', 'procedures_callreturn']);
		const functionDefinitions = blocks.filter(block => definitionTypes.has(block.type));
		const definitionsByName = new Map();
		functionDefinitions.forEach((block, index) => {
			const name = getFieldValue(block, 'NAME');
			const group = definitionsByName.get(name) || [];
			group.push({ block, index });
			definitionsByName.set(name, group);
		});

		definitionsByName.forEach((group, name) => {
			const result = validateName({ name, kind: 'function', duplicateNames: group.length > 1 ? [name] : [] });
			if (result.severity !== 'valid') {
				const relatedIds = group.map(({ block, index }) => getBlockId(block, `function-${index}`));
				blocks
					.filter(block => callTypes.has(block.type) && getFieldValue(block, 'NAME') === name)
					.forEach((block, index) => relatedIds.push(getBlockId(block, `function-call-${index}`)));
				issues.push(createIssue('function', name, result, relatedIds));
			}

			group.forEach(({ block, index }) => {
				const argumentsList = getFunctionArguments(block);
				argumentsList.forEach((parameterName, parameterIndex) => {
					const duplicateNames = argumentsList.filter((_, otherIndex) => otherIndex !== parameterIndex);
					const parameterResult = validateName({ name: parameterName, kind: 'parameter', duplicateNames });
					if (parameterResult.severity !== 'valid') {
						const functionBlockId = getBlockId(block, `function-${index}`);
						issues.push(
							createIssue('parameter', parameterName, parameterResult, [functionBlockId], {
								functionBlockId,
								parameterIndex,
							})
						);
					}
				});
			});
		});

		return { issues, canUpload: !issues.some(issue => issue.severity === 'error') };
	}

	return Object.freeze({
		BUILTIN_NAMES,
		HARD_KEYWORDS,
		RUNTIME_NAMES,
		beginHydration,
		collectWorkspaceIssues,
		endHydration,
		isHydrating,
		validateName,
	});
});
