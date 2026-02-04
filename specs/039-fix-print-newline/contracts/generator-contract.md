# Generator Contract: text_print MicroPython

**Version**: 1.0  
**Feature**: `039-fix-print-newline`  
**Date**: 2026年2月4日

## Overview

定義 `text_print` 積木的 MicroPython 程式碼產生器契約,確保產生的程式碼正確、一致且符合 Python 語法規範。

---

## Generator Function Signature

```typescript
/**
 * MicroPython Generator for text_print block
 *
 * @param block - Blockly 積木實例
 * @returns 生成的 MicroPython 程式碼字串
 */
function text_print(this: MicropythonGenerator, block: Blockly.Block): string;
```

---

## Input Contract

### Required Inputs

```typescript
interface GeneratorInputs {
	/**
	 * Blockly 積木物件
	 */
	block: {
		/**
		 * 取得輸入值的連接
		 */
		getInput(name: 'TEXT'): Blockly.Input | null;

		/**
		 * 取得欄位值
		 */
		getFieldValue(name: 'NEW_LINE'): 'TRUE' | 'FALSE';
	};

	/**
	 * Generator 實例 (透過 this)
	 */
	generator: {
		/**
		 * 將輸入積木轉換為程式碼
		 */
		valueToCode(block: Blockly.Block, name: string, order: number): string;

		/**
		 * 優先順序常數
		 */
		ORDER_NONE: number;
	};
}
```

### Input Validation

```typescript
/**
 * 輸入驗證規則
 */
interface InputValidation {
	/**
	 * TEXT 輸入驗證
	 */
	textInput: {
		required: false; // 可為空
		fallback: '""'; // 空值時的預設值
		types: ['string', 'number', 'variable', 'expression'];
	};

	/**
	 * NEW_LINE 欄位驗證
	 */
	newLineField: {
		required: true; // 必須存在
		values: ['TRUE', 'FALSE']; // 僅限這兩種值
		type: 'string'; // 必須是字串類型
	};
}
```

---

## Output Contract

### Return Type

```typescript
/**
 * Generator 必須返回字串
 */
type GeneratorOutput = string;
```

### Output Format

```typescript
/**
 * 輸出格式規範
 */
interface OutputFormat {
    /**
     * 有換行 (NEW_LINE = 'TRUE')
     */
    withNewLine: {
        template: 'print(${message})';
        regex: /^print\(.+\)$/;
        examples: [
            'print("Hello")',
            'print(42)',
            'print(message)',
            'print(x + y)'
        ];
    };

    /**
     * 無換行 (NEW_LINE = 'FALSE')
     */
    withoutNewLine: {
        template: 'print(${message}, end="")';
        regex: /^print\(.+, end=""\)$/;
        examples: [
            'print("Hello", end="")',
            'print(42, end="")',
            'print(message, end="")',
            'print(x + y, end="")'
        ];
    };
}
```

### Output Guarantees

契約保證輸出必須滿足:

1. **語法有效性**: 輸出是有效的 Python 語法
2. **單行輸出**: 不包含多行程式碼 (不需要 setup 或 imports)
3. **終止符**: 輸出字串必須以單一結尾換行符 `\n` 結尾 (符合其他 statement generator 慣例, 由上層直接串接)
4. **Idempotency**: 相同的輸入永遠產生相同的輸出
5. **No Side Effects**: Generator 不修改 workspace 或全域狀態

---

## Processing Logic Contract

### Step-by-Step Logic

```typescript
/**
 * 產生器處理流程契約
 */
interface ProcessingSteps {
	/**
	 * Step 1: 讀取 TEXT 輸入
	 */
	step1_readTextInput: {
		method: 'valueToCode(block, "TEXT", ORDER_NONE)';
		fallback: '""';
		output: string; // 例如: '"Hello"', 'variable', '42'
	};

	/**
	 * Step 2: 讀取 NEW_LINE 欄位
	 */
	step2_readNewLineField: {
		method: 'getFieldValue("NEW_LINE")';
		output: 'TRUE' | 'FALSE';
		conversion: 'value === "TRUE"'; // 轉換為 boolean
	};

	/**
	 * Step 3: 條件式程式碼生成
	 */
	step3_generateCode: {
		condition: 'newLine === true';
		whenTrue: 'print(${msg})';
		whenFalse: 'print(${msg}, end="")';
	};

	/**
	 * Step 4: 返回程式碼字串
	 */
	step4_return: {
		type: 'string';
		notNull: true;
		notUndefined: true;
	};
}
```

### Decision Tree

