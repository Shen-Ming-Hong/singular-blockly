/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlatformioDiagnosticItem } from '../types/platformioDiagnostic';

export function formatPlatformioDiagnosticFinding(
	item: PlatformioDiagnosticItem,
	options: { includeProbe?: boolean } = {}
): string {
	const parts = [
		`- ${item.id} [${item.status}] source=${item.source}`,
		`path=${item.resolvedPath ?? 'unresolved'}`,
	];

	if (options.includeProbe) {
		const probe = item.versionProbe?.output ?? item.versionProbe?.errorMessage ?? 'no probe output';
		parts.push(`probe=${probe}`);
	}

	parts.push(`reason=${item.reason}`);
	return parts.join('; ');
}