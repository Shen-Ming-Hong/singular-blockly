/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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

	// Find the end by looking for the closing ");" pattern from the end
	// This is more reliable than trying to track string states with French apostrophes
	const closingPattern = '});';
	const closingIdx = content.lastIndexOf(closingPattern);
	if (closingIdx === -1 || closingIdx < objStart) {
		return null;
	}

	// The object ends at the } before ");
	const objEnd = closingIdx + 1;

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
