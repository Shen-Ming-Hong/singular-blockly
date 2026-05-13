/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile as nodeExecFile } from 'child_process';
import { LocaleService } from './localeService';
import { log } from './logging';
import {
	getDefaultPlatformioExecutablePath,
	getExecutableDirectory,
	getExecutableSearchDirectories,
	resolveExecutable,
} from './executableResolver';
import {
	ClipboardSummary,
	DiagnosticItemId,
	DiagnosticItemStatus,
	DiagnosticSource,
	PanelActionId,
	PlatformioDiagnosticItem,
	PlatformioDiagnosticPanelState,
	PlatformioDiagnosticSession,
	PlatformioOverallStatus,
	VersionProbeResult,
} from '../types/platformioDiagnostic';

interface MessageLocalizer {
	getLocalizedMessage(key: string, fallbackOrArg?: string | any, ...args: any[]): Promise<string>;
}

export interface PlatformioDiagnosticExecResult {
	stdout: string;
	stderr: string;
}

export interface PlatformioDiagnosticServiceOptions {
	existsSync?: (filePath: string) => boolean;
	execFile?: (filePath: string, args: string[], options: { timeout: number }) => Promise<PlatformioDiagnosticExecResult>;
	env?: NodeJS.ProcessEnv;
	platform?: NodeJS.Platform;
	homeDir?: string;
	now?: () => Date;
	localeService?: MessageLocalizer;
	versionProbeTimeoutMs?: number;
}

interface ResolvedDiagnosticTarget {
	resolvedPath: string | null;
	source: DiagnosticSource;
	exists: boolean;
	isFromDetectedPenv: boolean | null;
}

type MessageDefinitionRecord<TKey extends string> = Record<TKey, [messageKey: string, fallback: string]>;

const DEFAULT_ACTIONS: PanelActionId[] = ['retest', 'copySummary'];
const DEFAULT_SECTION_ORDER: ['summary', 'tools', 'scope'] = ['summary', 'tools', 'scope'];
const TOOL_LABEL_DEFINITIONS: MessageDefinitionRecord<DiagnosticItemId> = {
	pio: ['PLATFORMIO_DIAGNOSTIC_TOOL_PIO', 'PlatformIO CLI (pio)'],
	penvRoot: ['PLATFORMIO_DIAGNOSTIC_TOOL_PENV_ROOT', 'PlatformIO penv root'],
	python: ['PLATFORMIO_DIAGNOSTIC_TOOL_PYTHON', 'PlatformIO Python'],
	pip: ['PLATFORMIO_DIAGNOSTIC_TOOL_PIP', 'PlatformIO pip'],
	mpremote: ['PLATFORMIO_DIAGNOSTIC_TOOL_MPREMOTE', 'mpremote'],
};
const SOURCE_LABEL_DEFINITIONS: MessageDefinitionRecord<DiagnosticSource> = {
	'default-platformio-path': ['PLATFORMIO_DIAGNOSTIC_SOURCE_DEFAULT_PLATFORMIO_PATH', 'Default PlatformIO path'],
	'path-search': ['PLATFORMIO_DIAGNOSTIC_SOURCE_PATH_SEARCH', 'PATH search'],
	'resolved-pio-sibling': ['PLATFORMIO_DIAGNOSTIC_SOURCE_RESOLVED_PIO_SIBLING', 'Derived from resolved pio sibling'],
	'derived-from-penv': ['PLATFORMIO_DIAGNOSTIC_SOURCE_DERIVED_FROM_PENV', 'Derived from detected penv'],
	unresolved: ['PLATFORMIO_DIAGNOSTIC_SOURCE_UNRESOLVED', 'Unresolved'],
};
const ITEM_STATUS_LABEL_DEFINITIONS: MessageDefinitionRecord<DiagnosticItemStatus> = {
	ok: ['PLATFORMIO_DIAGNOSTIC_STATUS_OK', 'OK'],
	warning: ['PLATFORMIO_DIAGNOSTIC_STATUS_WARNING', 'Warning'],
	error: ['PLATFORMIO_DIAGNOSTIC_STATUS_ERROR', 'Error'],
};
const OVERALL_STATUS_LABEL_DEFINITIONS: MessageDefinitionRecord<PlatformioOverallStatus> = {
	operational: ['PLATFORMIO_DIAGNOSTIC_OVERALL_OPERATIONAL', 'Operational'],
	degraded: ['PLATFORMIO_DIAGNOSTIC_OVERALL_DEGRADED', 'Degraded'],
	unavailable: ['PLATFORMIO_DIAGNOSTIC_OVERALL_UNAVAILABLE', 'Unavailable'],
};

