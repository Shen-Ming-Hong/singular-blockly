/**
 * Node.js Detection Service
 * Detects Node.js availability, validates version, and provides path validation
 * @module services/nodeDetectionService
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import {
	INodeDetectionService,
	NodeDetectionResult,
	PathValidationResult,
	NodeVersion,
	MIN_NODE_VERSION,
	NODE_DETECTION_CONFIG,
	NodeErrorType,
} from '../types/nodeDetection';
import { log } from './logging';

const execAsync = promisify(exec);

/**
 * Node.js detection service implementation
 */
export class NodeDetectionService implements INodeDetectionService {
	/**
	 * Detect Node.js availability and version
	 * @param nodePath Node.js executable path (default: 'node')
	 * @returns Node.js detection result
	 */
	async detectNodeJs(nodePath: string = 'node'): Promise<NodeDetectionResult> {
		const startTime = Date.now();
		const logContext = {
			nodePath,
			command: `${nodePath} --version`,
			timestamp: new Date().toISOString(),
		};

		log(`Detecting Node.js at: ${nodePath}`, 'info');

		// Step 1: Path validation (only if not default 'node')
		if (nodePath !== 'node') {
			if (!path.isAbsolute(nodePath)) {
				const errorMsg = 'Path must be absolute';
				log(`Node.js detection failed: ${errorMsg}`, 'error', { ...logContext, errorType: NodeErrorType.NotFound });
				return {
					available: false,
					versionCompatible: false,
					nodePath,
					errorMessage: errorMsg,
					errorType: NodeErrorType.NotFound,
				};
			}

			if (!fs.existsSync(nodePath)) {
				const errorMsg = 'Specified file does not exist';
				log(`Node.js detection failed: ${errorMsg}`, 'error', { ...logContext, errorType: NodeErrorType.NotFound });
				return {
					available: false,
					versionCompatible: false,
					nodePath,
					errorMessage: errorMsg,
					errorType: NodeErrorType.NotFound,
				};
			}
		}

		// Step 2: Execute node --version
		try {
			// For default 'node' command, don't use quotes to avoid Windows CMD issues
			// For absolute paths (with spaces), use quotes
			const command = nodePath === 'node' ? 'node --version' : `"${nodePath}" --version`;

			const { stdout, stderr } = await execAsync(command, {
				timeout: NODE_DETECTION_CONFIG.TIMEOUT,
				windowsHide: true,
			});

			const version = stdout.trim();
			const executionTime = Date.now() - startTime;

			log(`Node.js version detected: ${version} (${executionTime}ms)`, 'info', {
				...logContext,
				stdout: version,
				stderr: stderr || '(empty)',
				executionTimeMs: executionTime,
			});

			// Step 3: Parse version
			const parsedVersion = this.parseVersion(version);

			if (!parsedVersion) {
				const errorMsg = `Unable to parse version: ${version}`;
				log(`Node.js version parsing failed`, 'error', {
					...logContext,
					stdout: version,
					errorType: NodeErrorType.ParseError,
				});
				return {
					available: true,
					version,
					versionCompatible: false,
					nodePath,
					errorMessage: errorMsg,
					errorType: NodeErrorType.ParseError,
				};
			}

			// Step 4: Compare version
			const compatible = this.isVersionCompatible(parsedVersion, MIN_NODE_VERSION);

			if (!compatible) {
				const errorMsg = `Version ${version} is below minimum requirement v${MIN_NODE_VERSION.major}.${MIN_NODE_VERSION.minor}.${MIN_NODE_VERSION.patch}`;
				log(`Node.js version incompatible`, 'warn', {
					...logContext,
					detectedVersion: version,
					requiredVersion: `v${MIN_NODE_VERSION.major}.${MIN_NODE_VERSION.minor}.${MIN_NODE_VERSION.patch}`,
					errorType: NodeErrorType.VersionLow,
				});
				return {
					available: true,
					version,
					parsedVersion,
					versionCompatible: false,
					nodePath,
					errorMessage: errorMsg,
					errorType: NodeErrorType.VersionLow,
				};
			}

			// Success
			log(`Node.js detection successful: ${version}`, 'info', {
				...logContext,
				parsedVersion,
				compatible: true,
			});

			return {
				available: true,
				version,
				parsedVersion,
				versionCompatible: true,
				nodePath,
			};
		} catch (error: any) {
			const executionTime = Date.now() - startTime;

			// Step 5: Error handling
			let errorType: NodeErrorType;
			let errorMessage: string;

			if (error.code === 'ENOENT') {
				errorType = NodeErrorType.NotFound;
				errorMessage = 'Node.js not found in PATH or invalid executable path';
			} else if (error.code === 'EACCES' || error.code === 'EPERM') {
				errorType = NodeErrorType.Permission;
				errorMessage = 'Permission denied when trying to execute Node.js';
			} else if (error.killed && error.signal === 'SIGTERM') {
				errorType = NodeErrorType.Timeout;
				errorMessage = `Execution timeout (${NODE_DETECTION_CONFIG.TIMEOUT}ms)`;
			} else if (error.code === 'ENOTDIR' || error.code === 'EISDIR') {
				errorType = NodeErrorType.NotExecutable;
				errorMessage = 'Specified file is not a valid Node.js executable';
			} else {
				// Don't include error.message to avoid Windows CMD encoding issues (Big5 -> UTF-8 garbled text)
				errorType = NodeErrorType.Unknown;
				errorMessage = `Command execution failed with error code: ${error.code || 'UNKNOWN'}`;
			}

			log(`Node.js detection failed: ${errorMessage}`, 'error', {
				...logContext,
				errorType,
				errorCode: error.code,
				errorSignal: error.signal,
				stdout: error.stdout || '(empty)',
				stderr: error.stderr || '(empty)',
				executionTimeMs: executionTime,
				fullError: String(error),
			});

			return {
				available: false,
				versionCompatible: false,
				nodePath,
				errorMessage,
				errorType,
			};
		}
	}

