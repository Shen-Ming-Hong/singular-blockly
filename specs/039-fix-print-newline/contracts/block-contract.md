# Blockly Block Contract: text_print

**Version**: 1.0  
**Feature**: `039-fix-print-newline`  
**Date**: 2026年2月4日

## Overview

定義 `text_print` 積木的標準介面契約,確保 Blockly 積木定義、UI 行為和程式碼產生器之間的一致性。

---

## Block Specification

### Block Type

```typescript
type: 'text_print';
```

### Block Interface

```typescript
interface TextPrintBlock {
	/**
	 * 積木類型識別
	 */
	type: 'text_print';

	/**
	 * 積木連接點
	 */
	connections: {
		previousStatement: true; // 可連接上方積木
		nextStatement: true; // 可連接下方積木
		output: null; // 非表達式積木 (不返回值)
	};

	/**
	 * 輸入欄位
	 */
	inputs: {
		TEXT: ValueInput<any>; // 接受任何類型的值輸入
	};

	/**
	 * 介面欄位
	 */
	fields: {
		NEW_LINE: FieldCheckbox; // 換行控制 checkbox
	};

	/**
	 * 視覺屬性
	 */
	appearance: {
		colour: number; // 積木顏色 (RGB 或 Blockly 色號)
		tooltip: string; // 游標提示文字
		helpUrl: string; // 說明文件 URL
	};
}
```

---

## Field Specifications

### 1. TEXT Input (ValueInput)

```typescript
interface TextInput {
	/**
	 * 輸入名稱
	 */
	name: 'TEXT';

	/**
	 * 輸入類型
	 */
	type: 'input_value';

	/**
	 * 類型檢查
	 */
	check: null; // 接受所有類型

	/**
	 * 預設值 (Shadow Block)
	 */
	shadow: {
		type: 'text';
		fields: {
			TEXT: ''; // 空字串
		};
	};

	/**
	 * 連接規則
	 */
	connection: {
		accepts: [
			'String',
			'Number',
			'Variable',
			'Expression',
			'*', // 萬用類型
		];
	};
}
```

**契約保證**:

- ✅ 可接受字串常量 (`"Hello"`)
- ✅ 可接受數字常量 (`42`)
- ✅ 可接受變數積木 (`variables_get`)
- ✅ 可接受任何表達式積木 (`math_*`, `text_*`)
- ✅ 空輸入時使用空字串 `""`

---

### 2. NEW_LINE Field (FieldCheckbox)

```typescript
interface NewLineField {
	/**
	 * 欄位名稱
	 */
	name: 'NEW_LINE';

	/**
	 * 欄位類型
	 */
	type: 'field_checkbox';

	/**
	 * 預設值
	 */
	defaultValue: 'TRUE'; // 字串 'TRUE',非 boolean true

	/**
	 * 可能的值
	 */
	values: 'TRUE' | 'FALSE'; // Blockly 保證僅這兩種值

	/**
	 * UI 標籤
	 */
	label: '換行'; // 顯示在 checkbox 旁的文字

	/**
	 * UI 行為
	 */
	behavior: {
		/**
		 * 使用者可點擊切換狀態
		 */
		toggleable: true;

		/**
		 * 初始化時的視覺狀態
		 * TRUE → ☑ 勾選
		 * FALSE → ☐ 未勾選
		 */
		initialDisplay: 'checked'; // 'checked' | 'unchecked'

		/**
		 * 狀態變更事件
		 */
		onChange: (newValue: 'TRUE' | 'FALSE') => void;
	};
}
```

**契約保證**:

- ✅ 值的類型永遠是 `string` (不是 `boolean`)
- ✅ 值僅限 `'TRUE'` 或 `'FALSE'` (大寫,單引號)
- ✅ 預設值為 `'TRUE'` (勾選狀態)
- ✅ Blockly 自動處理 UI 和資料同步
- ✅ 狀態變更時自動觸發 workspace change event

---

## Block Behavior Contract

### Initialization

```typescript
/**
 * 從 Toolbox 拖曳新積木時
 */
function onBlockCreate(): BlockState {
	return {
		fields: {
			NEW_LINE: 'TRUE', // 預設勾選
		},
		inputs: {
			TEXT: null, // 空輸入
		},
	};
}
```

### User Interaction

```typescript
/**
 * 使用者點擊 checkbox
 */
function onCheckboxToggle(currentValue: string): string {
	return currentValue === 'TRUE' ? 'FALSE' : 'TRUE';
}
```

### Serialization

```typescript
/**
 * 儲存到 blockly/main.json
 */
function serialize(block: TextPrintBlock): JSON {
	return {
		type: 'text_print',
		id: block.id,
		fields: {
			NEW_LINE: block.getFieldValue('NEW_LINE'), // 'TRUE' | 'FALSE'
		},
		inputs: {
			TEXT: block.getInput('TEXT')?.connection?.serialize() || null,
		},
	};
}
```

### Deserialization

```typescript
/**
 * 從 blockly/main.json 載入
 */
function deserialize(json: JSON): TextPrintBlock {
	const block = workspace.newBlock('text_print');

	// 恢復欄位值
	block.setFieldValue(json.fields.NEW_LINE, 'NEW_LINE');

	// 恢復輸入連接
	if (json.inputs.TEXT) {
		const inputBlock = deserializeBlock(json.inputs.TEXT);
		block.getInput('TEXT').connection.connect(inputBlock.outputConnection);
	}

	return block;
}
```