function createExecFilePromise(filePath: string, args: string[], options: { timeout: number }): Promise<PlatformioDiagnosticExecResult> {
	return new Promise((resolve, reject) => {
		nodeExecFile(filePath, args, { encoding: 'utf8', timeout: options.timeout }, (error, stdout, stderr) => {
			if (error) {
				reject({ error, stdout, stderr });
				return;
			}

			resolve({ stdout, stderr });
		});
	});
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
	return values.find(value => !!value && value.trim().length > 0)?.trim();
}

function normalizeVersionOutput(stdout: string, stderr: string): string | undefined {
	const lines = [stdout.trim(), stderr.trim()].filter(Boolean);
	if (lines.length === 0) {
		return undefined;
	}
	return lines.join(' | ');
}

function unique(values: Array<string | null | undefined>): string[] {
	return [...new Set(values.filter((value): value is string => !!value))];
}

export class PlatformioDiagnosticService {
	private readonly existsSync: (filePath: string) => boolean;
	private readonly execFile: (filePath: string, args: string[], options: { timeout: number }) => Promise<PlatformioDiagnosticExecResult>;
	private readonly env: NodeJS.ProcessEnv;
	private readonly platform: NodeJS.Platform;
	private readonly homeDir: string;
	private readonly now: () => Date;
	private readonly localeService?: MessageLocalizer;
	private readonly versionProbeTimeoutMs: number;

	constructor(options: PlatformioDiagnosticServiceOptions = {}) {
		this.existsSync = options.existsSync ?? fs.existsSync;
		this.execFile = options.execFile ?? createExecFilePromise;
		this.env = options.env ?? process.env;
		this.platform = options.platform ?? process.platform;
		this.homeDir = options.homeDir ?? os.homedir();
		this.now = options.now ?? (() => new Date());
		this.localeService = options.localeService;
		this.versionProbeTimeoutMs = options.versionProbeTimeoutMs ?? 1800;
	}

	createLoadingState(): PlatformioDiagnosticPanelState {
		return {
			runState: 'loading',
			session: null,
			topLevelError: null,
			availableActions: [...DEFAULT_ACTIONS],
			sectionOrder: [...DEFAULT_SECTION_ORDER],
		};
	}

	createReadyState(session: PlatformioDiagnosticSession): PlatformioDiagnosticPanelState {
		return {
			runState: 'ready',
			session,
			topLevelError: null,
			availableActions: [...DEFAULT_ACTIONS],
			sectionOrder: [...DEFAULT_SECTION_ORDER],
		};
	}

	createErrorState(topLevelError: string): PlatformioDiagnosticPanelState {
		return {
			runState: 'error',
			session: null,
			topLevelError,
			availableActions: [...DEFAULT_ACTIONS],
			sectionOrder: [...DEFAULT_SECTION_ORDER],
		};
	}

