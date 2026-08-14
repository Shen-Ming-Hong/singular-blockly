const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
	checkEmpty,
	checkEncoding,
	checkKeyParity,
	checkPlaceholders,
	checkSchema,
	createReport,
	main,
	parseArguments,
	validateTranslations,
} = require('./validate-translations');

describe('translation validation contracts', () => {
	const temporaryDirectories = [];

	function createFixture(content) {
		const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'singular-blockly-i18n-'));
		temporaryDirectories.push(directory);
		const filePath = path.join(directory, 'fixture');
		fs.writeFileSync(filePath, content);
		return filePath;
	}

	function createProjectFixture(targetPackage = { KEEP: '維持' }) {
		const root = fs.mkdtempSync(path.join(os.tmpdir(), 'singular-blockly-i18n-project-'));
		temporaryDirectories.push(root);
		const messages = {
			BLOCKLY_ARIA_CONFIGURATION_ICON: 'Configure',
			BLOCKLY_ARIA_LOCKED_ICON: 'Locked',
		};
		for (const locale of ['en', 'ja']) {
			const localeDirectory = path.join(root, 'media', 'locales', locale);
			fs.mkdirSync(localeDirectory, { recursive: true });
			fs.writeFileSync(
				path.join(localeDirectory, 'messages.js'),
				`window.languageManager.loadMessages('${locale}', ${JSON.stringify(messages)});\n`
			);
			const blocklyDirectory = path.join(root, 'node_modules', 'blockly', 'msg');
			fs.mkdirSync(blocklyDirectory, { recursive: true });
			fs.writeFileSync(path.join(blocklyDirectory, `${locale}.js`), '');
		}
		fs.writeFileSync(path.join(root, 'package.nls.json'), JSON.stringify({ KEEP: 'Keep', MISSING: 'Missing' }));
		fs.writeFileSync(path.join(root, 'package.nls.ja.json'), JSON.stringify(targetPackage));
		return root;
	}

	afterEach(() => {
		for (const directory of temporaryDirectories.splice(0)) {
			fs.rmSync(directory, { recursive: true, force: true });
		}
	});

	it('rejects missing, extra, and repeated placeholder mismatches', () => {
		const missing = checkPlaceholders('EXAMPLE', 'Move %1 with {0} and {0}', '移動 %1 並使用 {0}');
		const extra = checkPlaceholders('EXAMPLE', 'Move %1 steps', '移動 %1 步並使用 %2');
		assert.deepStrictEqual(missing.map(finding => finding.code), ['missingPlaceholder']);
		assert.deepStrictEqual(missing[0].expected, { token: '{0}', count: 2 });
		assert.deepStrictEqual(missing[0].actual, { token: '{0}', count: 1 });
		assert.deepStrictEqual(extra.map(finding => finding.code), ['extraPlaceholder']);
	});

	it('reports missing and extra keys for any keyed translation surface', () => {
		const issues = checkKeyParity('package-nls', { KEEP: 'Keep', MISSING: 'Missing' }, { KEEP: '保留', EXTRA: '額外' }, 'zh-hant');
		assert.deepStrictEqual(
			issues.map(finding => `${finding.code}:${finding.key}`),
			['missingKey:MISSING', 'extraKey:EXTRA']
		);
		for (const finding of issues) {
			for (const field of ['code', 'surface', 'locale', 'key', 'expected', 'actual']) {
				assert.ok(Object.hasOwn(finding, field), `${field} must be present in every JSON finding`);
			}
		}
	});

	it('detects a missing package NLS key through the integrated validator', () => {
		const report = validateTranslations(['ja'], createProjectFixture());
		assert.strictEqual(report.status, 'FAIL');
		assert.ok(report.issues.some(finding => finding.surface === 'package-nls' && finding.code === 'missingKey'));
	});

	it('rejects a null package NLS document as a schema validation issue', () => {
		const report = validateTranslations(['ja'], createProjectFixture(null));
		assert.strictEqual(report.status, 'FAIL');
		assert.ok(
			report.issues.some(
				finding => finding.surface === 'package-nls' && finding.locale === 'ja' && finding.code === 'schemaError'
			)
		);
	});

	it('rejects empty translations except documented message keys', () => {
		assert.strictEqual(checkEmpty('EMPTY_KEY', '   ', 'messages', 'ja').length, 1);
		assert.deepStrictEqual(checkEmpty('PROCEDURES_DEFNORETURN_TITLE', '', 'messages', 'ja'), []);
		assert.strictEqual(checkEmpty('PROCEDURES_DEFNORETURN_TITLE', '', 'package-nls', 'ja').length, 1);
	});

	it('rejects non-object and non-string schema values', () => {
		assert.strictEqual(checkSchema('ja', null)[0].code, 'schemaError');
		const issues = checkSchema('ja', { VALID: '文字列', INVALID: ['not', 'a', 'string'] });
		assert.strictEqual(issues.length, 1);
		assert.strictEqual(issues[0].key, 'INVALID');
	});

	it('validates UTF-8 and rejects byte order marks', () => {
		assert.strictEqual(checkEncoding('fixture', createFixture(Buffer.from([0x2f, 0x2f, 0x20, 0xc3, 0x28])))[0].code, 'encodingError');
		assert.deepStrictEqual(checkEncoding('fixture', createFixture('valid UTF-8')), []);
		assert.strictEqual(checkEncoding('fixture', createFixture(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])))[0].code, 'bomDetected');
	});

	it('accepts supported CLI modes and rejects invalid invocations', () => {
		assert.deepStrictEqual(parseArguments(['--language=ja', '--format=json']), { format: 'json', locales: ['ja'] });
		assert.throws(() => parseArguments([]), /Usage/);
		assert.throws(() => parseArguments(['--language=unknown']), /Unsupported locale/);
		assert.throws(() => parseArguments(['--all', '--language=ja']), /either --all or --language/);
		assert.throws(() => parseArguments(['--all', '--typo']), /Unsupported argument/);
		assert.throws(() => parseArguments(['--all', '--all']), /Duplicate/);
		assert.throws(() => parseArguments(['--language=ja=typo']), /Unsupported locale/);
		assert.throws(() => parseArguments(['--all', '--format=json=typo']), /Unsupported format/);
	});

	it('derives stable pass and fail report statuses', () => {
		assert.strictEqual(createReport(['ja'], []).status, 'PASS');
		assert.strictEqual(createReport(['ja'], [{ surface: 'messages', locale: 'ja' }]).status, 'FAIL');
	});

	it('returns documented execution exit codes', () => {
		const fixtureRoot = createProjectFixture();
		const originalError = console.error;
		const originalLog = console.log;
		console.error = () => {};
		console.log = () => {};
		try {
			assert.strictEqual(main([]), 2);
			assert.strictEqual(main(['--language=ja', '--format=json'], fixtureRoot), 1);
			assert.strictEqual(main(['--language=en', '--format=json']), 0);
		} finally {
			console.error = originalError;
			console.log = originalLog;
		}
	});
});
