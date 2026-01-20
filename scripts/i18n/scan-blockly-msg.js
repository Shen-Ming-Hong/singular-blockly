#!/usr/bin/env node
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { log } = require('./lib/logger');
const { readAllTranslations } = require('./lib/translation-reader');

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const showBaselineMissing = args.includes('--baseline-missing') || verbose;

const ROOT_DIR = path.join(__dirname, '..', '..');
const BLOCKLY_MSG_EN = path.join(ROOT_DIR, 'node_modules', 'blockly', 'msg', 'en.js');
const BLOCKLY_BLOCKS_COMPRESSED = path.join(ROOT_DIR, 'node_modules', 'blockly', 'blocks_compressed.js');
const PROJECT_BLOCKS_DIR = path.join(ROOT_DIR, 'media', 'blockly', 'blocks');
const LOCALES_DIR = path.join(ROOT_DIR, 'media', 'locales');
const TOOLBOX_INDEX = path.join(ROOT_DIR, 'media', 'toolbox', 'index.json');
const TOOLBOX_CYBERBRICK = path.join(ROOT_DIR, 'media', 'toolbox', 'cyberbrick.json');

function loadBlocklyMessages(filePath) {
	if (!fs.existsSync(filePath)) {
		return null;
	}

	const code = fs.readFileSync(filePath, 'utf8');
	const context = {
		Blockly: { Msg: {} },
		goog: { provide() {}, require() {} },
	};

	try {
		vm.runInNewContext(code, context, { filename: filePath });
		return context.Blockly.Msg || {};
	} catch (error) {
		log.error('Failed to parse Blockly msg file', error instanceof Error ? error.message : String(error));
		return null;
	}
}

function detectNewline(text) {
	return text.includes('\r\n') ? '\r\n' : '\n';
}

function findMatchingBracket(text, startIndex, openChar, closeChar) {
	let depth = 0;
	let inString = null;
	let escaped = false;

	for (let i = startIndex; i < text.length; i++) {
		const char = text[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === '\\') {
			escaped = true;
			continue;
		}

		if (inString) {
			if (char === inString) {
				inString = null;
			}
			continue;
		}

		if (char === '"' || char === "'") {
			inString = char;
			continue;
		}

		if (char === openChar) {
			depth++;
		} else if (char === closeChar) {
			depth--;
			if (depth === 0) {
				return i;
			}
		}
	}

	return -1;
}

function extractBlockDefinitionArrays(content) {
	const arrays = [];
	const marker = 'createBlockDefinitionsFromJsonArray';
	let index = 0;

	while (index < content.length) {
		const markerIndex = content.indexOf(marker, index);
		if (markerIndex === -1) {
			break;
		}

		const arrayStart = content.indexOf('[', markerIndex);
		if (arrayStart === -1) {
			break;
		}

		const arrayEnd = findMatchingBracket(content, arrayStart, '[', ']');
		if (arrayEnd === -1) {
			break;
		}

		arrays.push(content.slice(arrayStart, arrayEnd + 1));
		index = arrayEnd + 1;
	}

	return arrays;
}

function extractObjectsFromArray(arrayText) {
	const objects = [];
	let inString = null;
	let escaped = false;
	let depth = 0;
	let objectStart = null;

	for (let i = 0; i < arrayText.length; i++) {
		const char = arrayText[i];

		if (escaped) {
			escaped = false;
			continue;
		}

		if (char === '\\') {
			escaped = true;
			continue;
		}

		if (inString) {
			if (char === inString) {
				inString = null;
			}
			continue;
		}

		if (char === '"' || char === "'") {
			inString = char;
			continue;
		}

		if (char === '{') {
			if (depth === 0) {
				objectStart = i;
			}
			depth++;
		} else if (char === '}') {
			depth--;
			if (depth === 0 && objectStart !== null) {
				objects.push(arrayText.slice(objectStart, i + 1));
				objectStart = null;
			}
		}
	}

	return objects;
}

