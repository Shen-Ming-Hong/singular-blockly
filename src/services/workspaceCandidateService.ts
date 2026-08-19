/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash, randomUUID } from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';
import { FileService } from './fileService';
import { log } from './logging';
import {
	ValidateWorkspaceCandidateMessage,
	hasWorkspaceDocumentContent,
	isWorkspaceDocument,
	WorkspaceCandidateValidationResult,
	WorkspaceDocument,
	WorkspaceLiveLoadResultMessage,
	WorkspaceRejectionOutcome,
	WorkspaceValidationIssue,
	WORKSPACE_VALIDATION_TIMEOUT_MS,
	isWorkspaceCandidateValidationResult,
	isWorkspaceLiveLoadResultMessage,
	normalizeWorkspaceDocumentBoard,
} from '../types/workspaceValidation';

const MAIN_PATH = 'blockly/main.json';
const BACKUP_PATH = 'blockly/main.json.bak';
const INVALID_PATH = 'blockly/main.invalid.json';
const VALIDATION_STATUS_PATH = 'blockly/.singular-blockly/workspace-validation-status.json';
const INVALID_HISTORY_PATTERN = /^main\.invalid\.\d{8}T\d{9}Z-\d+\.json$/;

type ValidationChannel = (message: ValidateWorkspaceCandidateMessage) => Promise<WorkspaceCandidateValidationResult>;
type LiveLoadChannel = (
	requestId: string,
	generation: number,
	deadlineAt: number,
	document: WorkspaceDocument
) => Promise<WorkspaceLiveLoadResultMessage>;

interface RejectedCandidateContext {
	generation: number;
	observationRevision: number;
	candidate: Buffer | undefined;
	issue: WorkspaceValidationIssue;
	deleted: boolean;
	allowRecovery?: boolean;
}

interface CandidateCommitPrecondition {
	generation: number;
	observationRevision: number;
	candidate: Buffer;
}

type ExpectedMainState =
	| { kind: 'present'; hash: string }
	| { kind: 'absent' };

const services = new Map<string, WorkspaceCandidateService>();

export function getWorkspaceCandidateService(workspaceRoot: string): WorkspaceCandidateService | undefined {
	return services.get(path.resolve(workspaceRoot));
}

/** Owns the activation-lifetime main.json watcher and candidate recovery state machine. */
export class WorkspaceCandidateService implements vscode.Disposable {
	private watcher?: vscode.FileSystemWatcher;
	private debounceTimer?: NodeJS.Timeout;
	private validationChannel?: ValidationChannel;
	private liveLoadChannel?: LiveLoadChannel;
	private generation = 0;
	private observationRevision = 0;
	private lastValidMemory?: Buffer;
	private expectedInternalMainState?: ExpectedMainState;
	private workspaceTransactionTail: Promise<void> = Promise.resolve();
	private disposed = false;

	constructor(
		private readonly workspaceRoot: string,
		private readonly fileService: FileService = new FileService(workspaceRoot),
		private readonly timeoutMs = WORKSPACE_VALIDATION_TIMEOUT_MS,
		private readonly now: () => Date = () => new Date(),
		private readonly onRejected?: (
			issue: WorkspaceValidationIssue,
			outcome: WorkspaceRejectionOutcome
		) => void | Promise<void>
	) {}

	start(workspaceApi: Pick<typeof vscode.workspace, 'createFileSystemWatcher'> = vscode.workspace): this {
		if (this.watcher || this.disposed) {return this;}
		services.set(path.resolve(this.workspaceRoot), this);
		this.watcher = workspaceApi.createFileSystemWatcher(new vscode.RelativePattern(this.workspaceRoot, MAIN_PATH));
		this.watcher.onDidChange(() => this.scheduleCandidate(false));
		this.watcher.onDidCreate(() => this.scheduleCandidate(false));
		this.watcher.onDidDelete(() => this.scheduleCandidate(true));
		return this;
	}

	attachChannels(validation: ValidationChannel, liveLoad: LiveLoadChannel): void {
		this.validationChannel = validation;
		this.liveLoadChannel = liveLoad;
	}

	detachChannels(): void {
		this.validationChannel = undefined;
		this.liveLoadChannel = undefined;
	}