	async collectDiagnostics(workspacePath: string | null): Promise<PlatformioDiagnosticSession> {
		log('[platformio-diagnostic] starting diagnostic collection', 'info', { workspacePath });

		const requestedAt = this.now().toISOString();
		const searchDirectories = getExecutableSearchDirectories(this.env, this.platform);
		const pioResolution = this.resolvePio(searchDirectories);
		const pioDirectory = getExecutableDirectory(pioResolution.resolvedPath);
		const penvRootPath = pioDirectory ? path.dirname(pioDirectory) : null;
		const penvResolution = this.resolvePenvRoot(penvRootPath, !!pioResolution.resolvedPath);
		const toolSearchDirectories = unique([pioDirectory, ...searchDirectories]);

		const pioItem = await this.buildExecutableItem('pio', pioResolution, ['--version']);
		const penvRootItem = await this.buildPenvRootItem(penvResolution, pioResolution.resolvedPath);
		const [pythonItem, pipItem, mpremoteItem] = await Promise.all([
			this.buildToolItem('python', ['python3', 'python'], ['--version'], toolSearchDirectories, penvRootPath),
			this.buildToolItem('pip', ['pip3', 'pip'], ['--version'], toolSearchDirectories, penvRootPath),
			this.buildToolItem('mpremote', ['mpremote'], ['version'], toolSearchDirectories, penvRootPath),
		]);

		const items: PlatformioDiagnosticSession['items'] = [pioItem, penvRootItem, pythonItem, pipItem, mpremoteItem];
		const overallStatus = this.getOverallStatus(items);
		const scopeNotice = await this.message(
			'PLATFORMIO_DIAGNOSTIC_SCOPE_NOTICE',
			'This report reflects the VS Code extension runtime on this machine. It may differ from the shell environment you use in an external terminal.'
		);

		const session: PlatformioDiagnosticSession = {
			requestedAt,
			workspacePath,
			overallStatus,
			items,
			scopeNotice,
		};

		log('[platformio-diagnostic] diagnostic collection completed', 'info', {
			overallStatus,
			requestedAt,
			items: items.map(item => ({ id: item.id, status: item.status, path: item.resolvedPath })),
		});

		return session;
	}

	async buildClipboardSummary(session: PlatformioDiagnosticSession): Promise<ClipboardSummary> {
		const panelTitle = await this.message('PLATFORMIO_DIAGNOSTIC_PANEL_TITLE', 'PlatformIO Diagnostic');
		const requestedAtLabel = await this.message('PLATFORMIO_DIAGNOSTIC_REQUESTED_AT', 'Generated at');
		const workspaceLabel = await this.message('PLATFORMIO_DIAGNOSTIC_WORKSPACE', 'Workspace');
		const overallStatusLabel = await this.message('PLATFORMIO_DIAGNOSTIC_OVERALL_STATUS', 'Overall status');
		const pathLabel = await this.message('PLATFORMIO_DIAGNOSTIC_PATH', 'Path');
		const sourceLabel = await this.message('PLATFORMIO_DIAGNOSTIC_SOURCE', 'Source');
		const reasonLabel = await this.message('PLATFORMIO_DIAGNOSTIC_REASON', 'Reason');
		const nextStepLabel = await this.message('PLATFORMIO_DIAGNOSTIC_NEXT_STEP', 'Next step');
		const versionLabel = await this.message('PLATFORMIO_DIAGNOSTIC_VERSION', 'Version probe');
		const scopeTitle = await this.message('PLATFORMIO_DIAGNOSTIC_SCOPE_TITLE', 'Scope');
		const unresolvedPathLabel = await this.message('PLATFORMIO_DIAGNOSTIC_PATH_UNRESOLVED', 'Not resolved');

		const lines: string[] = [
			panelTitle,
			'='.repeat(panelTitle.length),
			`${requestedAtLabel}: ${session.requestedAt}`,
			`${workspaceLabel}: ${session.workspacePath ?? '-'}`,
			`${overallStatusLabel}: ${await this.getOverallStatusLabel(session.overallStatus)}`,
			'',
		];

		for (const item of session.items) {
			lines.push(`- ${await this.getToolLabel(item.id)} [${await this.getItemStatusLabel(item.status)}]`);
			lines.push(`  ${pathLabel}: ${item.resolvedPath ?? unresolvedPathLabel}`);
			lines.push(`  ${sourceLabel}: ${await this.getSourceLabel(item.source)}`);
			lines.push(`  ${reasonLabel}: ${item.reason}`);
			if (item.versionProbe?.output) {
				lines.push(`  ${versionLabel}: ${item.versionProbe.output}`);
			}
			if (item.nextStep) {
				lines.push(`  ${nextStepLabel}: ${item.nextStep}`);
			}
			lines.push('');
		}

		lines.push(`${scopeTitle}: ${session.scopeNotice}`);

		return {
			plainText: lines.join('\n').trim(),
			generatedAt: session.requestedAt,
			overallStatus: session.overallStatus,
		};
	}

