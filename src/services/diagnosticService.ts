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
 * Diagnostic service implementation
 */
export class DiagnosticService implements IDiagnosticService {
	constructor(
		private nodeDetectionService: NodeDetectionService,
		private localeService: LocaleService
	) {}

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

		// 6. Generate recommendations
		const recommendations = this.generateRecommendations(nodeDetection, mcpServerBundleExists, vscodeApiSupported, workspacePath);

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
	 * Format diagnostic report into user-readable text
	 * @param report Diagnostic report
	 * @param options Format options
	 * @returns Formatted report text
	 */
	formatReport(report: McpDiagnosticReport, options?: DiagnosticReportFormatOptions): string {
		const useEmoji = options?.useEmoji ?? true;
		const checkmark = useEmoji ? '✅' : '[OK]';
		const cross = useEmoji ? '❌' : '[FAIL]';
		const folder = useEmoji ? '📁' : '[DIR]';
		const gear = useEmoji ? '⚙️' : '[CFG]';
		const time = useEmoji ? '⏰' : '[TIME]';

		let reportText = '【MCP Server 診斷報告】\n\n';

		// Node.js status
		if (report.nodeDetection.available && report.nodeDetection.versionCompatible) {
			reportText += `${checkmark} Node.js 版本: ${report.nodeDetection.version}\n`;
		} else if (report.nodeDetection.available && !report.nodeDetection.versionCompatible) {
			reportText += `${cross} Node.js: 版本過低 (${report.nodeDetection.version}, 需要 >= 22.16.0)\n`;
		} else {
			reportText += `${cross} Node.js: ${report.nodeDetection.errorMessage}\n`;
		}

		// MCP Bundle
		reportText += `${report.mcpServerBundleExists ? checkmark : cross} MCP Server Bundle: ${
			report.mcpServerBundleExists ? '存在' : '檔案不存在'
		}\n`;

		// VSCode API
		reportText += `${report.vscodeApiSupported ? checkmark : cross} VSCode API 版本: ${report.vscodeVersion}${
			!report.vscodeApiSupported ? ' (需要 >= 1.105.0)' : ''
		}\n`;

		// Workspace path
		reportText += `${folder} 工作區路徑: ${report.workspacePath || '無'}\n`;

		// Node.js path setting
		const nodePathDisplay = report.nodeDetection.nodePath === 'node' ? 'node (系統 PATH)' : report.nodeDetection.nodePath;
		reportText += `${gear} Node.js 路徑: ${nodePathDisplay}\n`;

		// Status
		const statusText =
			report.overallStatus === 'operational'
				? 'MCP Server 可正常運作'
				: report.overallStatus === 'partially_available'
					? 'MCP Server 部分可用'
					: 'MCP Server 無法啟動';
		reportText += `\n狀態: ${statusText}\n`;

		// Recommendations
		if (report.recommendations.length > 0) {
			reportText += '\n建議:\n';
			for (const recommendation of report.recommendations) {
				reportText += `• ${recommendation}\n`;
			}
		}

		// Timestamp (if requested)
		if (options?.includeTimestamp !== false) {
			const timestamp = new Date(report.timestamp).toLocaleString('zh-TW', { hour12: false });
			reportText += `\n${time} 生成時間: ${timestamp}\n`;
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
			const plainTextReport = this.formatPlainTextReport(report);
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
	private formatPlainTextReport(report: McpDiagnosticReport): string {
		let text = 'MCP Server 診斷報告\n';
		text += '==================\n';
		text += `生成時間: ${new Date(report.timestamp).toLocaleString('zh-TW', { hour12: false })}\n\n`;

		text += 'Node.js 狀態:\n';
		text += `  - 可用: ${report.nodeDetection.available ? '是' : '否'}\n`;
		if (report.nodeDetection.version) {
			text += `  - 版本: ${report.nodeDetection.version}\n`;
			text += `  - 相容: ${report.nodeDetection.versionCompatible ? '是' : '否'}\n`;
		} else {
			text += `  - 錯誤: ${report.nodeDetection.errorMessage}\n`;
		}
		const nodePathDisplay = report.nodeDetection.nodePath === 'node' ? 'node (系統 PATH)' : report.nodeDetection.nodePath;
		text += `  - 路徑: ${nodePathDisplay}\n\n`;

		text += 'MCP Server Bundle:\n';
		text += `  - 存在: ${report.mcpServerBundleExists ? '是' : '否'}\n`;
		text += `  - 路徑: ${report.mcpServerBundlePath}\n\n`;

		text += 'VSCode API:\n';
		text += `  - 支援: ${report.vscodeApiSupported ? '是' : '否'}\n`;
		text += `  - 版本: ${report.vscodeVersion}\n\n`;

		text += '工作區:\n';
		text += `  - 路徑: ${report.workspacePath || '無'}\n\n`;

		const statusText =
			report.overallStatus === 'operational'
				? '可正常運作'
				: report.overallStatus === 'partially_available'
					? '部分可用'
					: '無法啟動';
		text += `綜合狀態: ${statusText}\n`;

		if (report.recommendations.length > 0) {
			text += '\n建議:\n';
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
	 * Generate actionable recommendations based on diagnostic results
	 * @returns List of recommendations
	 */
	private generateRecommendations(
		nodeDetection: NodeDetectionResult,
		mcpBundleExists: boolean,
		vscodeSupported: boolean,
		workspacePath: string | null
	): string[] {
		const recommendations: string[] = [];

		// Node.js recommendations
		if (!nodeDetection.available) {
			recommendations.push('安裝 Node.js 22.16.0 或更新版本');
			recommendations.push('若已安裝,請在設定中指定 Node.js 路徑 (singularBlockly.mcp.nodePath)');
		} else if (!nodeDetection.versionCompatible) {
			recommendations.push(`升級 Node.js 至 22.16.0 或更新版本 (目前: ${nodeDetection.version})`);
		}

		// MCP Bundle recommendations
		if (!mcpBundleExists) {
			recommendations.push('執行 `npm run compile` 或重新安裝 Extension');
		}

		// VSCode API recommendations
		if (!vscodeSupported) {
			recommendations.push('升級 VSCode 至 1.105.0 或更新版本');
		}

		// Workspace recommendations
		if (!workspacePath) {
			recommendations.push('開啟專案資料夾以使用完整功能');
		}

		return recommendations;
	}
}