	/** Record a document already produced by the live editor runtime. */
	async recordValidDocument(
		document: WorkspaceDocument,
		precondition?: CandidateCommitPrecondition
	): Promise<boolean> {
		return await this.runExclusiveWorkspaceTransaction(
			() => this.commitValidDocument(document, precondition)
		);
	}

	private async commitValidDocument(
		document: WorkspaceDocument,
		precondition?: CandidateCommitPrecondition
	): Promise<boolean> {
		if (this.disposed) {return false;}
		const bytes = Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
		const previousMemory = this.lastValidMemory ? Buffer.from(this.lastValidMemory) : undefined;
		const previousMain = await this.readExistingBytes(MAIN_PATH);
		const previousBackup = await this.readExistingBytes(BACKUP_PATH);
		if (
			precondition && (
				this.isSuperseded(precondition.generation, precondition.observationRevision) ||
				!previousMain?.equals(precondition.candidate)
			)
		) {return false;}
		try {
			this.expectMainBytes(bytes);
			await this.fileService.writeFileAtomic(MAIN_PATH, bytes);
			await this.fileService.writeFileAtomic(BACKUP_PATH, bytes);
			this.lastValidMemory = bytes;
			return true;
		} catch (error) {
			this.lastValidMemory = previousMemory;
			await this.restoreBytes(MAIN_PATH, previousMain);
			await this.restoreBytes(BACKUP_PATH, previousBackup);
			throw error;
		}
	}

	/** Seed recovery state after the existing project has loaded successfully in Blockly. */
	async seedInitialValidDocument(
		document: WorkspaceDocument,
		expectedMainBytes: Buffer,
		mainBlockStateRepaired = false
	): Promise<boolean> {
		return await this.runExclusiveWorkspaceTransaction(
			() => this.seedInitialValidDocumentTransaction(document, expectedMainBytes, mainBlockStateRepaired)
		);
	}

	private async seedInitialValidDocumentTransaction(
		document: WorkspaceDocument,
		expectedMainBytes: Buffer,
		mainBlockStateRepaired: boolean
	): Promise<boolean> {
		if (this.disposed || !isWorkspaceDocument(document) || !this.fileService.fileExists(MAIN_PATH)) {return false;}
		let currentMain: Buffer;
		try {
			currentMain = await this.fileService.readBuffer(MAIN_PATH);
		} catch {
			return false;
		}
		if (!currentMain.equals(expectedMainBytes)) {return false;}

		const bytes = Buffer.from(`${JSON.stringify(document, null, 2)}\n`);
		if (mainBlockStateRepaired !== true) {
			await this.fileService.writeFileAtomic(BACKUP_PATH, bytes);
			this.lastValidMemory = bytes;
			this.expectMainBytes(currentMain);
			return true;
		}

		const previousMemory = this.lastValidMemory ? Buffer.from(this.lastValidMemory) : undefined;
		const previousBackup = await this.readExistingBytes(BACKUP_PATH);
		try {
			this.expectMainBytes(bytes);
			await this.fileService.writeFileAtomic(MAIN_PATH, bytes);
			await this.fileService.writeFileAtomic(BACKUP_PATH, bytes);
			const committedMain = await this.readExistingBytes(MAIN_PATH);
			if (!committedMain?.equals(bytes)) {
				this.lastValidMemory = previousMemory;
				this.expectedInternalMainState = undefined;
				await this.restoreSnapshotIfUnchanged(BACKUP_PATH, previousBackup, bytes);
				return false;
			}
			this.lastValidMemory = bytes;
			return true;
		} catch (error) {
			this.lastValidMemory = previousMemory;
			const rollbackErrors: unknown[] = [];
			for (const [relativePath, snapshot] of [
				[MAIN_PATH, currentMain],
				[BACKUP_PATH, previousBackup],
			] as const) {
				try {
					await this.restoreSnapshotIfUnchanged(relativePath, snapshot, bytes);
				} catch (rollbackError) {
					rollbackErrors.push(rollbackError);
				}
			}
			if (rollbackErrors.length > 0) {
				throw new AggregateError([error, ...rollbackErrors], 'Initial workspace repair rollback failed');
			}
			throw error;
		}
	}

