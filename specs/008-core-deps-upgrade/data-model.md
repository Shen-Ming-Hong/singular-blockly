# Data Model: Blockly 12.x 核心依賴升級

**Feature**: Phase 1 核心依賴升級  
**Phase**: Design  
**Date**: 2025-01-21

## 概述

本文件定義 Blockly 11.2.2 → 12.3.1 和 @blockly/theme-modern 6.0.12 → 7.0.1 升級過程中涉及的核心實體及其關係。這些實體代表專案中的關鍵概念,確保升級過程中狀態管理的一致性和向後相容性。

---

## 實體定義

### 1. Blockly Package Entity

**用途**: 代表 Blockly 核心套件及其版本資訊、載入方式和初始化參數。

#### 屬性

| 屬性名稱          | 類型     | 描述                    | Blockly 11.2.2        | Blockly 12.3.1        |
| ----------------- | -------- | ----------------------- | --------------------- | --------------------- |
| `version`         | `string` | 套件版本號              | `"11.2.2"`            | `"12.3.1"`            |
| `packageName`     | `string` | npm 套件名稱            | `"blockly"`           | `"blockly"`           |
| `loadMethod`      | `enum`   | 載入方式                | `"UMD"`               | `"UMD"`               |
| `globalObject`    | `string` | 全域物件名稱            | `"Blockly"`           | `"Blockly"`           |
| `coreAPIs`        | `object` | 核心 API 端點           | 見下表                | 見下表                |
| `typeDefinitions` | `string` | TypeScript 型別定義路徑 | `"blockly/core.d.ts"` | `"blockly/core.d.ts"` |
| `bundleSize`      | `number` | 打包後大小 (bytes)      | ~130,000              | ~130,000-137,000      |

#### 核心 API 端點 (coreAPIs)

```typescript
interface BlocklyCoreAPIs {
	inject: {
		signature: '(container: string | Element, options: BlocklyOptions) => WorkspaceSvg';
		compatibility: '相容'; // 11.2.2 → 12.3.1
	};
	serialization: {
		workspaces: {
			save: '(workspace: WorkspaceSvg) => object';
			load: '(state: object, workspace: WorkspaceSvg) => void';
		};
		compatibility: '相容';
	};
	Events: {
		BLOCK_MOVE: '類別引用';
		BLOCK_CHANGE: '類別引用';
		BLOCK_CREATE: '類別引用';
		BLOCK_DELETE: '類別引用';
		FINISHED_LOADING: '類別引用';
		compatibility: '相容 (內部改進,外部 API 不變)';
	};
	Theme: {
		defineTheme: '(name: string, config: ThemeConfig) => Theme';
		compatibility: '相容';
	};
	Themes: {
		Modern: 'Theme'; // 預設主題
		compatibility: '相容';
	};
	Blocks: {
		registry: 'object'; // 積木定義註冊表
		compatibility: '相容';
	};
}
```

#### 初始化參數 (WorkspaceOptions)

```typescript
interface WorkspaceOptions {
	toolbox: ToolboxDefinition | string; // 工具箱配置
	theme: Theme; // 主題物件
	trashcan: boolean; // 垃圾桶
	move: {
		scrollbars: boolean;
		drag: boolean;
		wheel: boolean;
	};
	zoom: {
		controls: boolean;
		wheel: boolean;
		startScale: number;
		maxScale: number;
		minScale: number;
		scaleSpeed: number;
		pinch: boolean;
	};
	// Blockly 12 新增可選參數:
	plugins?: object; // 可註冊替換類別 (可選)
}
```

**變更說明**: Blockly 12.3.1 新增 `plugins` 配置選項,但為**可選參數**,現有初始化程式碼無需修改。

---

### 2. Theme Package Entity

**用途**: 代表 @blockly/theme-modern 主題套件及其配置結構。

#### 屬性

