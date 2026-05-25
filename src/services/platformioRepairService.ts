/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as os from 'os';
import * as path from 'path';
import { createPlatformioPrivacyRedactor, PlatformioPrivacyRedactor } from './platformioPrivacyRedactor';
import { createExecFilePromise } from './platformioProcess';
import {
	AutoRepairRun,
	AutoRepairRunStatus,
	DiagnosticItemId,
	EnvironmentFingerprint,
	PlatformioDiagnosticItem,
	PlatformioDiagnosticSession,
	RepairFlow,
	RepairHistorySummary,
	RepairStep,
	RepairStepResult,
	RepairStepResultStatus,
} from '../types/platformioDiagnostic';

export interface PlatformioRepairExecResult {
	stdout: string;
	stderr: string;
}

export interface PlatformioRepairServiceOptions {
	execFile?: (filePath: string, args: string[], options: { timeout: number }) => Promise<PlatformioRepairExecResult>;
	now?: () => Date;
	homeDir?: string;
	workspacePath?: string | null;
	stepOutputLimit?: number;
}

export interface ExecuteRepairFlowOptions {
	environmentFingerprint: EnvironmentFingerprint;
	initialSessionId: string;
	workspacePath?: string | null;
	retest?: () => Promise<PlatformioDiagnosticSession>;
	isCancelled?: () => boolean;
}

const MAX_REPAIR_STEPS = 3;

export class PlatformioRepairService {
	private readonly execFile: (filePath: string, args: string[], options: { timeout: number }) => Promise<PlatformioRepairExecResult>;
	private readonly now: () => Date;
	private readonly homeDir: string | undefined;
	private readonly workspacePath: string | null | undefined;
	private readonly stepOutputLimit: number;

	constructor(options: PlatformioRepairServiceOptions = {}) {
		this.execFile = options.execFile ?? createExecFilePromise;
		this.now = options.now ?? (() => new Date());
		this.homeDir = options.homeDir ?? os.homedir();
		this.workspacePath = options.workspacePath;
		this.stepOutputLimit = options.stepOutputLimit ?? 2000;
	}

	planRepairFlows(session: PlatformioDiagnosticSession, history?: RepairHistorySummary | null): RepairFlow[] {
		if (session.overallStatus === 'operational') {
			return [];
		}

		const redactor = this.createRedactor(session.workspacePath);
		const flows = [
			this.createSettingsAwareFlow(session, history),
			this.createMpremoteRepairFlow(session, history, redactor),
		].filter((flow): flow is RepairFlow => !!flow);

		return flows.slice(0, MAX_REPAIR_STEPS);
	}

	async executeRepairFlow(flow: RepairFlow, options: ExecuteRepairFlowOptions): Promise<AutoRepairRun> {
		const redactor = this.createRedactor(options.workspacePath);
		const runId = `repair-${this.now().toISOString()}`;
		const startedAt = this.now().toISOString();
		const stepResults: RepairStepResult[] = [];
		let finalSessionId: string | null = null;
		let status: AutoRepairRunStatus = 'running';

		for (const step of flow.steps) {
			if (options.isCancelled?.()) {
				status = 'cancelled';
				break;
			}

			const result = await this.executeStep(step, redactor);
			stepResults.push(result);

			if (this.isBlockingResult(result.status)) {
				status = result.status === 'blocked' ? 'blocked' : 'failed';
				break;
			}
		}

		if (status === 'running' && options.isCancelled?.()) {
			status = 'cancelled';
		}

		if (status === 'running' && options.retest) {
			const finalSession = await options.retest();
			finalSessionId = finalSession.sessionId ?? finalSession.requestedAt;
			status = this.statusFromRetest(finalSession);
		}

		if (status === 'running') {
			status = stepResults.some(result => result.status === 'skipped') ? 'partially-succeeded' : 'succeeded';
		}

		return {
			runId,
			flowId: flow.id,
			startedAt,
			finishedAt: this.now().toISOString(),
			status,
			environmentFingerprint: options.environmentFingerprint,
			initialSessionId: options.initialSessionId,
			finalSessionId,
			stepResults,
			userFacingSummary: this.buildRunSummary(flow, status),
		};
	}

