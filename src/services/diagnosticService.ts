/**
 * MCP Diagnostic Service
 * Collects and formats MCP Server diagnostic information
 * @module services/diagnosticService
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { NodeDetectionService } from './nodeDetectionService';
import { LocaleService } from './localeService';
import {
	IDiagnosticService,
	McpDiagnosticReport,
	DiagnosticReportFormatOptions,
	McpStatus,
	NodeDetectionResult,
} from '../types/nodeDetection';
import { log } from './logging';

/**
 * Map Blockly language codes to locale strings for date formatting
 */
const LOCALE_MAP: Record<string, string> = {
	'zh-hant': 'zh-TW',
	en: 'en-US',
	ja: 'ja-JP',
	ko: 'ko-KR',
	de: 'de-DE',
	es: 'es-ES',
	fr: 'fr-FR',
	'pt-br': 'pt-BR',
	it: 'it-IT',
	ru: 'ru-RU',
	pl: 'pl-PL',
	hu: 'hu-HU',
	cs: 'cs-CZ',
	tr: 'tr-TR',
	bg: 'bg-BG',
};

/**
 * Diagnostic service implementation
 */
export class DiagnosticService implements IDiagnosticService {
	constructor(
		private nodeDetectionService: NodeDetectionService,
		private localeService: LocaleService
	) {}

	/**
	 * Get the locale string for date formatting based on current language
	 */
	private getDateLocale(): string {
		const currentLang = this.localeService.getCurrentLanguage();
		return LOCALE_MAP[currentLang] || 'en-US';
	}

	/**
	 * Collect MCP diagnostic information
	 * @param extensionPath Extension installation path
	 * @returns MCP diagnostic report
	 */
	async collectDiagnostics(extensionPath: string): Promise<McpDiagnosticReport> {
		log('Collecting MCP diagnostics...', 'info');

		// 1. Node.js detection
		const config = vscode.workspace.getConfiguration('singularBlockly.mcp');
		const nodePath = config.get<string>('nodePath', 'node');
		const nodeDetection = await this.nodeDetectionService.detectNodeJs(nodePath);

		// 2. MCP Server Bundle check
		const mcpServerBundlePath = path.join(extensionPath, 'dist', 'mcp-server.js');
		const mcpServerBundleExists = fs.existsSync(mcpServerBundlePath);

		// 3. VSCode API version check
		const vscodeVersion = vscode.version;
		const vscodeApiSupported = this.checkVSCodeVersion(vscodeVersion);

		// 4. Workspace path
		const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || null;

		// 5. Overall status assessment
		const overallStatus = this.assessOverallStatus(nodeDetection, mcpServerBundleExists, vscodeApiSupported);

		// 6. Generate recommendations (now async for localization)
		const recommendations = await this.generateRecommendations(
			nodeDetection,
			mcpServerBundleExists,
			vscodeApiSupported,
			workspacePath
		);

		const report: McpDiagnosticReport = {
			nodeDetection,
			mcpServerBundleExists,
			mcpServerBundlePath,
			vscodeApiSupported,
			vscodeVersion,
			workspacePath,
			overallStatus,
			recommendations,
			timestamp: new Date().toISOString(),
		};

		log('MCP diagnostics collected', 'info', {
			overallStatus,
			nodeAvailable: nodeDetection.available,
			nodeCompatible: nodeDetection.versionCompatible,
			bundleExists: mcpServerBundleExists,
			vscodeSupported: vscodeApiSupported,
		});

		return report;
	}

