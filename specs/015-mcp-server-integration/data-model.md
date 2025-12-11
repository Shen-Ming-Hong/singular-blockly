# Data Model: MCP Server Integration

**Date**: 2025-12-11  
**Feature**: 015-mcp-server-integration  
**Status**: Phase 1

---

## 1. 核心實體

### 1.1 BlockDictionary（積木字典）

積木字典為唯讀的靜態資料，於編譯時生成。

```typescript
/**
 * 積木字典根結構
 * 儲存路徑: src/mcp/block-dictionary.json
 */
interface BlockDictionary {
	/** 字典版本，與 package.json 同步 */
	version: string;

	/** 生成時間戳 */
	generatedAt: string;

	/** 所有積木定義 */
	blocks: BlockDefinition[];

	/** 分類資訊 */
	categories: CategoryInfo[];

	/** 索引（用於快速查詢） */
	indices: {
		byType: Record<string, number>; // type -> array index
		byCategory: Record<string, number[]>; // category -> array indices
	};
}
```

### 1.2 BlockDefinition（積木定義）

```typescript
/**
 * 單一積木的完整定義
 */
interface BlockDefinition {
	/** 積木類型識別碼（唯一），例如 'servo_setup' */
	type: string;

	/** 所屬分類 */
	category: string;

	/** 多語言名稱 */
	names: LocalizedStrings;

	/** 多語言描述 */
	descriptions: LocalizedStrings;

	/** 欄位定義列表 */
	fields: BlockField[];

	/** 輸入連接點定義 */
	inputs: BlockInput[];

	/** 輸出型別（僅值積木有） */
	output?: BlockOutput;

	/** 使用範例 */
	examples: BlockExample[];

	/** 支援的板卡列表 */
	boards: BoardType[];

	/** 搜尋標籤（含中英文關鍵字） */
	tags: string[];

	/** 是否為實驗性功能 */
	experimental?: boolean;
}

/** 多語言字串映射 */
type LocalizedStrings = Record<SupportedLocale, string>;

/** 支援的語言代碼 */
type SupportedLocale = 'en' | 'zh-hant' | 'ja' | 'ko' | 'es' | 'pt-br' | 'fr' | 'de' | 'it' | 'ru' | 'pl' | 'hu' | 'tr' | 'bg' | 'cs';

/** 支援的板卡類型 */
type BoardType = 'arduino_uno' | 'arduino_nano' | 'arduino_mega' | 'esp32' | 'esp32_supermini';
```

### 1.3 BlockField（積木欄位）

```typescript
/**
 * 積木欄位定義
 */
interface BlockField {
	/** 欄位名稱（程式碼用） */
	name: string;

	/** 欄位類型 */
	type: FieldType;

	/** 多語言標籤 */
	label: LocalizedStrings;

	/** 預設值 */
	default?: FieldValue;

	/** 下拉選項（type = 'dropdown' 時） */
	options?: FieldOption[];

	/** 最小值（type = 'number' 時） */
	min?: number;

	/** 最大值（type = 'number' 時） */
	max?: number;

	/** 精度（type = 'number' 時） */
	precision?: number;

	/** 是否為必填 */
	required?: boolean;
}

type FieldType =
	| 'text' // 文字輸入
	| 'number' // 數字輸入
	| 'dropdown' // 下拉選單
	| 'checkbox' // 勾選框
	| 'angle' // 角度選擇器
	| 'colour'; // 顏色選擇器

type FieldValue = string | number | boolean;

interface FieldOption {
	/** 選項值 */
	value: string;

	/** 多語言標籤 */
	label: LocalizedStrings;
}
```

### 1.4 BlockInput（輸入連接點）

```typescript
/**
 * 積木輸入連接點定義
 */
interface BlockInput {
	/** 輸入名稱（程式碼用） */
	name: string;

	/** 輸入類型 */
	type: InputType;

	/** 多語言標籤 */
	label?: LocalizedStrings;

	/** 允許連接的型別 */
	check?: string | string[];

	/** 預設陰影積木 */
	shadow?: ShadowBlock;

	/** 對齊方式 */
	align?: 'left' | 'centre' | 'right';
}

type InputType = 'value' | 'statement';

interface ShadowBlock {
	/** 陰影積木類型 */
	type: string;

	/** 陰影積木欄位值 */
	fields?: Record<string, FieldValue>;
}
```

