/**
 * Node.js Detection and MCP Diagnostic Types
 * Feature: MCP Server Graceful Degradation
 * @module types/nodeDetection
 */

/**
 * Node.js version object (parsed semantic version)
 */
export interface NodeVersion {
	major: number;
	minor: number;
	patch: number;
}

/**
 * Node.js detection error types
 */
export enum NodeErrorType {
	/** Command does not exist or not in PATH */
	NotFound = 'not_found',
	/** File exists but is not a valid Node.js executable */
	NotExecutable = 'not_executable',
	/** No execution permission */
	Permission = 'permission',
	/** Execution timeout */
	Timeout = 'timeout',
	/** Version is too old */
	VersionLow = 'version_low',
	/** Version parsing failed */
	ParseError = 'parse_error',
	/** Other unknown errors */
	Unknown = 'unknown',
}

/**
 * Node.js detection result
 */
export interface NodeDetectionResult {
	/** Whether Node.js is available (can successfully execute node --version) */
	readonly available: boolean;

	/** Node.js version string (format: v22.16.0), only when available is true */
	readonly version?: string;

	/** Parsed version object, only when available is true */
	readonly parsedVersion?: NodeVersion;

	/** Whether the version meets the minimum requirement (>= 22.16.0) */
	readonly versionCompatible: boolean;

	/** The Node.js executable path used (can be 'node' or custom path) */
	readonly nodePath: string;

	/** Error message (only when detection fails) */
	readonly errorMessage?: string;

	/** Error type (only when detection fails) */
	readonly errorType?: NodeErrorType;
}

/**
 * Path validation result
 */
export interface PathValidationResult {
	/** Whether the path is valid */
	readonly valid: boolean;

	/** Error message (only when valid is false) */
	readonly error?: string;

	/** Error type (only when valid is false) */
	readonly errorType?: 'not_found' | 'not_executable' | 'permission' | 'invalid_path' | 'unknown';

	/** The validated path */
	readonly path: string;
}

/**
 * MCP comprehensive status
 */
export type McpStatus =
	| 'operational' // Can operate normally
	| 'partially_available' // Partially available (e.g., Node.js version low but executable)
	| 'unavailable'; // Cannot start

/**
 * Diagnostic report format options
 */
export interface DiagnosticReportFormatOptions {
	/** Whether to include timestamp */
	includeTimestamp?: boolean;

	/** Whether to use emoji icons */
	useEmoji?: boolean;

	/** Target format */
	format: 'text' | 'markdown' | 'json';
}

/**
 * MCP diagnostic report
 */
export interface McpDiagnosticReport {
	/** Node.js detection result */
	nodeDetection: NodeDetectionResult;

	/** Whether the MCP Server bundle file exists */
	mcpServerBundleExists: boolean;

	/** MCP Server bundle file path */
	mcpServerBundlePath: string;

	/** Whether VSCode API supports MCP (version >= 1.105.0) */
	vscodeApiSupported: boolean;

	/** VSCode version string */
	vscodeVersion: string;

	/** Workspace path */
	workspacePath: string | null;

	/** Overall status assessment */
	overallStatus: McpStatus;

	/** List of recommended solutions */
	recommendations: string[];

	/** Timestamp of report generation */
	timestamp: string;
}

/**
 * MCP settings
 */
export interface McpSettings {
	/** Custom Node.js executable path (empty string or undefined means use default 'node') */
	nodePath: string;

	/** Whether to show startup warning */
	showStartupWarning: boolean;
}

/**
 * Default MCP settings
 */
export const DEFAULT_MCP_SETTINGS: McpSettings = {
	nodePath: 'node',
	showStartupWarning: true,
};

/**
 * Minimum Node.js version required for MCP Server
 */
export const MIN_NODE_VERSION: NodeVersion = {
	major: 22,
	minor: 16,
	patch: 0,
};

/**
 * Minimum Node.js version string required for MCP Server
 */
export const MIN_NODE_VERSION_STRING = '22.16.0';

/**
 * Node.js detection configuration
 */
export const NODE_DETECTION_CONFIG = {
	/** Timeout for executing node --version (milliseconds) */
	TIMEOUT: 3000,

	/** Cache duration for detection results (milliseconds), detect once during extension startup and cache */
	CACHE_DURATION: Infinity, // Cache until extension restarts

	/** Regular expression for version parsing */
	VERSION_REGEX: /^v?(\d+)\.(\d+)\.(\d+)/,
};

/**
 * Node.js detection service interface
 */
export interface INodeDetectionService {
	/**
	 * Detect Node.js availability and version
	 * @param nodePath Node.js executable path (default: 'node')
	 * @returns Node.js detection result
	 */
	detectNodeJs(nodePath?: string): Promise<NodeDetectionResult>;

	/**
	 * Validate the specified Node.js path
	 * @param nodePath Node.js executable path
	 * @returns Path validation result
	 */
	validateNodePath(nodePath: string): Promise<PathValidationResult>;

	/**
	 * Compare two version numbers
	 * @param version Detected version
	 * @param minVersion Minimum required version
	 * @returns Whether it meets the minimum requirement
	 */
	isVersionCompatible(version: NodeVersion, minVersion: NodeVersion): boolean;

	/**
	 * Parse Node.js version string
	 * @param versionString Version string (e.g., 'v22.16.0')
	 * @returns Parsed version object, returns null on failure
	 */
	parseVersion(versionString: string): NodeVersion | null;
}

/**
 * Diagnostic service interface
 */
export interface IDiagnosticService {
	/**
	 * Collect MCP diagnostic information
	 * @param extensionPath Extension installation path
	 * @returns MCP diagnostic report
	 */
	collectDiagnostics(extensionPath: string): Promise<McpDiagnosticReport>;

	/**
	 * Format diagnostic report into user-readable text
	 * @param report Diagnostic report
	 * @param options Format options
	 * @returns Formatted report text
	 */
	formatReport(report: McpDiagnosticReport, options?: DiagnosticReportFormatOptions): Promise<string>;

	/**
	 * Copy diagnostic report to clipboard
	 * @param report Diagnostic report
	 * @returns Whether the copy was successful
	 */
	copyToClipboard(report: McpDiagnosticReport): Promise<boolean>;
}