function addKeyMapping(map, key, blockType) {
	if (!map.has(key)) {
		map.set(key, new Set());
	}
	if (blockType) {
		map.get(key).add(blockType);
	}
}

function extractFromBlocksCompressed(filePath, allowedBlockTypes) {
	const keyMap = new Map();
	if (!fs.existsSync(filePath)) {
		log.warn('blocks_compressed.js not found', { filePath });
		return keyMap;
	}

	const content = fs.readFileSync(filePath, 'utf8');
	const arrays = extractBlockDefinitionArrays(content);

	arrays.forEach(arrayText => {
		const objects = extractObjectsFromArray(arrayText);
		objects.forEach(objectText => {
			const typeMatch = objectText.match(/\btype\s*:\s*["']([^"']+)["']/);
			const blockType = typeMatch ? typeMatch[1] : null;
			if (allowedBlockTypes && blockType && !allowedBlockTypes.has(blockType)) {
				return;
			}
			const keyMatches = objectText.match(/BKY_([A-Z0-9_]+)/g);
			if (!keyMatches) {
				return;
			}
			keyMatches.forEach(match => {
				const key = match.replace('BKY_', '');
				addKeyMapping(keyMap, key, blockType);
			});
		});
	});

	return keyMap;
}

function listJsFiles(dirPath) {
	if (!fs.existsSync(dirPath)) {
		return [];
	}

	const entries = fs.readdirSync(dirPath, { withFileTypes: true });
	const files = [];

	entries.forEach(entry => {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...listJsFiles(fullPath));
		} else if (entry.isFile() && entry.name.endsWith('.js')) {
			files.push(fullPath);
		}
	});

	return files;
}