| 屬性名稱            | 類型      | 描述         | 6.0.12                    | 7.0.1                         |
| ------------------- | --------- | ------------ | ------------------------- | ----------------------------- |
| `version`           | `string`  | 套件版本號   | `"6.0.12"`                | `"7.0.1"`                     |
| `packageName`       | `string`  | npm 套件名稱 | `"@blockly/theme-modern"` | `"@blockly/theme-modern"`     |
| `baseTheme`         | `Theme`   | 基礎主題引用 | `Blockly.Themes.Modern`   | `Blockly.Themes.Modern`       |
| `visualEnhancement` | `string`  | 視覺改進描述 | `"標準邊框"`              | `"更深邊框 (darker borders)"` |
| `apiCompatibility`  | `boolean` | API 相容性   | -                         | `true` (與 6.x 完全相容)      |

#### 主題物件結構 (ThemeConfig)

```typescript
interface ThemeConfig {
	base?: Theme; // 基礎主題 (e.g., Blockly.Themes.Modern)
	componentStyles: {
		workspaceBackgroundColour: string;
		toolboxBackgroundColour: string;
		toolboxForegroundColour: string;
		flyoutBackgroundColour: string;
		flyoutForegroundColour: string;
		flyoutOpacity: number;
		scrollbarColour: string;
		insertionMarkerColour: string;
		insertionMarkerOpacity: number;
		scrollbarOpacity: number;
		cursorColour: string;
		selectedGlowColour: string;
		selectedGlowOpacity: number;
		replacementGradientHue: number;
	};
	blockStyles: {
		[blockType: string]: {
			colourPrimary: string;
			colourSecondary: string;
			colourTertiary: string;
		};
	};
	categoryStyles: {
		[categoryName: string]: {
			colour: string;
		};
	};
	fontStyle: {
		family: string;
		weight: string;
		size: number;
	};
	startHats: boolean;
}
```

**專案自訂主題**:

-   `singular` (淺色主題) - 定義於 `media/blockly/themes/singular.js`
-   `singularDark` (深色主題) - 定義於 `media/blockly/themes/singularDark.js`

**變更說明**: @blockly/theme-modern 7.0.1 僅改進視覺效果 (邊框更深),主題配置結構**完全相容** 6.0.12。

---

### 3. Workspace State Entity

**用途**: 代表 Blockly 工作區的序列化狀態,用於儲存和載入專案。

#### 屬性

| 屬性名稱    | 類型     | 描述                                           | 儲存位置                        |
| ----------- | -------- | ---------------------------------------------- | ------------------------------- |
| `workspace` | `object` | 工作區序列化資料 (blocks, variables, comments) | `{workspace}/blockly/main.json` |
| `board`     | `string` | 開發板類型                                     | 同上                            |
| `theme`     | `string` | 主題名稱 (`"light"` 或 `"dark"`)               | 同上                            |
| `version`   | `string` | Blockly 版本 (可選)                            | 同上                            |

#### 序列化格式 (JSON Schema)

```typescript
interface WorkspaceState {
	workspace: {
		blocks: {
			languageVersion: number; // Blockly 語言版本
			blocks: Array<BlockDefinition>;
		};
		variables?: Array<{
			name: string;
			id: string;
			type?: string;
		}>;
		comments?: Array<CommentDefinition>;
	};
	board: 'arduino_uno' | 'arduino_nano' | 'arduino_mega' | 'esp32' | 'super_mini';
	theme: 'light' | 'dark';
	version?: string; // 專案版本 (可選)
}
```

#### 向後相容性策略

**問題**: Blockly 12 是否能載入 Blockly 11 產生的 JSON 檔案?

**答案**: ✅ **是的**

**驗證依據**:

1. `Blockly.serialization.workspaces.load()` API 在 Blockly 12 中保持相同簽章
2. JSON 格式結構未改變 (blocks, variables, comments 欄位保持一致)
3. Blockly 12 官方測試套件包含向後相容性測試

**遷移邏輯**:

```javascript
// 載入現有工作區 (Blockly 11 或 12 產生)
try {
	const state = JSON.parse(workspaceFileContent);
	Blockly.serialization.workspaces.load(state.workspace, workspace);

	// 版本檢測 (可選)
	if (!state.version) {
		console.log('載入舊版工作區檔案 (Blockly 11.x)');
	}
} catch (error) {
	console.error('工作區載入失敗', error);
	// 錯誤處理
}
```

**儲存邏輯** (無變更):

