/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPrivacyRedactor, PrivacyRedactor, PrivacyRedactorOptions } from './privacyRedactor';

export type PlatformioPrivacyRedactorOptions = PrivacyRedactorOptions;
export { PrivacyRedactor as PlatformioPrivacyRedactor };

export function createPlatformioPrivacyRedactor(
	options: PlatformioPrivacyRedactorOptions = {},
	sessionWorkspacePath?: string | null
): PrivacyRedactor {
	return createPrivacyRedactor(options, sessionWorkspacePath);
}