```typescript
/**
 * 程式碼生成決策樹
 */
function generateCode(block: Block): string {
	// Step 1: 取得文字輸入
	const msg: string = valueToCode(block, 'TEXT', ORDER_NONE) || '""';

	// Step 2: 取得換行欄位
	const newLineValue: string = block.getFieldValue('NEW_LINE');
	const newLine: boolean = newLineValue === 'TRUE';

	// Step 3: 條件式生成
	if (newLine) {
		return `print(${msg})`;
	} else {
		return `print(${msg}, end="")`;
	}
}
```

---

## Code Generation Rules

### Rule 1: String Handling

```typescript
/**
 * 字串處理規則
 */
interface StringHandling {
	/**
	 * 字串常量: 保留引號
	 */
	stringLiteral: {
		input: '"Hello"';
		output: 'print("Hello")';
	};

	/**
	 * 變數: 無引號
	 */
	variable: {
		input: 'message';
		output: 'print(message)';
	};

	/**
	 * 表達式: 無引號
	 */
	expression: {
		input: 'str(x) + str(y)';
		output: 'print(str(x) + str(y))';
	};
}
```

### Rule 2: End Parameter Placement

```typescript
/**
 * end 參數位置規則
 */
interface EndParameterPlacement {
	/**
	 * 必須是最後一個參數
	 */
	position: 'last';

	/**
	 * 使用具名參數
	 */
	format: 'end=""'; // 不是 '""' (位置參數)

	/**
	 * 雙引號包裹
	 */
	quotes: 'double'; // "" 不是 ''
}
```

### Rule 3: No Additional Code

```typescript
/**
 * 無額外程式碼規則
 */
interface NoAdditionalCode {
	/**
	 * 不生成 import 語句
	 */
	imports: null;

	/**
	 * 不生成初始化程式碼
	 */
	initialization: null;

	/**
	 * 不使用全域變數
	 */
	globals: null;

	/**
	 * 不註冊 setup code
	 */
	setupCode: null;
}
```

**理由**: MicroPython 的 `print()` 是內建函數,無需任何額外設定。

---

## Edge Case Handling

### Case 1: Empty Input

```typescript
/**
 * 空輸入處理
 */
interface EmptyInputHandling {
	scenario: 'TEXT input is null or undefined';

	handler: {
		code: 'const msg = valueToCode(...) || \\"\\"\\"';
		result: '""'; // 空字串 (有引號)
	};

	output: {
		withNewLine: 'print("")';
		withoutNewLine: 'print("", end="")';
	};
}
```

### Case 2: Multiline String

```typescript
/**
 * 多行字串處理
 */
interface MultilineStringHandling {
	scenario: 'TEXT contains \\n characters';

	input: '"Hello\\nWorld"';

	output: {
		withNewLine: 'print("Hello\\nWorld")';
		withoutNewLine: 'print("Hello\\nWorld", end="")';

		// 終端機行為
		terminal: ['Hello', 'World', '[換行取決於 NEW_LINE]'];
	};

	note: '\\n 在字串中間會換行,end="" 僅影響輸出結尾';
}
```

### Case 3: Special Characters

```typescript
/**
 * 特殊字元處理
 */
interface SpecialCharactersHandling {
	scenarios: {
		quotes: {
			input: '"\\"Hello\\""'; // "Hello"
			output: 'print("\\"Hello\\"")';
		};

		backslash: {
			input: '"C:\\\\path"';
			output: 'print("C:\\\\path")';
		};

		unicode: {
			input: '"Hello 世界"';
			output: 'print("Hello 世界")';
		};
	};

	rule: 'valueToCode() 已處理跳脫,無需額外處理';
}
```

### Case 4: Complex Expressions

```typescript
/**
 * 複雜表達式處理
 */
interface ComplexExpressionHandling {
	scenarios: {
		arithmetic: {
			input: 'x + y * z';
			output: 'print(x + y * z, end="")';
		};

		functionCall: {
			input: 'str(temperature)';
			output: 'print(str(temperature))';
		};

		nested: {
			input: '"Temp: " + str(temp) + "°C"';
			output: 'print("Temp: " + str(temp) + "°C")';
		};
	};

	rule: 'valueToCode() 處理運算子優先順序,直接使用返回值';
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
	 * 場景 1: getFieldValue 返回無效值
	 */
	invalidFieldValue: {
		trigger: 'value !== "TRUE" && value !== "FALSE"';

		handling: 'Fallback to "TRUE" (預設換行)';

		code: `
            const value = block.getFieldValue('NEW_LINE');
            const newLine = (value === 'TRUE' || value !== 'FALSE');
            // 非 'FALSE' 的值都視為 'TRUE'
        `;

		logging: 'log.warn("Invalid NEW_LINE value, using TRUE")';
	};

	/**
	 * 場景 2: valueToCode 返回空字串
	 */
	emptyValueCode: {
		trigger: 'valueToCode() returns ""';

		handling: 'Use "" (empty string literal)';

		code: 'const msg = valueToCode(...) || \\"\\"\\"\\"';

		output: 'print("")';
	};

	/**
	 * 場景 3: Block 物件為 null
	 */
	nullBlock: {
		trigger: 'block === null or block === undefined';

		handling: 'Return empty string (skip this block)';

		code: 'if (!block) return ""';

		logging: 'log.error("text_print generator called with null block")';
	};
}
```

