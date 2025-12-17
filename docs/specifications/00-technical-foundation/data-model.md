# 資料模型規格 (data-model.md)

> 定義 Singular Blockly 專案的核心資料結構、狀態管理、持久化格式。
> 最後更新：2025-12-17

---

## 一、工作區狀態 (Workspace State)

### 1.1 主要儲存結構

**檔案位置**: `{workspace}/blockly/main.json`

```typescript
interface WorkspaceSaveData {
	/** Blockly 工作區序列化資料 */
	workspace: BlocklyWorkspace;

	/** 目前選擇的開發板 */
	board: BoardType;

	/** UI 主題設定 */
	theme: 'light' | 'dark';

	/** 最後儲存時間戳 (可選) */
	timestamp?: string;
}

type BoardType = 'none' | 'arduino_uno' | 'arduino_nano' | 'arduino_mega' | 'esp32' | 'esp32_supermini';
```

### 1.2 Blockly 工作區結構

```typescript
interface BlocklyWorkspace {
	blocks: {
		/** Blockly 序列化版本 (固定為 0) */
		languageVersion: 0;

		/** 頂層積木陣列 */
		blocks: BlockDefinition[];
	};

	/** 變數定義 (可選) */
	variables?: VariableDefinition[];
}

interface VariableDefinition {
	/** 變數名稱 */
	name: string;

	/** 變數唯一識別碼 */
	id: string;

	/** 變數類型 (預設 '') */
	type?: string;
}
```

### 1.3 積木定義結構

```typescript
interface BlockDefinition {
	/** 積木類型識別碼 */
	type: string;

	/** 積木唯一識別碼 (21 字元 Base64) */
	id: string;

	/** 頂層積木的 X 座標 */
	x?: number;

	/** 頂層積木的 Y 座標 */
	y?: number;

	/** 欄位值 */
	fields?: Record<string, FieldValue>;

	/** 輸入連接 */
	inputs?: Record<string, InputDefinition>;

	/** 下一個連接的積木 */
	next?: { block: BlockDefinition };

	/** 額外狀態 (mutation data) */
	extraState?: Record<string, unknown>;

	/** 積木是否被禁用 */
	enabled?: boolean;

	/** 是否收合 */
	collapsed?: boolean;
}

type FieldValue = string | number | boolean;

interface InputDefinition {
	/** 連接的積木 */
	block?: BlockDefinition;

	/** Shadow 積木 (預設值) */
	shadow?: BlockDefinition;
}
```

---

## 二、Arduino 程式碼生成器狀態

### 2.1 Generator 內部狀態

```typescript
interface ArduinoGeneratorState {
	/** #include 標頭檔 */
	includes_: Record<string, string>;

	/** 全域變數宣告 */
	variables_: Record<string, string>;

	/** 其他定義 (typedef, enum 等) */
	definitions_: Record<string, string>;

	/** 自定義函數 */
	functions_: Record<string, string>;

	/** 程式碼註釋 */
	comments_: Record<string, string>;

	/** setup() 區塊程式碼 */
	setupCode_: string[];

	/** loop() 開頭一次性程式碼 */
	loopCodeOnce_: Record<string, string>;

	/** PID-編碼器對應表 */
	pidEncoderMap_: Record<string, string>;

	/** 腳位模式警告 */
	warnings_: string[];

	/** 腳位模式追蹤 */
	pinModes_: Record<string, PinMode>;

	/** PlatformIO 函式庫依賴 */
	lib_deps_: string[];

	/** PlatformIO 編譯標誌 */
	build_flags_: string[];

	/** PlatformIO 函式庫連結模式 */
	lib_ldf_mode_: string | null;

	/** 強制生成的積木類型列表 */
	alwaysGenerateBlocks_: string[];

	/** 名稱資料庫 (變數名稱管理) */
	nameDB_: Blockly.Names;
}

type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';
```

### 2.2 生成的 Arduino 程式碼結構