### 1.5 BlockOutput（輸出定義）

```typescript
/**
 * 積木輸出定義（僅值積木有）
 */
interface BlockOutput {
	/** 輸出型別 */
	type: string | string[] | null;
}
```

### 1.6 BlockExample（使用範例）

```typescript
/**
 * 積木使用範例
 */
interface BlockExample {
	/** 目標板卡 */
	board: BoardType;

	/** Blockly JSON 序列化格式 */
	json: BlocklyJsonFormat;

	/** 生成的 Arduino 程式碼 */
	arduinoCode: string;

	/** 多語言描述 */
	description: LocalizedStrings;
}

/**
 * Blockly 積木 JSON 格式（簡化版）
 */
interface BlocklyJsonFormat {
	type: string;
	id?: string;
	x?: number;
	y?: number;
	fields?: Record<string, FieldValue>;
	inputs?: Record<
		string,
		{
			block?: BlocklyJsonFormat;
			shadow?: BlocklyJsonFormat;
		}
	>;
	next?: {
		block?: BlocklyJsonFormat;
	};
}
```

### 1.7 CategoryInfo（分類資訊）

```typescript
/**
 * 積木分類資訊
 */
interface CategoryInfo {
	/** 分類 ID */
	id: string;

	/** 多語言名稱 */
	name: LocalizedStrings;

	/** 顯示顏色 (HSV 色相值或 hex) */
	colour: string;

	/** 圖示（選填） */
	icon?: string;

	/** 排序權重 */
	weight?: number;
}
```

---

## 2. 工作區狀態實體

### 2.1 WorkspaceState（工作區狀態）

```typescript
/**
 * 工作區完整狀態
 * 儲存路徑: {workspace}/blockly/main.json
 */
interface WorkspaceState {
	/** 工作區內容（Blockly 序列化格式） */
	workspace: BlocklyWorkspace;

	/** 目前選擇的板卡 */
	board: BoardType;

	/** 主題設定 */
	theme: ThemeType;
}

type ThemeType = 'light' | 'dark';

/**
 * Blockly 工作區序列化格式
 */
interface BlocklyWorkspace {
	blocks: {
		languageVersion: number;
		blocks: BlocklyJsonFormat[];
	};
	variables?: BlocklyVariable[];
}

interface BlocklyVariable {
	name: string;
	id: string;
	type?: string;
}
```

### 2.2 WorkspaceStateSummary（工作區摘要）

用於 MCP 工具回應的簡化格式：

```typescript
/**
 * 工作區狀態摘要（用於 get_workspace_state 回應）
 */
interface WorkspaceStateSummary {
	/** 目前板卡 */
	board: BoardType;

	/** 目前主題 */
	theme: ThemeType;

	/** 積木總數 */
	blockCount: number;

	/** 頂層積木數量 */
	topLevelBlockCount: number;

	/** 積木摘要列表 */
	blocks: BlockSummary[];

	/** 變數列表 */
	variables: string[];

	/** 完整 JSON（大型專案時可能省略） */
	fullJson?: object;
}

/**
 * 單一積木摘要
 */
interface BlockSummary {
	/** 積木 ID */
	id: string;

	/** 積木類型 */
	type: string;

	/** 位置（僅頂層積木有） */
	position?: { x: number; y: number };

	/** 欄位值 */
	fields: Record<string, FieldValue>;

	/** 連接關係 */
	connections: BlockConnections;
}

interface BlockConnections {
	/** 上一個積木 ID */
	previous?: string;

	/** 下一個積木 ID */
	next?: string;

	/** 父積木 ID（作為輸入連接時） */
	parent?: string;

	/** 輸入連接的積木 */
	inputs?: Record<string, string>;
}
```

---

## 3. 板卡配置實體

### 3.1 BoardConfig（板卡配置）

