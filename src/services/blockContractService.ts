/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface BlockContractConnection {
	enabled: boolean;
	check: string[] | null;
}

export interface BlockContractInput {
	name: string;
	kind: 'VALUE' | 'STATEMENT' | 'DUMMY' | 'CUSTOM' | 'END_ROW' | string;
	connection: BlockContractConnection;
}

export interface BlockContractField {
	name: string;
	kind: string;
	defaultValue?: unknown;
	options?: string[];
	optionsMode?: 'static' | 'dynamic';
}

export interface BlockContractVariant {
	connections: {
		previous: BlockContractConnection;
		next: BlockContractConnection;
		output: BlockContractConnection;
	};
	inputs: BlockContractInput[];
	fields: BlockContractField[];
	minimalState: Record<string, unknown>;
	extraState?: unknown;
}

export interface BlockContractEntry {
	type: string;
	categories: string[];
	boards: string[];
	variants: Record<string, BlockContractVariant>;
}

export interface BlockContract {
	schemaVersion: 3;
	blocklyVersion: string;
	boards: Array<{ id: string; language: string; toolbox: string }>;
	blocks: BlockContractEntry[];
}

interface BlockContractShardDescriptor {
	category: string;
	path: string;
	blockTypes: string[];
}

interface BlockContractIndex {
	schemaVersion: 3;
	blocklyVersion: string;
	boards: BlockContract['boards'];
	shards: BlockContractShardDescriptor[];
}

interface BlockContractShard {
	schemaVersion: 3;
	category: string;
	blocks: BlockContractEntry[];
}

export interface LoadedBlockContract {
	contract: BlockContract;
	sha256: string;
	path: string;
}

const CONTRACT_RELATIVE_PATH = path.join(
	'project-skills',
	'singular-blockly',
	'canonical',
	'references',
	'block-contract.json'
);
const SHARD_PATH_PATTERN = /^block-contract\/([a-z0-9][a-z0-9_-]*)\.json$/;

/** Reads and validates the tracked category-sharded block contract. */
export class BlockContractService {
	private cached?: LoadedBlockContract;

	constructor(private readonly extensionPath: string) {}

	load(): LoadedBlockContract {
		if (this.cached) {return this.cached;}
		const indexPath = [
			path.join(this.extensionPath, 'resources', CONTRACT_RELATIVE_PATH),
			path.join(this.extensionPath, 'dist', CONTRACT_RELATIVE_PATH),
		].find(candidate => fs.existsSync(candidate));
		if (!indexPath) {throw new Error('BLOCK_CONTRACT_MISSING');}

		const indexBytes = fs.readFileSync(indexPath);
		const index = this.parseJson(indexBytes);
		if (!BlockContractService.isIndex(index)) {throw new Error('BLOCK_CONTRACT_INVALID_SCHEMA');}

		const referencesRoot = path.dirname(indexPath);
		const digest = createHash('sha256').update('block-contract.json\0').update(indexBytes);
		const blocks: BlockContractEntry[] = [];
		const boardIds = new Set(index.boards.map(board => board.id));
		for (const descriptor of index.shards) {
			const shardPath = this.resolveShardPath(referencesRoot, descriptor);
			if (!fs.existsSync(shardPath)) {throw new Error('BLOCK_CONTRACT_SHARD_MISSING');}
			const shardBytes = fs.readFileSync(shardPath);
			const shard = this.parseJson(shardBytes);
			if (!BlockContractService.isShard(shard, descriptor, boardIds)) {
				throw new Error('BLOCK_CONTRACT_INVALID_SCHEMA');
			}
			digest.update(`\0${descriptor.path}\0`).update(shardBytes);
			blocks.push(...shard.blocks);
		}
		blocks.sort((left, right) => left.type.localeCompare(right.type, 'en'));

		this.cached = {
			contract: {
				schemaVersion: 3,
				blocklyVersion: index.blocklyVersion,
				boards: index.boards,
				blocks,
			},
			sha256: digest.digest('hex'),
			path: indexPath,
		};
		return this.cached;
	}

	getBlock(type: string): BlockContractEntry | undefined {
		return this.load().contract.blocks.find(block => block.type === type);
	}

	private parseJson(bytes: Buffer): unknown {
		try {
			return JSON.parse(bytes.toString('utf8')) as unknown;
		} catch {
			throw new Error('BLOCK_CONTRACT_INVALID_JSON');
		}
	}

