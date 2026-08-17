import assert = require('assert');
import { describe, it } from 'mocha';
import { CYBERBRICK_UPLOAD_SETTINGS_KEY } from '../../types/cyberbrickUpload';
import { assertContainsAll, assertDoesNotContainAny, extractFunctionBody, readWorkspaceFile } from './cyberbrickUploadTestUtils';

const htmlPath = 'media/html/blocklyEdit.html';
const scriptPath = 'media/js/blocklyEdit.js';
const cssPath = 'media/css/blocklyEdit.css';
const manifestPath = 'package.json';

describe('CyberBrick upload settings WebView contract', () => {
	it('renders one theme-aware progress surface for determinate setup and indeterminate cleanup', () => {
		const html = readWorkspaceFile(htmlPath);
		const css = readWorkspaceFile(cssPath);
		assertContainsAll(
			html,
			[
				'id="cyberbrickProvisioningStatus"',
				'aria-atomic="true"',
				'id="cyberbrickProvisioningProgressLabel"',
				'id="cyberbrickProvisioningIcon"',
				'id="cyberbrickProvisioningProgressbar"',
				'role="progressbar"',
				'aria-valuemin="0"',
				'aria-valuemax="100"',
				'aria-valuenow="0"',
				'aria-labelledby="cyberbrickProvisioningProgressLabel"',
				'id="cyberbrickProvisioningProgressFill"',
				'id="cyberbrickProvisioningStage"',
				'aria-live="polite"',
				'id="cyberbrickProvisioningKeepConnected"',
			],
			'CyberBrick child-friendly progress markup'
		);
		assertContainsAll(
			css,
			[
				'.cyberbrick-provisioning-progress-card',
				'.cyberbrick-provisioning-progress-track',
				'min-height: 22px',
				'.cyberbrick-provisioning-progress-fill',
				'.cyberbrick-provisioning-progress-card.running',
				'.cyberbrick-provisioning-progress-card.succeeded',
				'.cyberbrick-provisioning-progress-card.failed',
				'.cyberbrick-provisioning-icon',
				'.cyberbrick-provisioning-progress-track::after',
				'animation: cyberbrick-progress-sweep',
				'@media (prefers-reduced-motion: reduce)',
				'@media (forced-colors: active)',
				'var(--editor-focus-ring)',
			],
			'CyberBrick progress styling'
		);
		assert(
			html.indexOf('id="cyberbrickProvisioningStatus"') < html.indexOf('id="cyberbrickProvisioningToggle"') &&
				html.indexOf('id="cyberbrickProvisioningStatus"') < html.indexOf('id="cyberbrickAdvancedToggle"'),
			'shared progress should sit outside and before both operation accordions'
		);
		assert(!css.includes('var(--button-primary-bg)'), 'progress fill must not rely on an undefined theme token');
		const visibleProgressMarkup = html.slice(html.indexOf('id="cyberbrickProvisioningStatus"'), html.indexOf('id="cyberbrickProvisionButton"'));
		assert(!/\d\s*\/\s*6/.test(visibleProgressMarkup), 'student-facing progress must not show n/6');
		assert(!visibleProgressMarkup.includes('%'), 'student-facing progress must not show a percentage');
	});

	it('starts and preserves reducer state while disabling every conflicting provisioning control', () => {
		const script = readWorkspaceFile(scriptPath);
		assertContainsAll(
			script,
			[
				'otaProvisioningState',
				'createInitialState()',
				"type: 'start'",
				'setCyberBrickProvisioningControlsDisabled',
				'cyberbrickUsbPortSelect',
				'cyberbrickRefreshUsbPorts',
				'cyberbrickFriendlyNameInput',
				'cyberbrickWifiSsidSelect',
				'cyberbrickWifiScanButton',
				'cyberbrickWifiPasswordInput',
				'cyberbrickWifiPasswordToggle',
				'cyberbrickProvisionButton',
				'cyberbrickOtaCleanupButton',
				'.cyberbrick-paired-device-actions button',
				"CYBERBRICK_PROVISION_RUNNING",
				"CYBERBRICK_PROVISION_KEEP_CONNECTED",
			],
			'CyberBrick running state and control lock'
		);
		const requestBody = extractFunctionBody(script, 'requestCyberBrickOtaProvisioning');
		assert(requestBody.indexOf("type: 'start'") < requestBody.indexOf("command: 'cyberbrickOtaProvisionRequest'"), 'empty progress must render before postMessage');
		assertContainsAll(
			extractFunctionBody(script, 'renderCyberBrickProvisioningProgress'),
			[
				'activeProgressOperation',
				'cleanupProgressStatus',
				"progressbar.removeAttribute('aria-valuenow')",
				"progressbar.setAttribute('aria-busy', 'true')",
				"progressbar.setAttribute('aria-valuemax', '100')",
			],
			'shared determinate and indeterminate progress behavior'
		);
		const pairedDevicesBody = extractFunctionBody(script, 'renderCyberBrickPairedDevices');
		assertContainsAll(
			pairedDevicesBody,
			["otaProvisioningState.status === 'idle'", 'closeCyberBrickProvisioningAccordion();', 'openCyberBrickProvisioningAccordion();'],
			'CyberBrick terminal progress visibility'
		);
		assert(
			pairedDevicesBody.indexOf("otaProvisioningState.status === 'idle'") < pairedDevicesBody.indexOf('closeCyberBrickProvisioningAccordion();'),
			'paired devices should collapse provisioning only in the idle state'
		);
	});

	it('parses Host messages before reducing and clears the Wi-Fi password only after valid success', () => {
		const script = readWorkspaceFile(scriptPath);
		assertContainsAll(
			extractFunctionBody(script, 'handleCyberBrickOtaProvisionProgress'),
			['parseProgressMessage', 'reduceState', 'renderCyberBrickProvisioningProgress'],
			'validated provisioning progress'
		);
		const resultBody = extractFunctionBody(script, 'handleCyberBrickOtaProvisionResult');
		assertContainsAll(
			resultBody,
			['parseResultMessage', 'reduceState', 'clearCyberBrickWifiPasswordInput', 'setCyberBrickProvisioningControlsDisabled(false)'],
			'validated provisioning result'
		);
		const successIndex = resultBody.indexOf('if (parsed.success)');
		const clearIndex = resultBody.indexOf('clearCyberBrickWifiPasswordInput');
		const failureIndex = resultBody.indexOf('CYBERBRICK_PROVISION_FAILED');
		assert(successIndex >= 0 && clearIndex > successIndex && clearIndex < failureIndex, 'password clearing must stay in the valid success branch');
	});

	it('declares a CyberBrick-only gear button and upload mode modal', () => {
		const html = readWorkspaceFile(htmlPath);

		assertContainsAll(
			html,
			[
				'id="cyberbrickUploadSettingsContainer"',
				'id="cyberbrickUploadSettingsButton"',
				'aria-controls="cyberbrickUploadSettingsModal"',
				'id="cyberbrickUploadSettingsModal"',
				'id="cyberbrickProvisioningToggle"',
				'id="cyberbrickAdvancedToggle"',
			],
			'CyberBrick upload settings markup'
		);
	});

	it('loads and saves settings through explicit WebView messages only', () => {
		const script = readWorkspaceFile(scriptPath);

		assertContainsAll(
			script,
			[
				'const cyberBrickUploadSettingsState',
				"command: 'cyberbrickUploadSettingsLoad'",
				"command: 'cyberbrickUploadSettingsSave'",
				"case 'cyberbrickUploadSettingsLoaded'",
				"case 'cyberbrickUploadSettingsSaved'",
			],
			'CyberBrick upload settings WebView messages'
		);

		assertDoesNotContainAny(
			extractFunctionBody(script, 'applyCyberBrickUploadPanelState'),
			['wifiPassword', 'otaToken', 'pairingSecret'],
			'sanitized CyberBrick panel state renderer'
		);
	});

	it('keeps USB upload flow intact as the single automatic route', () => {
		const script = readWorkspaceFile(scriptPath);
		const uploadBody = extractFunctionBody(script, 'handleUploadClick');

		assert(uploadBody.includes("command: 'requestUpload'"), 'USB/default branch should preserve existing requestUpload flow');
	});

	it('uses CyberBrick-specific styles instead of TXT modal classes', () => {
		const css = readWorkspaceFile(cssPath);

		assertContainsAll(
			css,
			['.cyberbrick-upload-settings-switch', '#cyberbrickUploadSettingsButton', '.cyberbrick-upload-modal-content'],
			'CyberBrick upload settings CSS'
		);
		assert(!css.includes('.cyberbrick-upload-modal-content.txt-'), 'CyberBrick modal styles must not depend on TXT classes');
	});

	it('declares provisioning and paired-device controls without password re-rendering', () => {
		const html = readWorkspaceFile(htmlPath);
		const script = readWorkspaceFile(scriptPath);

		assertContainsAll(
			html,
			[
				'id="cyberbrickPairedDevicesList"',
				'id="cyberbrickUsbPortSelect"',
				'id="cyberbrickWifiSsidSelect"',
				'id="cyberbrickWifiPasswordInput"',
				'id="cyberbrickWifiPasswordToggle"',
				'aria-pressed="false"',
				'cyberbrick-password-eye-open',
				'cyberbrick-password-eye-closed',
				'id="cyberbrickProvisionButton"',
				'id="cyberbrickOtaCleanupButton"',
				'id="cyberbrickProvisioningBody"',
				'id="cyberbrickAdvancedBody"',
			],
			'CyberBrick provisioning markup'
		);
		assertDoesNotContainAny(
			html,
			['Start USB Setup', 'list="cyberbrickWifiSsidOptions"', '<datalist id="cyberbrickWifiSsidOptions"', 'id="cyberbrickWifiSsidInput"'],
			'CyberBrick provisioning fallback text'
		);
		assertContainsAll(script, ['Set Up Wireless Upload', 'CYBERBRICK_PROVISION_BUTTON'], 'CyberBrick provisioning fallback labels');
		assertDoesNotContainAny(
			script,
			[
				'Start USB Setup',
				'Use USB setup below',
				'after USB setup',
				'CYBERBRICK_WIFI_MANUAL_VALUE',
				'CYBERBRICK_WIFI_SSID_MANUAL_OPTION',
				'cyberbrickWifiSsidInput',
				'getCyberBrickManualWifiSsidText',
				'syncCyberBrickWifiSsidManualInput',
			],
			'CyberBrick provisioning runtime fallback text'
		);
		assertContainsAll(
			script,
			[
				"command: 'cyberbrickWifiScanRequest'",
				"command: 'cyberbrickOtaProvisionRequest'",
				"command: 'cyberbrickPairedDeviceDeleteRequest'",
				"command: 'cyberbrickOtaCleanupRequest'",
				"case 'cyberbrickOtaCleanupResult'",
				'cyberbrickWifiSsidSelect',
				'CYBERBRICK_WIFI_SSID_EMPTY_PLACEHOLDER',
				'getSelectedCyberBrickWifiSsid',
				'toggleCyberBrickWifiPasswordVisibility',
				'updateCyberBrickWifiPasswordToggleState',
				'clearCyberBrickWifiPasswordInput',
				'CYBERBRICK_WIFI_PASSWORD_SHOW',
				'CYBERBRICK_WIFI_PASSWORD_HIDE',
				'selectFirstCyberBrickWifiSsidFromScan',
				'getCyberBrickShortDeviceLabel',
				'primaryDeviceId',
			],
			'CyberBrick provisioning/paired-device behavior'
		);
		assertContainsAll(
			extractFunctionBody(script, 'handleCyberBrickWifiScanResult'),
			['selectFirstCyberBrickWifiSsidFromScan', 'message.success'],
			'Wi-Fi scan result should preselect the first scanned SSID after successful scans'
		);
		assertContainsAll(
			extractFunctionBody(script, 'renderCyberBrickWifiNetworks'),
			['getCyberBrickWifiEmptyPlaceholderText()', 'placeholder.disabled = true', "placeholder.value = ''"],
			'Wi-Fi SSID dropdown should show a disabled empty-scan placeholder instead of manual fallback'
		);
		const provisionProgressBody = extractFunctionBody(script, 'renderCyberBrickProvisioningProgress');
		assertContainsAll(
			provisionProgressBody,
			['currentStepState.messageKey', 'getCyberBrickProvisioningStepMessage(currentStepState)', "state.status === 'running'"],
			'OTA setup progress should use reducer-provided localized step keys'
		);
		assertDoesNotContainAny(
			provisionProgressBody,
			['step.message || step.step'],
			'OTA setup progress should not render backend English messages directly'
		);
		assertContainsAll(
			extractFunctionBody(script, 'getCyberBrickProvisioningStepMessage'),
			[
				'CYBERBRICK_PROVISION_STEP_DETECT_USB',
				'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_FOUND',
				'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_CREATING',
				'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_CREATED',
				'CYBERBRICK_PROVISION_STEP_INSTALL_AGENT',
				'CYBERBRICK_PROVISION_STEP_CONFIGURE_WIFI',
				'CYBERBRICK_PROVISION_STEP_CONFIGURE_WIFI_NO_IP',
				'CYBERBRICK_PROVISION_STEP_STORE_SECRETS',
				'CYBERBRICK_PROVISION_STEP_DETECT_USB_FAILED',
				'CYBERBRICK_PROVISION_STEP_READ_DEVICE_ID_FAILED',
				'CYBERBRICK_PROVISION_STEP_INSTALL_AGENT_FAILED',
				'CYBERBRICK_PROVISION_STEP_CONFIGURE_WIFI_FAILED',
				'CYBERBRICK_PROVISION_STEP_VERIFY_AGENT_FAILED',
				'CYBERBRICK_PROVISION_STEP_STORE_SECRETS_FAILED',
			],
			'OTA setup progress step messages should be localized by step code'
		);
		const provisionResultBody = extractFunctionBody(script, 'handleCyberBrickOtaProvisionResult');
		assertContainsAll(
			provisionResultBody,
			['CYBERBRICK_PROVISION_SUCCEEDED', 'CYBERBRICK_PROVISION_FAILED', 'toast.show(successMessage', 'toast.show(errorMessage'],
			'OTA setup result toasts should use localized messages'
		);
		const clearPasswordIndex = provisionResultBody.indexOf('clearCyberBrickWifiPasswordInput();');
		const successBranchIndex = provisionResultBody.indexOf('if (parsed.success)');
		const failureBranchIndex = provisionResultBody.indexOf('} else {', successBranchIndex);
		assert.ok(
			clearPasswordIndex > successBranchIndex && clearPasswordIndex < failureBranchIndex,
			'Wi-Fi password should be cleared only after successful OTA setup'
		);
		assertDoesNotContainAny(
			extractFunctionBody(script, 'requestCyberBrickOtaProvisioning'),
			["passwordInput.value = ''", "passwordInput.type = 'password'", 'clearCyberBrickWifiPasswordInput'],
			'OTA setup submit should keep the Wi-Fi password available until the result succeeds'
		);
		assertContainsAll(
			extractFunctionBody(script, 'clearCyberBrickWifiPasswordInput'),
			["passwordInput.value = ''", "passwordInput.type = 'password'", 'updateCyberBrickWifiPasswordToggleState()'],
			'successful OTA setup should clear the password and hide the password field again'
		);
		assertDoesNotContainAny(
			provisionResultBody,
			['userFacingSummary || window.languageManager', "message.error?.message || window.languageManager"],
			'OTA setup result toasts should not prefer backend English summaries over localized messages'
		);
		assert(!extractFunctionBody(script, 'applyCyberBrickUploadPanelState').includes('cyberbrickWifiPasswordInput'), 'saved panel state must not re-render a Wi-Fi password');
		assertContainsAll(
			extractFunctionBody(script, 'renderCyberBrickPairedDevices'),
			['event.preventDefault();', 'event.stopPropagation();', 'void confirmCyberBrickDeviceDelete(device);'],
			'paired-device action buttons should not bubble into the Blockly workspace'
		);
		assertContainsAll(
			extractFunctionBody(script, 'confirmCyberBrickDeviceDelete'),
			['await showAsyncConfirm', "command: 'cyberbrickPairedDeviceDeleteRequest'"],
			'paired-device deletion should use a non-Blockly confirmation flow'
		);
		assertDoesNotContainAny(
			extractFunctionBody(script, 'confirmCyberBrickDeviceDelete'),
			['window.confirm', "purpose: 'blocklyDelete'"],
			'paired-device deletion must not reuse Blockly workspace deletion confirmation'
		);
		const cleanupRequestBody = extractFunctionBody(script, 'requestCyberBrickOtaCleanup');
		assertContainsAll(
			cleanupRequestBody,
			['await showAsyncConfirm', "command: 'cyberbrickOtaCleanupRequest'", 'payload: { usbPort }'],
			'OTA cleanup should require confirmation and send only the USB port (USB physical connection is the trust anchor, not settings primary device)'
		);
		assertContainsAll(
			cleanupRequestBody,
			[
				"activeProgressOperation = 'cleanup'",
				"cleanupProgressStatus = 'running'",
				'cleanupRequestId = requestId',
				'renderCyberBrickProvisioningProgress()',
			],
			'OTA cleanup should render through the shared progress surface'
		);
		assert(
			cleanupRequestBody.indexOf('renderCyberBrickProvisioningProgress()') < cleanupRequestBody.indexOf("command: 'cyberbrickOtaCleanupRequest'"),
			'cleanup progress should become visible before the Host request starts'
		);
		assertDoesNotContainAny(
			extractFunctionBody(script, 'requestCyberBrickOtaCleanup'),
			['deviceId: device.deviceId', 'device?.deviceId'],
			'OTA cleanup must not pass primary device ID — cleanup targets whatever is physically connected via USB'
		);
		assertDoesNotContainAny(
			extractFunctionBody(script, 'requestCyberBrickOtaCleanup'),
			['CYBERBRICK_OTA_CLEANUP_DEVICE_REQUIRED'],
			'OTA cleanup should be allowed for any USB-connected CyberBrick, not only paired devices'
		);
		assertDoesNotContainAny(
			extractFunctionBody(script, 'requestCyberBrickOtaCleanup'),
			['window.confirm', "purpose: 'blocklyDelete'"],
			'OTA cleanup must not reuse Blockly workspace deletion confirmation'
		);
		assertContainsAll(
			extractFunctionBody(script, 'handleCyberBrickOtaCleanupResult'),
			['message.requestId !== cyberBrickUploadSettingsState.cleanupRequestId', 'cleanupRequestId = null'],
			'stale cleanup results must not replace a newer shared-progress operation'
		);
	});

	it('renders OTA progress/result UI and no automatic USB fallback hook', () => {
		const script = readWorkspaceFile(scriptPath);

		assertContainsAll(
			script,
			[
				"case 'cyberbrickOtaUploadProgress'",
				"case 'cyberbrickOtaUploadResult'",
				'USB fallback is manual only',
			],
			'CyberBrick OTA progress/result UI'
		);
	});

	it('registers CyberBrick upload settings so VS Code allows workspace writes', () => {
		const manifest = JSON.parse(readWorkspaceFile(manifestPath));
		const property = manifest.contributes?.configuration?.properties?.[CYBERBRICK_UPLOAD_SETTINGS_KEY];

		assert.ok(property, `${CYBERBRICK_UPLOAD_SETTINGS_KEY} should be declared in contributes.configuration.properties`);
		assert.strictEqual(property.type, 'object');
		assert.strictEqual(property.scope, 'resource');
		assert.strictEqual(property.default.schemaVersion, 2);
		assert.deepStrictEqual(property.default.pairedDevices, []);
	});
});
