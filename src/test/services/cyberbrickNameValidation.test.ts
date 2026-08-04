import assert = require('assert');
import { describe, it } from 'mocha';
import {
	CYBERBRICK_BUILTIN_NAMES,
	CYBERBRICK_PYTHON_HARD_KEYWORDS,
	CYBERBRICK_RUNTIME_NAMES,
	validateCyberBrickName,
} from '../../services/cyberbrickNameValidation';

describe('CyberBrick Extension Host name validation', () => {
	it('trims surrounding whitespace without rewriting accepted ASCII and CJK names', () => {
		for (const name of ['motor', '_motor2', '馬達', '馬達2', '_計數', '\u3400', '\u4dbf', '\u4e00', '\u9fff', '\uf900', '\ufaff']) {
			const result = validateCyberBrickName({ name, kind: 'variable' });
			assert.strictEqual(result.code, 'valid', name);
			assert.strictEqual(result.normalizedName, name);
		}
		assert.strictEqual(validateCyberBrickName({ name: '  馬達2  ', kind: 'variable' }).normalizedName, '馬達2');
	});

	it('classifies invalid input using the documented error priority', () => {
		const cases: Array<[unknown, string]> = [
			[undefined, 'empty'],
			['2 馬達-', 'starts-with-number'],
			['馬達 \t速度-', 'contains-whitespace'],
			['motor-speed!', 'contains-hyphen'],
			['馬達🚀', 'invalid-character'],
			['while', 'python-keyword'],
			['drive', 'duplicate-function'],
		];
		for (const [name, code] of cases) {
			const result = validateCyberBrickName({ name, kind: 'function', duplicateNames: ['drive'] });
			assert.strictEqual(result.severity, 'error', String(name));
			assert.strictEqual(result.code, code, String(name));
			assert(result.messageKey.startsWith('CYBERBRICK_NAME_ERROR_'));
		}
	});

	it('contains the exact hard keyword set and does not reject Python soft keywords', () => {
		const expected = `False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`.split(' ');
		assert.deepStrictEqual([...CYBERBRICK_PYTHON_HARD_KEYWORDS].sort(), expected.sort());
		for (const keyword of expected) {
			assert.strictEqual(validateCyberBrickName({ name: keyword, kind: 'variable' }).code, 'python-keyword', keyword);
		}
		for (const name of ['match', 'case', '_']) {
			assert.strictEqual(validateCyberBrickName({ name, kind: 'variable' }).code, 'valid', name);
		}
	});

	it('uses kind-specific duplicate errors after syntax and keywords', () => {
		assert.strictEqual(validateCyberBrickName({ name: 'same', kind: 'function', duplicateNames: ['same'] }).code, 'duplicate-function');
		assert.strictEqual(validateCyberBrickName({ name: 'same', kind: 'parameter', duplicateNames: ['same'] }).code, 'duplicate-parameter');
		assert.strictEqual(validateCyberBrickName({ name: 'same', kind: 'variable', duplicateNames: ['same'] }).code, 'valid');
		assert.strictEqual(validateCyberBrickName({ name: 'for', kind: 'function', duplicateNames: ['for'] }).code, 'python-keyword');
	});

	it('returns warning severity for the complete runtime and builtin sets', () => {
		const expectedRuntime = ['machine', 'time', 'network', 'Pin', 'PWM', 'ADC', 'UART', 'I2C', 'SPI', 'Timer', 'NeoPixel'];
		const expectedBuiltins = ['print', 'input', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'min', 'max', 'sum', 'abs', 'round', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'open'];
		assert.deepStrictEqual([...CYBERBRICK_RUNTIME_NAMES], expectedRuntime);
		assert.deepStrictEqual([...CYBERBRICK_BUILTIN_NAMES], expectedBuiltins);
		for (const name of expectedRuntime) {
			const result = validateCyberBrickName({ name, kind: 'variable' });
			assert.strictEqual(result.severity, 'warning', name);
			assert.strictEqual(result.code, 'shadows-runtime-name', name);
		}
		for (const name of expectedBuiltins) {
			const result = validateCyberBrickName({ name, kind: 'variable' });
			assert.strictEqual(result.severity, 'warning', name);
			assert.strictEqual(result.code, 'shadows-builtin-name', name);
		}
	});
});