	private resolvePio(searchDirectories: string[]): ResolvedDiagnosticTarget {
		const defaultPath = getDefaultPlatformioExecutablePath('pio', this.platform, this.homeDir);
		if (this.existsSync(defaultPath)) {
			return {
				resolvedPath: defaultPath,
				source: 'default-platformio-path',
				exists: true,
				isFromDetectedPenv: null,
			};
		}

		const resolvedPath = resolveExecutable({
			searchDirectories,
			executableNames: ['pio'],
			existsSync: this.existsSync,
			env: this.env,
			platform: this.platform,
		});

		if (resolvedPath) {
			return {
				resolvedPath,
				source: 'path-search',
				exists: true,
				isFromDetectedPenv: null,
			};
		}

		return {
			resolvedPath: null,
			source: 'unresolved',
			exists: false,
			isFromDetectedPenv: null,
		};
	}

	private resolvePenvRoot(penvRootPath: string | null, hasResolvedPio: boolean): ResolvedDiagnosticTarget {
		if (!penvRootPath) {
			return {
				resolvedPath: null,
				source: 'unresolved',
				exists: false,
				isFromDetectedPenv: null,
			};
		}

		return {
			resolvedPath: penvRootPath,
			source: hasResolvedPio ? 'resolved-pio-sibling' : 'unresolved',
			exists: this.existsSync(penvRootPath),
			isFromDetectedPenv: null,
		};
	}

	private async buildPenvRootItem(
		resolution: ResolvedDiagnosticTarget,
		resolvedPioPath: string | null
	): Promise<PlatformioDiagnosticItem> {
		const toolLabel = await this.getToolLabel('penvRoot');
		const unresolvedReason = resolvedPioPath
			? await this.message(
				'PLATFORMIO_DIAGNOSTIC_REASON_PENV_MISSING',
				'A penv root was derived from the resolved pio path, but the directory does not exist: {0}',
				resolution.resolvedPath ?? ''
			)
			: await this.message(
				'PLATFORMIO_DIAGNOSTIC_REASON_PENV_UNRESOLVED',
				'No penv root could be derived because the PlatformIO CLI path is not resolved yet.'
			);

		if (!resolution.resolvedPath) {
			return {
				id: 'penvRoot',
				kind: 'derived-directory',
				status: 'error',
				resolvedPath: null,
				source: 'unresolved',
				exists: false,
				isFromDetectedPenv: null,
				reason: unresolvedReason,
				nextStep: await this.message(
					'PLATFORMIO_DIAGNOSTIC_NEXTSTEP_CHECK_PLATFORMIO_INSTALL',
					'Confirm PlatformIO CLI is installed and reachable from the VS Code extension runtime, then run diagnostics again.'
				),
			};
		}

		if (!resolution.exists) {
			return {
				id: 'penvRoot',
				kind: 'derived-directory',
				status: 'warning',
				resolvedPath: resolution.resolvedPath,
				source: resolution.source,
				exists: false,
				isFromDetectedPenv: null,
				reason: unresolvedReason,
				nextStep: await this.message(
					'PLATFORMIO_DIAGNOSTIC_NEXTSTEP_CHECK_PENV_LAYOUT',
					'Check whether the detected PlatformIO penv directory layout is intact, then run diagnostics again.'
				),
			};
		}

		return {
			id: 'penvRoot',
			kind: 'derived-directory',
			status: 'ok',
			resolvedPath: resolution.resolvedPath,
			source: resolution.source,
			exists: true,
			isFromDetectedPenv: null,
			reason: await this.message(
				'PLATFORMIO_DIAGNOSTIC_REASON_PENV_DERIVED',
				'{0} was derived from the resolved PlatformIO CLI location.',
				toolLabel
			),
		};
	}

