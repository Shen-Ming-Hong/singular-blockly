const path = require('path');
const fs = require('fs');

function loadMessagesFile(lang) {
	const filePath = path.join(__dirname, '..', '..', '..', 'media', 'locales', lang, 'messages.js');
	if (!fs.existsSync(filePath)) {
		return null;
	}

	// Read the file content
	const content = fs.readFileSync(filePath, 'utf8');

	// Extract the object passed to loadMessages
	// Pattern: window.languageManager.loadMessages('lang', { ... });
	const marker = 'loadMessages(';
	const idx = content.indexOf(marker);
	if (idx === -1) {
		return null;
	}

	// Find the start of the object (first { after loadMessages)
	const objStart = content.indexOf('{', idx);
	if (objStart === -1) {
		return null;
	}

	// Find the matching closing brace
	// We need to count braces to find the correct closing one
	let braceCount = 0;
	let objEnd = objStart;
	let inString = false;
	let stringChar = null;
	let escaped = false;

	for (let i = objStart; i < content.length; i++) {
		const char = content[i];
		const prevChar = i > 0 ? content[i - 1] : '';

		// Handle escape sequences
		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === '\\') {
			escaped = true;
			continue;
		}

		// Handle string literals
		if ((char === '"' || char === "'" || char === '`') && !inString) {
			inString = true;
			stringChar = char;
			continue;
		}

		if (inString && char === stringChar && prevChar !== '\\') {
			inString = false;
			stringChar = null;
			continue;
		}

		// Only count braces outside of strings
		if (!inString) {
			if (char === '{') {
				braceCount++;
			} else if (char === '}') {
				braceCount--;
				if (braceCount === 0) {
					objEnd = i + 1;
					break;
				}
			}
		}
	}

	if (objEnd === objStart) {
		return null;
	}

	// Extract the object text
	const objText = content.substring(objStart, objEnd);

	// Use Function constructor to safely evaluate the object literal
	// This is safer than eval and works without window object
	try {
		// eslint-disable-next-line no-new-func
		const evalFunc = new Function('return ' + objText);
		const messages = evalFunc();
		return messages;
	} catch (e) {
		console.error(`Failed to parse messages for ${lang}:`, e.message);
		return null;
	}
}

function readAllTranslations(languages) {
	const result = {};
	languages.forEach(lang => {
		const obj = loadMessagesFile(lang);
		result[lang] = obj || {};
	});
	return result;
}

module.exports = { readAllTranslations, loadMessagesFile };
