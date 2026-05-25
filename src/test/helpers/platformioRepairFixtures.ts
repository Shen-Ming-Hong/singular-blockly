/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
	PlatformioDiagnosticItem,
	PlatformioDiagnosticSession,
} from '../../types/platformioDiagnostic';

export const PLATFORMIO_REPAIR_FIXTURE_NOW = '2026-01-02T03:04:05.000Z';

export function createDiagnosticItem(overrides: Partial<PlatformioDiagnosticItem> = {}): PlatformioDiagnosticItem {
	return {
		id: 'pio',
		kind: 'executable',
		status: 'ok',
		resolvedPath: '/Users/tester/.platformio/penv/bin/pio',
		source: 'default-platformio-path',
		exists: true,
		isFromDetectedPenv: null,
		reason: 'ready',
		versionProbe: {
			command: 'pio --version',
			succeeded: true,
			output: 'PlatformIO Core, version 6.1.18',
			durationMs: 12,
		},
		...overrides,
	};
}

export function createDiagnosticSession(overrides: Partial<PlatformioDiagnosticSession> = {}): PlatformioDiagnosticSession {
	const pio = createDiagnosticItem({ id: 'pio' });
	const penvRoot = createDiagnosticItem({
		id: 'penvRoot',
		kind: 'derived-directory',
		resolvedPath: '/Users/tester/.platformio/penv',
		source: 'resolved-pio-sibling',
		versionProbe: undefined,
	});
	const python = createDiagnosticItem({ id: 'python', resolvedPath: '/Users/tester/.platformio/penv/bin/python3', source: 'derived-from-penv', isFromDetectedPenv: true });
	const pip = createDiagnosticItem({ id: 'pip', resolvedPath: '/Users/tester/.platformio/penv/bin/pip3', source: 'derived-from-penv', isFromDetectedPenv: true });
	const mpremote = createDiagnosticItem({ id: 'mpremote', resolvedPath: '/Users/tester/.platformio/penv/bin/mpremote', source: 'derived-from-penv', isFromDetectedPenv: true });

	return {
		requestedAt: PLATFORMIO_REPAIR_FIXTURE_NOW,
		workspacePath: '/Users/tester/Documents/demo',
		overallStatus: 'operational',
		items: [pio, penvRoot, python, pip, mpremote],
		scopeNotice: 'fixture scope notice',
		...overrides,
	};
}