function extractFromProjectBlocks(blocksDir, englishMessages, allowedBlockTypes) {
	const keyMap = new Map();
	const files = listJsFiles(blocksDir);

	files.forEach(filePath => {
		const content = fs.readFileSync(filePath, 'utf8');
		const lines = content.split(detectNewline(content));
		let currentBlockType = null;

		lines.forEach(line => {
			const blockMatch = line.match(/Blockly\.Blocks\[['"]([^'"]+)['"]\]\s*=/);
			if (blockMatch) {
				currentBlockType = blockMatch[1];
			}

			const msgMatch = line.match(/getMessage\(['"]([A-Z0-9_]+)['"]/);
			if (msgMatch) {
				const key = msgMatch[1];
				if (allowedBlockTypes && currentBlockType && !allowedBlockTypes.has(currentBlockType)) {
					return;
				}
				if (englishMessages && Object.prototype.hasOwnProperty.call(englishMessages, key)) {
					addKeyMapping(keyMap, key, currentBlockType);
				}
			}
		});
	});

	return keyMap;
}

function mergeKeyMaps(target, source) {
	source.forEach((blockTypes, key) => {
		if (!target.has(key)) {
			target.set(key, new Set());
		}
		blockTypes.forEach(blockType => target.get(key).add(blockType));
	});
}

function loadLanguages() {
	if (!fs.existsSync(LOCALES_DIR)) {
		return [];
	}

	return fs
		.readdirSync(LOCALES_DIR, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
		.filter(lang => fs.existsSync(path.join(LOCALES_DIR, lang, 'messages.js')));
}

function loadToolboxBlockTypes(toolboxPath) {
	if (!fs.existsSync(toolboxPath)) {
		return new Set();
	}

	const visited = new Set();
	const blockTypes = new Set();

	const collectFromNode = (node, baseDir) => {
		if (!node) {
			return;
		}
		if (Array.isArray(node)) {
			node.forEach(item => collectFromNode(item, baseDir));
			return;
		}
		if (typeof node !== 'object') {
			return;
		}

		if (node.$include) {
			const includePath = path.resolve(baseDir, node.$include);
			if (visited.has(includePath)) {
				return;
			}
			visited.add(includePath);
			if (fs.existsSync(includePath)) {
				const includeContent = JSON.parse(fs.readFileSync(includePath, 'utf8'));
				collectFromNode(includeContent, path.dirname(includePath));
			}
			return;
		}

		if (node.kind === 'block' && node.type) {
			blockTypes.add(node.type);
		}

		if (node.custom === 'VARIABLE') {
			blockTypes.add('variables_get');
			blockTypes.add('variables_set');
			blockTypes.add('variables_get_dynamic');
			blockTypes.add('variables_set_dynamic');
		}

		if (node.inputs) {
			Object.values(node.inputs).forEach(input => {
				if (input && typeof input === 'object') {
					if (input.shadow && input.shadow.type) {
						blockTypes.add(input.shadow.type);
					}
					if (input.block && input.block.type) {
						blockTypes.add(input.block.type);
					}
				}
			});
		}

		if (node.contents) {
			collectFromNode(node.contents, baseDir);
		}
	};

	const rootContent = JSON.parse(fs.readFileSync(toolboxPath, 'utf8'));
	collectFromNode(rootContent, path.dirname(toolboxPath));

	return blockTypes;
}

function main() {
	log.info('Starting Blockly.Msg scan');

	const englishMessages = loadBlocklyMessages(BLOCKLY_MSG_EN);
	if (!englishMessages) {
		log.error('Unable to load Blockly English messages. Ensure dependencies are installed.');
		process.exit(1);
	}

	const toolboxBlockTypes = new Set([
		...loadToolboxBlockTypes(TOOLBOX_INDEX),
		...loadToolboxBlockTypes(TOOLBOX_CYBERBRICK),
	]);
	log.info('Toolbox block types detected', { count: toolboxBlockTypes.size });

	const keyMap = extractFromBlocksCompressed(BLOCKLY_BLOCKS_COMPRESSED, toolboxBlockTypes);
	const projectKeyMap = extractFromProjectBlocks(PROJECT_BLOCKS_DIR, englishMessages, toolboxBlockTypes);
	mergeKeyMaps(keyMap, projectKeyMap);

	const usedKeys = Array.from(keyMap.keys()).sort();
	log.info('Detected Blockly.Msg usage', { keys: usedKeys.length });

	const languages = loadLanguages();
	const translations = readAllTranslations(languages);
	const englishBaseline = translations.en || {};
	const baselineKeys = new Set(Object.keys(englishBaseline));
	const requiredKeys = usedKeys.filter(key => baselineKeys.has(key));

	const missingBaselineKeys = usedKeys.filter(key => !baselineKeys.has(key));
	if (missingBaselineKeys.length > 0 && showBaselineMissing) {
		log.warn('English baseline missing keys', { count: missingBaselineKeys.length });
		missingBaselineKeys.forEach(key => {
			const defaultValue = englishMessages[key] ?? '';
			const blockTypes = keyMap.get(key) ? Array.from(keyMap.get(key)).sort() : [];
			const blockList = blockTypes.length > 0 ? blockTypes.join(', ') : 'unknown';
			console.log(`- ${key}: "${defaultValue}" (blocks: ${blockList})`);
		});
	}

	let totalMissing = 0;
	languages.filter(lang => lang !== 'en').forEach(lang => {
		const langTranslations = translations[lang] || {};
		const missingKeys = requiredKeys.filter(
			key =>
				!Object.prototype.hasOwnProperty.call(langTranslations, key) ||
				langTranslations[key] === undefined ||
				langTranslations[key] === ''
		);

		if (missingKeys.length === 0) {
			return;
		}

		totalMissing += missingKeys.length;
		log.warn(`Missing keys for ${lang}`, { count: missingKeys.length });
		missingKeys.forEach(key => {
			const defaultValue = englishMessages[key] ?? '';
			const blockTypes = keyMap.get(key) ? Array.from(keyMap.get(key)).sort() : [];
			const blockList = blockTypes.length > 0 ? blockTypes.join(', ') : 'unknown';
			console.log(`- ${key}: "${defaultValue}" (blocks: ${blockList})`);
		});
	});

	if (totalMissing === 0) {
		log.info('No missing keys detected.');
	}
}

main();