	/** Reject a startup document that parsed but failed the real Blockly runtime load. */
	async rejectInitialCandidate(
		expectedMainBytes: Buffer,
		issue: WorkspaceValidationIssue,
		allowRecovery = true
	): Promise<boolean> {
		if (this.disposed || !this.fileService.fileExists(MAIN_PATH)) {return false;}
		let currentMain: Buffer;
		try {
			currentMain = await this.fileService.readBuffer(MAIN_PATH);
		} catch {
			return false;
		}
		if (!currentMain.equals(expectedMainBytes)) {return false;}

		const generation = ++this.generation;
		await this.rejectCandidate({
			generation,
			observationRevision: this.observationRevision,
			candidate: expectedMainBytes,
			issue,
			deleted: false,
			allowRecovery,
		});
		return true;
	}

	/** Process a candidate immediately; exposed for integration tests and explicit initial gates. */
	async processCandidate(deleted = false, observationRevision = this.observationRevision): Promise<void> {
		if (this.disposed) {return;}
		const generation = ++this.generation;
		let bytes: Buffer | undefined;
		if (!deleted && this.fileService.fileExists(MAIN_PATH)) {
			try {
				bytes = await this.fileService.readBuffer(MAIN_PATH);
			} catch {
				if (this.isSuperseded(generation, observationRevision)) {return;}
				await this.rejectCandidate({
					generation,
					observationRevision,
					candidate: undefined,
					issue: { code: 'INVALID_JSON' },
					deleted: false,
				});
				return;
			}
		}
		if (this.isSuperseded(generation, observationRevision)) {return;}

		let document: WorkspaceDocument;
		try {
			if (deleted || !bytes) {throw new Error('MAIN_FILE_DELETED');}
			document = JSON.parse(bytes.toString('utf8')) as WorkspaceDocument;
		} catch (error) {
			await this.rejectCandidate({
				generation,
				observationRevision,
				candidate: bytes,
				issue: {
					code: error instanceof Error && error.message === 'MAIN_FILE_DELETED' ? 'MAIN_FILE_DELETED' : 'INVALID_JSON',
				},
				deleted,
			});
			return;
		}

		if (!isWorkspaceDocument(document) || !hasWorkspaceDocumentContent(document)) {
			await this.rejectCandidate({
				generation, observationRevision, candidate: bytes, issue: { code: 'EMPTY_WORKSPACE' }, deleted: false,
			});
			return;
		}
		document = normalizeWorkspaceDocumentBoard(document);
		if (!this.validationChannel || !this.liveLoadChannel) {
			await this.rejectCandidate({
				generation, observationRevision, candidate: bytes, issue: { code: 'CHANNEL_UNAVAILABLE' }, deleted: false,
			});
			return;
		}

		const requestId = randomUUID();
		const deadlineAt = Date.now() + this.timeoutMs;
		const request: ValidateWorkspaceCandidateMessage = {
			command: 'validateWorkspaceCandidate',
			requestId,
			generation,
			deadlineAt,
			document,
		};
		let result: WorkspaceCandidateValidationResult;
		try {
			result = await this.withDeadline(this.validationChannel(request), deadlineAt);
		} catch (error) {
			if (this.isSuperseded(generation, observationRevision)) {return;}
			await this.rejectCandidate({
				generation,
				observationRevision,
				candidate: bytes,
				issue: this.classifyChannelError(error, 'validation'),
				deleted: false,
			});
			return;
		}
		if (this.isSuperseded(generation, observationRevision)) {return;}
		if (!isWorkspaceCandidateValidationResult(result)) {
			await this.rejectCandidate({
				generation, observationRevision, candidate: bytes, issue: { code: 'ROUND_TRIP_FAILED' }, deleted: false,
			});
			return;
		}
		if (result.requestId !== requestId || result.generation !== generation) {return;}
		if (!result.valid) {
			await this.rejectCandidate({
				generation, observationRevision, candidate: bytes, issue: result.issue, deleted: false,
			});
			return;
		}

		await this.runExclusiveWorkspaceTransaction(() => this.processValidatedCandidate(
			generation,
			observationRevision,
			bytes,
			result.normalizedDocument,
			requestId,
			deadlineAt
		));
	}