	/**
	 * Validate the specified Node.js path
	 * @param nodePath Node.js executable path
	 * @returns Path validation result
	 */
	async validateNodePath(nodePath: string): Promise<PathValidationResult> {
		log(`Validating Node.js path: ${nodePath}`, 'info');

		// Default 'node' is always valid
		if (nodePath === 'node') {
			return {
				valid: true,
				path: nodePath,
			};
		}

		// Check if path is absolute
		if (!path.isAbsolute(nodePath)) {
			return {
				valid: false,
				error: 'Path must be absolute',
				errorType: 'invalid_path',
				path: nodePath,
			};
		}

		// Check if file exists
		if (!fs.existsSync(nodePath)) {
			return {
				valid: false,
				error: 'Specified file does not exist',
				errorType: 'not_found',
				path: nodePath,
			};
		}

		// Try to execute node --version to verify it's a valid Node.js
		try {
			const { stdout } = await execAsync(`"${nodePath}" --version`, {
				timeout: NODE_DETECTION_CONFIG.TIMEOUT,
				windowsHide: true,
			});

			const version = stdout.trim();

			// Verify output format matches Node.js version pattern
			if (!NODE_DETECTION_CONFIG.VERSION_REGEX.test(version)) {
				return {
					valid: false,
					error: 'Specified file is not a valid Node.js executable',
					errorType: 'not_executable',
					path: nodePath,
				};
			}

			log(`Node.js path validated successfully: ${nodePath} (${version})`, 'info');

			return {
				valid: true,
				path: nodePath,
			};
		} catch (error: any) {
			let errorType: 'not_found' | 'not_executable' | 'permission' | 'unknown';
			let errorMessage: string;

			if (error.code === 'ENOENT') {
				errorType = 'not_found';
				errorMessage = 'Node.js not found in PATH or invalid executable path';
			} else if (error.code === 'EACCES' || error.code === 'EPERM') {
				errorType = 'permission';
				errorMessage = 'Permission denied when trying to execute Node.js';
			} else if (error.code === 'ENOTDIR' || error.code === 'EISDIR') {
				errorType = 'not_executable';
				errorMessage = 'Specified file is not a valid Node.js executable';
			} else {
				// Don't include error.message to avoid Windows CMD encoding issues (Big5 -> UTF-8 garbled text)
				errorType = 'unknown';
				errorMessage = `Command execution failed with error code: ${error.code || 'UNKNOWN'}`;
			}

			log(`Node.js path validation failed: ${errorMessage}`, 'warn', {
				nodePath,
				errorType,
				errorCode: error.code,
			});

			return {
				valid: false,
				error: errorMessage,
				errorType,
				path: nodePath,
			};
		}
	}

	/**
	 * Compare two version numbers
	 * @param version Detected version
	 * @param minVersion Minimum required version
	 * @returns Whether it meets the minimum requirement
	 */
	isVersionCompatible(version: NodeVersion, minVersion: NodeVersion): boolean {
		if (version.major !== minVersion.major) {
			return version.major > minVersion.major;
		}
		if (version.minor !== minVersion.minor) {
			return version.minor > minVersion.minor;
		}
		return version.patch >= minVersion.patch;
	}

	/**
	 * Parse Node.js version string
	 * @param versionString Version string (e.g., 'v22.16.0')
	 * @returns Parsed version object, returns null on failure
	 */
	parseVersion(versionString: string): NodeVersion | null {
		const match = versionString.match(NODE_DETECTION_CONFIG.VERSION_REGEX);
		if (!match) {
			return null;
		}

		return {
			major: parseInt(match[1], 10),
			minor: parseInt(match[2], 10),
			patch: parseInt(match[3], 10),
		};
	}
}