	private createSettingsAwareFlow(
		session: PlatformioDiagnosticSession,
		history?: RepairHistorySummary | null
	): RepairFlow | null {
		const pio = this.findItem(session, 'pio');
		if (!pio || pio.status !== 'error') {
			return null;
		}

		const hasOfficialPath = (session.settingsEvidence?.candidatePathEntries.length ?? 0) > 0;
		const flowId = 'align-with-official-platformio-settings';

		return {
			id: flowId,
			title: 'Align with official PlatformIO settings',
			summary: 'Re-check PlatformIO using official extension settings and provide a bounded manual path if pio remains unavailable.',
			triggerFindingIds: ['pio'],
			riskLevel: 'low',
			requiresConfirmation: true,
			steps: [
				{
					id: 'settings-aware-resolution',
					title: 'Re-read official PlatformIO settings',
					description: 'Use platformio-ide.customPATH and related official settings as diagnostic evidence.',
					kind: 'settings-aware-resolution',
					commandPreview: 'No shell command; settings-aware retest only',
					timeoutMs: 5000,
					mutatesUserSpace: false,
					blockingFailureCodes: [],
				},
				{
					id: 'manual-platformio-install-guide',
					title: 'Prepare manual PlatformIO install guidance',
					description: 'If no official customPATH candidate is available, guide the user to install or configure PlatformIO without changing system settings.',
					kind: hasOfficialPath ? 'diagnostic-retry' : 'manual-instruction',
					commandPreview: 'Open PlatformIO status and retry diagnostics',
					timeoutMs: 5000,
					mutatesUserSpace: false,
					blockingFailureCodes: hasOfficialPath ? [] : ['missing-executable'],
					manualInstruction: 'Install PlatformIO from the official VS Code extension, then retry diagnostics.',
				},
			],
			stopPolicy: 'stop-on-success-or-blocking-failure',
			estimatedDurationMs: 10000,
			primaryFix: 'Prefer official PlatformIO extension settings such as platformio-ide.customPATH before falling back to PATH.',
			fallbackFix: 'If pio still cannot be resolved, keep CyberBrick usable and provide a manual install/configuration path.',
			verification: 'Run PlatformIO diagnostics again and confirm the pio item is no longer error.',
			manualAlternative: 'Open the official PlatformIO extension, finish its setup, then copy its configured customPATH into VS Code settings if needed.',
			recommendationReason: this.withHistoryReason(flowId, history, 'pio is unavailable in the VS Code extension runtime.'),
			stillManualSteps: hasOfficialPath ? [] : ['Confirm PlatformIO Core is installed by the official PlatformIO extension.'],
		};
	}

	private createMpremoteRepairFlow(
		session: PlatformioDiagnosticSession,
		history: RepairHistorySummary | null | undefined,
		redactor: PlatformioPrivacyRedactor
	): RepairFlow | null {
		const mpremote = this.findItem(session, 'mpremote');
		if (!mpremote || mpremote.status === 'ok') {
			return null;
		}

		const python = this.findItem(session, 'python');
		const pythonPath = python?.resolvedPath ?? null;
		const flowId = 'repair-mpremote-in-detected-python';
		const steps: RepairStep[] = [];

		if (pythonPath) {
			steps.push({
				id: 'install-mpremote-user-space',
				title: 'Install or update mpremote in user space',
				description: 'Use the detected PlatformIO Python to install mpremote without sudo or system package managers.',
				kind: 'user-space-python-package',
				commandPreview: `${redactor.redact(pythonPath)} -m pip install --user --upgrade mpremote`,
				executable: pythonPath,
				args: ['-m', 'pip', 'install', '--user', '--upgrade', 'mpremote'],
				timeoutMs: 120000,
				mutatesUserSpace: true,
				blockingFailureCodes: ['network-or-proxy', 'permission-denied', 'probe-timeout'],
			});
			steps.push({
				id: 'retest-mpremote',
				title: 'Verify mpremote detection',
				description: 'Re-run diagnostics to confirm mpremote can be resolved and probed.',
				kind: 'diagnostic-retry',
				commandPreview: 'Run PlatformIO diagnostics again',
				timeoutMs: 5000,
				mutatesUserSpace: false,
				blockingFailureCodes: [],
			});
		} else {
			steps.push({
				id: 'manual-mpremote-after-python',
				title: 'Resolve PlatformIO Python first',
				description: 'mpremote cannot be installed safely until PlatformIO Python is resolved.',
				kind: 'manual-instruction',
				commandPreview: 'No automatic command available',
				timeoutMs: 5000,
				mutatesUserSpace: false,
				blockingFailureCodes: ['missing-executable'],
				manualInstruction: 'Fix PlatformIO Python detection first, then install mpremote in that user-space environment.',
			});
		}

		return {
			id: flowId,
			title: 'Repair mpremote for CyberBrick uploads',
			summary: 'Install or update mpremote in the detected user-space PlatformIO Python environment.',
			triggerFindingIds: ['mpremote'],
			riskLevel: 'low',
			requiresConfirmation: true,
			steps,
			stopPolicy: 'stop-on-success-or-blocking-failure',
			estimatedDurationMs: pythonPath ? 120000 : 5000,
			primaryFix: 'Use the detected PlatformIO Python to install or update mpremote in user space.',
			fallbackFix: 'If installation fails, copy the AI repair packet and check proxy/PyPI settings before retrying.',
			verification: 'Run diagnostics again and confirm mpremote becomes OK.',
			notApplicableReason: pythonPath ? undefined : 'PlatformIO Python is not resolved yet. Repair pio/python detection first.',
			manualAlternative: 'Run python -m pip install --user --upgrade mpremote in the resolved PlatformIO Python environment, then retry diagnostics.',
			recommendationReason: this.withHistoryReason(flowId, history, 'mpremote is missing or cannot be probed for CyberBrick uploads.'),
			stillManualSteps: pythonPath ? [] : ['Resolve PlatformIO Python before installing mpremote.'],
		};
	}

