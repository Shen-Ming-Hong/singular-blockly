# Data Model - HuskyLens Blocks Validation

## Overview

本文件定義 HuskyLens 積木驗證過程中需要檢查和修正的資料實體及其約束條件。所有資料模型基於 Phase 0 Research 的查證結果。

---

## Entity 1: BlockDefinition (積木定義)

### Purpose

表示單一 Blockly 積木的完整定義,包含 UI 結構、欄位、輸入/輸出類型等。

### Location

`media/blockly/blocks/huskylens.js`

### Schema

```typescript
interface BlockDefinition {
	blockType: string; // 積木類型名稱 (例如: 'huskylens_init_i2c')
	init: InitMethod; // init() 方法定義
	colour: number; // 積木顏色 (0-360)
	tooltip?: string; // 工具提示文字 (i18n key 或純文字)
	helpUrl?: string; // 說明文件 URL

	// 驗證相關
	validationStatus: 'pass' | 'fail' | 'warning';
	validationErrors: ValidationError[];
}

interface InitMethod {
	inputs: BlockInput[]; // 積木輸入列表
	outputs?: BlockOutput; // 積木輸出 (如果有)
	statements?: BlockStatement; // 語句連接 (如果有)
	fields: BlockField[]; // 積木欄位列表
}

interface BlockInput {
	type: 'dummy' | 'value' | 'statement'; // 輸入類型
	name?: string; // 輸入名稱 (value/statement 必須有)
	check?: string | string[]; // 類型檢查 (例如: 'Number', ['Number', 'String'])
	fields: BlockField[]; // 該輸入上的欄位
}

interface BlockOutput {
	enabled: boolean; // 是否有輸出
	type?: string | string[]; // 輸出類型 (例如: 'Boolean', 'Number')
}

interface BlockStatement {
	previous: boolean; // 是否可連接到上方積木
	next: boolean; // 是否可連接到下方積木
}

interface BlockField {
	type: 'FieldDropdown' | 'FieldNumber' | 'FieldTextInput' | 'FieldLabel';
	name?: string; // 欄位名稱 (Label 除外)
	label?: string; // 欄位標籤 (i18n key 或純文字)
	options?: DropdownOption[]; // Dropdown 選項
	defaultValue?: any; // 預設值
	constraints?: FieldConstraints; // 欄位約束 (例如: min/max for Number)
}

interface DropdownOption {
	label: string; // 顯示文字 (i18n key)
	value: string | number; // 實際值
}

interface FieldConstraints {
	min?: number;
	max?: number;
	precision?: number;
}
```

### Validation Rules (from Task 2 Research)

1. **Must have `init()` method** - 所有積木必須有完整的 init() 定義
2. **I18n messages** - 所有標籤和選項必須使用 `Blockly.Msg['KEY']` 而非硬編碼文字
3. **Type checking** - ValueInput 必須使用 `setCheck()` 限制輸入類型
4. **Output type declaration** - 有輸出的積木必須使用 `setOutput(true, 'Type')`
5. **Statement connections** - 語句積木必須正確設定 `setPreviousStatement()` 和 `setNextStatement()`
6. **Colour consistency** - 相同類別的積木應使用相同顏色
7. **Tooltip presence** - 所有積木應有 `setTooltip()` (使用 i18n key)
8. **Field type correctness** - 欄位類型必須符合用途 (例如: 引腳選擇用 FieldNumber)

### Instances (11 HuskyLens Blocks)

