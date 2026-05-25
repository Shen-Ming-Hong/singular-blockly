/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile as nodeExecFile } from 'child_process';

export interface PlatformioExecResult {
	stdout: string;
	stderr: string;
}

export function createExecFilePromise(
	filePath: string,
	args: string[],
	options: { timeout: number }
): Promise<PlatformioExecResult> {
	return new Promise((resolve, reject) => {
		nodeExecFile(filePath, args, { encoding: 'utf8', timeout: options.timeout }, (error, stdout, stderr) => {
			if (error) {
				reject({ error, stdout, stderr });
				return;
			}

			resolve({ stdout, stderr });
		});
	});
}