```cpp
// 1. 警告註釋 (如果有)
/* 腳位模式警告:
 * 警告訊息...
 */

// 2. 程式碼註釋
// 註釋內容...

// 3. #include 標頭檔
#include <Arduino.h>
#include <Servo.h>

// 4. 全域變數
Servo myServo;
int counter = 0;

// 5. 其他定義
typedef struct { ... } MyStruct;

// 6. 函數前向宣告
void myFunction(int param);

// 7. 函數定義
void myFunction(int param) {
  // 函數內容
}

// 8. setup()
void setup() {
  // setupCode_ 內容
  myServo.attach(9);
}

// 9. loop()
void loop() {
  // loopCodeOnce_ 內容
  // 主要 loop 程式碼
}
```

---

## 三、開發板配置

### 3.1 Board Config 結構

```typescript
interface BoardConfig {
	/** 開發板顯示名稱 */
	name: string;

	/** PlatformIO 平台 */
	platform: 'atmelavr' | 'espressif32';

	/** PlatformIO 板子識別碼 */
	board: string;

	/** 使用框架 */
	framework: 'arduino';

	/** 腳位配置 */
	pins: PinConfig;

	/** 額外的 PlatformIO 設定 */
	extra?: Record<string, string>;
}

interface PinConfig {
	/** 數位腳位列表 */
	digital: (number | string)[];

	/** 類比腳位列表 */
	analog: string[];

	/** PWM 腳位列表 */
	pwm: number[];

	/** 中斷腳位列表 */
	interrupt: number[];

	/** I2C 腳位 (可選) */
	i2c?: {
		sda: number;
		scl: number;
	};

	/** SPI 腳位 (可選) */
	spi?: {
		mosi: number;
		miso: number;
		sck: number;
		ss: number;
	};
}
```

### 3.2 PlatformIO 配置

**檔案位置**: `{workspace}/platformio.ini`

```ini
[env:board_name]
platform = atmelavr
board = uno
framework = arduino
lib_deps =
    arduino-libraries/Servo@^1.2.2
build_flags =
    -DSOME_FLAG
lib_ldf_mode = deep+
```

```typescript
interface PlatformIOConfig {
	/** 環境名稱 */
	env: string;

	/** 平台 */
	platform: string;

	/** 開發板 */
	board: string;

	/** 框架 */
	framework: string;

	/** 函式庫依賴 */
	lib_deps?: string[];

	/** 編譯標誌 */
	build_flags?: string[];

	/** 函式庫連結模式 */
	lib_ldf_mode?: string;
}
```

---

## 四、備份系統

### 4.1 備份檔案結構

**目錄位置**: `{workspace}/blockly/backup/`

**檔案命名**: `{backup_name}.json`

```typescript
// 備份檔案內容與 main.json 相同
interface BackupFile extends WorkspaceSaveData {
	// 繼承 WorkspaceSaveData 結構
}
```

### 4.2 自動備份命名規則

```typescript
// 自動備份檔案命名格式
type AutoBackupName = `auto_backup_${YYYYMMDD}_${HHMMSS}` | `auto_restore_${YYYYMMDD}_${HHMMSS}`;

// 範例
// auto_backup_20251217_143052.json
// auto_restore_20251217_150000.json
```

### 4.3 備份列表項目

```typescript
interface BackupListItem {
	/** 備份名稱 (不含 .json) */
	name: string;

	/** 建立日期 (ISO 8601) */
	date: string;

	/** 完整檔案路徑 */
	filePath: string;

	/** 檔案大小 (bytes) */
	size: number;
}
```

---

## 五、訊息協定

### 5.1 Extension → WebView 訊息