| Block Type               | Category | Has Output | Expected Colour | I18n Keys Required         |
| ------------------------ | -------- | ---------- | --------------- | -------------------------- |
| huskylens_init_i2c       | 初始化   | No         | 330             | 1 (tooltip)                |
| huskylens_init_uart      | 初始化   | No         | 330             | 3 (tooltip + 2 pins)       |
| huskylens_set_algorithm  | 設定     | No         | 230             | 8 (tooltip + 7 algorithms) |
| huskylens_request        | 操作     | No         | 290             | 1 (tooltip)                |
| huskylens_is_learned     | 查詢     | Boolean    | 160             | 1 (tooltip)                |
| huskylens_count_blocks   | 查詢     | Number     | 160             | 1 (tooltip)                |
| huskylens_get_block_info | 查詢     | Number     | 160             | 6 (tooltip + 5 info types) |
| huskylens_count_arrows   | 查詢     | Number     | 160             | 1 (tooltip)                |
| huskylens_get_arrow_info | 查詢     | Number     | 160             | 6 (tooltip + 5 info types) |
| huskylens_learn          | 操作     | No         | 290             | 2 (tooltip + ID label)     |
| huskylens_forget         | 操作     | No         | 290             | 1 (tooltip)                |

**Total I18n Messages**: 31 keys × 12 languages = 372 messages

---

## Entity 2: CodeGenerator (程式碼生成器)

### Purpose

表示單一積木的 Arduino C++ 程式碼生成邏輯。

### Location

`media/blockly/generators/arduino/huskylens.js`

### Schema

```typescript
interface CodeGenerator {
	blockType: string; // 對應的積木類型
	generatorFunction: GeneratorFunction; // 程式碼生成函式

	// 依賴項
	includes: string[]; // 需要的 #include 標頭檔
	variables: string[]; // 需要的全域變數
	setupCode: string[]; // setup() 中的初始化程式碼
	definitions: string[]; // 函式定義或常數定義

	// PlatformIO 依賴
	libDeps: string[]; // lib_deps 依賴
	buildFlags: string[]; // build_flags 編譯選項

	// 驗證相關
	validationStatus: 'pass' | 'fail' | 'warning';
	validationErrors: ValidationError[];
}

interface GeneratorFunction {
	parameters: string[]; // 函式參數 (通常是 block)
	returnType: 'string' | 'array'; // 回傳類型 (語句回傳 string, 值回傳 [code, order])
	code: string; // 生成的 C++ 程式碼
	order?: number; // 運算優先級 (值積木需要)
}
```

### Validation Rules (from Task 1 Research)

1. **API correctness** - 所有 HUSKYLENSArduino API 呼叫必須正確
2. **Property name case** - 必須使用 `.ID` (大寫) 而非 `.id` (小寫)
3. **Board detection** - UART 初始化必須檢測開發板類型 (AVR vs ESP32)
4. **Return type matching** - 回傳值類型必須符合 API 規格 (bool, int16_t, HUSKYLENSResult)
5. **Error handling** - 關鍵操作應有 try-catch 或錯誤檢查
6. **Include order** - pragma 指令必須按正確順序插入 (已驗證正確)
7. **Library dependencies** - lib_deps 必須包含 HUSKYLENSArduino GitHub URL
8. **Global variable uniqueness** - 避免重複宣告全域變數

### Critical Fixes Required

| Generator                | Issue           | Fix Required                       |
| ------------------------ | --------------- | ---------------------------------- |
| huskylens_get_block_info | `.id` → `.ID`   | 修正屬性名稱大小寫                 |
| huskylens_get_arrow_info | `.id` → `.ID`   | 修正屬性名稱大小寫                 |
| huskylens_init_uart      | 缺少 ESP32 支援 | 新增開發板檢測,使用 HardwareSerial |

### Board-Specific Code Generation

```typescript
interface BoardSpecificCode {
	avr: {
		includes: string[]; // ['<SoftwareSerial.h>']
		variables: string[]; // ['SoftwareSerial huskySerial(rx, tx);']
		initCode: string; // 'huskySerial.begin(9600);'
	};
	esp32: {
		includes: string[]; // [] (無需額外 include)
		variables: string[]; // ['HardwareSerial huskySerial(1);']
		initCode: string; // 'huskySerial.begin(9600, SERIAL_8N1, rx, tx);'
	};
}
```

---

## Entity 3: I18nMessage (國際化訊息)

### Purpose