```typescript
/**
 * 板卡完整配置
 */
interface BoardConfig {
	/** 板卡 ID */
	id: BoardType;

	/** 顯示名稱 */
	name: LocalizedStrings;

	/** PlatformIO 配置 */
	platformio: PlatformIOConfig;

	/** 腳位配置 */
	pins: BoardPins;

	/** 特殊能力 */
	capabilities: BoardCapability[];
}

interface PlatformIOConfig {
	/** 平台，例如 'atmelavr', 'espressif32' */
	platform: string;

	/** 板卡識別碼 */
	board: string;

	/** 框架 */
	framework: string;

	/** 額外設定 */
	extra?: Record<string, string>;
}

interface BoardPins {
	/** 數位腳位 */
	digital: (number | string)[];

	/** 類比腳位 */
	analog: string[];

	/** PWM 腳位 */
	pwm: number[];

	/** 中斷腳位 */
	interrupt: number[];

	/** I2C 腳位 */
	i2c: { sda: number | string; scl: number | string };

	/** SPI 腳位 */
	spi: { mosi: number; miso: number; sck: number; ss: number };

	/** 觸控腳位（ESP32 專用） */
	touch?: number[];

	/** UART 腳位 */
	uart?: { tx: number; rx: number };
}

type BoardCapability = 'wifi' | 'bluetooth' | 'ble' | 'touch_sensor' | 'pwm_channels' | 'dac' | 'adc_12bit';
```

---

## 4. MCP 工具輸入/輸出模型

### 4.1 get_block_usage

```typescript
// 輸入
interface GetBlockUsageInput {
	blockType: string; // 必填：積木類型
	language?: SupportedLocale; // 選填：語言，預設 'zh-hant'
}

// 輸出
interface GetBlockUsageOutput {
	type: string;
	name: string;
	category: string;
	description: string;
	fields: {
		name: string;
		type: FieldType;
		label: string;
		default?: FieldValue;
		options?: { value: string; label: string }[];
	}[];
	inputs: {
		name: string;
		type: InputType;
		label?: string;
		check?: string | string[];
	}[];
	output?: { type: string | string[] | null };
	example: {
		json: object;
		arduinoCode: string;
		description: string;
	};
	boards: BoardType[];
	tags: string[];
}
```

### 4.2 search_blocks

```typescript
// 輸入
interface SearchBlocksInput {
	query: string; // 必填：搜尋關鍵字
	category?: string; // 選填：限定分類
	board?: BoardType; // 選填：限定板卡
	language?: SupportedLocale; // 選填：語言
	limit?: number; // 選填：結果數量，預設 10
}

// 輸出
interface SearchBlocksOutput {
	query: string;
	totalResults: number;
	results: {
		type: string;
		name: string;
		category: string;
		description: string;
		relevanceScore: number;
	}[];
}
```

### 4.3 list_blocks_by_category

```typescript
// 輸入
interface ListBlocksByCategoryInput {
	category: string; // 必填：分類 ID
	language?: SupportedLocale; // 選填：語言
}

// 輸出
interface ListBlocksByCategoryOutput {
	category: {
		id: string;
		name: string;
		colour: string;
	};
	blocks: {
		type: string;
		name: string;
		description: string;
	}[];
	totalCount: number;
}
```

### 4.4 get_workspace_state

```typescript
// 輸入
interface GetWorkspaceStateInput {
	includeFullJson?: boolean; // 選填：是否包含完整 JSON
}

// 輸出
type GetWorkspaceStateOutput = WorkspaceStateSummary;
```

### 4.5 update_workspace

```typescript
// 輸入
interface UpdateWorkspaceInput {
	action: WorkspaceAction;
	blocks?: BlocklyJsonFormat[]; // add 時必填
	blockIds?: string[]; // remove 時必填
	modifications?: BlockModification[]; // modify 時必填
	fullState?: object; // replace 時必填
}

type WorkspaceAction = 'add' | 'remove' | 'modify' | 'replace';

interface BlockModification {
	id: string;
	fields?: Record<string, FieldValue>;
	position?: { x: number; y: number };
}

// 輸出
interface UpdateWorkspaceOutput {
	success: boolean;
	action: WorkspaceAction;
	affectedBlockIds: string[];
	newState: WorkspaceStateSummary;
	warnings?: string[];
}
```

### 4.6 refresh_editor

```typescript
// 輸入
interface RefreshEditorInput {
	// 無參數
}

// 輸出
interface RefreshEditorOutput {
	success: boolean;
	message: string;
	timestamp: string;
}
```

