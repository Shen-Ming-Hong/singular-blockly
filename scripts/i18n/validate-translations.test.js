const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { checkEmpty, checkEncoding, checkPlaceholders, checkSchema } = require('./validate-translations');

describe('translation validation contracts', () => {
	const temporaryDirectories = [];

	function createLocaleFixture(content) {
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'singular-blockly-i18n-'));
		temporaryDirectories.push(directory);
		const filePath = path.join(directory, 'messages.js');
		fs.writeFileSync(filePath, content);
		return filePath;
	}

	afterEach(() => {
		for (const directory of temporaryDirectories.splice(0)) {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	});

	it('rejects missing placeholders', () => {
		const issues = checkPlaceholders('EXAMPLE', 'Move %1 steps with {0}', '移動步並使用 {0}');
		assert.deepStrictEqual(
			issues.map(issue => issue.type),
			['missingPlaceholder']
		);
	});

	it('rejects extra placeholders', () => {
		const issues = checkPlaceholders('EXAMPLE', 'Move %1 steps', '移動 %1 步並使用 %2');
		assert.deepStrictEqual(
			issues.map(issue => issue.type),
			['extraPlaceholder']
		);
	});

	it('rejects missing and empty translations', () => {
		assert.strictEqual(checkEmpty('MISSING_KEY', undefined).length, 1);
		assert.strictEqual(checkEmpty('EMPTY_KEY', '   ').length, 1);
	});

	it('allows keys documented as intentionally empty', () => {
		assert.deepStrictEqual(checkEmpty('PROCEDURES_DEFNORETURN_TITLE', ''), []);
	});

	it('rejects non-object and non-string schema values', () => {
		assert.strictEqual(checkSchema('ja', null)[0].type, 'schemaError');
		const issues = checkSchema('ja', { VALID: '文字列', INVALID: ['not', 'a', 'string'] });
		assert.strictEqual(issues.length, 1);
		assert.strictEqual(issues[0].key, 'INVALID');
	});

	it('rejects invalid UTF-8 bytes instead of silently replacing them', () => {
		const filePath = createLocaleFixture(Buffer.from([0x2f, 0x2f, 0x20, 0xc3, 0x28, 0x0a]));

		const issues = checkEncoding('fixture', filePath);

		assert.strictEqual(issues.length, 1);
		assert.strictEqual(issues[0].type, 'encodingError');
	});

	it('accepts valid UTF-8 locale content', () => {
		const filePath = createLocaleFixture("window.languageManager.loadMessages('ja', { TEST: '文字列' });\n");

		assert.deepStrictEqual(checkEncoding('fixture', filePath), []);
	});

	it('continues to reject UTF-8 byte order marks', () => {
		const filePath = createLocaleFixture(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d, 0x0a]));

		assert.strictEqual(checkEncoding('fixture', filePath)[0].type, 'bomDetected');
	});
});