	private async processValidatedCandidate(
		generation: number,
		observationRevision: number,
		candidate: Buffer,
		normalizedDocument: WorkspaceDocument,
		requestId: string,
		deadlineAt: number
	): Promise<void> {
		if (!await this.isCandidateCurrent(generation, observationRevision, candidate)) {return;}
		const liveLoadChannel = this.liveLoadChannel;
		if (!liveLoadChannel) {
			await this.quarantineAndRecover({
				generation, observationRevision, candidate, issue: { code: 'CHANNEL_UNAVAILABLE' }, deleted: false,
			});
			return;
		}

		let liveResult: WorkspaceLiveLoadResultMessage;
		try {
			liveResult = await this.withDeadline(
				liveLoadChannel(requestId, generation, deadlineAt, normalizedDocument),
				deadlineAt
			);
		} catch (error) {
			if (this.isSuperseded(generation, observationRevision)) {
				await this.restoreLiveWorkspace(generation);
				return;
			}
			await this.rejectAfterLiveLoadFailure({
				generation,
				observationRevision,
				candidate,
				issue: this.classifyChannelError(error, 'live-load'),
				deleted: false,
			});
			return;
		}
		if (this.isSuperseded(generation, observationRevision)) {
			await this.restoreLiveWorkspace(generation);
			return;
		}
		if (!isWorkspaceLiveLoadResultMessage(liveResult)) {
			await this.rejectAfterLiveLoadFailure({
				generation, observationRevision, candidate, issue: { code: 'LIVE_LOAD_FAILED' }, deleted: false,
			});
			return;
		}
		if (liveResult.requestId !== requestId || liveResult.generation !== generation) {
			await this.rejectAfterLiveLoadFailure({
				generation, observationRevision, candidate, issue: { code: 'LIVE_LOAD_FAILED' }, deleted: false,
			});
			return;
		}
		if (!liveResult.success) {
			await this.rejectAfterLiveLoadFailure({
				generation,
				observationRevision,
				candidate,
				issue: liveResult.issue || { code: 'LIVE_LOAD_FAILED' },
				deleted: false,
			});
			return;
		}
		if (!await this.isCandidateCurrent(generation, observationRevision, candidate)) {
			await this.restoreLiveWorkspace(generation);
			return;
		}

		try {
			const committed = await this.commitValidDocument(liveResult.normalizedDocument!, {
				generation,
				observationRevision,
				candidate,
			});
			if (!committed) {
				await this.restoreLiveWorkspace(generation);
				return;
			}
		} catch {
			await this.restoreLiveWorkspace(generation);
			await this.quarantineAndRecover({
				generation,
				observationRevision,
				candidate,
				issue: { code: 'DISK_COMMIT_FAILED' },
				deleted: false,
			});
			return;
		}
		await this.writeValidationStatus(generation, 'accepted');
		log(`Workspace candidate generation ${generation} committed after runtime validation`, 'info');
	}

	private runExclusiveWorkspaceTransaction<T>(operation: () => Promise<T>): Promise<T> {
		const current = this.workspaceTransactionTail.then(operation);
		this.workspaceTransactionTail = current.then(() => undefined, () => undefined);
		return current;
	}

	private async rejectCandidate(context: RejectedCandidateContext): Promise<void> {
		await this.runExclusiveWorkspaceTransaction(() => this.quarantineAndRecover(context));
	}

	private async rejectAfterLiveLoadFailure(context: RejectedCandidateContext): Promise<void> {
		await this.restoreLiveWorkspace(context.generation);
		await this.quarantineAndRecover(context);
	}

