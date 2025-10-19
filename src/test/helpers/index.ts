/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Test Helpers - Unified Export
 *
 * This file provides a single import point for all test helpers,
 * making it easier to use test utilities across test files.
 *
 * Usage:
 * ```typescript
 * import { FSMock, VSCodeMock, createIsolatedFileService } from './helpers';
 * ```
 */

// Export all mocks
export { FSMock, VSCodeMock } from './mocks';

// Export all test helper functions
export {
	createIsolatedFileService,
	createIsolatedSettingsManager,
	createIsolatedLocaleService,
	createIsolatedWebViewManager,
	validateFileServiceMock,
	validateWebViewMock,
} from './testHelpers';
