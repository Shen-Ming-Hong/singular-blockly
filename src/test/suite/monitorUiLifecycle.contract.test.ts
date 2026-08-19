/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import { describe, it } from 'mocha';
import { normalizeWhitespace, readWorkspaceFile } from './editorThemeSurfaceContractUtils';

function functionBody(source: string, name: string): string {
	const starts = [
		source.indexOf(`function ${name}(`),
		source.indexOf(`private async ${name}(`),
		source.indexOf(`private ${name}(`),
	].filter(index => index >= 0);
	const start = starts.length > 0 ? Math.min(...starts) : -1;
	assert.ok(start >= 0, `${name} should exist`);
	const nextFunction = source.indexOf('\nfunction ', start + 1);
	const nextMember = source.indexOf('\n\tprivate ', start + 1);
	const next = [nextFunction, nextMember].filter(index => index >= 0).sort((a, b) => a - b)[0] ?? -1;
	return source.slice(start, next >= 0 ? next : undefined);
}

describe('Monitor UI lifecycle contract', () => {
	it('keeps manual and upload stop quiet while preserving disconnect warnings', () => {
		const source = readWorkspaceFile('media/js/blocklyEdit.js');
		const body = functionBody(source, 'handleMonitorStopped');

		assert.ok(body.includes('toast.hide()'), 'Monitor stop should clear any connected toast immediately');
		assert.ok(
			body.includes("message.reason !== 'upload_started'"),
			'Upload stop must not hide a progress toast that may already be visible'
		);
		assert.ok(!body.includes('MONITOR_CLOSED_FOR_UPLOAD'), 'Upload stop should not create a competing toast');
		assert.ok(body.includes("message.reason === 'device_disconnected'"), 'Unexpected disconnect should remain visible');
		assert.ok(body.includes("toast.show(disconnectedMsg, 'warning')"), 'Unexpected disconnect should remain a warning');
	});

	it('uses monitor services as the sole source of monitorStopped messages', () => {
		const source = readWorkspaceFile('src/webview/messageHandler.ts');
		const body = normalizeWhitespace(functionBody(source, 'handleStopMonitor'));

		assert.ok(body.includes("serialMonitorService.stop('manual_stop')"));
		assert.ok(body.includes("arduinoMonitorService.stop('manual_stop')"));
		assert.ok(!body.includes("command: 'monitorStopped'"), 'Manual stop handler must not send a duplicate stop message');
	});
});
