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
	PenvProviderStatus,
	isProviderInstalled,
	detectStatus,
	attemptInstall,
	waitForPenvReady,
	showInstallNotification,
} from '../services/penvProviderService';

// ─── 測試輔助函數 ──────────────────────────────────────────────────────────────

function createMockDeps(overrides: Partial<PenvProviderServiceDeps> = {}): PenvProviderServiceDeps {
	return {
		getExtension: sinon.stub().returns(undefined),
		executeCommand: sinon.stub().resolves(),
		showInformationMessage: sinon.stub().resolves(undefined),
		checkPenvExists: sinon.stub().returns(false),
		...overrides,
	};
}

// ─── T010: 單元測試 ────────────────────────────────────────────────────────────

describe('PenvProviderService', () => {
	// 可注入的立即 delay 函數（避免 sinon fake timers 與 VS Code 內建計時器衝突）
	const noDelay = (_ms: number) => Promise.resolve();

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
	});

	// ─── (b) detectStatus ──────────────────────────────────────────────────

	describe('detectStatus', () => {
		it('should return not-installed when no provider is installed', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns(undefined),
				checkPenvExists: sinon.stub().returns(false),
			});
			const result: PenvProviderStatus = detectStatus(deps);
			assert.strictEqual(result, 'not-installed');
		});

		it('should return installed-ready when provider installed and penv exists', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns({ id: 'platformio.platformio-ide' }),
				checkPenvExists: sinon.stub().returns(true),
			});
			assert.strictEqual(detectStatus(deps), 'installed-ready');
		});

		it('should return installed-pending when provider installed but penv not yet ready', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns({ id: 'platformio.platformio-ide' }),
				checkPenvExists: sinon.stub().returns(false),
			});
			assert.strictEqual(detectStatus(deps), 'installed-pending');
		});
	});

	// ─── (c) attemptInstall ────────────────────────────────────────────────

	describe('attemptInstall', () => {
		it('should install platformio.platformio-ide when available', async () => {
			const executeCommand = sinon.stub().resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			await attemptInstall({ executeCommand, showInformationMessage });
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
			await attemptInstall({ executeCommand, showInformationMessage });
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
			await attemptInstall({ executeCommand, showInformationMessage });
			assert.ok(executeCommand.calledWith('workbench.extensions.search', 'platformio'));
			assert.ok(showInformationMessage.calledOnce);
		});
	});

	// ─── (d) waitForPenvReady ─────────────────────────────────────────────

	describe('waitForPenvReady', () => {
		it('should return true when penv is ready on the first retry', async () => {
			const checkFn = sinon.stub().returns(true);
			const result = await waitForPenvReady(checkFn, 3, 0, noDelay);
			assert.strictEqual(result, true);
			assert.strictEqual(checkFn.callCount, 1);
		});

		it('should succeed after 2 failed retries', async () => {
			const checkFn = sinon.stub();
			checkFn.onCall(0).returns(false);
			checkFn.onCall(1).returns(false);
			checkFn.onCall(2).returns(true);
			const result = await waitForPenvReady(checkFn, 3, 0, noDelay);
			assert.strictEqual(result, true);
			assert.strictEqual(checkFn.callCount, 3);
		});

		it('should return false after exhausting all retries', async () => {
			const checkFn = sinon.stub().returns(false);
			const result = await waitForPenvReady(checkFn, 3, 0, noDelay);
			assert.strictEqual(result, false);
			assert.strictEqual(checkFn.callCount, 3);
		});
	});

	// ─── (e) showInstallNotification ──────────────────────────────────────

	describe('showInstallNotification', () => {
		it('should auto-install without showing a pre-install notification', async () => {
			const executeCommand = sinon.stub().resolves();
			const showInformationMessage = sinon.stub().resolves(undefined);
			const deps = createMockDeps({ executeCommand, showInformationMessage });
			await showInstallNotification(deps);
			// VS Code 自己的確認對話框處理使用者互動，我們不再疊加通知
			assert.ok(
				executeCommand.calledWith('workbench.extensions.installExtension', 'platformio.platformio-ide'),
				'should trigger installExtension directly'
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
		it('[US4] PlatformIO installed: detectStatus returns installed-ready', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns({ id: 'platformio.platformio-ide' }),
				checkPenvExists: sinon.stub().returns(true),
			});
			assert.strictEqual(detectStatus(deps), 'installed-ready');
		});

		it('[US4] pioarduino installed: detectStatus returns installed-ready', () => {
			const deps = createMockDeps({
				getExtension: sinon.stub().returns({ id: 'pioarduino.pioarduino-ide' }),
				checkPenvExists: sinon.stub().returns(true),
			});
			assert.strictEqual(detectStatus(deps), 'installed-ready');
		});
	});
});