表示單一可翻譯的文字訊息,支援 12 種語言。

### Location

`media/locales/{lang}/messages.js`

### Schema

```typescript
interface I18nMessage {
	key: string; // 訊息鍵 (例如: 'HUSKYLENS_INIT_I2C_TOOLTIP')
	translations: Translation[]; // 12 種語言的翻譯

	// 使用位置追蹤
	usedInBlocks: string[]; // 使用此訊息的積木類型列表
	usedInFields: string[]; // 使用此訊息的欄位類型列表

	// 驗證相關
	validationStatus: 'complete' | 'incomplete' | 'missing';
	missingLanguages: string[]; // 缺少翻譯的語言列表
}

interface Translation {
	language: string; // 語言代碼 (例如: 'zh-hant', 'en', 'ja')
	text: string; // 翻譯文字
	lastUpdated?: string; // 最後更新時間
	reviewStatus?: 'unreviewed' | 'reviewed' | 'native-verified';
}
```

### Supported Languages (12)

1. `zh-hant` - 繁體中文 (Traditional Chinese)
2. `en` - 英文 (English)
3. `ja` - 日文 (Japanese)
4. `ko` - 韓文 (Korean)
5. `es` - 西班牙文 (Spanish)
6. `fr` - 法文 (French)
7. `de` - 德文 (German)
8. `it` - 義大利文 (Italian)
9. `pt-br` - 巴西葡萄牙文 (Brazilian Portuguese)
10. `ru` - 俄文 (Russian)
11. `tr` - 土耳其文 (Turkish)
12. `pl` - 波蘭文 (Polish)

### Required Message Keys (44 keys)

**Category: Block Tooltips (11 keys)**

-   `HUSKYLENS_INIT_I2C_TOOLTIP`
-   `HUSKYLENS_INIT_UART_TOOLTIP`
-   `HUSKYLENS_SET_ALGORITHM_TOOLTIP`
-   `HUSKYLENS_REQUEST_TOOLTIP`
-   `HUSKYLENS_IS_LEARNED_TOOLTIP`
-   `HUSKYLENS_COUNT_BLOCKS_TOOLTIP`
-   `HUSKYLENS_GET_BLOCK_INFO_TOOLTIP`
-   `HUSKYLENS_COUNT_ARROWS_TOOLTIP`
-   `HUSKYLENS_GET_ARROW_INFO_TOOLTIP`
-   `HUSKYLENS_LEARN_TOOLTIP`
-   `HUSKYLENS_FORGET_TOOLTIP`

**Category: Field Labels (22 keys)**

-   `HUSKYLENS_INIT_UART_RX_PIN`
-   `HUSKYLENS_INIT_UART_TX_PIN`
-   `HUSKYLENS_ALGORITHM_FACE_RECOGNITION`
-   `HUSKYLENS_ALGORITHM_OBJECT_TRACKING`
-   `HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION`
-   `HUSKYLENS_ALGORITHM_LINE_TRACKING`
-   `HUSKYLENS_ALGORITHM_COLOR_RECOGNITION`
-   `HUSKYLENS_ALGORITHM_TAG_RECOGNITION`
-   `HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION`
-   `HUSKYLENS_BLOCK_INFO_X_CENTER`
-   `HUSKYLENS_BLOCK_INFO_Y_CENTER`
-   `HUSKYLENS_BLOCK_INFO_WIDTH`
-   `HUSKYLENS_BLOCK_INFO_HEIGHT`
-   `HUSKYLENS_BLOCK_INFO_ID`
-   `HUSKYLENS_ARROW_INFO_X_ORIGIN`
-   `HUSKYLENS_ARROW_INFO_Y_ORIGIN`
-   `HUSKYLENS_ARROW_INFO_X_TARGET`
-   `HUSKYLENS_ARROW_INFO_Y_TARGET`
-   `HUSKYLENS_ARROW_INFO_ID`
-   `HUSKYLENS_LEARN_ID_LABEL`
-   `HUSKYLENS_GET_BLOCK_INFO_INDEX_LABEL`
-   `HUSKYLENS_GET_ARROW_INFO_INDEX_LABEL`

