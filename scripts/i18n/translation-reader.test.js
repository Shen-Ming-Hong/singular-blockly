const assert = require('assert');

const { parseMessages } = require('./lib/translation-reader');

describe('translation reader contracts', () => {
	it('reads a single static loadMessages object without executing code', () => {
		const messages = parseMessages(
			"window.languageManager.loadMessages('en', { TEXT: 'Hello', COUNT: 2, FLAGS: [true, null] });",
			'fixture.js',
			'en'
		);
		assert.deepStrictEqual({ ...messages }, { TEXT: 'Hello', COUNT: 2, FLAGS: [true, null] });
	});

	it('rejects executable expressions and host-constructor escape attempts', () => {
		const malicious =
			"window.languageManager.loadMessages('en', { VALUE: window.languageManager.loadMessages.constructor('return process')() });";
		assert.throws(() => parseMessages(malicious, 'malicious.js', 'en'), /Unsupported executable translation expression/);
	});

	it('rejects extra statements, duplicate keys, and locale mismatches', () => {
		assert.throws(
			() => parseMessages("process.exit(); window.languageManager.loadMessages('en', {});", 'extra.js', 'en'),
			/exactly one loadMessages call/
		);
		assert.throws(
			() => parseMessages("window.languageManager.loadMessages('en', { TEXT: 'A', TEXT: 'B' });", 'duplicate.js', 'en'),
			/Duplicate translation key/
		);
		assert.throws(
			() => parseMessages("window.languageManager.loadMessages('ja', {});", 'locale.js', 'en'),
			/Locale declaration mismatch/
		);
		assert.throws(
			() => parseMessages("window.languageManager.loadMessages('en', { TEXT: 'missing quote });", 'syntax.js', 'en'),
			/Unable to parse translation file/
		);
	});
});
