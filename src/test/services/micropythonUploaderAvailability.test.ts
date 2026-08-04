/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import { suite, test, teardown } from 'mocha';
import { CommandExecutor, MicropythonUploader } from '../../services/micropythonUploader';

suite('MicropythonUploader environment availability', () => {
	const executor: CommandExecutor = {
		exec: async () => ({ stdout: '', stderr: '' }),
	};

	teardown(() => {
		sinon.restore();
	});

	test('reports initialization when a provider is installed but Python is unavailable', async () => {
		const uploader = new MicropythonUploader('/workspace', executor, () => true);
		sinon.stub(uploader, 'checkPythonEnvironment').resolves(false);

		const result = await uploader.ensureMpremoteAvailable();

		assert.strictEqual(result.success, false);
		if (!result.success) {
			assert.strictEqual(result.message, 'PlatformIO Python environment is not available.');
			assert.match(result.details ?? '', /still initializing/);
			assert.doesNotMatch(result.details ?? '', /install PlatformIO IDE/);
		}
	});

	test('suggests automatic setup when no provider is installed', async () => {
		const uploader = new MicropythonUploader('/workspace', executor, () => false);
		sinon.stub(uploader, 'checkPythonEnvironment').resolves(false);

		const result = await uploader.ensureMpremoteAvailable();

		assert.strictEqual(result.success, false);
		if (!result.success) {
			assert.match(result.details ?? '', /Open the Blockly editor/);
			assert.match(result.details ?? '', /pioarduino/);
		}
	});
});