**Category: Block Main Labels (11 keys)**

-   `HUSKYLENS_INIT_I2C`
-   `HUSKYLENS_INIT_UART`
-   `HUSKYLENS_SET_ALGORITHM`
-   `HUSKYLENS_REQUEST`
-   `HUSKYLENS_IS_LEARNED`
-   `HUSKYLENS_COUNT_BLOCKS`
-   `HUSKYLENS_GET_BLOCK_INFO`
-   `HUSKYLENS_COUNT_ARROWS`
-   `HUSKYLENS_GET_ARROW_INFO`
-   `HUSKYLENS_LEARN`
-   `HUSKYLENS_FORGET`

**Total Messages**: 44 keys × 12 languages = **528 i18n entries**

### Validation Rules

1. **Key naming convention** - 使用 `HUSKYLENS_` 前綴,全大寫,底線分隔
2. **Completeness** - 所有 44 個鍵必須在所有 12 種語言中存在
3. **No hardcoded text** - 積木定義中不得出現硬編碼的中文/英文文字
4. **Placeholder consistency** - 如果訊息包含佔位符 (例如: %1, %2),所有語言的翻譯必須保留相同的佔位符

---

## Entity 4: ToolboxEntry (工具箱條目)

### Purpose

表示 Blockly 工具箱中的積木條目配置。

### Location

`media/toolbox/categories/sensors.json` (或新建 `huskylens.json`)

### Schema

```typescript
interface ToolboxCategory {
	kind: 'category';
	name: string; // 分類名稱 (i18n key)
	colour: string; // 分類顏色 (HSV 格式)
	contents: ToolboxBlock[]; // 積木列表
}

interface ToolboxBlock {
	kind: 'block';
	type: string; // 積木類型 (對應 BlockDefinition.blockType)
	inputs?: ToolboxInput[]; // 預設輸入值 (可選)
	fields?: ToolboxField[]; // 預設欄位值 (可選)
}

interface ToolboxInput {
	name: string; // 輸入名稱
	block: ToolboxBlock; // 嵌套的積木
}

interface ToolboxField {
	name: string; // 欄位名稱
	value: any; // 預設值
}
```

### Validation Rules

1. **All blocks present** - 所有 11 個 HuskyLens 積木必須在工具箱中
2. **Correct order** - 積木順序應符合使用邏輯 (初始化 → 設定 → 查詢 → 操作)
3. **Category exists** - 確保 "感測器" 或 "HuskyLens" 分類存在
4. **Block type matching** - toolbox 中的 `type` 必須對應已定義的積木類型

### Recommended Toolbox Structure

```json
{
	"kind": "category",
	"name": "%{BKY_CATEGORY_HUSKYLENS}",
	"colour": "160",
	"contents": [
		{ "kind": "block", "type": "huskylens_init_i2c" },
		{ "kind": "block", "type": "huskylens_init_uart" },
		{ "kind": "block", "type": "huskylens_set_algorithm" },
		{ "kind": "block", "type": "huskylens_request" },
		{ "kind": "block", "type": "huskylens_is_learned" },
		{ "kind": "block", "type": "huskylens_count_blocks" },
		{ "kind": "block", "type": "huskylens_get_block_info" },
		{ "kind": "block", "type": "huskylens_count_arrows" },
		{ "kind": "block", "type": "huskylens_get_arrow_info" },
		{ "kind": "block", "type": "huskylens_learn" },
		{ "kind": "block", "type": "huskylens_forget" }
	]
}
```

---

## Entity 5: ValidationResult (驗證結果)

### Purpose

記錄單一驗證項目的結果,用於追蹤修正進度。

### Schema