	private async buildToolItem(
		id: Exclude<DiagnosticItemId, 'pio' | 'penvRoot'>,
		executableNames: string[],
		probeArgs: string[],
		searchDirectories: string[],
		penvRootPath: string | null
	): Promise<PlatformioDiagnosticItem> {
		const defaultPath = getDefaultPlatformioExecutablePath(this.getDefaultExecutableName(id), this.platform, this.homeDir);
		const penvScriptsDirectory = penvRootPath ? this.getPenvScriptsDirectory(penvRootPath) : null;
		let resolution: ResolvedDiagnosticTarget | null = null;

		if (penvScriptsDirectory) {
			const resolvedFromPenv = resolveExecutable({
				searchDirectories: [penvScriptsDirectory],
				executableNames,
				existsSync: this.existsSync,
				env: this.env,
				platform: this.platform,
			});

			if (resolvedFromPenv) {
				resolution = {
					resolvedPath: resolvedFromPenv,
					source: 'derived-from-penv',
					exists: true,
					isFromDetectedPenv: true,
				};
			}
		}

		if (!resolution && this.existsSync(defaultPath)) {
			resolution = {
				resolvedPath: defaultPath,
				source: 'default-platformio-path',
				exists: true,
				isFromDetectedPenv: penvScriptsDirectory ? this.isPathWithin(defaultPath, penvScriptsDirectory) : false,
			};
		}

		if (!resolution) {
			const resolvedFromSearch = resolveExecutable({
				searchDirectories,
				executableNames,
				existsSync: this.existsSync,
				env: this.env,
				platform: this.platform,
			});

			if (resolvedFromSearch) {
				resolution = {
					resolvedPath: resolvedFromSearch,
					source: 'path-search',
					exists: true,
					isFromDetectedPenv: penvScriptsDirectory ? this.isPathWithin(resolvedFromSearch, penvScriptsDirectory) : false,
				};
			}
		}

		return this.buildExecutableItem(
			id,
			resolution ?? {
				resolvedPath: null,
				source: 'unresolved',
				exists: false,
				isFromDetectedPenv: penvScriptsDirectory ? false : null,
			},
			probeArgs
		);
	}

	private async buildExecutableItem(
		id: Exclude<DiagnosticItemId, 'penvRoot'>,
		resolution: ResolvedDiagnosticTarget,
		probeArgs: string[]
	): Promise<PlatformioDiagnosticItem> {
		const toolLabel = await this.getToolLabel(id);

		if (!resolution.resolvedPath) {
			return {
				id,
				kind: 'executable',
				status: 'error',
				resolvedPath: null,
				source: 'unresolved',
				exists: false,
				isFromDetectedPenv: resolution.isFromDetectedPenv,
				reason: await this.message(
					'PLATFORMIO_DIAGNOSTIC_REASON_EXECUTABLE_MISSING',
					'{0} was not found in the default PlatformIO location or the current PATH visible to the VS Code extension runtime.',
					toolLabel
				),
				nextStep:
					id === 'pio'
						? await this.message(
							'PLATFORMIO_DIAGNOSTIC_NEXTSTEP_CHECK_PLATFORMIO_INSTALL',
							'Confirm PlatformIO CLI is installed and reachable from the VS Code extension runtime, then run diagnostics again.'
						)
						: await this.message(
							'PLATFORMIO_DIAGNOSTIC_NEXTSTEP_CHECK_TOOL_IN_PENV',
							'Check whether {0} exists inside the detected PlatformIO penv or PATH, then run diagnostics again.',
							toolLabel
						),
			};
		}

		const versionProbe = await this.runVersionProbe(resolution.resolvedPath, probeArgs);
		const probeCommand = [path.basename(resolution.resolvedPath), ...probeArgs].join(' ');
		const normalizedProbe: VersionProbeResult = {
			command: probeCommand,
			succeeded: versionProbe.succeeded,
			output: versionProbe.output,
			errorMessage: versionProbe.errorMessage,
			durationMs: versionProbe.durationMs,
		};

		if (normalizedProbe.succeeded) {
			return {
				id,
				kind: 'executable',
				status: 'ok',
				resolvedPath: resolution.resolvedPath,
				source: resolution.source,
				exists: resolution.exists,
				isFromDetectedPenv: resolution.isFromDetectedPenv,
				reason: await this.message(
					'PLATFORMIO_DIAGNOSTIC_REASON_EXECUTABLE_READY',
					'{0} was resolved successfully and the version probe completed.',
					toolLabel
				),
				versionProbe: normalizedProbe,
			};
		}

		return {
			id,
			kind: 'executable',
			status: id === 'pio' ? 'warning' : 'warning',
			resolvedPath: resolution.resolvedPath,
			source: resolution.source,
			exists: resolution.exists,
			isFromDetectedPenv: resolution.isFromDetectedPenv,
			reason: await this.message(
				'PLATFORMIO_DIAGNOSTIC_REASON_VERSION_PROBE_FAILED',
				'{0} was found at {1}, but the version probe did not complete successfully: {2}',
				toolLabel,
				resolution.resolvedPath,
				normalizedProbe.errorMessage ?? normalizedProbe.output ?? 'unknown error'
			),
			nextStep: await this.message(
				'PLATFORMIO_DIAGNOSTIC_NEXTSTEP_RETRY_AFTER_FIX',
				'Verify the executable can run from this path, fix the environment if needed, and then run diagnostics again.'
			),
			versionProbe: normalizedProbe,
		};
	}