```javascript
const state = {
	workspace: Blockly.serialization.workspaces.save(workspace),
	board: window.currentBoard,
	theme: currentTheme,
	version: '12.3.1', // 可選:記錄 Blockly 版本
};
fs.writeFileSync(workspaceFilePath, JSON.stringify(state, null, 2));
```

---

### 4. Board Configuration Entity

**用途**: 代表 Arduino 開發板配置與 Blockly 工作區的關聯。

#### 屬性

| 屬性名稱           | 類型       | 描述                | 範例值                           |
| ------------------ | ---------- | ------------------- | -------------------------------- |
| `boardId`          | `string`   | 開發板識別碼        | `"arduino_uno"`                  |
| `displayName`      | `string`   | 顯示名稱            | `"Arduino Uno"`                  |
| `platform`         | `string`   | PlatformIO 平台     | `"atmelavr"`                     |
| `board`            | `string`   | PlatformIO 板卡代碼 | `"uno"`                          |
| `framework`        | `string`   | 開發框架            | `"arduino"`                      |
| `availableBlocks`  | `string[]` | 可用積木類型        | `["arduino_*", "sensor_*", ...]` |
| `pinConfiguration` | `object`   | 腳位配置            | 見下方                           |

#### 腳位配置範例

```typescript
interface PinConfiguration {
	digitalPins: number[]; // 數位腳位 (e.g., [0, 1, 2, ..., 13])
	analogPins: string[]; // 類比腳位 (e.g., ["A0", "A1", ..., "A5"])
	pwmPins: number[]; // PWM 腳位 (e.g., [3, 5, 6, 9, 10, 11])
	serialPorts: number; // 串列埠數量
	i2cSupport: boolean; // I2C 支援
	spiSupport: boolean; // SPI 支援
}
```

#### 開發板配置來源

**定義位置**: `media/blockly/blocks/board_configs.js`

```javascript
window.BOARD_CONFIGS = {
	arduino_uno: {
		name: 'Arduino Uno',
		platform: 'atmelavr',
		board: 'uno',
		framework: 'arduino',
		pins: { digital: 14, analog: 6, pwm: [3, 5, 6, 9, 10, 11] },
	},
	esp32: {
		name: 'ESP32',
		platform: 'espressif32',
		board: 'esp32dev',
		framework: 'arduino',
		pins: { digital: 34, analog: 16, pwm: 'all_digital' },
	},
	// ... 其他板卡
};
```

#### 與 PlatformIO 整合

**platformio.ini 產生邏輯**:

```ini
[env:${boardId}]
platform = ${platform}
board = ${board}
framework = ${framework}
lib_deps =
    ${dynamicLibraries}  # 由 arduinoGenerator.lib_deps_ 產生
build_flags =
    ${dynamicFlags}      # 由 arduinoGenerator.build_flags_ 產生
```

**變更說明**: Blockly 升級**不影響**開發板配置系統,所有板卡定義保持不變。

---

## 實體關係圖

```
┌─────────────────────────┐
│  Blockly Package        │
│  (version: 12.3.1)      │
└───────────┬─────────────┘
            │ provides
            ↓
┌─────────────────────────┐         ┌──────────────────────┐
│  Workspace State        │ ←────── │  Board Configuration │
│  (main.json)            │ refs    │  (board_configs.js)  │
└───────────┬─────────────┘         └──────────────────────┘
            │ uses                           │
            ↓                                │ defines
┌─────────────────────────┐                 │
│  Theme Package          │                 │
│  (@blockly/theme-modern)│                 │
└───────────┬─────────────┘                 │
            │ provides                       │
            ↓                                ↓
┌─────────────────────────┐         ┌──────────────────────┐
│  Custom Themes          │         │  PlatformIO Config   │
│  (singular.js,          │         │  (platformio.ini)    │
│   singularDark.js)      │         │                      │
└─────────────────────────┘         └──────────────────────┘
```

**關係說明**:

1. **Blockly Package** 提供核心 API 供 **Workspace State** 序列化/反序列化
2. **Workspace State** 引用 **Board Configuration** 決定可用積木和腳位
3. **Workspace State** 使用 **Theme Package** 或 **Custom Themes** 設定外觀
4. **Board Configuration** 定義 **PlatformIO Config** 的產生規則
5. **Theme Package** 提供基礎主題供 **Custom Themes** 繼承