	private resolveShardPath(referencesRoot: string, descriptor: BlockContractShardDescriptor): string {
			const match = SHARD_PATH_PATTERN.exec(descriptor.path);
			if (!match || match[1] !== descriptor.category) {throw new Error('BLOCK_CONTRACT_INVALID_SCHEMA');}
			return path.resolve(referencesRoot, ...descriptor.path.split('/'));
	}

	private static isIndex(value: unknown): value is BlockContractIndex {
		if (!value || typeof value !== 'object') {return false;}
		const candidate = value as Partial<BlockContractIndex>;
		if (candidate.schemaVersion !== 3 || typeof candidate.blocklyVersion !== 'string') {return false;}
		if (
			!Array.isArray(candidate.boards) || candidate.boards.length === 0 ||
			!Array.isArray(candidate.shards) || candidate.shards.length === 0
		) {return false;}
		const boardIds = candidate.boards.map(board => board?.id);
		if (
			boardIds.some(id => typeof id !== 'string') ||
			new Set(boardIds).size !== boardIds.length ||
			candidate.boards.some(board => typeof board.language !== 'string' || typeof board.toolbox !== 'string')
		) {return false;}

		const categories = candidate.shards.map(shard => shard?.category);
		if (
			categories.some(category => typeof category !== 'string') ||
			new Set(categories).size !== categories.length ||
			!BlockContractService.isSorted(categories as string[])
		) {return false;}
		const indexedTypes = new Set<string>();
		for (const shard of candidate.shards) {
			if (
				typeof shard.path !== 'string' ||
				!Array.isArray(shard.blockTypes) ||
				shard.blockTypes.length === 0 ||
				shard.blockTypes.some(type => typeof type !== 'string') ||
				!BlockContractService.isSorted(shard.blockTypes) ||
				new Set(shard.blockTypes).size !== shard.blockTypes.length
			) {return false;}
			for (const type of shard.blockTypes) {
				if (indexedTypes.has(type)) {return false;}
				indexedTypes.add(type);
			}
		}
		return true;
	}

	private static isShard(
		value: unknown,
		descriptor: BlockContractShardDescriptor,
		boardIds: Set<string>
	): value is BlockContractShard {
		if (!value || typeof value !== 'object') {return false;}
		const shard = value as Partial<BlockContractShard>;
		if (shard.schemaVersion !== 3 || shard.category !== descriptor.category || !Array.isArray(shard.blocks)) {return false;}
		const types = shard.blocks.map(block => block?.type);
		if (types.length !== descriptor.blockTypes.length || types.some((type, index) => type !== descriptor.blockTypes[index])) {
			return false;
		}
		for (const block of shard.blocks) {
			if (!BlockContractService.isBlock(block, descriptor.category, boardIds)) {return false;}
		}
		return true;
	}

	private static isBlock(block: BlockContractEntry, shardCategory: string, boardIds: Set<string>): boolean {
		if (
			!block || typeof block.type !== 'string' ||
			!Array.isArray(block.categories) || block.categories.length === 0 ||
			block.categories.some(category => typeof category !== 'string') ||
			new Set(block.categories).size !== block.categories.length ||
			!BlockContractService.isSorted(block.categories) ||
			!Array.isArray(block.boards) || block.boards.length === 0 ||
			block.boards.some(board => typeof board !== 'string') ||
			new Set(block.boards).size !== block.boards.length ||
			!BlockContractService.isSorted(block.boards)
		) {
			return false;
		}
		const categoryMatches = shardCategory === 'shared'
			? block.categories.length > 1
			: block.categories.length === 1 && block.categories[0] === shardCategory;
		if (!categoryMatches || block.boards.some(board => !boardIds.has(board))) {return false;}
		if (!block.variants || Object.keys(block.variants).length !== block.boards.length) {return false;}
		for (const board of block.boards) {
			const variant = block.variants[board];
			if (!variant?.connections || !Array.isArray(variant.inputs) || !Array.isArray(variant.fields)) {return false;}
			if (!variant.minimalState || variant.minimalState.type !== block.type) {return false;}
			if (variant.fields.some(field => (
				!field || typeof field.name !== 'string' || typeof field.kind !== 'string' ||
				(field.options !== undefined && (
					!Array.isArray(field.options) || field.options.some(option => typeof option !== 'string')
				)) ||
				(field.optionsMode !== undefined && !['static', 'dynamic'].includes(field.optionsMode))
			))) {return false;}
		}
		return true;
	}

	private static isSorted(values: string[]): boolean {
		return values.every((value, index) => index === 0 || values[index - 1].localeCompare(value, 'en') <= 0);
	}
}
