/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type CyberBrickNameKind = 'variable' | 'function' | 'parameter';
export type CyberBrickNameValidationSeverity = 'valid' | 'warning' | 'error';
export type CyberBrickNameValidationCode =
	| 'valid'
	| 'empty'
	| 'starts-with-number'
	| 'contains-whitespace'
	| 'contains-hyphen'
	| 'invalid-character'
	| 'python-keyword'
	| 'duplicate-function'
	| 'duplicate-parameter'
	| 'shadows-runtime-name'
	| 'shadows-builtin-name';

export interface CyberBrickNameValidationOptions {
	name: unknown;
	kind: CyberBrickNameKind;
	duplicateNames?: readonly string[];
}

export interface CyberBrickNameValidationResult {
	rawName: string;
	normalizedName: string;
	severity: CyberBrickNameValidationSeverity;
	code: CyberBrickNameValidationCode;
	messageKey: string;
}

export const CYBERBRICK_PYTHON_HARD_KEYWORDS = Object.freeze(
	`False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`.split(' ')
);

export const CYBERBRICK_RUNTIME_NAMES = Object.freeze([
	'machine', 'time', 'network', 'Pin', 'PWM', 'ADC', 'UART', 'I2C', 'SPI', 'Timer', 'NeoPixel',
]);

export const CYBERBRICK_BUILTIN_NAMES = Object.freeze([
	'print', 'input', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'min', 'max', 'sum', 'abs',
	'round', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'open',
]);

const HARD_KEYWORDS = new Set(CYBERBRICK_PYTHON_HARD_KEYWORDS);
const RUNTIME_NAMES = new Set(CYBERBRICK_RUNTIME_NAMES);
const BUILTIN_NAMES = new Set(CYBERBRICK_BUILTIN_NAMES);
const VALID_NAME_PATTERN = /^[A-Za-z_\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff][A-Za-z0-9_\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]*$/u;

export const CYBERBRICK_NAME_MESSAGE_KEYS: Record<CyberBrickNameValidationCode, string> = {
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
};

export const CYBERBRICK_NAME_FALLBACK_MESSAGES: Record<CyberBrickNameValidationCode, string> = {
	valid: '',
	empty: 'Enter a name.',
	'starts-with-number': 'A name cannot start with a number.',
	'contains-whitespace': 'Remove spaces from the name.',
	'contains-hyphen': 'Use an underscore (_) instead of a hyphen (-).',
	'invalid-character': 'Use letters, numbers, underscores, or Chinese characters only.',
	'python-keyword': 'This is a reserved MicroPython word. Choose another name.',
	'duplicate-function': 'Another function already uses this name.',
	'duplicate-parameter': 'This function already has a parameter with this name.',
	'shadows-runtime-name': 'This name may hide a MicroPython device feature.',
	'shadows-builtin-name': 'This name may hide a built-in Python function.',
};

function createResult(
	rawName: string,
	normalizedName: string,
	severity: CyberBrickNameValidationSeverity,
	code: CyberBrickNameValidationCode
): CyberBrickNameValidationResult {
	return { rawName, normalizedName, severity, code, messageKey: CYBERBRICK_NAME_MESSAGE_KEYS[code] };
}

export function validateCyberBrickName(options: CyberBrickNameValidationOptions): CyberBrickNameValidationResult {
	const rawName = typeof options.name === 'string' ? options.name : '';
	const normalizedName = rawName.trim();
	const error = (code: CyberBrickNameValidationCode) => createResult(rawName, normalizedName, 'error', code);

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
	if (HARD_KEYWORDS.has(normalizedName)) {
		return error('python-keyword');
	}
	if (options.duplicateNames?.includes(normalizedName)) {
		if (options.kind === 'function') {
			return error('duplicate-function');
		}
		if (options.kind === 'parameter') {
			return error('duplicate-parameter');
		}
	}
	if (RUNTIME_NAMES.has(normalizedName)) {
		return createResult(rawName, normalizedName, 'warning', 'shadows-runtime-name');
	}
	if (BUILTIN_NAMES.has(normalizedName)) {
		return createResult(rawName, normalizedName, 'warning', 'shadows-builtin-name');
	}
	return createResult(rawName, normalizedName, 'valid', 'valid');
}