### Defensive Programming

```typescript
/**
 * 防禦性程式設計模式
 */
function safeGenerate(block: Block | null): string {
	// Guard: 檢查 block 存在
	if (!block) {
		log.error('Generator called with null block');
		return '';
	}

	// Guard: 檢查欄位存在
	const field = block.getField('NEW_LINE');
	if (!field) {
		log.warn('NEW_LINE field not found, using default');
		return generateWithDefault(block);
	}

	// Normal flow
	const msg = valueToCode(block, 'TEXT', ORDER_NONE) || '""';
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	return `print(${msg}${newLine ? '' : ', end=""'})`;
}
```

---

## Cross-Platform Consistency Contract

### Arduino Generator Parity

```typescript
/**
 * 與 Arduino Generator 的邏輯對等性
 */
interface ArduinoParity {
	/**
	 * 映射關係
	 */
	mapping: {
		'Serial.println(msg)': 'print(msg)';
		'Serial.print(msg)': 'print(msg, end="")';
	};

	/**
	 * 行為等價性測試
	 */
	equivalenceTests: [
		{
			scenario: 'NEW_LINE = TRUE';
			arduino: 'Serial.println("A"); Serial.println("B");';
			micropython: 'print("A")\nprint("B")';
			terminalOutput: 'A\nB\n';
		},
		{
			scenario: 'NEW_LINE = FALSE';
			arduino: 'Serial.print("A"); Serial.print("B");';
			micropython: 'print("A", end="")\nprint("B", end="")';
			terminalOutput: 'AB';
		},
	];
}
```

---

## Performance Contract

### Execution Time

```typescript
/**
 * 效能保證
 */
interface PerformanceGuarantees {
	/**
	 * 單一積木產生時間
	 */
	generationTime: {
		typical: '< 1ms';
		maximum: '< 10ms';
		measurement: 'From generator call to return';
	};

	/**
	 * 記憶體使用
	 */
	memoryUsage: {
		typical: '< 1KB';
		maximum: '< 10KB';
		note: 'Includes string allocations';
	};

	/**
	 * 複雜度
	 */
	complexity: {
		time: 'O(1)'; // 常數時間
		space: 'O(1)'; // 常數空間
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
	basicTests: ['NEW_LINE = TRUE generates print(msg)', 'NEW_LINE = FALSE generates print(msg, end="")', 'Empty TEXT input uses default ""', 'Variable input preserves variable name'];

	edgeCaseTests: ['Multiline string handling', 'Special characters in string', 'Complex expressions', 'Null/undefined inputs'];

	integrationTests: ['Generated code is valid Python', 'Behavior matches Arduino version', 'Multiple text_print blocks work independently'];
}
```

### Manual Test Checklist

```typescript
/**
 * 手動測試檢查清單
 */
interface ManualTestChecklist {
	steps: ['1. 建立 text_print 積木 (NEW_LINE = TRUE)', '2. 檢查生成的程式碼: print(...)', '3. 取消勾選 NEW_LINE', '4. 檢查生成的程式碼: print(..., end="")', '5. 上傳到 CyberBrick', '6. 開啟終端機監控', '7. 驗證輸出行為符合預期'];

	expectedResults: {
		'NEW_LINE = TRUE': '每次輸出後自動換行';
		'NEW_LINE = FALSE': '輸出不換行,下一個輸出接續';
	};
}
```

---

## Implementation Example

```typescript
/**
 * 完整實作範例 (契約參考實作)
 */
window.micropythonGenerator.forBlock['text_print'] = function (block) {
	// ✅ Step 1: 讀取 TEXT 輸入 (契約保證)
	const msg = window.micropythonGenerator.valueToCode(block, 'TEXT', window.micropythonGenerator.ORDER_NONE) || '""';

	// ✅ Step 2: 讀取 NEW_LINE 欄位 (契約保證)
	const newLine = block.getFieldValue('NEW_LINE') === 'TRUE';

	// ✅ Step 3: 條件式程式碼生成 (契約保證)
	return `print(${msg}${newLine ? '' : ', end=""'})`;

	// ✅ 滿足所有契約:
	// - 返回字串 (非 null/undefined)
	// - 語法有效的 Python 程式碼
	// - 無副作用 (不修改全域狀態)
	// - O(1) 時間複雜度
	// - 行為與 Arduino 版本對等
};
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
