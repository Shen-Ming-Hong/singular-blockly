/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 清理打包前殘留的暫存 toolbox 檔案
 */

const fs = require('fs');
const path = require('path');

const TOOLBOX_DIR = path.join(__dirname, '..', 'media', 'toolbox');
const TEMP_PREFIX = 'temp_toolbox_';
const TEMP_SUFFIX = '.json';

function cleanupTempToolboxFiles() {
	if (!fs.existsSync(TOOLBOX_DIR)) {
		console.log('Toolbox directory not found, skipping temp toolbox cleanup.');
		return;
	}

	const tempFiles = fs
		.readdirSync(TOOLBOX_DIR, { withFileTypes: true })
		.filter(entry => entry.isFile())
		.map(entry => entry.name)
		.filter(name => name.startsWith(TEMP_PREFIX) && name.endsWith(TEMP_SUFFIX));

	if (tempFiles.length === 0) {
		console.log('No temp toolbox files found.');
		return;
	}

	for (const fileName of tempFiles) {
		fs.rmSync(path.join(TOOLBOX_DIR, fileName), { force: true });
	}

	console.log(`Removed ${tempFiles.length} temp toolbox file(s).`);
}

try {
	cleanupTempToolboxFiles();
} catch (error) {
	console.error('Failed to cleanup temp toolbox files before packaging.', error);
	process.exitCode = 1;
}