	private async runVersionProbe(executablePath: string, args: string[]): Promise<VersionProbeResult> {
		const startedAt = Date.now();
		try {
			const result = await this.execFile(executablePath, args, { timeout: this.versionProbeTimeoutMs });
			return {
				command: [path.basename(executablePath), ...args].join(' '),
				succeeded: true,
				output: normalizeVersionOutput(result.stdout, result.stderr),
				durationMs: Date.now() - startedAt,
			};
		} catch (error: any) {
			const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
			const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
			const errorMessage =
				firstNonEmpty(error?.message, stderr, stdout) ?? `Probe timed out or failed after ${this.versionProbeTimeoutMs}ms`;

			return {
				command: [path.basename(executablePath), ...args].join(' '),
				succeeded: false,
				output: normalizeVersionOutput(stdout, stderr),
				errorMessage,
				durationMs: Date.now() - startedAt,
			};
		}
	}

	private getOverallStatus(items: PlatformioDiagnosticSession['items']): PlatformioOverallStatus {
		if (items[0].status === 'error') {
			return 'unavailable';
		}

		if (items.some(item => item.status !== 'ok')) {
			return 'degraded';
		}

		return 'operational';
	}

	private getPenvScriptsDirectory(penvRootPath: string): string {
		return this.platform === 'win32' ? path.join(penvRootPath, 'Scripts') : path.join(penvRootPath, 'bin');
	}

	private getDefaultExecutableName(id: Exclude<DiagnosticItemId, 'penvRoot'>): 'pio' | 'python' | 'pip' | 'mpremote' {
		switch (id) {
			case 'python':
				return 'python';
			case 'pip':
				return 'pip';
			case 'mpremote':
				return 'mpremote';
			case 'pio':
			default:
				return 'pio';
		}
	}

	private async getToolLabel(id: DiagnosticItemId): Promise<string> {
		return this.getMessageFromRecord(id, TOOL_LABEL_DEFINITIONS);
	}

	private async getSourceLabel(source: DiagnosticSource): Promise<string> {
		return this.getMessageFromRecord(source, SOURCE_LABEL_DEFINITIONS);
	}

	private async getItemStatusLabel(status: DiagnosticItemStatus): Promise<string> {
		return this.getMessageFromRecord(status, ITEM_STATUS_LABEL_DEFINITIONS);
	}

	private async getOverallStatusLabel(status: PlatformioOverallStatus): Promise<string> {
		return this.getMessageFromRecord(status, OVERALL_STATUS_LABEL_DEFINITIONS);
	}

	private async getMessageFromRecord<TKey extends string>(
		key: TKey,
		definitions: MessageDefinitionRecord<TKey>
	): Promise<string> {
		const [messageKey, fallback] = definitions[key];
		return this.message(messageKey, fallback);
	}

	private isPathWithin(candidatePath: string, directoryPath: string): boolean {
		const normalizedCandidate = path.resolve(candidatePath);
		const normalizedDirectory = path.resolve(directoryPath);
		return normalizedCandidate === normalizedDirectory || normalizedCandidate.startsWith(`${normalizedDirectory}${path.sep}`);
	}

	private async message(key: string, fallback: string, ...args: any[]): Promise<string> {
		if (this.localeService) {
			return this.localeService.getLocalizedMessage(key, fallback, ...args);
		}

		let message = fallback;
		args.forEach((arg, index) => {
			message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
		});
		return message;
	}

	static fromLocaleService(localeService: LocaleService, options: Omit<PlatformioDiagnosticServiceOptions, 'localeService'> = {}) {
		return new PlatformioDiagnosticService({
			...options,
			localeService,
		});
	}
}