```typescript
interface ValidationResult {
	entityType: 'block' | 'generator' | 'i18n' | 'toolbox';
	entityId: string; // 實體識別碼 (例如: 'huskylens_init_i2c')
	checkName: string; // 驗證項目名稱
	status: 'pass' | 'fail' | 'warning';

	// 錯誤詳情
	message?: string; // 錯誤訊息
	location?: CodeLocation; // 程式碼位置
	expectedValue?: any; // 預期值
	actualValue?: any; // 實際值

	// 修正建議
	fixSuggestion?: string; // 修正建議
	autoFixable: boolean; // 是否可自動修正
}

interface CodeLocation {
	file: string; // 檔案路徑
	line?: number; // 行號
	column?: number; // 列號
	snippet?: string; // 程式碼片段
}

interface ValidationError {
	code: string; // 錯誤代碼 (例如: 'BLOCK_NO_INIT')
	severity: 'error' | 'warning' | 'info';
	message: string;
	location: CodeLocation;
	fix?: AutoFix;
}

interface AutoFix {
	description: string;
	oldCode: string;
	newCode: string;
}
```

---

## Data Flow & Relationships

```
BlockDefinition (11)
    ↓ uses
I18nMessage (44 keys × 12 langs = 528)
    ↓ generates
CodeGenerator (11)
    ↓ depends on
LibraryDependencies (HUSKYLENSArduino)
    ↓ listed in
ToolboxEntry (11)
    ↓ produces
ValidationResult (N items)
```

---

## Validation Workflow

1. **Load All Entities**

    - 讀取 11 個 BlockDefinition (from `blocks/huskylens.js`)
    - 讀取 11 個 CodeGenerator (from `generators/arduino/huskylens.js`)
    - 讀取 528 個 I18nMessage (from `locales/*/messages.js`)
    - 讀取 ToolboxEntry (from `toolbox/categories/*.json`)

2. **Run Validation Rules**

    - 對每個實體執行其對應的驗證規則
    - 收集所有 ValidationResult

3. **Generate Report**

    - 統計 pass/fail/warning 數量
    - 按優先級排序錯誤
    - 產生修正建議清單

4. **Apply Fixes**

    - 自動修正 autoFixable 的錯誤
    - 手動修正其他錯誤
    - 重新驗證

5. **Verify Completeness**
    - 確認所有積木都已驗證
    - 確認所有 i18n 訊息都已翻譯
    - 確認所有程式碼生成器都正確

---

## Critical Data Constraints

### From Research Findings

1. **`.ID` vs `.id`** (Entity 2: CodeGenerator)

    - ❌ Wrong: `result.id`
    - ✅ Correct: `result.ID`
    - Affected: `huskylens_get_block_info`, `huskylens_get_arrow_info`

2. **Board-Specific Serial** (Entity 2: CodeGenerator)

    - AVR: `SoftwareSerial huskySerial(rx, tx);`
    - ESP32: `HardwareSerial huskySerial(1);`
    - Requires: `window.currentBoard` detection

3. **Algorithm Constants** (Entity 2: CodeGenerator)

    - Range: 0-6 (enum values)
    - Source: `protocolAlgorithm` from HUSKYLENSArduino

4. **Return Types** (Entity 2: CodeGenerator)
    - `begin()`: bool
    - `request()`: bool
    - `isLearned()`: bool
    - `countBlocks()`: int16_t
    - `countArrows()`: int16_t
    - `getBlock()`: HUSKYLENSResult
    - `getArrow()`: HUSKYLENSResult
    - `writeAlgorithm()`: bool
    - `writeLearn()`: bool
    - `writeForget()`: bool

---

## Summary

-   **Total Entities**: 5 類型
-   **Total Instances**: 11 blocks + 11 generators + 528 i18n messages + 11 toolbox entries = **561 items**
-   **Critical Fixes**: 3 (`.id` × 2 + ESP32 support × 1)
-   **Validation Rules**: 30+ (分散在 5 個實體類型中)

這個資料模型將指導 Phase 2 Implementation 的所有驗證和修正工作。