---

## Validation Rules

### Field Value Validation

```typescript
/**
 * NEW_LINE 欄位值驗證
 */
function validateNewLineField(value: any): boolean {
	return typeof value === 'string' && (value === 'TRUE' || value === 'FALSE');
}

/**
 * 使用範例
 */
const value = block.getFieldValue('NEW_LINE');
if (!validateNewLineField(value)) {
	throw new Error(`Invalid NEW_LINE value: ${value}`);
}
```

### Input Validation

```typescript
/**
 * TEXT 輸入驗證
 */
function validateTextInput(input: any): boolean {
	// TEXT 輸入接受所有類型,永遠有效
	return true;
}
```

### Block Structure Validation

```typescript
/**
 * 積木結構完整性檢查
 */
function validateBlockStructure(block: TextPrintBlock): ValidationResult {
	const errors: string[] = [];

	// 檢查必要欄位
	if (!block.getField('NEW_LINE')) {
		errors.push('Missing NEW_LINE field');
	}

	// 檢查必要輸入
	if (!block.getInput('TEXT')) {
		errors.push('Missing TEXT input');
	}

	// 檢查連接點
	if (!block.previousConnection) {
		errors.push('Missing previous connection');
	}
	if (!block.nextConnection) {
		errors.push('Missing next connection');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
```

---

## Cross-Platform Consistency Contract

### Arduino vs MicroPython Mapping

```typescript
/**
 * 積木狀態到平台程式碼的映射契約
 */
interface PlatformMapping {
	arduino: {
		TRUE: 'Serial.println(${msg});';
		FALSE: 'Serial.print(${msg});';
	};
	micropython: {
		TRUE: 'print(${msg})';
		FALSE: 'print(${msg}, end="")';
	};
}

/**
 * 行為等價性契約
 */
function assertBehaviorEquivalence(): void {
	// 相同的 NEW_LINE 狀態必須產生等價的行為
	assert(
		arduino.println() === micropython.print() // 都換行
	);
	assert(
		arduino.print() === micropython.print((end = '')) // 都不換行
	);
}
```

---

## i18n Contract (多語言支援)

### Locale Keys

```typescript
/**
 * 積木多語言字串鍵值
 */
interface I18nKeys {
	blockName: 'ARDUINO_SERIAL_PRINT'; // '顯示'
	newLineLabel: 'ARDUINO_SERIAL_NEWLINE'; // '換行'
	tooltip: 'ARDUINO_SERIAL_PRINT_TOOLTIP'; // 工具提示
	helpUrl: 'ARDUINO_SERIAL_PRINT_HELPURL'; // 說明 URL
}
```

### Supported Languages

契約保證支援 15 種語言:

- `en`, `zh-hant`, `ja`, `ko`, `es`, `pt-br`, `fr`, `de`, `it`, `ru`, `pl`, `hu`, `tr`, `bg`, `cs`

---

## Deprecation & Migration Contract

### Current Version: 1.0

目前無棄用的欄位或行為。

### Future Compatibility Guarantee

```typescript
/**
 * 向後相容性保證
 */
interface BackwardCompatibility {
	/**
	 * 新版本必須能讀取舊版本的序列化資料
	 */
	canLoadOldFormat: true;

	/**
	 * 欄位名稱變更時的遷移策略
	 */
	fieldMigration: {
		NEW_LINE: 'NEW_LINE'; // 無變更
	};

	/**
	 * 預設值變更時的處理
	 */
	defaultValueMigration: {
		oldDefault: 'TRUE';
		newDefault: 'TRUE'; // 保持不變
		migrationNeeded: false;
	};
}
```

---

## Error Handling Contract

### Error Scenarios

```typescript
/**
 * 錯誤場景與處理策略
 */
interface ErrorHandling {
	/**
	 * 欄位值無效
	 */
	invalidFieldValue: {
		trigger: 'getFieldValue() returns unexpected value';
		handling: 'Fallback to default "TRUE"';
		logging: 'log.error("Invalid NEW_LINE value")';
	};

	/**
	 * 輸入連接錯誤
	 */
	inputConnectionError: {
		trigger: 'TEXT input connection fails';
		handling: 'Use empty string ""';
		logging: 'log.warn("TEXT input not connected")';
	};

	/**
	 * 序列化失敗
	 */
	serializationError: {
		trigger: 'JSON.stringify() throws';
		handling: 'Skip this block, continue with others';
		logging: 'log.error("Failed to serialize text_print block")';
	};
}
```

---

## Testing Contract

### Unit Test Requirements

```typescript
/**
 * 單元測試必須涵蓋的場景
 */
interface TestCoverage {
	fieldTests: ['NEW_LINE defaults to TRUE', 'NEW_LINE toggles between TRUE and FALSE', 'NEW_LINE value persists after serialize/deserialize'];

	inputTests: ['TEXT accepts string literal', 'TEXT accepts number literal', 'TEXT accepts variable block', 'TEXT accepts expression block', 'TEXT defaults to "" when empty'];

	integrationTests: ['Block appears in toolbox', 'Block can be placed in workspace', 'Block connects to other statement blocks', 'Block saves to and loads from JSON'];
}
```

---

## Version History

| Version | Date       | Changes               |
| ------- | ---------- | --------------------- |
| 1.0     | 2026-02-04 | Initial specification |

---

**Contract Status**: ✅ Active  
**Breaking Changes**: None  
**Deprecations**: None