### 4.7 get_generated_code

```typescript
// 輸入
interface GetGeneratedCodeInput {
	format?: CodeFormat; // 選填：程式碼格式
}

type CodeFormat = 'arduino' | 'cpp';

// 輸出
interface GetGeneratedCodeOutput {
	code: string;
	language: string;
	board: BoardType;
	includes: string[];
	libraries: string[];
	warnings?: string[];
}
```

### 4.8 get_platform_config

```typescript
// 輸入
interface GetPlatformConfigInput {
	// 無參數
}

// 輸出
interface GetPlatformConfigOutput {
	board: BoardType;
	platformio: PlatformIOConfig;
	libraries: {
		name: string;
		version: string;
	}[];
	buildFlags?: string[];
}
```

### 4.9 get_board_pins

```typescript
// 輸入
interface GetBoardPinsInput {
	board?: BoardType; // 選填：指定板卡，預設為目前板卡
}

// 輸出
interface GetBoardPinsOutput {
	board: BoardType;
	name: string;
	pins: BoardPins;
	capabilities: BoardCapability[];
}
```

---

## 5. 狀態轉換規則

### 5.1 WorkspaceState 驗證規則

```typescript
const WorkspaceStateValidation = {
	// board 必須是有效的 BoardType
	board: (value: string) => ['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'esp32_supermini'].includes(value),

	// theme 必須是 'light' 或 'dark'
	theme: (value: string) => ['light', 'dark'].includes(value),

	// workspace.blocks 必須是有效的 Blockly 格式
	workspace: (value: BlocklyWorkspace) => value.blocks?.languageVersion >= 0 && Array.isArray(value.blocks.blocks),
};
```

### 5.2 積木修改限制

-   **add**: 新增的積木 ID 不得與現有積木重複
-   **remove**: 移除的積木必須存在
-   **modify**: 修改的積木必須存在，欄位必須在積木定義中
-   **replace**: 完整狀態必須通過驗證

---

## 6. 索引與查詢優化

### 6.1 積木字典索引

```typescript
// 編譯時生成的索引
const dictionaryIndices = {
	// type -> 陣列索引的快速查詢
	byType: {
		servo_setup: 0,
		servo_move: 1,
		// ...
	},

	// category -> 該分類下所有積木的索引
	byCategory: {
		motors: [0, 1, 2, 3],
		sensors: [4, 5, 6],
		// ...
	},

	// 搜尋用的倒排索引（tag -> type）
	searchIndex: {
		servo: ['servo_setup', 'servo_move', 'servo_stop'],
		馬達: ['servo_setup', 'servo_move', 'motor_control'],
		// ...
	},
};
```

### 6.2 搜尋演算法

```typescript
function searchBlocks(query: string, options: SearchOptions): SearchResult[] {
	const normalizedQuery = query.toLowerCase().trim();
	const results: Map<string, number> = new Map();

	// 1. 精確匹配 type
	if (indices.byType[normalizedQuery]) {
		results.set(normalizedQuery, 100);
	}

	// 2. 標籤匹配
	for (const [tag, types] of Object.entries(indices.searchIndex)) {
		if (tag.includes(normalizedQuery)) {
			for (const type of types) {
				const currentScore = results.get(type) || 0;
				results.set(type, Math.max(currentScore, 80));
			}
		}
	}

	// 3. 名稱/描述模糊匹配
	for (const block of dictionary.blocks) {
		const nameMatch = Object.values(block.names).some(name => name.toLowerCase().includes(normalizedQuery));
		if (nameMatch) {
			const currentScore = results.get(block.type) || 0;
			results.set(block.type, Math.max(currentScore, 60));
		}
	}

	// 4. 過濾與排序
	return Array.from(results.entries())
		.filter(([type, score]) => {
			if (options.category && dictionary.blocks.find(b => b.type === type)?.category !== options.category) {
				return false;
			}
			if (options.board && !dictionary.blocks.find(b => b.type === type)?.boards.includes(options.board)) {
				return false;
			}
			return true;
		})
		.sort((a, b) => b[1] - a[1])
		.slice(0, options.limit || 10)
		.map(([type, score]) => ({
			...getBlockSummary(type, options.language),
			relevanceScore: score,
		}));
}
```
