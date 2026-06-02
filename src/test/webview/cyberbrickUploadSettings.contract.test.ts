import assert = require('assert');
import { describe, it } from 'mocha';
import { CYBERBRICK_UPLOAD_SETTINGS_KEY } from '../../types/cyberbrickUpload';
import { assertContainsAll, assertDoesNotContainAny, extractFunctionBody, readWorkspaceFile } from './cyberbrickUploadTestUtils';

const htmlPath = 'media/html/blocklyEdit.html';
const scriptPath = 'media/js/blocklyEdit.js';
const cssPath = 'media/css/blocklyEdit.css';
const manifestPath = 'package.json';

describe('CyberBrick upload settings WebView contract', () => {
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
				'id="cyberbrickWifiSsidInput"',
				'id="cyberbrickWifiPasswordInput"',
				'id="cyberbrickWifiPasswordToggle"',
				'aria-pressed="false"',
				'cyberbrick-password-eye-open',
				'cyberbrick-password-eye-closed',
				'id="cyberbrickProvisionButton"',
				'id="cyberbrickOtaCleanupButton"',
				'id="cyberbrickOtaCleanupStatus"',
				'id="cyberbrickProvisioningBody"',
				'id="cyberbrickAdvancedBody"',
			],
			'CyberBrick provisioning markup'
		);
		assertDoesNotContainAny(html, ['Start USB Setup', 'list="cyberbrickWifiSsidOptions"', '<datalist id="cyberbrickWifiSsidOptions"'], 'CyberBrick provisioning fallback text');
		assertContainsAll(script, ['Set Up Wireless Upload', 'CYBERBRICK_PROVISION_BUTTON'], 'CyberBrick provisioning fallback labels');
		assertDoesNotContainAny(script, ['Start USB Setup', 'Use USB setup below', 'after USB setup'], 'CyberBrick provisioning runtime fallback text');
		assertContainsAll(
			script,
			[
				"command: 'cyberbrickWifiScanRequest'",
				"command: 'cyberbrickOtaProvisionRequest'",
				"command: 'cyberbrickPairedDeviceDeleteRequest'",
				"command: 'cyberbrickOtaCleanupRequest'",
				"case 'cyberbrickOtaCleanupResult'",
				'cyberbrickWifiSsidSelect',
				'CYBERBRICK_WIFI_SSID_MANUAL_OPTION',
				'getSelectedCyberBrickWifiSsid',
				'syncCyberBrickWifiSsidManualInput',
				'toggleCyberBrickWifiPasswordVisibility',
				'updateCyberBrickWifiPasswordToggleState',
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
		const provisionProgressBody = extractFunctionBody(script, 'renderCyberBrickProvisioningProgress');
		assertContainsAll(
			provisionProgressBody,
			['getCyberBrickProvisioningStepMessage(step)', 'isCreatingDeviceId'],
			'OTA setup progress should use localized step messages and avoid marking identity creation as failed'
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
			],
			'OTA setup progress step messages should be localized by step code'
		);
		const provisionResultBody = extractFunctionBody(script, 'handleCyberBrickOtaProvisionResult');
		assertContainsAll(
			provisionResultBody,
			['CYBERBRICK_PROVISION_SUCCEEDED', 'CYBERBRICK_PROVISION_FAILED', 'toast.show(successMessage', 'toast.show(errorMessage'],
			'OTA setup result toasts should use localized messages'
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
		assertContainsAll(
			extractFunctionBody(script, 'requestCyberBrickOtaCleanup'),
			['await showAsyncConfirm', "command: 'cyberbrickOtaCleanupRequest'", 'payload: { usbPort }'],
			'OTA cleanup should require confirmation and send only the USB port (USB physical connection is the trust anchor, not settings primary device)'
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