```typescript
type ExtensionToWebViewMessage = LoadWorkspaceMessage | UpdateThemeMessage | BackupCreatedMessage | BackupListResponseMessage | CreateVariableMessage | DeleteVariableMessage | AutoBackupSettingsResponseMessage | LoadErrorMessage;

interface LoadWorkspaceMessage {
	command: 'loadWorkspace';
	state: BlocklyWorkspace;
	board: BoardType;
	theme: 'light' | 'dark';
	source?: 'fileWatcher' | 'mcpReload';
	isRestored?: boolean;
	restoreName?: string;
}

interface UpdateThemeMessage {
	command: 'updateTheme';
	theme: 'light' | 'dark';
}

interface BackupCreatedMessage {
	command: 'backupCreated';
	name: string;
	success: boolean;
	error?: string;
}

interface BackupListResponseMessage {
	command: 'backupListResponse';
	backups: BackupListItem[];
	error?: string;
}

interface CreateVariableMessage {
	command: 'createVariable';
	name: string;
	isRename: boolean;
	oldName?: string;
}

interface DeleteVariableMessage {
	command: 'deleteVariable';
	confirmed: boolean;
	name: string;
}

interface AutoBackupSettingsResponseMessage {
	command: 'autoBackupSettingsResponse';
	interval: number;
}

interface LoadErrorMessage {
	command: 'loadError';
	error: string;
}
```

### 5.2 WebView → Extension 訊息

```typescript
type WebViewToExtensionMessage = LogMessage | SaveWorkspaceMessage | UpdateCodeMessage | UpdateBoardMessage | RequestInitialStateMessage | PromptNewVariableMessage | ConfirmDeleteVariableMessage | UpdateThemeMessage | CreateBackupMessage | GetBackupListMessage | DeleteBackupMessage | RestoreBackupMessage | PreviewBackupMessage | GetAutoBackupSettingsMessage | UpdateAutoBackupSettingsMessage | RequestWorkspaceReloadMessage;

interface LogMessage {
	command: 'log';
	source: string;
	level: 'debug' | 'info' | 'warn' | 'error';
	message: string;
	args?: string[];
	timestamp: string;
}

interface SaveWorkspaceMessage {
	command: 'saveWorkspace';
	state: BlocklyWorkspace;
	board: BoardType;
	theme: 'light' | 'dark';
}

interface UpdateCodeMessage {
	command: 'updateCode';
	code: string;
	lib_deps?: string[];
	build_flags?: string[];
	lib_ldf_mode?: string;
}

interface UpdateBoardMessage {
	command: 'updateBoard';
	board: BoardType;
	lib_deps?: string[];
	build_flags?: string[];
	lib_ldf_mode?: string;
}

interface RequestInitialStateMessage {
	command: 'requestInitialState';
}

interface PromptNewVariableMessage {
	command: 'promptNewVariable';
	isRename: boolean;
	currentName?: string;
}

interface ConfirmDeleteVariableMessage {
	command: 'confirmDeleteVariable';
	variableName: string;
}

interface CreateBackupMessage {
	command: 'createBackup';
	name: string;
}

interface GetBackupListMessage {
	command: 'getBackupList';
}

interface DeleteBackupMessage {
	command: 'deleteBackup';
	name: string;
}

interface RestoreBackupMessage {
	command: 'restoreBackup';
	name: string;
}

interface PreviewBackupMessage {
	command: 'previewBackup';
	name: string;
}

interface GetAutoBackupSettingsMessage {
	command: 'getAutoBackupSettings';
}

interface UpdateAutoBackupSettingsMessage {
	command: 'updateAutoBackupSettings';
	interval: number;
}

interface RequestWorkspaceReloadMessage {
	command: 'requestWorkspaceReload';
}
```

---

## 六、MCP 工具 Schema

### 6.1 get_block_usage

```typescript
// 輸入
interface GetBlockUsageInput {
	blockType: string;
	language?: SupportedLocale;
	context?: BlockContext;
}

// 輸出
interface GetBlockUsageOutput {
	type: string;
	category: string;
	description: string;
	fields: FieldDefinition[];
	inputs: InputSpec[];
	connections: ConnectionSpec;
	insertionGuide: InsertionGuide;
	jsonTemplate?: BlockDefinition;
	templateUsage?: TemplateUsageGuide;
}

type SupportedLocale = 'en' | 'zh-hant' | 'ja' | 'ko' | 'es' | 'pt-br' | 'fr' | 'de' | 'it' | 'ru' | 'pl' | 'hu' | 'tr' | 'bg' | 'cs';
```

