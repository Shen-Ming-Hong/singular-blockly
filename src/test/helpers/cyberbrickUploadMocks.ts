/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as sinon from 'sinon';
import * as vscode from 'vscode';

export class MockSecretStorage implements Pick<vscode.SecretStorage, 'get' | 'store' | 'delete'> {
	readonly values = new Map<string, string>();
	readonly get = sinon.stub<[string], Thenable<string | undefined>>().callsFake(async key => this.values.get(key));
	readonly store = sinon.stub<[string, string], Thenable<void>>().callsFake(async (key, value) => {
		this.values.set(key, value);
	});
	readonly delete = sinon.stub<[string], Thenable<void>>().callsFake(async key => {
		this.values.delete(key);
	});
}

export class MockWorkspaceConfiguration implements Pick<vscode.WorkspaceConfiguration, 'get' | 'update'> {
	readonly values = new Map<string, unknown>();
	readonly get = sinon.stub<[string, unknown?], unknown>().callsFake((key, defaultValue) => {
		return this.values.has(key) ? this.values.get(key) : defaultValue;
	});
	readonly update = sinon.stub<[string, unknown, boolean | vscode.ConfigurationTarget | null | undefined], Thenable<void>>().callsFake(
		async (key, value) => {
			if (value === undefined) {
				this.values.delete(key);
			} else {
				this.values.set(key, value);
			}
		}
	);
}

export function createCyberBrickMockContext(secrets = new MockSecretStorage()): vscode.ExtensionContext {
	return {
		extensionPath: '/mock/extension',
		extensionUri: vscode.Uri.file('/mock/extension'),
		secrets: secrets as unknown as vscode.SecretStorage,
		subscriptions: [],
	} as unknown as vscode.ExtensionContext;
}

export function createWorkspaceFolder(fsPath = '/mock/workspace'): vscode.WorkspaceFolder {
	return {
		uri: vscode.Uri.file(fsPath),
		name: 'workspace',
		index: 0,
	};
}
