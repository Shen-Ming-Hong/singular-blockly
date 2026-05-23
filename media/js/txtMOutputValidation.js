/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT M output validation helper.
 *
 * This module intentionally uses a UMD-style export so the same pure
 * validation logic can run in the VS Code WebView and in Node-based tests.
 */

(function (root, factory) {
	'use strict';

	const api = factory();
	if (typeof module === 'object' && module.exports) {
		module.exports = api;
	}
	if (root) {
		root.txtMOutputValidation = api;
	}
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
	'use strict';

	const COMPONENT_KEYS = Object.freeze({
		MOTOR: 'MOTOR',
		LAMP: 'LAMP',
	});

	// Extension points for future M components:
	// - displayMessageKey: localized dropdown label.
	// - requiresDirection: whether the Blockly shape should show the direction field.
	// - valueLabelMessageKey/valueRange: how the shared numeric input is presented.
	// - generatorMode: how txt_motor_speed maps the value to ftrobopy output code.
	// - sharedPinPolicy: whether this component reserves the full M port shared with O ports.
	const M_COMPONENTS = Object.freeze({
		[COMPONENT_KEYS.MOTOR]: Object.freeze({
			key: COMPONENT_KEYS.MOTOR,
			displayMessageKey: 'TXT_COMPONENT_MOTOR',
			requiresDirection: true,
			valueRange: Object.freeze({ min: 0, max: 512 }),
			valueLabelMessageKey: 'TXT_MOTOR_SPEED_SET',
			generatorMode: 'signed-speed',
			sharedPinPolicy: 'm-port-exclusive',
		}),
		[COMPONENT_KEYS.LAMP]: Object.freeze({
			key: COMPONENT_KEYS.LAMP,
			displayMessageKey: 'TXT_COMPONENT_LAMP',
			requiresDirection: false,
			valueRange: Object.freeze({ min: 0, max: 512 }),
			valueLabelMessageKey: 'TXT_LAMP_BRIGHTNESS',
			generatorMode: 'unsigned-level',
			sharedPinPolicy: 'm-port-exclusive',
		}),
	});

	const M_PORTS = Object.freeze(['M1', 'M2', 'M3', 'M4']);
	const O_PORTS = Object.freeze(['O1', 'O2', 'O3', 'O4', 'O5', 'O6', 'O7', 'O8']);
	const O_TO_M_PORT_MAP = Object.freeze({
		O1: 'M1',
		O2: 'M1',
		O3: 'M2',
		O4: 'M2',
		O5: 'M3',
		O6: 'M3',
		O7: 'M4',
		O8: 'M4',
	});
	const M_TO_O_PORTS = Object.freeze({
		M1: Object.freeze(['O1', 'O2']),
		M2: Object.freeze(['O3', 'O4']),
		M3: Object.freeze(['O5', 'O6']),
		M4: Object.freeze(['O7', 'O8']),
	});

	function normalizePort(value, prefix, min, max) {
		const raw = String(value ?? '').trim().toUpperCase();
		const numberText = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
		const portNumber = Number.parseInt(numberText, 10);
		if (!Number.isInteger(portNumber) || portNumber < min || portNumber > max) {
			return null;
		}
		return `${prefix}${portNumber}`;
	}

	function normalizeMPort(value) {
		return normalizePort(value, 'M', 1, 4);
	}

	function normalizeOPort(value) {
		return normalizePort(value, 'O', 1, 8);
	}

	function normalizeComponent(value) {
		const raw = String(value ?? '').trim().toUpperCase();
		return Object.prototype.hasOwnProperty.call(M_COMPONENTS, raw) ? raw : COMPONENT_KEYS.MOTOR;
	}

	function getComponentMetadata(value) {
		return M_COMPONENTS[normalizeComponent(value)];
	}

	function getBlockId(block, fallbackPrefix, index) {
		return String(block?.id || `${fallbackPrefix}-${index + 1}`);
	}

	function getFieldValue(block, name) {
		if (!block) {
			return undefined;
		}
		if (typeof block.getFieldValue === 'function') {
			return block.getFieldValue(name);
		}
		return block.fields ? block.fields[name] : undefined;
	}

	function isEnabledBlocklyBlock(block) {
		if (!block || block.isInsertionMarker_) {
			return false;
		}
		if (typeof block.isEnabled === 'function' && !block.isEnabled()) {
			return false;
		}
		if (typeof block.getInheritedDisabled === 'function' && block.getInheritedDisabled()) {
			return false;
		}
		return true;
	}

	function visitSerializedBlock(block, visitor) {
		if (!block || typeof block !== 'object') {
			return;
		}
		visitor(block);
		if (block.inputs && typeof block.inputs === 'object') {
			Object.values(block.inputs).forEach(input => {
				if (input?.block) {
					visitSerializedBlock(input.block, visitor);
				}
			});
		}
		if (block.next?.block) {
			visitSerializedBlock(block.next.block, visitor);
		}
	}

	function getSerializedTopBlocks(source) {
		if (Array.isArray(source)) {
			return source;
		}
		return source?.workspace?.blocks?.blocks || source?.blocks?.blocks || [];
	}

	function getAllBlocks(source) {
		if (!source) {
			return [];
		}
		if (typeof source.getAllBlocks === 'function') {
			return source.getAllBlocks(false).filter(isEnabledBlocklyBlock);
		}

		const blocks = [];
		getSerializedTopBlocks(source).forEach(block => visitSerializedBlock(block, nestedBlock => blocks.push(nestedBlock)));
		return blocks;
	}

	function createMUsageRecord(block, index, sourceType) {
		const port = normalizeMPort(getFieldValue(block, 'MOTOR'));
		if (!port) {
			return null;
		}

		const component = sourceType === 'txt_motor_speed' ? normalizeComponent(getFieldValue(block, 'COMPONENT')) : null;
		return {
			kind: sourceType === 'txt_motor_speed' ? 'm-output' : 'm-stop',
			port,
			component,
			blockId: getBlockId(block, sourceType, index),
			blockType: sourceType,
		};
	}

	function createOUsageRecord(block, index) {
		const oPort = normalizeOPort(getFieldValue(block, 'OUTPUT'));
		if (!oPort) {
			return null;
		}

		return {
			kind: 'o-output',
			oPort,
			mappedMPort: O_TO_M_PORT_MAP[oPort],
			blockId: getBlockId(block, 'txt_output', index),
			blockType: 'txt_output',
		};
	}

	function extractWorkspaceUsage(source) {
		const mRecords = [];
		const oRecords = [];
		getAllBlocks(source).forEach((block, index) => {
			if (block.type === 'txt_motor_speed' || block.type === 'txt_motor_stop') {
				const record = createMUsageRecord(block, index, block.type);
				if (record) {
					mRecords.push(record);
				}
			} else if (block.type === 'txt_output') {
				const record = createOUsageRecord(block, index);
				if (record) {
					oRecords.push(record);
				}
			}
		});

		return { mRecords, oRecords };
	}

	function unique(values) {
		return [...new Set(values.filter(Boolean))];
	}

	function sortPorts(ports) {
		return [...ports].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
	}

	function detectComponentConflicts(mRecords) {
		const byPort = new Map();
		mRecords
			.filter(record => record.kind === 'm-output')
			.forEach(record => {
				if (!byPort.has(record.port)) {
					byPort.set(record.port, []);
				}
				byPort.get(record.port).push(record);
			});

		const conflicts = [];
		byPort.forEach((records, mPort) => {
			const components = unique(records.map(record => record.component));
			if (components.length <= 1) {
				return;
			}

			conflicts.push({
				kind: 'M_COMPONENT_CONFLICT',
				mPort,
				components,
				relatedOPorts: [],
				blockIds: unique(records.map(record => record.blockId)),
				messageKey: 'TXT_M_OUTPUT_COMPONENT_CONFLICT_WARNING',
				severity: 'blocking-warning',
			});
		});
		return conflicts;
	}

	function detectSharedPinConflicts(mRecords, oRecords) {
		const usedMPorts = new Map();
		mRecords.forEach(record => {
			if (!usedMPorts.has(record.port)) {
				usedMPorts.set(record.port, []);
			}
			usedMPorts.get(record.port).push(record);
		});

		const oByMappedM = new Map();
		oRecords.forEach(record => {
			if (!oByMappedM.has(record.mappedMPort)) {
				oByMappedM.set(record.mappedMPort, []);
			}
			oByMappedM.get(record.mappedMPort).push(record);
		});

		const conflicts = [];
		usedMPorts.forEach((mPortRecords, mPort) => {
			const relatedORecords = oByMappedM.get(mPort) || [];
			if (relatedORecords.length === 0) {
				return;
			}

			conflicts.push({
				kind: 'M_O_SHARED_PIN_CONFLICT',
				mPort,
				components: unique(mPortRecords.map(record => record.component)),
				relatedOPorts: sortPorts(unique(relatedORecords.map(record => record.oPort))),
				blockIds: unique([...mPortRecords, ...relatedORecords].map(record => record.blockId)),
				messageKey: 'TXT_M_OUTPUT_SHARED_PIN_CONFLICT_WARNING',
				severity: 'blocking-warning',
			});
		});
		return conflicts;
	}

	function formatMessage(messageProvider, key, fallback, args) {
		const template =
			messageProvider && typeof messageProvider.getMessage === 'function'
				? messageProvider.getMessage(key, fallback)
				: fallback;
		return args.reduce((text, arg, index) => text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg)), template);
	}

	function componentLabel(component, messageProvider) {
		const metadata = getComponentMetadata(component);
		return formatMessage(messageProvider, metadata.displayMessageKey, metadata.key, []);
	}

	function formatConflictMessage(conflict, messageProvider) {
		if (conflict.kind === 'M_COMPONENT_CONFLICT') {
			const components = unique(conflict.components || []).map(component => componentLabel(component, messageProvider)).join(' / ');
			return formatMessage(
				messageProvider,
				conflict.messageKey,
				'M port {0} is used as multiple components: {1}. Use one component type per M port.',
				[conflict.mPort, components]
			);
		}

		return formatMessage(
			messageProvider,
			conflict.messageKey,
			'M port {0} shares hardware pins with {1}. Use either the M port or its paired O outputs.',
			[conflict.mPort, (conflict.relatedOPorts || []).join(', ')]
		);
	}

	function validateWorkspace(source, options) {
		const usage = extractWorkspaceUsage(source);
		const conflicts = [
			...detectComponentConflicts(usage.mRecords),
			...detectSharedPinConflicts(usage.mRecords, usage.oRecords),
		];
		const messageProvider = options?.messageProvider;
		const warnings = conflicts.map(conflict => formatConflictMessage(conflict, messageProvider));
		const blockWarnings = {};
		conflicts.forEach((conflict, index) => {
			const message = warnings[index];
			conflict.blockIds.forEach(blockId => {
				if (!blockWarnings[blockId]) {
					blockWarnings[blockId] = [];
				}
				blockWarnings[blockId].push(message);
			});
		});

		return {
			conflicts,
			warnings,
			blockWarnings,
			canGenerate: conflicts.length === 0,
			canExport: conflicts.length === 0,
			canUpload: conflicts.length === 0,
			usage,
		};
	}

	function buildPreflightSummary(source, options) {
		const result = validateWorkspace(source, options);
		return {
			conflicts: result.conflicts,
			warnings: result.warnings,
			blockWarnings: result.blockWarnings,
			canGenerate: result.canGenerate,
			canExport: result.canExport,
			canUpload: result.canUpload,
		};
	}

	return Object.freeze({
		COMPONENT_KEYS,
		M_COMPONENTS,
		M_PORTS,
		O_PORTS,
		O_TO_M_PORT_MAP,
		M_TO_O_PORTS,
		normalizeMPort,
		normalizeOPort,
		normalizeComponent,
		getComponentMetadata,
		extractWorkspaceUsage,
		detectComponentConflicts,
		detectSharedPinConflicts,
		validateWorkspace,
		buildPreflightSummary,
		formatConflictMessage,
	});
});