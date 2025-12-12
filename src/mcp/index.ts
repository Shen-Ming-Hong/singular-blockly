/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * MCP 模組索引
 * 匯出所有 MCP 相關功能
 */

// Block Dictionary
export { getBlockDictionary, getBlockByType, searchBlocks, formatBlockUsage, formatCategoryBlocks } from './blockDictionary.js';
export type { BlockDefinition, BlockField, BlockInput, CategoryInfo, SearchResult, BlockDictionary } from './blockDictionary.js';

// MCP Provider (VSCode Extension)
export { registerMcpProvider, checkMcpServerExists } from './mcpProvider.js';

// Tools
export { registerBlockQueryTools } from './tools/blockQuery.js';
export { registerPlatformConfigTools } from './tools/platformConfig.js';
export { registerWorkspaceOpsTools } from './tools/workspaceOps.js';