	/**
	 * Format diagnostic report into user-readable text (async for localization)
	 * @param report Diagnostic report
	 * @param options Format options
	 * @returns Formatted report text
	 */
	async formatReport(report: McpDiagnosticReport, options?: DiagnosticReportFormatOptions): Promise<string> {
		const useEmoji = options?.useEmoji ?? true;
		const checkmark = useEmoji ? '✅' : '[OK]';
		const cross = useEmoji ? '❌' : '[FAIL]';
		const folder = useEmoji ? '📁' : '[DIR]';
		const gear = useEmoji ? '⚙️' : '[CFG]';
		const time = useEmoji ? '⏰' : '[TIME]';

		// Get localized strings
		const reportTitle = await this.localeService.getLocalizedMessage('DIAG_REPORT_TITLE', 'MCP Server Diagnostic Report');
		const nodeVersionLabel = await this.localeService.getLocalizedMessage('DIAG_NODEJS_VERSION', 'Node.js Version');
		const versionTooLow = await this.localeService.getLocalizedMessage(
			'DIAG_VERSION_TOO_LOW',
			'Version too low ({0}, requires >= 22.16.0)',
			report.nodeDetection.version || ''
		);
		const mcpBundleLabel = await this.localeService.getLocalizedMessage('DIAG_MCP_BUNDLE', 'MCP Server Bundle');
		const existsText = await this.localeService.getLocalizedMessage('DIAG_EXISTS', 'Exists');
		const fileNotFound = await this.localeService.getLocalizedMessage('DIAG_FILE_NOT_FOUND', 'File not found');
		const vscodeApiLabel = await this.localeService.getLocalizedMessage('DIAG_VSCODE_API_VERSION', 'VSCode API Version');
		const requiresVersion = await this.localeService.getLocalizedMessage('DIAG_REQUIRES_VERSION', 'requires >= {0}', '1.105.0');
		const workspaceLabel = await this.localeService.getLocalizedMessage('DIAG_WORKSPACE_PATH', 'Workspace Path');
		const noneText = await this.localeService.getLocalizedMessage('DIAG_NONE', 'None');
		const nodePathLabel = await this.localeService.getLocalizedMessage('DIAG_NODEJS_PATH', 'Node.js Path');
		const systemPath = await this.localeService.getLocalizedMessage('DIAG_SYSTEM_PATH', 'System PATH');
		const statusLabel = await this.localeService.getLocalizedMessage('DIAG_STATUS', 'Status');
		const statusOperational = await this.localeService.getLocalizedMessage(
			'DIAG_STATUS_OPERATIONAL',
			'MCP Server is operational'
		);
		const statusPartial = await this.localeService.getLocalizedMessage(
			'DIAG_STATUS_PARTIAL',
			'MCP Server is partially available'
		);
		const statusUnavailable = await this.localeService.getLocalizedMessage('DIAG_STATUS_UNAVAILABLE', 'MCP Server is unavailable');
		const recommendationsLabel = await this.localeService.getLocalizedMessage('DIAG_RECOMMENDATIONS', 'Recommendations');
		const generatedAt = await this.localeService.getLocalizedMessage('DIAG_GENERATED_AT', 'Generated at');

		let reportText = `【${reportTitle}】\n\n`;

		// Node.js status
		if (report.nodeDetection.available && report.nodeDetection.versionCompatible) {
			reportText += `${checkmark} ${nodeVersionLabel}: ${report.nodeDetection.version}\n`;
		} else if (report.nodeDetection.available && !report.nodeDetection.versionCompatible) {
			reportText += `${cross} Node.js: ${versionTooLow}\n`;
		} else {
			reportText += `${cross} Node.js: ${report.nodeDetection.errorMessage}\n`;
		}

		// MCP Bundle
		reportText += `${report.mcpServerBundleExists ? checkmark : cross} ${mcpBundleLabel}: ${
			report.mcpServerBundleExists ? existsText : fileNotFound
		}\n`;

		// VSCode API
		reportText += `${report.vscodeApiSupported ? checkmark : cross} ${vscodeApiLabel}: ${report.vscodeVersion}${
			!report.vscodeApiSupported ? ` (${requiresVersion})` : ''
		}\n`;

		// Workspace path
		reportText += `${folder} ${workspaceLabel}: ${report.workspacePath || noneText}\n`;

		// Node.js path setting
		const nodePathDisplay = report.nodeDetection.nodePath === 'node' ? `node (${systemPath})` : report.nodeDetection.nodePath;
		reportText += `${gear} ${nodePathLabel}: ${nodePathDisplay}\n`;

		// Status
		const statusText =
			report.overallStatus === 'operational'
				? statusOperational
				: report.overallStatus === 'partially_available'
					? statusPartial
					: statusUnavailable;
		reportText += `\n${statusLabel}: ${statusText}\n`;

		// Recommendations
		if (report.recommendations.length > 0) {
			reportText += `\n${recommendationsLabel}:\n`;
			for (const recommendation of report.recommendations) {
				reportText += `• ${recommendation}\n`;
			}
		}

		// Timestamp (if requested)
		if (options?.includeTimestamp !== false) {
			const dateLocale = this.getDateLocale();
			const timestamp = new Date(report.timestamp).toLocaleString(dateLocale, { hour12: false });
			reportText += `\n${time} ${generatedAt}: ${timestamp}\n`;
		}

		return reportText;
	}