---

## 升級影響分析

### 實體層級影響

| 實體                | Blockly 11 → 12 影響 | 需要修改?               |
| ------------------- | -------------------- | ----------------------- |
| Blockly Package     | 版本號變更,API 相容  | ❌ 否 (僅 package.json) |
| Theme Package       | 版本號變更,視覺改進  | ❌ 否 (僅 package.json) |
| Workspace State     | JSON 格式不變        | ❌ 否 (向後相容)        |
| Board Configuration | 無影響               | ❌ 否                   |
| Custom Themes       | 主題結構不變         | ❌ 否                   |

### 資料流影響

**工作區載入流程** (無變更):

```
1. 讀取 main.json
2. 解析 JSON → WorkspaceState
3. 提取 workspace, board, theme
4. Blockly.serialization.workspaces.load(workspace, blocklyWorkspace)
5. 應用 board 配置
6. 應用 theme
```

**工作區儲存流程** (無變更):

```
1. Blockly.serialization.workspaces.save(blocklyWorkspace)
2. 組合 WorkspaceState { workspace, board, theme }
3. JSON.stringify(state, null, 2)
4. 寫入 main.json
```

---

## 測試策略

### 實體測試

#### 1. Blockly Package 測試

-   ✅ 驗證 `Blockly.inject()` 正常初始化
-   ✅ 驗證所有 API 端點可呼叫
-   ✅ 驗證 TypeScript 型別定義載入

#### 2. Theme Package 測試

-   ✅ 驗證 `Blockly.Themes.Modern` 可用
-   ✅ 驗證自訂主題繼承正常
-   ✅ 驗證主題切換功能

#### 3. Workspace State 測試

-   ✅ 載入 Blockly 11 產生的 main.json
-   ✅ 儲存並重新載入 Blockly 12 產生的 main.json
-   ✅ 驗證 board 和 theme 屬性保留

#### 4. Board Configuration 測試

-   ✅ 驗證 5 種板卡配置可正常選擇
-   ✅ 驗證 PlatformIO 設定產生正確

### 整合測試

```typescript
// 測試案例:向後相容性
test('Blockly 12 can load Blockly 11 workspace', async () => {
	const blockly11Json = fs.readFileSync('test/fixtures/blockly11-workspace.json');
	const state = JSON.parse(blockly11Json);

	const workspace = Blockly.inject('div', {
		/* config */
	});

	// 應該不拋出錯誤
	expect(() => {
		Blockly.serialization.workspaces.load(state.workspace, workspace);
	}).not.toThrow();

	// 積木數量應相同
	expect(workspace.getAllBlocks().length).toBe(expectedBlockCount);
});
```

---

## 附錄

### A. Blockly API 對照表

| API 類別                  | Blockly 11.2.2 | Blockly 12.3.1 | 相容性 |
| ------------------------- | -------------- | -------------- | ------ |
| `Blockly.inject()`        | ✅             | ✅             | 相容   |
| `Blockly.serialization.*` | ✅             | ✅             | 相容   |
| `Blockly.Events.*`        | ✅             | ✅             | 相容   |
| `Blockly.Theme.*`         | ✅             | ✅             | 相容   |
| `Blockly.Blocks[]`        | ✅             | ✅             | 相容   |
| `*Generator.forBlock[]`   | ✅             | ✅             | 相容   |

### B. 主題屬性對照表

| 屬性              | 6.0.12   | 7.0.1    | 變更 |
| ----------------- | -------- | -------- | ---- |
| `componentStyles` | ✅       | ✅       | 無   |
| `blockStyles`     | ✅       | ✅       | 無   |
| `categoryStyles`  | ✅       | ✅       | 無   |
| `fontStyle`       | ✅       | ✅       | 無   |
| 視覺效果          | 標準邊框 | 更深邊框 | 改善 |

---

**Data Model Status**: ✅ 完成  
**Last Updated**: 2025-01-21  
**Next Document**: quickstart.md (Phase 1 開發指南)