	private async executeStep(step: RepairStep, redactor: PlatformioPrivacyRedactor): Promise<RepairStepResult> {
		const startedAtDate = this.now();
		const startedAt = startedAtDate.toISOString();

		if (step.kind === 'manual-instruction') {
			return this.createStepResult(step, startedAtDate, 'blocked', null, step.manualInstruction ?? step.description, true, redactor, {
				nextAction: step.manualInstruction ?? step.description,
			});
		}

		if (!step.executable) {
			return this.createStepResult(step, startedAtDate, 'succeeded', null, 'No subprocess required for this diagnostic repair step.', false, redactor, {
				stepKind: step.kind,
			});
		}

		if (!this.isAllowlistedStep(step)) {
			return this.createStepResult(step, startedAtDate, 'blocked', null, 'Repair step is not allowlisted for automatic execution.', true, redactor, {
				stepKind: step.kind,
			});
		}

		try {
			const result = await this.execFile(step.executable, step.args ?? [], { timeout: step.timeoutMs });
			return this.createStepResult(
				step,
				startedAtDate,
				'succeeded',
				0,
				this.combineOutput(result.stdout, result.stderr),
				false,
				redactor,
				{ executable: redactor.redact(step.executable) }
			);
		} catch (error: any) {
			const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
			const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
			const message = typeof error?.message === 'string' ? error.message : String(error?.error ?? error);
			const timedOut = /timed out|timeout/i.test(message) || error?.error?.killed === true;
			return this.createStepResult(
				step,
				startedAtDate,
				timedOut ? 'timed-out' : 'failed',
				typeof error?.code === 'number' ? error.code : null,
				this.combineOutput(stdout, stderr, message),
				true,
				redactor,
				{ executable: redactor.redact(step.executable) },
				timedOut ? 'The repair command timed out. Check network/proxy settings before retrying.' : 'The repair command failed. Review the sanitized output before retrying.'
			);
		}
	}

	private createStepResult(
		step: RepairStep,
		startedAtDate: Date,
		status: RepairStepResultStatus,
		exitCode: number | null,
		rawOutput: string,
		forceRedacted: boolean,
		redactor: PlatformioPrivacyRedactor,
		evidence: Record<string, string | number | boolean | null>,
		nextAction?: string
	): RepairStepResult {
		const finishedAtDate = this.now();
		const truncated = rawOutput.length > this.stepOutputLimit;
		const limitedOutput = truncated ? `${rawOutput.slice(0, this.stepOutputLimit)}…` : rawOutput;
		const sanitizedOutput = redactor.redact(limitedOutput);

		return {
			stepId: step.id,
			startedAt: startedAtDate.toISOString(),
			finishedAt: finishedAtDate.toISOString(),
			status,
			exitCode,
			durationMs: Math.max(0, finishedAtDate.getTime() - startedAtDate.getTime()),
			sanitizedOutput,
			outputRedacted: forceRedacted || truncated || sanitizedOutput !== limitedOutput,
			evidence,
			nextAction,
		};
	}

	private createRedactor(sessionWorkspacePath?: string | null): PlatformioPrivacyRedactor {
		return createPlatformioPrivacyRedactor({
			homeDir: this.homeDir,
			workspacePath: this.workspacePath,
		}, sessionWorkspacePath);
	}

	private isAllowlistedStep(step: RepairStep): boolean {
		if (step.kind !== 'user-space-python-package') {
			return false;
		}

		const executableName = path.basename(step.executable ?? '').toLowerCase();
		const args = step.args ?? [];
		return (
			/^python(3)?(\.exe)?$/.test(executableName) &&
			args.join(' ') === '-m pip install --user --upgrade mpremote'
		);
	}

	private statusFromRetest(session: PlatformioDiagnosticSession): AutoRepairRunStatus {
		if (session.overallStatus === 'operational') {
			return 'succeeded';
		}

		if (session.overallStatus === 'degraded') {
			return 'partially-succeeded';
		}

		return 'failed';
	}

	private isBlockingResult(status: RepairStepResultStatus): boolean {
		return status === 'failed' || status === 'blocked' || status === 'timed-out';
	}

	private withHistoryReason(flowId: string, history: RepairHistorySummary | null | undefined, baseReason: string): string {
		const previousFailed = history?.runs.some(run => run.flowId === flowId && ['failed', 'blocked'].includes(run.status));
		if (!previousFailed) {
			return baseReason;
		}

		return `${baseReason} Previous automatic attempt failed; review the manual alternative or AI repair packet before repeating this flow.`;
	}

	private buildRunSummary(flow: RepairFlow, status: AutoRepairRunStatus): string {
		return `${flow.title}: ${status}`;
	}

	private findItem(session: PlatformioDiagnosticSession, id: DiagnosticItemId): PlatformioDiagnosticItem | undefined {
		return session.items.find(item => item.id === id);
	}

	private combineOutput(...values: string[]): string {
		return values.map(value => value.trim()).filter(Boolean).join('\n');
	}
}