	/**
	 * Copy diagnostic report to clipboard
	 * @param report Diagnostic report
	 * @returns Whether the copy was successful
	 */
	async copyToClipboard(report: McpDiagnosticReport): Promise<boolean> {
		try {
			const plainTextReport = await this.formatPlainTextReport(report);
			await vscode.env.clipboard.writeText(plainTextReport);
			log('Diagnostic report copied to clipboard', 'info');
			return true;
		} catch (error) {
			log('Failed to copy diagnostic report to clipboard', 'error', error);
			return false;
		}
	}

	/**
	 * Format diagnostic report as plain text (suitable for copying to GitHub Issue)
	 * @param report Diagnostic report
	 * @returns Plain text formatted report
	 */
	private async formatPlainTextReport(report: McpDiagnosticReport): Promise<string> {
		// Get localized strings
		const reportTitle = await this.localeService.getLocalizedMessage('DIAG_REPORT_TITLE', 'MCP Server Diagnostic Report');
		const generatedAt = await this.localeService.getLocalizedMessage('DIAG_GENERATED_AT', 'Generated at');
		const nodeStatusLabel = await this.localeService.getLocalizedMessage('DIAG_NODEJS_STATUS', 'Node.js Status');
		const availableLabel = await this.localeService.getLocalizedMessage('DIAG_AVAILABLE', 'Available');
		const yesText = await this.localeService.getLocalizedMessage('DIAG_YES', 'Yes');
		const noText = await this.localeService.getLocalizedMessage('DIAG_NO', 'No');
		const versionLabel = await this.localeService.getLocalizedMessage('DIAG_VERSION', 'Version');
		const compatibleLabel = await this.localeService.getLocalizedMessage('DIAG_COMPATIBLE', 'Compatible');
		const errorLabel = await this.localeService.getLocalizedMessage('DIAG_ERROR', 'Error');
		const pathLabel = await this.localeService.getLocalizedMessage('DIAG_PATH', 'Path');
		const mcpBundleLabel = await this.localeService.getLocalizedMessage('DIAG_MCP_BUNDLE', 'MCP Server Bundle');
		const existsLabel = await this.localeService.getLocalizedMessage('DIAG_EXISTS', 'Exists');
		const vscodeApiLabel = await this.localeService.getLocalizedMessage('DIAG_VSCODE_API_VERSION', 'VSCode API');
		const supportedLabel = await this.localeService.getLocalizedMessage('DIAG_SUPPORTED', 'Supported');
		const workspaceLabel = await this.localeService.getLocalizedMessage('DIAG_WORKSPACE_PATH', 'Workspace');
		const noneText = await this.localeService.getLocalizedMessage('DIAG_NONE', 'None');
		const overallStatusLabel = await this.localeService.getLocalizedMessage('DIAG_OVERALL_STATUS', 'Overall Status');
		const operationalShort = await this.localeService.getLocalizedMessage('DIAG_OPERATIONAL_SHORT', 'Operational');
		const partialShort = await this.localeService.getLocalizedMessage('DIAG_PARTIAL_SHORT', 'Partially available');
		const unavailableShort = await this.localeService.getLocalizedMessage('DIAG_UNAVAILABLE_SHORT', 'Unavailable');
		const recommendationsLabel = await this.localeService.getLocalizedMessage('DIAG_RECOMMENDATIONS', 'Recommendations');
		const systemPath = await this.localeService.getLocalizedMessage('DIAG_SYSTEM_PATH', 'System PATH');

		const dateLocale = this.getDateLocale();

		let text = `${reportTitle}\n`;
		text += '==================\n';
		text += `${generatedAt}: ${new Date(report.timestamp).toLocaleString(dateLocale, { hour12: false })}\n\n`;

		text += `${nodeStatusLabel}:\n`;
		text += `  - ${availableLabel}: ${report.nodeDetection.available ? yesText : noText}\n`;
		if (report.nodeDetection.version) {
			text += `  - ${versionLabel}: ${report.nodeDetection.version}\n`;
			text += `  - ${compatibleLabel}: ${report.nodeDetection.versionCompatible ? yesText : noText}\n`;
		} else {
			text += `  - ${errorLabel}: ${report.nodeDetection.errorMessage}\n`;
		}
		const nodePathDisplay = report.nodeDetection.nodePath === 'node' ? `node (${systemPath})` : report.nodeDetection.nodePath;
		text += `  - ${pathLabel}: ${nodePathDisplay}\n\n`;

		text += `${mcpBundleLabel}:\n`;
		text += `  - ${existsLabel}: ${report.mcpServerBundleExists ? yesText : noText}\n`;
		text += `  - ${pathLabel}: ${report.mcpServerBundlePath}\n\n`;

		text += `${vscodeApiLabel}:\n`;
		text += `  - ${supportedLabel}: ${report.vscodeApiSupported ? yesText : noText}\n`;
		text += `  - ${versionLabel}: ${report.vscodeVersion}\n\n`;

		text += `${workspaceLabel}:\n`;
		text += `  - ${pathLabel}: ${report.workspacePath || noneText}\n\n`;

		const statusText =
			report.overallStatus === 'operational'
				? operationalShort
				: report.overallStatus === 'partially_available'
					? partialShort
					: unavailableShort;
		text += `${overallStatusLabel}: ${statusText}\n`;

		if (report.recommendations.length > 0) {
			text += `\n${recommendationsLabel}:\n`;
			for (let i = 0; i < report.recommendations.length; i++) {
				text += `  ${i + 1}. ${report.recommendations[i]}\n`;
			}
		}

		return text;
	}

