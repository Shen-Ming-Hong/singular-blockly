/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert = require('assert');
import * as sinon from 'sinon';
import { describe, it, beforeEach, afterEach } from 'mocha';
import {
	PenvProviderServiceDeps,
	isProviderInstalled,
	attemptInstall,
	showInstallNotification,
	getInstalledProviderId,
} from '../services/penvProviderService';

// ─── 測試輔助函數 ──────────────────────────────────────────────────────────────

function createMockDeps(overrides: Partial<PenvProviderServiceDeps> = {}): PenvProviderServiceDeps {
	return {
		getExtension: sinon.stub().returns(undefined),
		executeCommand: sinon.stub().resolves(),
		showInformationMessage: sinon.stub().resolves(undefined),
		...overrides,
	};
}

// ─── T010: 單元測試 ────────────────────────────────────────────────────────────

describe('PenvProviderService', () => {
	afterEach(() => {
		sinon.restore();
	});

	// ─── (a) isProviderInstalled ────────────────────────────────────────────

	describe('isProviderInstalled', () => {
		it('should return false when neither provider is installed', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns(undefined),
			});
			assert.strictEqual(isProviderInstalled(deps), false);
		});

		it('should return true when platformio.platformio-ide is installed', () => {
			const getExtension = sinon.stub();
			getExtension.withArgs('platformio.platformio-ide').returns({ id: 'platformio.platformio-ide' });
			getExtension.returns(undefined);
			assert.strictEqual(isProviderInstalled({ getExtension }), true);
		});

		it('should return true when pioarduino.pioarduino-ide is installed', () => {
			const getExtension = sinon.stub();
			getExtension.withArgs('pioarduino.pioarduino-ide').returns({ id: 'pioarduino.pioarduino-ide' });
			getExtension.returns(undefined);
			assert.strictEqual(isProviderInstalled({ getExtension }), true);
		});

		it('should prefer the official provider when both extensions are installed', () => {
			const getExtension = sinon.stub();
			getExtension.withArgs('platformio.platformio-ide').returns({ id: 'platformio.platformio-ide' });
			getExtension.withArgs('pioarduino.pioarduino-ide').returns({ id: 'pioarduino.pioarduino-ide' });
			assert.strictEqual(getInstalledProviderId({ getExtension }), 'platformio.platformio-ide');
		});
	});

	// ─── (b) attemptInstall ────────────────────────────────────────────────

	describe('attemptInstall', () => {
		it('should install platformio.platformio-ide when available', async () => {
			const executeCommand = sinon.stub().resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const result = await attemptInstall({ executeCommand, showInformationMessage });
			assert.deepStrictEqual(result, {
				status: 'installed',
				providerId: 'platformio.platformio-ide',
			});
			assert.ok(
				executeCommand.calledWith('workbench.extensions.installExtension', 'platformio.platformio-ide')
			);
		});

		it('should fall back to pioarduino when platformio fails', async () => {
			const executeCommand = sinon.stub();
			executeCommand
				.withArgs('workbench.extensions.installExtension', 'platformio.platformio-ide')
				.rejects(new Error('Not found'));
			executeCommand.resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const result = await attemptInstall({ executeCommand, showInformationMessage });
			assert.deepStrictEqual(result, {
				status: 'installed',
				providerId: 'pioarduino.pioarduino-ide',
			});
			assert.ok(
				executeCommand.calledWith('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide')
			);
		});

		it('should open extensions search when both providers fail', async () => {
			const executeCommand = sinon.stub();
			executeCommand
				.withArgs('workbench.extensions.installExtension', sinon.match.string)
				.rejects(new Error('Not found'));
			executeCommand.withArgs('workbench.extensions.search', 'platformio').resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const result = await attemptInstall({ executeCommand, showInformationMessage });
			assert.deepStrictEqual(result, { status: 'manual-required' });
			assert.ok(executeCommand.calledWith('workbench.extensions.search', 'platformio'));
			assert.ok(showInformationMessage.calledOnce);
		});
	});

	// ─── (c) showInstallNotification ──────────────────────────────────────

	describe('showInstallNotification', () => {
		it('should open PlatformIO Home after auto-install and before showing reload', async () => {
			const executeCommand = sinon.stub().resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const deps = createMockDeps({ executeCommand, showInformationMessage });
			await showInstallNotification(deps);
			assert.ok(
				executeCommand.calledWith('workbench.extensions.installExtension', 'platformio.platformio-ide'),
				'should trigger installExtension directly'
			);
			assert.ok(
				executeCommand.calledWith('platformio-ide.showHome'),
				'should open PlatformIO Home after installation'
			);
			assert.ok(
				executeCommand.getCall(0).calledBefore(executeCommand.getCall(1)),
				'should install the provider before opening PlatformIO Home'
			);
			assert.ok(
				executeCommand.getCall(1).calledBefore(showInformationMessage.getCall(0)),
				'should open PlatformIO Home before showing the reload prompt'
			);
		});

		it('should attempt pioarduino fallback automatically when platformio fails', async () => {
			const executeCommand = sinon.stub();
			executeCommand
				.withArgs('workbench.extensions.installExtension', 'platformio.platformio-ide')
				.rejects(new Error('Not available'));
			executeCommand.resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const deps = createMockDeps({ executeCommand, showInformationMessage });
			await showInstallNotification(deps);
			assert.ok(
				executeCommand.calledWith('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide'),
				'should auto-fallback to pioarduino'
			);
			assert.ok(
				executeCommand.calledWith('platformio-ide.showHome'),
				'should open PlatformIO Home after installing pioarduino'
			);
			const pioarduinoInstallCall = executeCommand
				.getCalls()
				.find(call => call.args[1] === 'pioarduino.pioarduino-ide');
			const homeCall = executeCommand.getCalls().find(call => call.args[0] === 'platformio-ide.showHome');
			assert.ok(
				pioarduinoInstallCall && homeCall && pioarduinoInstallCall.calledBefore(homeCall),
				'should finish installing pioarduino before opening PlatformIO Home'
			);
			assert.ok(
				homeCall && homeCall.calledBefore(showInformationMessage.getCall(0)),
				'should open PlatformIO Home before showing the reload prompt'
			);
		});

		it('should still offer reload when opening PlatformIO Home fails', async () => {
			const executeCommand = sinon.stub();
			executeCommand.withArgs('platformio-ide.showHome').rejects(new Error('Command unavailable'));
			executeCommand.resolves();
			const showInformationMessage = sinon.stub().resolves('Reload Now');
			const deps = createMockDeps({ executeCommand, showInformationMessage });

			await showInstallNotification(deps);

			assert.strictEqual(
				executeCommand
					.getCalls()
					.filter(call => call.args[0] === 'workbench.extensions.installExtension').length,
				1,
				'Home failure must not trigger another provider installation'
			);
			assert.ok(showInformationMessage.calledOnce, 'should retain the existing reload prompt');
			assert.ok(
				executeCommand.calledWith('workbench.action.reloadWindow'),
				'should still reload when the user confirms'
			);
		});

		it('should not report ready or reload when both provider installs fail', async () => {
			const executeCommand = sinon.stub();
			executeCommand
				.withArgs('workbench.extensions.installExtension', sinon.match.string)
				.rejects(new Error('Not available'));
			executeCommand.withArgs('workbench.extensions.search', 'platformio').resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const deps = createMockDeps({ executeCommand, showInformationMessage });

			await showInstallNotification(deps);

			assert.ok(executeCommand.calledWith('workbench.extensions.search', 'platformio'));
			assert.ok(
				executeCommand.neverCalledWith('platformio-ide.showHome'),
				'failed provider installation must not open PlatformIO Home'
			);
			assert.ok(
				executeCommand.neverCalledWith('workbench.action.reloadWindow'),
				'failed installation must not offer or trigger reload'
			);
			assert.strictEqual(showInformationMessage.callCount, 1, 'only the manual-install message should be shown');
		});
	});

	// ─── T013 (US1/US2): 編輯器開啟觸發測試 ──────────────────────────────

	describe('editor-open provider check (US1/US2)', () => {
		it('[US1] should auto-install when no provider is installed', async () => {
			const executeCommand = sinon.stub().resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const deps = createMockDeps({
				getExtension: sinon.stub().returns(undefined),
				executeCommand,
				showInformationMessage,
			});
			// 不論板子類型，只要無 provider 就觸發安裝
			if (!isProviderInstalled(deps)) {
				await showInstallNotification(deps);
			}
			assert.ok(
				executeCommand.calledWith('workbench.extensions.installExtension', 'platformio.platformio-ide'),
				'should call installExtension directly'
			);
		});

		it('[US1/US4] should NOT install when PlatformIO is already installed', async () => {
			const executeCommand = sinon.stub().resolves();
			const deps = createMockDeps({
				getExtension: sinon.stub().returns({ id: 'platformio.platformio-ide' }),
				executeCommand,
			});
			if (!isProviderInstalled(deps)) {
				await showInstallNotification(deps);
			}
			assert.ok(executeCommand.notCalled, 'no install when provider present');
			assert.ok(
				executeCommand.neverCalledWith('platformio-ide.showHome'),
				'no automatic Home opening when provider was already present'
			);
		});

		it('[US2] should fallback to pioarduino when platformio install fails', async () => {
			const executeCommand = sinon.stub();
			executeCommand
				.withArgs('workbench.extensions.installExtension', 'platformio.platformio-ide')
				.rejects(new Error('Not available on Open VSX'));
			executeCommand.resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const deps = createMockDeps({ executeCommand, showInformationMessage });
			await showInstallNotification(deps);
			assert.ok(
				executeCommand.calledWith('workbench.extensions.installExtension', 'pioarduino.pioarduino-ide'),
				'should auto-fallback to pioarduino'
			);
		});
	});

	// ─── T017 (US4): 迴歸測試 ─────────────────────────────────────────

	describe('regression: existing users unaffected', () => {
		it('[US4] PlatformIO installed: provider is detected', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns({ id: 'platformio.platformio-ide' }),
			});
			assert.strictEqual(isProviderInstalled(deps), true);
		});

		it('[US4] pioarduino installed: provider is detected', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns({ id: 'pioarduino.pioarduino-ide' }),
			});
			assert.strictEqual(isProviderInstalled(deps), true);
		});
	});
});