### 6.2 search_blocks

```typescript
// 輸入
interface SearchBlocksInput {
	query: string;
	category?: string;
	board?: BoardType;
	language?: SupportedLocale;
	limit?: number;
}

// 輸出
interface SearchBlocksOutput {
	query: string;
	totalResults: number;
	results: BlockSearchResult[];
}

interface BlockSearchResult {
	type: string;
	name: string;
	category: string;
	description: string;
	relevanceScore: number;
}
```

### 6.3 get_workspace_state

```typescript
// 輸入
interface GetWorkspaceStateInput {
	includeBlocks?: boolean;
}

// 輸出
interface GetWorkspaceStateOutput {
	exists: boolean;
	board?: BoardType;
	theme?: string;
	statistics?: {
		topLevelBlocks: number;
		totalBlocks: number;
		uniqueBlockTypes: number;
	};
	blockTypes?: string[];
	blocks?: BlockDefinition[];
	lastModified?: string;
}
```

---

## 七、VS Code 設定

### 7.1 工作區設定

**檔案位置**: `{workspace}/.vscode/settings.json`

```typescript
interface WorkspaceSettings {
	/** PlatformIO 設定 */
	'platformio-ide.autoOpenPlatformIOIniFile'?: boolean;
	'platformio-ide.disablePIOHomeStartup'?: boolean;

	/** Singular Blockly 設定 */
	'singular-blockly.theme'?: 'light' | 'dark';
	'singular-blockly.autoBackupInterval'?: number;
	'singularBlockly.safetyGuard.suppressWarning'?: boolean;
}
```

---

## 八、狀態轉換圖

### 8.1 工作區生命週期

```
┌──────────┐
│  初始化   │
└────┬─────┘
     │ requestInitialState
     ▼
┌──────────────────────────────────┐
│           空白狀態               │
│  workspace: { blocks: [] }       │
│  board: 'none'                   │
└────┬───────────────┬─────────────┘
     │               │
     │ 載入 main.json │ 使用者選擇開發板
     ▼               ▼
┌──────────────────────────────────┐
│           編輯狀態               │
│  workspace: { blocks: [...] }    │
│  board: 'arduino_uno'            │
└────┬───────────────┬─────────────┘
     │               │
     │ 自動儲存      │ 手動備份
     │ (onChange)    │
     ▼               ▼
┌─────────────┐   ┌─────────────┐
│ main.json   │   │backup/*.json│
│ (持久化)    │   │ (備份)      │
└─────────────┘   └─────────────┘
```

### 8.2 程式碼生成流程

```
┌──────────────────┐
│ Blockly 工作區   │
│ 積木變更事件     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ generateCode()   │
│ ├── init()       │ ← 重置 Generator 狀態
│ ├── forBlock[]   │ ← 遍歷所有積木
│ └── finish()     │ ← 組合最終程式碼
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│           輸出                   │
│ ├── src/main.cpp (Arduino 程式碼) │
│ └── platformio.ini (函式庫依賴)   │
└──────────────────────────────────┘
```

---

## 九、資料驗證規則

### 9.1 積木 ID 格式

-   長度：21 字元
-   字元集：Base64 (`A-Z`, `a-z`, `0-9`, `_`, `-`)
-   生成方式：`Blockly.utils.idGenerator.genUid()`

### 9.2 變數名稱規則

```typescript
const variableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// 有效: myVar, _temp, count1
// 無效: 1var, my-var, 變數
```

### 9.3 函數名稱轉換

```typescript
// 中文函數名稱轉換為合法 C++ 識別符
function convertFunctionName(name: string): string {
	// 中文字轉為 Unicode 編碼
	// '馬達控制' → 'fn99ac_9054_63a7_5236'
}
```

---

_此文件定義 Singular Blockly 專案的完整資料模型。_
