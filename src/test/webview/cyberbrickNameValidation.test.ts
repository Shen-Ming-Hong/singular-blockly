import assert = require('assert');
import * as path from 'path';
import { describe, it } from 'mocha';

interface NameValidationResult {
	normalizedName: string;
	severity: 'valid' | 'warning' | 'error';
	code: string;
	messageKey: string;
}

interface NameValidationApi {
	validateName(options: { name: unknown; kind: 'variable' | 'function' | 'parameter'; duplicateNames?: string[] }): NameValidationResult;
	collectWorkspaceIssues(source: unknown, board: string): {
		issues: Array<{ kind: string; name: string; severity: string; code: string; blockIds: string[]; functionBlockId?: string; parameterIndex?: number }>;
		canUpload: boolean;
	};
}

const helperPath = path.resolve(__dirname, '../../../media/js/cyberbrickNameValidation.js');
const api = require(helperPath) as NameValidationApi;

const HARD_KEYWORDS = `False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`.split(' ');
const RUNTIME_NAMES = ['machine', 'time', 'network', 'Pin', 'PWM', 'ADC', 'UART', 'I2C', 'SPI', 'Timer', 'NeoPixel'];
const BUILTIN_NAMES = ['print', 'input', 'len', 'range', 'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'min', 'max', 'sum', 'abs', 'round', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'open'];

describe('CyberBrick WebView name validation helper', () => {
	it('normalizes only surrounding whitespace and accepts ASCII or supported CJK identifiers', () => {
		for (const name of ['motor', '_motor2', '馬達', '馬達2', '_計數', '\u3400', '\u4dbf', '\u4e00', '\u9fff', '\uf900', '\ufaff']) {
			const result = api.validateName({ name, kind: 'variable' });
			assert.strictEqual(result.code, 'valid', name);
			assert.strictEqual(result.normalizedName, name);
		}

		const trimmed = api.validateName({ name: '  馬達2  ', kind: 'variable' });
		assert.strictEqual(trimmed.code, 'valid');
		assert.strictEqual(trimmed.normalizedName, '馬達2');
	});

	it('returns the stable blocking code in the documented priority order', () => {
		const cases: Array<[unknown, string]> = [
			['   ', 'empty'],
			['1 motor-', 'starts-with-number'],
			['motor speed-', 'contains-whitespace'],
			['motor-speed!', 'contains-hyphen'],
			['motor!', 'invalid-character'],
			['for', 'python-keyword'],
			['sameName', 'duplicate-function'],
		];
		for (const [name, code] of cases) {
			const result = api.validateName({ name, kind: 'function', duplicateNames: ['sameName'] });
			assert.strictEqual(result.severity, 'error', String(name));
			assert.strictEqual(result.code, code, String(name));
		}
	});

	it('rejects every Python hard keyword while leaving soft keywords available', () => {
		for (const keyword of HARD_KEYWORDS) {
			assert.strictEqual(api.validateName({ name: keyword, kind: 'variable' }).code, 'python-keyword', keyword);
		}
		for (const name of ['match', 'case', '_']) {
			assert.strictEqual(api.validateName({ name, kind: 'variable' }).code, 'valid', name);
		}
	});

	it('blocks duplicates only for functions and parameters in their supplied scope', () => {
		assert.strictEqual(api.validateName({ name: 'drive', kind: 'function', duplicateNames: ['drive'] }).code, 'duplicate-function');
		assert.strictEqual(api.validateName({ name: 'speed', kind: 'parameter', duplicateNames: ['speed'] }).code, 'duplicate-parameter');
		assert.strictEqual(api.validateName({ name: 'speed', kind: 'parameter', duplicateNames: ['other'] }).code, 'valid');
		assert.strictEqual(api.validateName({ name: 'drive', kind: 'variable', duplicateNames: ['drive'] }).code, 'valid');
	});

	it('returns non-blocking warnings for the complete runtime and builtin lists', () => {
		for (const name of RUNTIME_NAMES) {
			const result = api.validateName({ name, kind: 'variable' });
			assert.strictEqual(result.severity, 'warning', name);
			assert.strictEqual(result.code, 'shadows-runtime-name', name);
		}
		for (const name of BUILTIN_NAMES) {
			const result = api.validateName({ name, kind: 'variable' });
			assert.strictEqual(result.severity, 'warning', name);
			assert.strictEqual(result.code, 'shadows-builtin-name', name);
		}
	});

	it('collects variable, function, and parameter issues with related block ids', () => {
		const variables = [
			{ name: '1motor', getId: () => 'var-invalid' },
			{ name: 'print', getId: () => 'var-warning' },
		];
		const blocks = [
			{ id: 'get-invalid', type: 'variables_get', fields: { VAR: 'var-invalid' } },
			{ id: 'set-invalid', type: 'variables_set', fields: { VAR: 'var-invalid' } },
			{ id: 'get-warning', type: 'variables_get', fields: { VAR: 'var-warning' } },
			{ id: 'fn-a', type: 'arduino_function', fields: { NAME: 'drive' }, arguments_: ['speed', 'speed', 'bad value'] },
			{ id: 'fn-b', type: 'arduino_function', fields: { NAME: 'drive' }, arguments_: [] },
			{ id: 'call-drive', type: 'arduino_function_call', fields: { NAME: 'drive' } },
		];
		const workspace = {
			getVariableMap: () => ({ getAllVariables: () => variables }),
			getAllBlocks: () => blocks.map(block => ({ ...block, getFieldValue: (name: string) => block.fields[name as keyof typeof block.fields] })),
		};

		const result = api.collectWorkspaceIssues(workspace, 'cyberbrick');

		assert.strictEqual(result.canUpload, false);
		const variableIssue = result.issues.find(issue => issue.kind === 'variable' && issue.name === '1motor');
		assert.deepStrictEqual(variableIssue ? [...variableIssue.blockIds].sort() : undefined, ['get-invalid', 'set-invalid']);
		assert.strictEqual(variableIssue?.code, 'starts-with-number');
		const duplicateFunction = result.issues.find(issue => issue.code === 'duplicate-function');
		assert.deepStrictEqual(duplicateFunction ? [...duplicateFunction.blockIds].sort() : undefined, ['call-drive', 'fn-a', 'fn-b']);
		const duplicateParameters = result.issues.filter(issue => issue.code === 'duplicate-parameter');
		assert.strictEqual(duplicateParameters.length, 2);
		assert(duplicateParameters.every(issue => issue.functionBlockId === 'fn-a'));
		assert(result.issues.some(issue => issue.kind === 'parameter' && issue.code === 'contains-whitespace' && issue.parameterIndex === 2));
	});

	it('allows warning-only workspaces and isolates all issues to CyberBrick', () => {
		const workspace = {
			getVariableMap: () => ({ getAllVariables: () => [{ name: 'machine', getId: () => 'runtime' }] }),
			getAllBlocks: () => [{ id: 'runtime-get', type: 'variables_get', getFieldValue: () => 'runtime' }],
		};
		const cyberbrick = api.collectWorkspaceIssues(workspace, 'cyberbrick');
		assert.strictEqual(cyberbrick.canUpload, true);
		assert.strictEqual(cyberbrick.issues[0].severity, 'warning');
		assert.deepStrictEqual(api.collectWorkspaceIssues(workspace, 'uno'), { issues: [], canUpload: true });
		assert.deepStrictEqual(api.collectWorkspaceIssues(workspace, 'txt'), { issues: [], canUpload: true });
	});
});
