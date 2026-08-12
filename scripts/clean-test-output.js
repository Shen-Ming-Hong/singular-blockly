/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const outputRoot = path.resolve(projectRoot, 'out');

if (outputRoot !== path.join(projectRoot, 'out') || path.dirname(outputRoot) !== projectRoot) {
	throw new Error('Refusing to clean an unexpected test output path');
}
if (fs.existsSync(outputRoot)) {
	const stats = fs.lstatSync(outputRoot);
	if (stats.isSymbolicLink() || !stats.isDirectory()) {
		throw new Error('Refusing to clean a non-directory or symbolic-link test output path');
	}
	fs.rmSync(outputRoot, { recursive: true });
}