	/**
	 * Check if VSCode version supports MCP API (>= 1.105.0)
	 * @param version VSCode version string
	 * @returns Whether the version is supported
	 */
	private checkVSCodeVersion(version: string): boolean {
		const match = version.match(/^(\d+)\.(\d+)\.(\d+)/);
		if (!match) {
			return false;
		}

		const major = parseInt(match[1], 10);
		const minor = parseInt(match[2], 10);

		return major > 1 || (major === 1 && minor >= 105);
	}

	/**
	 * Assess overall MCP status based on detection results
	 * @returns Overall status
	 */
	private assessOverallStatus(nodeDetection: NodeDetectionResult, mcpBundleExists: boolean, vscodeSupported: boolean): McpStatus {
		// Fully operational: all requirements met
		if (nodeDetection.available && nodeDetection.versionCompatible && mcpBundleExists && vscodeSupported) {
			return 'operational';
		}

		// Partially available: Node.js available but version low
		if (nodeDetection.available && !nodeDetection.versionCompatible && mcpBundleExists && vscodeSupported) {
			return 'partially_available';
		}

		// Unavailable: critical requirements not met
		return 'unavailable';
	}

	/**
	 * Generate actionable recommendations based on diagnostic results (async for localization)
	 * @returns List of recommendations
	 */
	private async generateRecommendations(
		nodeDetection: NodeDetectionResult,
		mcpBundleExists: boolean,
		vscodeSupported: boolean,
		workspacePath: string | null
	): Promise<string[]> {
		const recommendations: string[] = [];

		// Node.js recommendations
		if (!nodeDetection.available) {
			recommendations.push(
				await this.localeService.getLocalizedMessage('REC_INSTALL_NODEJS', 'Install Node.js 22.16.0 or later')
			);
			recommendations.push(
				await this.localeService.getLocalizedMessage(
					'REC_SET_NODEJS_PATH',
					'If already installed, specify the Node.js path in settings (singularBlockly.mcp.nodePath)'
				)
			);
		} else if (!nodeDetection.versionCompatible) {
			recommendations.push(
				await this.localeService.getLocalizedMessage(
					'REC_UPGRADE_NODEJS',
					'Upgrade Node.js to 22.16.0 or later (current: {0})',
					nodeDetection.version || ''
				)
			);
		}

		// MCP Bundle recommendations
		if (!mcpBundleExists) {
			recommendations.push(
				await this.localeService.getLocalizedMessage('REC_RUN_COMPILE', 'Run `npm run compile` or reinstall the extension')
			);
		}

		// VSCode API recommendations
		if (!vscodeSupported) {
			recommendations.push(
				await this.localeService.getLocalizedMessage('REC_UPGRADE_VSCODE', 'Upgrade VSCode to 1.105.0 or later')
			);
		}

		// Workspace recommendations
		if (!workspacePath) {
			recommendations.push(
				await this.localeService.getLocalizedMessage('REC_OPEN_PROJECT', 'Open a project folder to use full features')
			);
		}

		return recommendations;
	}
}