	private scheduleCandidate(deleted: boolean): void {
		if (this.disposed) {return;}
		const observationRevision = ++this.observationRevision;
		if (this.debounceTimer) {clearTimeout(this.debounceTimer);}
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = undefined;
			void this.processObservedCandidate(deleted, observationRevision);
		}, 500);
	}

	private async processObservedCandidate(deleted: boolean, observationRevision = this.observationRevision): Promise<void> {
		if (observationRevision !== this.observationRevision) {return;}
		const expected = this.expectedInternalMainState;
		if (deleted && expected?.kind === 'absent' && !this.fileService.fileExists(MAIN_PATH)) {return;}
		if (!deleted && expected?.kind === 'present' && this.fileService.fileExists(MAIN_PATH)) {
			try {
				const currentHash = WorkspaceCandidateService.sha256(await this.fileService.readBuffer(MAIN_PATH));
				if (currentHash === expected.hash) {return;}
			} catch {
				// Process the event through the normal recovery path.
			}
		}
		await this.processCandidate(deleted, observationRevision);
	}

	private async quarantineAndRecover({
		generation,
		observationRevision,
		candidate,
		issue,
		deleted,
		allowRecovery = true,
	}: RejectedCandidateContext): Promise<void> {
		if (this.isSuperseded(generation, observationRevision)) {return;}
		const quarantine = candidate || Buffer.from(`${JSON.stringify({ code: issue.code }, null, 2)}\n`);
		const timestamp = WorkspaceCandidateService.timestamp(this.now());
		try {
			await this.fileService.writeFileAtomic(INVALID_PATH, quarantine);
			await this.fileService.writeFileAtomic(`blockly/main.invalid.${timestamp}-${generation}.json`, quarantine);
			await this.rotateHistory();
		} catch {
			log(`Workspace candidate quarantine failed: ${issue.code}`, 'warn');
		}
		if (!await this.isRejectedCandidateCurrent(generation, observationRevision, candidate, deleted)) {return;}

		let outcome: WorkspaceRejectionOutcome = 'quarantined';
		const recovery = allowRecovery ? await this.getRecoveryBytes(candidate) : undefined;
		if (!await this.isRejectedCandidateCurrent(generation, observationRevision, candidate, deleted)) {return;}
		if (recovery) {
			try {
				this.expectMainBytes(recovery);
				await this.fileService.writeFileAtomic(MAIN_PATH, recovery);
				this.lastValidMemory = recovery;
				outcome = 'restored';
			} catch {
				log(`Workspace candidate recovery write failed: ${issue.code}`, 'warn');
			}
		}
		log(`Workspace candidate rejected: ${issue.code}`, 'warn');
		await this.writeValidationStatus(generation, 'rejected', issue);
		try {
			const callback = this.onRejected?.(issue, outcome);
			if (callback) {
				void callback.catch(() => log(`Workspace candidate rejection callback failed: ${issue.code}`, 'warn'));
			}
		} catch {
			log(`Workspace candidate rejection callback failed: ${issue.code}`, 'warn');
		}
	}

	private async writeValidationStatus(
		generation: number,
		status: 'accepted' | 'rejected',
		issue?: WorkspaceValidationIssue
	): Promise<void> {
		const document = {
			schemaVersion: 1,
			status,
			generation,
			...(issue ? { issue } : {}),
			updatedAt: this.now().toISOString(),
		};
		try {
			await this.fileService.writeFileAtomic(VALIDATION_STATUS_PATH, `${JSON.stringify(document, null, 2)}\n`);
		} catch {
			log(`Workspace validation status could not be written: ${status}`, 'warn');
		}
	}

	private async getRecoveryBytes(excluded?: Buffer): Promise<Buffer | undefined> {
		if (this.fileService.fileExists(BACKUP_PATH)) {
			try {
				const bytes = await this.fileService.readBuffer(BACKUP_PATH);
				if (bytes.length > 0 && (!excluded || !bytes.equals(excluded))) {return bytes;}
			} catch {
				// Fall through to the in-memory snapshot.
			}
		}
		return this.lastValidMemory && (!excluded || !this.lastValidMemory.equals(excluded))
			? Buffer.from(this.lastValidMemory)
			: undefined;
	}

	private async restoreLiveWorkspace(generation: number): Promise<void> {
		const recovery = await this.getRecoveryBytes();
		if (!recovery || !this.liveLoadChannel) {return;}
		try {
			const document = JSON.parse(recovery.toString('utf8')) as WorkspaceDocument;
			if (!isWorkspaceDocument(document)) {return;}
			const deadlineAt = Date.now() + this.timeoutMs;
			const requestId = randomUUID();
			const result = await this.withDeadline(this.liveLoadChannel(requestId, generation, deadlineAt, document), deadlineAt);
			if (
				!isWorkspaceLiveLoadResultMessage(result) ||
				result.requestId !== requestId ||
				result.generation !== generation ||
				!result.success
			) {
				log('Workspace live rollback was not acknowledged', 'warn');
			}
		} catch {
			log('Workspace live rollback could not be acknowledged', 'warn');
		}
	}

	private async readExistingBytes(relativePath: string): Promise<Buffer | undefined> {
		if (!this.fileService.fileExists(relativePath)) {return undefined;}
		return await this.fileService.readBuffer(relativePath);
	}

	private async restoreBytes(relativePath: string, bytes: Buffer | undefined): Promise<void> {
		if (bytes !== undefined) {
			if (relativePath === MAIN_PATH) {this.expectMainBytes(bytes);}
			await this.fileService.writeFileAtomic(relativePath, bytes);
		} else {
			if (relativePath === MAIN_PATH) {this.expectedInternalMainState = { kind: 'absent' };}
			await this.fileService.deleteFile(relativePath);
		}
	}

	private async restoreSnapshotIfUnchanged(
		relativePath: string,
		snapshot: Buffer | undefined,
		transactionBytes: Buffer
	): Promise<boolean> {
		const current = await this.readExistingBytes(relativePath);
		const isUnchanged =
			(current === undefined && snapshot === undefined) ||
			Boolean(current?.equals(transactionBytes)) ||
			Boolean(current && snapshot && current.equals(snapshot));
		if (!isUnchanged) {
			if (relativePath === MAIN_PATH) {this.expectedInternalMainState = undefined;}
			return false;
		}
		await this.restoreBytes(relativePath, snapshot);
		return true;
	}

	private async rotateHistory(): Promise<void> {
		const files = (await this.fileService.listFiles('blockly')).filter(file => INVALID_HISTORY_PATTERN.test(file)).sort();
		for (const file of files.slice(0, Math.max(0, files.length - 5))) {
			await this.fileService.deleteFile(`blockly/${file}`);
		}
	}

	private async withDeadline<T>(promise: Promise<T>, deadlineAt: number): Promise<T> {
		return await new Promise<T>((resolve, reject) => {
			const remaining = Math.max(0, deadlineAt - Date.now());
			const timer = setTimeout(() => reject(new Error('VALIDATION_TIMEOUT')), remaining);
			promise.then(
				value => {
					clearTimeout(timer);
					resolve(value);
				},
				error => {
					clearTimeout(timer);
					reject(error);
				}
			);
		});
	}

	private isSuperseded(generation: number, observationRevision: number): boolean {
		return this.disposed || generation !== this.generation || observationRevision !== this.observationRevision;
	}

	private async isCandidateCurrent(generation: number, observationRevision: number, candidate: Buffer): Promise<boolean> {
		if (this.isSuperseded(generation, observationRevision) || !this.fileService.fileExists(MAIN_PATH)) {return false;}
		try {
			const matches = (await this.fileService.readBuffer(MAIN_PATH)).equals(candidate);
			return matches && !this.isSuperseded(generation, observationRevision);
		} catch {
			return false;
		}
	}

	private async isRejectedCandidateCurrent(
		generation: number,
		observationRevision: number,
		candidate: Buffer | undefined,
		deleted: boolean
	): Promise<boolean> {
		if (this.isSuperseded(generation, observationRevision)) {return false;}
		if (deleted) {return !this.fileService.fileExists(MAIN_PATH);}
		if (!candidate || !this.fileService.fileExists(MAIN_PATH)) {return false;}
		try {
			const matches = (await this.fileService.readBuffer(MAIN_PATH)).equals(candidate);
			return matches && !this.isSuperseded(generation, observationRevision);
		} catch {
			return false;
		}
	}

	private classifyChannelError(
		error: unknown,
		phase: 'validation' | 'live-load'
	): WorkspaceValidationIssue {
		if (error instanceof Error && error.message === 'VALIDATION_TIMEOUT') {return { code: 'VALIDATION_TIMEOUT' };}
		if (error instanceof Error && error.message === 'CHANNEL_UNAVAILABLE') {return { code: 'CHANNEL_UNAVAILABLE' };}
		return { code: phase === 'validation' ? 'CHANNEL_UNAVAILABLE' : 'LIVE_LOAD_FAILED' };
	}

	dispose(): void {
		if (this.disposed) {return;}
		this.disposed = true;
		this.generation++;
		this.observationRevision++;
		if (this.debounceTimer) {clearTimeout(this.debounceTimer);}
		this.watcher?.dispose();
		this.watcher = undefined;
		this.detachChannels();
		const key = path.resolve(this.workspaceRoot);
		if (services.get(key) === this) {services.delete(key);}
	}

	private static timestamp(date: Date): string {
		return date.toISOString().replace(/[-:.]/g, '');
	}

	private static sha256(bytes: Uint8Array): string {
		return createHash('sha256').update(bytes).digest('hex');
	}

	private expectMainBytes(bytes: Uint8Array): void {
		this.expectedInternalMainState = {
			kind: 'present',
			hash: WorkspaceCandidateService.sha256(bytes),
		};
	}
}
