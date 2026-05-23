/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type SerializedTxtBlock = {
	type: string;
	id?: string;
	fields?: Record<string, string | number>;
	inputs?: Record<string, { block?: SerializedTxtBlock; shadow?: SerializedTxtBlock }>;
	next?: { block?: SerializedTxtBlock };
	x?: number;
	y?: number;
};

export type SerializedTxtWorkspace = {
	blocks: {
		languageVersion: number;
		blocks: SerializedTxtBlock[];
	};
};

export type TxtWorkspaceFile = {
	workspace: SerializedTxtWorkspace;
	board: 'txt';
};

export function numberShadow(value: number, id = `math-${value}`): SerializedTxtBlock {
	return {
		type: 'math_number',
		id,
		fields: {
			NUM: value,
		},
	};
}

export function chainBlocks(blocks: SerializedTxtBlock[]): SerializedTxtBlock | undefined {
	if (blocks.length === 0) {
		return undefined;
	}

	for (let index = 0; index < blocks.length - 1; index++) {
		blocks[index].next = { block: blocks[index + 1] };
	}
	return blocks[0];
}

export function txtSetupBlock(children: SerializedTxtBlock[] = [], id = 'txt-setup-1'): SerializedTxtBlock {
	const firstChild = chainBlocks(children);
	return {
		type: 'txt_setup',
		id,
		inputs: firstChild ? { DO: { block: firstChild } } : undefined,
	};
}

export function txtProcessBlock(children: SerializedTxtBlock[] = [], id = 'txt-process-1', name = 'Main'): SerializedTxtBlock {
	const firstChild = chainBlocks(children);
	return {
		type: 'txt_process',
		id,
		fields: { NAME: name },
		inputs: firstChild ? { DO: { block: firstChild } } : undefined,
	};
}

export function txtMOutputBlock(options: {
	id?: string;
	port?: 1 | 2 | 3 | 4 | '1' | '2' | '3' | '4' | 'M1' | 'M2' | 'M3' | 'M4';
	component?: 'MOTOR' | 'LAMP' | string;
	direction?: 'FORWARD' | 'BACKWARD';
	value?: number;
} = {}): SerializedTxtBlock {
	const port = String(options.port ?? '1').replace(/^M/i, '');
	const fields: Record<string, string> = {
		MOTOR: port,
		DIRECTION: options.direction ?? 'FORWARD',
	};
	if (options.component !== undefined) {
		fields.COMPONENT = options.component;
	} else {
		fields.COMPONENT = 'MOTOR';
	}

	return {
		type: 'txt_motor_speed',
		id: options.id ?? `txt-m-${port}-${fields.COMPONENT.toLowerCase()}`,
		fields,
		inputs: {
			SPEED: {
				shadow: numberShadow(options.value ?? 512, `${options.id ?? `txt-m-${port}`}-speed`),
			},
		},
	};
}

export function legacyTxtMOutputBlock(options: {
	id?: string;
	port?: 1 | 2 | 3 | 4 | '1' | '2' | '3' | '4' | 'M1' | 'M2' | 'M3' | 'M4';
	direction?: 'FORWARD' | 'BACKWARD';
	value?: number;
} = {}): SerializedTxtBlock {
	const block = txtMOutputBlock({ ...options, component: 'MOTOR' });
	delete block.fields?.COMPONENT;
	return block;
}

export function txtMStopBlock(options: {
	id?: string;
	port?: 1 | 2 | 3 | 4 | '1' | '2' | '3' | '4' | 'M1' | 'M2' | 'M3' | 'M4';
} = {}): SerializedTxtBlock {
	const port = String(options.port ?? '1').replace(/^M/i, '');
	return {
		type: 'txt_motor_stop',
		id: options.id ?? `txt-stop-m-${port}`,
		fields: { MOTOR: port },
	};
}

export function txtOutputBlock(options: {
	id?: string;
	port?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | 'O1' | 'O2' | 'O3' | 'O4' | 'O5' | 'O6' | 'O7' | 'O8';
	state?: 'ON' | 'OFF';
} = {}): SerializedTxtBlock {
	const port = String(options.port ?? '1').replace(/^O/i, '');
	return {
		type: 'txt_output',
		id: options.id ?? `txt-output-o-${port}`,
		fields: {
			OUTPUT: port,
			STATE: options.state ?? 'ON',
		},
	};
}

export function txtWorkspace(topBlocks: SerializedTxtBlock[]): SerializedTxtWorkspace {
	return {
		blocks: {
			languageVersion: 0,
			blocks: topBlocks,
		},
	};
}

export function txtWorkspaceFile(topBlocks: SerializedTxtBlock[]): TxtWorkspaceFile {
	return {
		workspace: txtWorkspace(topBlocks),
		board: 'txt',
	};
}