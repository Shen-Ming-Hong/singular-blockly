/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 圖形化積木設計器（073）：用設計積木拼出積木外觀，自動產生 C++ 函式框架，
 * 使用者只填函式本體；結果存成專案內的積木包，沿用 072 的載入、產生器與佔位機制。
 *
 * 依賴 blocklyEdit.js 的全域：blockPackManager、formatBlockPackMessage、currentTheme、toast、showAsyncConfirm。
 */
(function () {
	const Blockly = window.Blockly;
	if (!Blockly || !window.blockPacks) return;

	const DESIGN_FORMAT_VERSION = 1;
	const ROOT_TYPE = 'bd_block';
	const PIECE_CHECK = 'bd_piece';
	const CPP_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]{0,31}$/;
	const CPP_KEYWORDS = new Set(
		(
			'alignas alignof and asm auto bool break case catch char class const constexpr continue decltype default delete do double ' +
			'else enum explicit export extern false float for friend goto if inline int long mutable namespace new noexcept not nullptr ' +
			'operator or private protected public register return short signed sizeof static struct switch template this throw true try ' +
			'typedef typeid typename union unsigned using virtual void volatile while xor setup loop main String byte word boolean'
		).split(' ')
	);
	const RETURN_TYPES = { statement: 'void', Number: 'float', Boolean: 'bool', String: 'String' };
	const DEFAULT_RETURNS = { Number: 'return 0;', Boolean: 'return false;', String: 'return "";' };
	const PIECE_COLOURS = { text: 160, pin: 20, number: 230, textfield: 290, dropdown: 330, value: 200, statement: 120 };

	function t(key, fallback, ...args) {
		return formatBlockPackMessage(key, fallback, ...args);
	}

	function nameValidator(value) {
		const trimmed = String(value || '').trim();
		return CPP_IDENTIFIER.test(trimmed) ? trimmed : null;
	}

	/** 形狀選擇器：SVG 外形依 Blockly thrasos 的接頭樣式簡化繪製 */
	const STATEMENT_PATH = 'M2 6 h10 l5 5 h10 l5 -5 h62 v28 h-62 l-5 5 h-10 l-5 -5 h-10 z';
	const VALUE_PATH = 'M16 6 h78 v28 h-78 v-9 c-11 0 -11 -10 0 -10 z';
	const SHAPES = [
		{ value: 'statement', key: 'BLOCK_DESIGNER_SHAPE_STATEMENT', fallback: 'does something', path: STATEMENT_PATH, sample: '▶ ▶' },
		{ value: 'Number', key: 'BLOCK_DESIGNER_SHAPE_NUMBER', fallback: 'returns a number', path: VALUE_PATH, sample: '123' },
		{ value: 'Boolean', key: 'BLOCK_DESIGNER_SHAPE_BOOLEAN', fallback: 'returns true/false', path: VALUE_PATH, sample: '✓ ✗' },
		{ value: 'String', key: 'BLOCK_DESIGNER_SHAPE_STRING', fallback: 'returns text', path: VALUE_PATH, sample: '"abc"' },
	];

	// ===== 設計用積木 =====

	function defineDesignBlocks() {
		Blockly.Blocks[ROOT_TYPE] = {
			init() {
				// 形狀由設計器上方的圖形選擇器設定，欄位只負責保存
				this.appendDummyInput()
					.appendField(t('BLOCK_DESIGNER_ROOT_FUNCTION', 'function name'))
					.appendField(new Blockly.FieldTextInput('readSensor', nameValidator), 'FUNCTION')
					.appendField(new Blockly.FieldDropdown(SHAPES.map(shape => [shape.value, shape.value])), 'SHAPE');
				this.getField('SHAPE').setVisible(false);
				this.appendStatementInput('PIECES').setCheck(PIECE_CHECK).appendField(t('BLOCK_DESIGNER_ROOT_PIECES', 'pieces, left to right'));
				this.setColour(60);
				this.setDeletable(false);
				this.setTooltip(t('BLOCK_DESIGNER_ROOT_TOOLTIP', 'Stack pieces here. They appear on the block from left to right.'));
			},
		};

		const piece = (type, colourKey, build, tooltipKey, tooltip) => {
			Blockly.Blocks[type] = {
				init() {
					build(this);
					this.setPreviousStatement(true, PIECE_CHECK);
					this.setNextStatement(true, PIECE_CHECK);
					this.setColour(PIECE_COLOURS[colourKey]);
					this.setTooltip(t(tooltipKey, tooltip));
				},
			};
		};
		const nameField = (block, label, value) =>
			block.appendDummyInput().appendField(label).appendField(new Blockly.FieldTextInput(value, nameValidator), 'NAME');

		piece(
			'bd_text',
			'text',
			block => block.appendDummyInput().appendField(t('BLOCK_DESIGNER_PIECE_TEXT', 'text')).appendField(new Blockly.FieldTextInput(t('BLOCK_DESIGNER_DEFAULT_TEXT', 'read sensor')), 'TEXT'),
			'BLOCK_DESIGNER_PIECE_TEXT_TOOLTIP',
			'Words shown on the block.'
		);
		piece(
			'bd_pin',
			'pin',
			block => {
				nameField(block, t('BLOCK_DESIGNER_PIECE_PIN', 'pin'), 'pin');
				block.inputList[0]
					.appendField(
						new Blockly.FieldDropdown(() => [
							[t('BLOCK_DESIGNER_PIN_INPUT', 'input'), 'input'],
							[t('BLOCK_DESIGNER_PIN_OUTPUT', 'output'), 'output'],
						]),
						'DIRECTION'
					)
					.appendField(
						new Blockly.FieldDropdown(() => [
							[t('BLOCK_DESIGNER_PIN_DIGITAL', 'digital'), 'digital'],
							[t('BLOCK_DESIGNER_PIN_ANALOG', 'analog'), 'analog'],
						]),
						'MODE'
					);
			},
			'BLOCK_DESIGNER_PIECE_PIN_TOOLTIP',
			'A GPIO pin menu. The function receives the pin number.'
		);
		piece(
			'bd_number',
			'number',
			block => {
				nameField(block, t('BLOCK_DESIGNER_PIECE_NUMBER', 'number'), 'count');
				block.inputList[0]
					.appendField(t('BLOCK_DESIGNER_DEFAULT', 'default'))
					.appendField(new Blockly.FieldNumber(1), 'DEFAULT')
					.appendField(new Blockly.FieldCheckbox('FALSE'), 'DECIMAL')
					.appendField(t('BLOCK_DESIGNER_DECIMAL', 'decimals'));
			},
			'BLOCK_DESIGNER_PIECE_NUMBER_TOOLTIP',
			'A number the student types on the block.'
		);
		piece(
			'bd_textfield',
			'textfield',
			block => {
				nameField(block, t('BLOCK_DESIGNER_PIECE_TEXTFIELD', 'text box'), 'message');
				block.inputList[0].appendField(t('BLOCK_DESIGNER_DEFAULT', 'default')).appendField(new Blockly.FieldTextInput('hello'), 'DEFAULT');
			},
			'BLOCK_DESIGNER_PIECE_TEXTFIELD_TOOLTIP',
			'Text the student types on the block.'
		);
		piece(
			'bd_dropdown',
			'dropdown',
			block => {
				nameField(block, t('BLOCK_DESIGNER_PIECE_DROPDOWN', 'menu'), 'mode');
				block.inputList[0]
					.appendField(t('BLOCK_DESIGNER_OPTIONS', 'options'))
					.appendField(new Blockly.FieldTextInput(t('BLOCK_DESIGNER_DEFAULT_OPTIONS', 'low, medium, high')), 'OPTIONS');
			},
			'BLOCK_DESIGNER_PIECE_DROPDOWN_TOOLTIP',
			'A menu. Separate options with commas. The function receives 0 for the first option, 1 for the next, and so on.'
		);
		piece(
			'bd_value',
			'value',
			block => {
				nameField(block, t('BLOCK_DESIGNER_PIECE_VALUE', 'slot for a block'), 'value');
				block.inputList[0].appendField(
					new Blockly.FieldDropdown(() => [
						[t('BLOCK_DESIGNER_TYPE_NUMBER', 'number'), 'Number'],
						[t('BLOCK_DESIGNER_TYPE_BOOLEAN', 'true/false'), 'Boolean'],
						[t('BLOCK_DESIGNER_TYPE_STRING', 'text'), 'String'],
					]),
					'CHECK'
				);
			},
			'BLOCK_DESIGNER_PIECE_VALUE_TOOLTIP',
			'A slot where students plug in another block, such as a number or a variable.'
		);
		piece(
			'bd_statement',
			'statement',
			block => nameField(block, t('BLOCK_DESIGNER_PIECE_STATEMENT', 'blocks to run inside'), 'DO'),
			'BLOCK_DESIGNER_PIECE_STATEMENT_TOOLTIP',
			'A mouth for other blocks. They run when the function returns true.'
		);
	}

	const PALETTE = ['bd_text', 'bd_pin', 'bd_number', 'bd_dropdown', 'bd_textfield', 'bd_value', 'bd_statement'];

	function starterState(functionName, text) {
		return {
			blocks: {
				languageVersion: 0,
				blocks: [
					{
						type: ROOT_TYPE,
						x: 24,
						y: 24,
						fields: { SHAPE: 'Number', FUNCTION: functionName },
						inputs: {
							PIECES: {
								block: {
									type: 'bd_text',
									fields: { TEXT: text },
									next: { block: { type: 'bd_pin', fields: { NAME: 'pin', DIRECTION: 'input', MODE: 'analog' } } },
								},
							},
						},
					},
				],
			},
		};
	}

	// ===== 由設計推導積木與函式框架 =====

	function toInputName(name) {
		return String(name)
			.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
			.toUpperCase()
			.replace(/[^A-Z0-9_]/g, '_')
			.replace(/^[^A-Z]+/, '')
			.slice(0, 32) || 'INPUT';
	}

	function toBlockName(functionName) {
		return (
			String(functionName)
				.replace(/([a-z0-9])([A-Z])/g, '$1_$2')
				.toLowerCase()
				.replace(/[^a-z0-9_]/g, '_')
				.replace(/^[^a-z]+/, '')
				.slice(0, 32) || 'block'
		);
	}

	function splitOptions(text) {
		return String(text || '')
			.split(/[,，、]/)
			.map(option => option.trim())
			.filter(Boolean);
	}

	/**
	 * 把設計工作區轉成積木包積木、模板與函式框架。
	 * @returns {{block: object, template: string, signature: string, notes: string[], params: string[], problems: string[]}}
	 */
	function compileDesign(root) {
		const problems = [];
		const shape = root.getFieldValue('SHAPE');
		const functionName = root.getFieldValue('FUNCTION');
		const labelParts = [];
		const inputs = [];
		const params = [];
		const notes = [];
		const args = [];
		const paramNames = {};
		const seen = new Set();
		let statementInput = null;
		let hasText = false;

		for (let piece = root.getInputTargetBlock('PIECES'); piece; piece = piece.getNextBlock()) {
			if (piece.type === 'bd_text') {
				const text = String(piece.getFieldValue('TEXT') || '').trim();
				if (text) {
					labelParts.push(text.replace(/[{}]/g, ''));
					hasText = true;
				}
				continue;
			}
			const paramName = piece.getFieldValue('NAME');
			const inputName = toInputName(paramName);
			if (seen.has(paramName) || inputs.some(input => input.name === inputName)) {
				problems.push(t('BLOCK_DESIGNER_PROBLEM_DUPLICATE', 'Two pieces are both named "{0}".', paramName));
				continue;
			}
			if (CPP_KEYWORDS.has(paramName) || paramName === functionName) {
				problems.push(t('BLOCK_DESIGNER_PROBLEM_RESERVED', '"{0}" cannot be used as a name.', paramName));
				continue;
			}
			seen.add(paramName);
			let input;
			let type = null;
			switch (piece.type) {
				case 'bd_pin':
					input = { name: inputName, kind: 'pin', mode: piece.getFieldValue('MODE'), direction: piece.getFieldValue('DIRECTION') };
					type = 'int';
					break;
				case 'bd_number': {
					const decimal = piece.getFieldValue('DECIMAL') === 'TRUE';
					input = { name: inputName, kind: 'number', default: Number(piece.getFieldValue('DEFAULT')) || 0, precision: decimal ? 0.01 : 1 };
					type = decimal ? 'float' : 'int';
					break;
				}
				case 'bd_textfield':
					input = { name: inputName, kind: 'text', default: String(piece.getFieldValue('DEFAULT') ?? '') };
					type = 'String';
					break;
				case 'bd_dropdown': {
					const options = splitOptions(piece.getFieldValue('OPTIONS'));
					if (options.length === 0) {
						problems.push(t('BLOCK_DESIGNER_PROBLEM_NO_OPTIONS', 'The menu "{0}" needs at least one option.', paramName));
						continue;
					}
					input = { name: inputName, kind: 'dropdown', options: options.map((label, index) => [label, String(index)]) };
					type = 'int';
					notes.push(`// ${paramName}: ${options.map((label, index) => `${index} = ${label}`).join(', ')}`);
					break;
				}
				case 'bd_value': {
					const check = piece.getFieldValue('CHECK');
					input = { name: inputName, kind: 'value', check };
					type = { Number: 'float', Boolean: 'bool', String: 'String' }[check];
					break;
				}
				case 'bd_statement':
					if (shape !== 'statement') {
						problems.push(t('BLOCK_DESIGNER_PROBLEM_STATEMENT_SHAPE', 'Only blocks that do something can hold other blocks inside.'));
						continue;
					}
					if (statementInput) {
						problems.push(t('BLOCK_DESIGNER_PROBLEM_TWO_STATEMENTS', 'A block can hold only one group of blocks inside.'));
						continue;
					}
					input = { name: inputName, kind: 'statement' };
					statementInput = inputName;
					break;
				default:
					continue;
			}
			inputs.push(input);
			paramNames[inputName] = paramName;
			labelParts.push(`{${inputName}}`);
			if (type) {
				params.push(`${type} ${paramName}`);
				args.push(`{{${inputName}}}`);
			}
		}

		if (!hasText) problems.push(t('BLOCK_DESIGNER_PROBLEM_NO_TEXT', 'Add at least one text piece so students know what the block does.'));
		if (!CPP_IDENTIFIER.test(functionName) || CPP_KEYWORDS.has(functionName)) {
			problems.push(t('BLOCK_DESIGNER_PROBLEM_FUNCTION', 'The function name must use English letters, digits, or _, and cannot be a C++ word.'));
		}

		const returnType = shape === 'statement' ? (statementInput ? 'bool' : 'void') : RETURN_TYPES[shape];
		const call = `${functionName}(${args.join(', ')})`;
		let template;
		if (shape !== 'statement') template = call;
		else if (statementInput) template = `if (${call}) {\n{{${statementInput}}}}`;
		else template = `${call};`;

		const block = {
			name: toBlockName(functionName),
			shape: shape === 'statement' ? 'statement' : 'value',
			label: labelParts.join(' '),
			inputs,
		};
		if (shape !== 'statement') block.output = shape;
		return { block, template, signature: `${returnType} ${functionName}(${params.join(', ')})`, returnType, notes, problems, paramNames };
	}

	function defaultBody(returnType) {
		const comment = `  // ${t('BLOCK_DESIGNER_BODY_HINT', 'Write what this block does here.')}`;
		const returns = { float: DEFAULT_RETURNS.Number, bool: DEFAULT_RETURNS.Boolean, String: DEFAULT_RETURNS.String };
		return returns[returnType] ? `${comment}\n  ${returns[returnType]}\n` : `${comment}\n`;
	}

	function functionSource(compiled, body) {
		const content = String(body || '').replace(/\s+$/, '');
		const fallback = { float: DEFAULT_RETURNS.Number, bool: DEFAULT_RETURNS.Boolean, String: DEFAULT_RETURNS.String }[compiled.returnType];
		const lines = [...compiled.notes, `${compiled.signature} {`];
		if (content.trim()) lines.push(content);
		else if (fallback) lines.push(`  ${fallback}`);
		lines.push('}');
		return lines.join('\n');
	}

	function bumpVersion(version) {
		const parts = String(version || '1.0.0').split('.').map(part => Number(part) || 0);
		while (parts.length < 3) parts.push(0);
		parts[2] += 1;
		return parts.slice(0, 3).join('.');
	}

	// ===== 設計器視窗 =====

	const designer = {
		workspace: null,
		previewWorkspace: null,
		draft: null,
		selected: 0,
		dirty: false,
		renderTimer: null,
		loading: false,

		init() {
			if (!document.getElementById('blockDesignerModal')) return;
			defineDesignBlocks();
			const on = (id, event, handler) => document.getElementById(id).addEventListener(event, handler);
			on('blockDesignerClose', 'click', () => this.requestClose());
			on('blockDesignerClose', 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ') this.requestClose();
			});
			on('blockDesignerCancel', 'click', () => this.requestClose());
			on('blockDesignerSave', 'click', () => this.save());
			on('blockDesignerExport', 'click', () => this.exportPack());
			on('blockDesignerAddBlock', 'click', () => this.addBlock());
			this.buildShapePicker();
			on('blockDesignerCategoryName', 'input', () => this.markDirty());
			on('blockDesignerColour', 'input', () => {
				this.updateColour();
				this.markDirty();
				this.scheduleRender();
			});
			on('blockDesignerBody', 'input', () => {
				this.currentEntry().body = document.getElementById('blockDesignerBody').value;
				this.markDirty();
				this.scheduleRender();
			});
			on('blockDesignerBody', 'keydown', event => this.handleTab(event));
			for (const id of ['blockDesignerIncludes', 'blockDesignerLibDeps', 'blockDesignerGlobals', 'blockDesignerSetup']) {
				on(id, 'input', () => this.markDirty());
			}
			document.getElementById('blockDesignerModal').addEventListener('keydown', event => {
				if (event.key !== 'Escape' || Blockly.WidgetDiv.isVisible() || Blockly.DropDownDiv.isVisible()) return;
				this.requestClose();
			});
			this.updateTexts();
		},

		updateTexts() {
			const setText = (id, key, fallback) => {
				const element = document.getElementById(id);
				if (element) element.textContent = t(key, fallback);
			};
			setText('blockDesignerTitle', 'BLOCK_DESIGNER_TITLE', 'Block designer');
			setText('blockDesignerCategoryLabel', 'BLOCK_DESIGNER_CATEGORY', 'Category');
			setText('blockDesignerColourLabel', 'BLOCK_DESIGNER_COLOUR', 'Colour');
			setText('blockDesignerBlocksTitle', 'BLOCK_DESIGNER_BLOCKS', 'Blocks');
			setText('blockDesignerAddBlock', 'BLOCK_DESIGNER_ADD_BLOCK', '+ New block');
			setText('blockDesignerShapeTitle', 'BLOCK_DESIGNER_SHAPE_TITLE', '1. Build the block from pieces');
			setText('blockDesignerShapePickerTitle', 'BLOCK_DESIGNER_ROOT_SHAPE', 'Block shape');
			document.querySelectorAll('#blockDesignerShapes .block-designer-shape-label').forEach((label, index) => {
				label.textContent = t(SHAPES[index].key, SHAPES[index].fallback);
			});
			setText('blockDesignerPreviewTitle', 'BLOCK_DESIGNER_PREVIEW_TITLE', 'What students see');
			setText('blockDesignerCodeTitle', 'BLOCK_DESIGNER_CODE_TITLE', '2. Fill in the function');
			setText('blockDesignerAdvancedTitle', 'BLOCK_DESIGNER_ADVANCED', 'Libraries and setup (optional)');
			setText('blockDesignerIncludesLabel', 'BLOCK_DESIGNER_INCLUDES', 'Header files (comma separated)');
			setText('blockDesignerLibDepsLabel', 'BLOCK_DESIGNER_LIBDEPS', 'PlatformIO libraries (one per line, owner/name@version)');
			setText('blockDesignerGlobalsLabel', 'BLOCK_DESIGNER_GLOBALS', 'Shared variables and objects');
			setText('blockDesignerSetupLabel', 'BLOCK_DESIGNER_SETUP', 'Run once in setup()');
			setText('blockDesignerExport', 'BLOCK_DESIGNER_EXPORT', 'Export block pack…');
			setText('blockDesignerCancel', 'BLOCK_PACK_CANCEL', 'Cancel');
			setText('blockDesignerSave', 'BLOCK_DESIGNER_SAVE', 'Save to project');
		},

		mainWorkspace() {
			return blockPackManager.workspace();
		},

		theme() {
			return currentTheme === 'dark' ? window.SingularBlocklyDarkTheme : window.SingularBlocklyTheme;
		},

		/** 開啟設計器；pack 為 null 時建立新分類 */
		open(pack) {
			const packs = window.blockPacks.getPacks(this.mainWorkspace());
			if (pack) {
				this.draft = {
					id: pack.id,
					version: pack.version,
					isNew: false,
					name: window.blockPacks.localize(pack.category?.name, pack) || pack.id,
					colour: Number(pack.category?.colour) || 0,
					entries: pack.designer.blocks.map(entry => ({ state: entry.state, body: entry.body })),
					target: pack.targets.esp32,
					designerGlobals: pack.designer.globals || '',
				};
			} else {
				let index = 1;
				while (packs.some(existing => existing.id === `custom_${index}`)) index++;
				this.draft = {
					id: `custom_${index}`,
					version: '1.0.0',
					isNew: true,
					name: t('BLOCK_DESIGNER_NEW_CATEGORY', 'My blocks'),
					colour: 20,
					entries: [{ state: starterState('readSensor', t('BLOCK_DESIGNER_DEFAULT_TEXT', 'read sensor')), body: null }],
					target: {},
					designerGlobals: '',
				};
			}
			document.getElementById('blockDesignerCategoryName').value = this.draft.name;
			document.getElementById('blockDesignerColour').value = String(this.draft.colour);
			document.getElementById('blockDesignerIncludes').value = (this.draft.target.includes || []).join(', ');
			document.getElementById('blockDesignerLibDeps').value = (this.draft.target.libDeps || []).join('\n');
			document.getElementById('blockDesignerGlobals').value = this.draft.designerGlobals;
			document.getElementById('blockDesignerSetup').value = this.draft.target.setup || '';
			document.getElementById('blockDesignerAdvanced').open = Boolean(
				this.draft.target.includes?.length || this.draft.target.libDeps?.length || this.draft.designerGlobals || this.draft.target.setup
			);
			document.getElementById('blockDesignerExport').disabled = this.draft.isNew;
			document.getElementById('blockDesignerModal').style.display = 'block';
			this.ensureWorkspaces();
			this.updateColour();
			this.selected = 0;
			this.loadEntry(0);
			this.dirty = false;
		},

		ensureWorkspaces() {
			if (this.workspace) return;
			this.workspace = Blockly.inject(document.getElementById('blockDesignerWorkspace'), {
				toolbox: { kind: 'flyoutToolbox', contents: PALETTE.map(type => ({ kind: 'block', type })) },
				renderer: 'thrasos',
				media: window.BLOCKLY_MEDIA_URL,
				theme: this.theme(),
				trashcan: true,
				move: { scrollbars: true, drag: true, wheel: true },
				zoom: { controls: true, wheel: true, startScale: 0.85 },
			});
			this.workspace.addChangeListener(event => {
				if (this.loading || event.isUiEvent) return;
				this.markDirty();
				this.scheduleRender();
			});
			this.previewWorkspace = Blockly.inject(document.getElementById('blockDesignerPreview'), {
				readOnly: true,
				renderer: 'thrasos',
				media: window.BLOCKLY_MEDIA_URL,
				theme: this.theme(),
				move: { scrollbars: false, drag: false, wheel: false },
				zoom: { startScale: 1 },
			});
			Blockly.common.setMainWorkspace(this.mainWorkspace());
		},

		buildShapePicker() {
			const container = document.getElementById('blockDesignerShapes');
			const svgNs = 'http://www.w3.org/2000/svg';
			SHAPES.forEach(shape => {
				const button = document.createElement('button');
				button.type = 'button';
				button.className = 'block-designer-shape';
				button.setAttribute('role', 'radio');
				button.dataset.shape = shape.value;
				const svg = document.createElementNS(svgNs, 'svg');
				svg.setAttribute('viewBox', '0 0 96 44');
				svg.setAttribute('aria-hidden', 'true');
				const path = document.createElementNS(svgNs, 'path');
				path.setAttribute('d', shape.path);
				const text = document.createElementNS(svgNs, 'text');
				text.setAttribute('x', shape.value === 'statement' ? '48' : '55');
				text.setAttribute('y', '25');
				text.setAttribute('text-anchor', 'middle');
				text.setAttribute('dominant-baseline', 'middle');
				text.textContent = shape.sample;
				svg.append(path, text);
				const label = document.createElement('span');
				label.className = 'block-designer-shape-label';
				label.textContent = t(shape.key, shape.fallback);
				button.append(svg, label);
				button.addEventListener('click', () => {
					const root = this.rootBlock();
					if (!root || root.getFieldValue('SHAPE') === shape.value) return;
					// 函式本體還是預設內容時，跟著新的回傳型別換成對應的預設內容
					const body = document.getElementById('blockDesignerBody');
					const before = compileDesign(root).returnType;
					root.setFieldValue(shape.value, 'SHAPE');
					if (body.value === defaultBody(before)) {
						body.value = defaultBody(compileDesign(root).returnType);
						this.currentEntry().body = body.value;
					}
					clearTimeout(this.renderTimer);
					this.render();
				});
				container.append(button);
			});
			container.addEventListener('keydown', event => {
				if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
				event.preventDefault();
				const buttons = [...container.querySelectorAll('.block-designer-shape')];
				const current = buttons.findIndex(button => button.getAttribute('aria-checked') === 'true');
				const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
				const next = buttons[(current + step + buttons.length) % buttons.length];
				next.click();
				next.focus();
			});
		},

		syncShapePicker() {
			const root = this.rootBlock();
			const value = root ? root.getFieldValue('SHAPE') : 'Number';
			const colour = Blockly.utils.colour.hueToHex(Number(document.getElementById('blockDesignerColour').value) || 0);
			document.querySelectorAll('#blockDesignerShapes .block-designer-shape').forEach(button => {
				const checked = button.dataset.shape === value;
				button.setAttribute('aria-checked', checked ? 'true' : 'false');
				button.tabIndex = checked ? 0 : -1;
				button.querySelector('path').setAttribute('fill', colour);
			});
		},

		currentEntry() {
			return this.draft.entries[this.selected];
		},

		rootBlock() {
			return this.workspace.getTopBlocks(false).find(block => block.type === ROOT_TYPE) || null;
		},

		loadEntry(index) {
			this.selected = index;
			this.loading = true;
			Blockly.Events.disable();
			try {
				this.workspace.clear();
				Blockly.serialization.workspaces.load(this.currentEntry().state, this.workspace);
			} finally {
				Blockly.Events.enable();
				this.loading = false;
			}
			Blockly.common.setMainWorkspace(this.mainWorkspace());
			Blockly.svgResize(this.workspace);
			Blockly.svgResize(this.previewWorkspace);
			const compiled = this.rootBlock() && compileDesign(this.rootBlock());
			if (this.currentEntry().body === null) this.currentEntry().body = defaultBody(compiled ? compiled.returnType : 'void');
			document.getElementById('blockDesignerBody').value = this.currentEntry().body;
			this.renderList();
			this.render();
		},

		storeEntry() {
			if (!this.workspace || !this.draft) return;
			this.currentEntry().state = Blockly.serialization.workspaces.save(this.workspace);
			this.currentEntry().body = document.getElementById('blockDesignerBody').value;
		},

		compiledEntries() {
			this.storeEntry();
			const scratch = new Blockly.Workspace();
			try {
				return this.draft.entries.map(entry => {
					scratch.clear();
					Blockly.serialization.workspaces.load(entry.state, scratch);
					const root = scratch.getTopBlocks(false).find(block => block.type === ROOT_TYPE);
					return root ? compileDesign(root) : null;
				});
			} finally {
				scratch.dispose();
			}
		},

		renderList() {
			const list = document.getElementById('blockDesignerBlockList');
			list.textContent = '';
			const compiled = this.compiledEntries();
			compiled.forEach((entry, index) => {
				const item = document.createElement('li');
				const button = document.createElement('button');
				button.type = 'button';
				button.className = 'block-designer-list-item';
				button.setAttribute('aria-current', index === this.selected ? 'true' : 'false');
				const name = document.createElement('span');
				name.className = 'block-designer-list-name';
				name.textContent = entry ? entry.block.label.replace(/\{[A-Z0-9_]+\}/g, '▢') || entry.block.name : '?';
				const fn = document.createElement('span');
				fn.className = 'block-designer-list-fn';
				fn.textContent = entry ? `${entry.signature.split('(')[0].split(' ').pop()}()` : '';
				button.append(name, fn);
				button.addEventListener('click', () => {
					if (index === this.selected) return;
					this.storeEntry();
					this.loadEntry(index);
				});
				item.append(button);
				if (this.draft.entries.length > 1) {
					const remove = document.createElement('button');
					remove.type = 'button';
					remove.className = 'block-designer-list-remove';
					remove.title = t('BLOCK_DESIGNER_DELETE_BLOCK', 'Delete this block');
					remove.setAttribute('aria-label', remove.title);
					remove.textContent = '×';
					remove.addEventListener('click', () => this.removeBlock(index));
					item.append(remove);
				}
				list.append(item);
			});
		},

		addBlock() {
			this.storeEntry();
			const used = new Set(this.compiledEntries().map(entry => entry && entry.signature.split('(')[0].split(' ').pop()));
			let index = this.draft.entries.length + 1;
			while (used.has(`block${index}`)) index++;
			this.draft.entries.push({ state: starterState(`block${index}`, t('BLOCK_DESIGNER_DEFAULT_TEXT', 'read sensor')), body: null });
			this.markDirty();
			this.loadEntry(this.draft.entries.length - 1);
		},

		removeBlock(index) {
			this.storeEntry();
			this.draft.entries.splice(index, 1);
			this.markDirty();
			this.loadEntry(Math.min(this.selected >= index ? Math.max(this.selected - 1, 0) : this.selected, this.draft.entries.length - 1));
		},

		updateColour() {
			const hue = Number(document.getElementById('blockDesignerColour').value) || 0;
			document.getElementById('blockDesignerColourSwatch').style.backgroundColor = Blockly.utils.colour.hueToHex(hue);
		},

		markDirty() {
			if (!this.loading) this.dirty = true;
		},

		scheduleRender() {
			clearTimeout(this.renderTimer);
			this.renderTimer = setTimeout(() => this.render(), 120);
		},

		draftPack(compiledList) {
			const name = document.getElementById('blockDesignerCategoryName').value.trim() || this.draft.id;
			const includes = splitOptions(document.getElementById('blockDesignerIncludes').value);
			const libDeps = document
				.getElementById('blockDesignerLibDeps')
				.value.split('\n')
				.map(line => line.trim())
				.filter(Boolean);
			const designerGlobals = document.getElementById('blockDesignerGlobals').value.replace(/\s+$/, '');
			const setup = document.getElementById('blockDesignerSetup').value.replace(/\s+$/, '');
			const functions = compiledList.map((compiled, index) => functionSource(compiled, this.draft.entries[index].body));
			const target = {
				globals: [designerGlobals, ...functions].filter(Boolean).join('\n\n') + '\n',
				blocks: Object.fromEntries(compiledList.map(compiled => [compiled.block.name, compiled.template])),
			};
			if (includes.length) target.includes = includes;
			if (libDeps.length) target.libDeps = libDeps;
			if (setup) target.setup = setup;
			return {
				formatVersion: 1,
				id: this.draft.id,
				version: this.draft.version,
				defaultLocale: window.languageManager?.currentLanguage || 'en',
				category: { name, colour: Number(document.getElementById('blockDesignerColour').value) || 0 },
				blocks: compiledList.map(compiled => compiled.block),
				targets: { esp32: target },
				designer: {
					formatVersion: DESIGN_FORMAT_VERSION,
					globals: designerGlobals,
					blocks: this.draft.entries.map((entry, index) => ({ name: compiledList[index].block.name, state: entry.state, body: entry.body })),
				},
			};
		},

		/** 檢查整個分類；回傳每個積木的推導結果與問題 */
		collect() {
			const compiledList = this.compiledEntries();
			const problems = [];
			const names = new Map();
			compiledList.forEach((compiled, index) => {
				if (!compiled) return;
				const fn = compiled.signature.split('(')[0].split(' ').pop();
				if (names.has(fn)) problems.push(t('BLOCK_DESIGNER_PROBLEM_SAME_FUNCTION', 'Two blocks use the function name "{0}".', fn));
				names.set(fn, index);
			});
			for (const pack of window.blockPacks.getPacks(this.mainWorkspace())) {
				if (pack.id === this.draft.id || !pack.designer) continue;
				for (const entry of pack.designer.blocks || []) {
					const state = entry.state?.blocks?.blocks?.[0];
					const fn = state?.fields?.FUNCTION;
					if (fn && names.has(fn)) {
						problems.push(t('BLOCK_DESIGNER_PROBLEM_OTHER_PACK', 'The function name "{0}" is already used in another category.', fn));
					}
				}
			}
			for (const line of document.getElementById('blockDesignerLibDeps').value.split('\n').map(item => item.trim()).filter(Boolean)) {
				if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+@[A-Za-z0-9_.^~*<>=-]+$/.test(line)) {
					problems.push(t('BLOCK_DESIGNER_PROBLEM_LIBDEP', 'Write libraries as owner/name@version: {0}', line));
				}
			}
			return { compiledList, problems };
		},

		render() {
			const root = this.rootBlock();
			if (!root) return;
			this.syncShapePicker();
			const compiled = compileDesign(root);
			const fnLines = [...compiled.notes, `${compiled.signature} {`];
			document.getElementById('blockDesignerCodeHead').textContent = fnLines.join('\n');
			const callText = compiled.template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, name) => {
				const input = compiled.block.inputs.find(item => item.name === name);
				return input && input.kind === 'statement' ? ' … ' : compiled.paramNames[name] || name;
			});
			document.getElementById('blockDesignerCall').textContent = t('BLOCK_DESIGNER_CALL', 'The block runs: {0}', callText.replace(/\s+/g, ' ').trim());

			const body = document.getElementById('blockDesignerBody').value;
			const params = compiled.signature.slice(compiled.signature.indexOf('(') + 1, -1).split(', ').filter(Boolean).map(param => param.split(' ').pop());
			// 記住這個積木曾經有過的參數，本體還在用已刪除的參數時提醒
			const entry = this.currentEntry();
			entry.knownParams = new Set([...(entry.knownParams || []), ...params]);
			const missing = [...entry.knownParams].filter(name => !params.includes(name) && new RegExp(`\\b${name}\\b`).test(body));
			this.showProblems([
				...compiled.problems,
				...missing.map(name => t('BLOCK_DESIGNER_PROBLEM_REMOVED_PARAM', 'The function body still uses "{0}", which is no longer a piece.', name)),
			]);

			const { compiledList } = this.collect();
			if (compiledList.some(entry => !entry)) return;
			const pack = this.draftPack(compiledList);
			const others = window.blockPacks.getPacks(this.mainWorkspace()).filter(existing => existing.id !== pack.id);
			window.blockPacks.activatePacks([...others, pack]);
			this.previewWorkspace.clear();
			const [category] = window.blockPacks.toolboxCategories([pack]);
			const item = category.contents[this.selected];
			if (item && Blockly.Blocks[item.type]) {
				const block = this.previewWorkspace.newBlock(item.type);
				for (const [field, value] of Object.entries(item.fields || {})) block.setFieldValue(value, field);
				block.initSvg();
				block.render();
				// 積木比預覽框寬時縮小到放得下
				const width = block.getHeightWidth().width;
				const available = this.previewWorkspace.getParentSvg().clientWidth - 32;
				this.previewWorkspace.setScale(width > available ? Math.max(0.5, available / width) : 1);
				block.moveBy(16, 16);
			}
			Blockly.common.setMainWorkspace(this.mainWorkspace());
			this.renderListLabels(compiledList);
		},

		renderListLabels(compiledList) {
			const names = document.querySelectorAll('#blockDesignerBlockList .block-designer-list-name');
			const fns = document.querySelectorAll('#blockDesignerBlockList .block-designer-list-fn');
			compiledList.forEach((compiled, index) => {
				if (!compiled || !names[index]) return;
				names[index].textContent = compiled.block.label.replace(/\{[A-Z0-9_]+\}/g, '▢') || compiled.block.name;
				fns[index].textContent = `${compiled.signature.split('(')[0].split(' ').pop()}()`;
			});
		},

		showProblems(problems) {
			const box = document.getElementById('blockDesignerProblems');
			box.textContent = '';
			box.hidden = problems.length === 0;
			if (!problems.length) return;
			const list = document.createElement('ul');
			for (const problem of [...new Set(problems)]) {
				const item = document.createElement('li');
				item.textContent = problem;
				list.append(item);
			}
			box.append(list);
		},

		handleTab(event) {
			if (event.key !== 'Tab' || event.shiftKey) return;
			event.preventDefault();
			const area = event.target;
			const start = area.selectionStart;
			area.setRangeText('  ', start, area.selectionEnd, 'end');
			area.dispatchEvent(new Event('input'));
		},

		save() {
			const { compiledList, problems } = this.collect();
			const blockProblems = compiledList.flatMap(compiled => (compiled ? compiled.problems : []));
			if (blockProblems.length || problems.length) {
				this.showProblems([...blockProblems, ...problems]);
				return;
			}
			const workspace = this.mainWorkspace();
			const existing = window.blockPacks.getPacks(workspace).find(pack => pack.id === this.draft.id);
			if (existing) this.draft.version = bumpVersion(existing.version);
			const pack = this.draftPack(compiledList);
			const removed = existing ? existing.blocks.map(block => block.name).filter(name => !pack.blocks.some(block => block.name === name)) : [];
			const affected = removed.length ? window.blockPacks.countPackBlocks(workspace, pack.id, removed) : 0;
			blockPackManager.confirmThen('update', pack, affected, () => {
				const installed = { ...pack, importedAt: new Date().toISOString() };
				const packs = existing
					? window.blockPacks.getPacks(workspace).map(item => (item.id === pack.id ? installed : item))
					: [...window.blockPacks.getPacks(workspace), installed];
				blockPackManager.applyPacks(packs, Boolean(existing) || window.blockPacks.countPackBlocks(workspace, pack.id) > 0);
				this.dirty = false;
				this.draft.isNew = false;
				document.getElementById('blockDesignerExport').disabled = false;
				toast.show(t('BLOCK_DESIGNER_SAVED', 'Saved "{0}". The blocks are in the toolbox.', pack.category.name));
			});
		},

		exportPack() {
			const { compiledList, problems } = this.collect();
			if (problems.length || compiledList.some(compiled => !compiled || compiled.problems.length)) return;
			vscode.postMessage({ command: 'exportBlockPack', pack: this.draftPack(compiledList) });
		},

		async requestClose() {
			if (this.dirty) {
				const leave = await showAsyncConfirm(t('BLOCK_DESIGNER_DISCARD', 'Close the designer without saving your changes?'));
				if (!leave) return;
			}
			this.close();
		},

		close() {
			clearTimeout(this.renderTimer);
			document.getElementById('blockDesignerModal').style.display = 'none';
			window.blockPacks.activatePacks(window.blockPacks.getPacks(this.mainWorkspace()));
			this.draft = null;
			this.dirty = false;
			blockPackManager.open();
		},
	};

	window.blockDesigner = designer;
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => designer.init());
	else designer.init();
})();
