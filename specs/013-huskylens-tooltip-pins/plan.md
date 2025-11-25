# 實作計畫：HuskyLens 動態腳位提示與工具箱間距修復

**分支**: `013-huskylens-tooltip-pins` | **日期**: 2025-11-25 | **規格**: [spec.md](./spec.md)
**輸入**: 功能規格來自 `/specs/013-huskylens-tooltip-pins/spec.md`

## 摘要

為 HuskyLens I2C/UART 初始化區塊新增動態 tooltip 腳位提示，根據選擇的開發板（Arduino Uno/Nano/Mega、ESP32、ESP32-C3 Super Mini）顯示對應的接線建議。同時修復 vision-sensors 工具箱類別的視覺間距不一致問題（移除多餘的 `sep` 分隔符）。

## 技術脈絡

**語言/版本**: JavaScript (ES6+) 用於 Blockly 區塊定義；TypeScript 5.x 用於 VSCode Extension  
**主要相依**: Blockly 12.3.1、@blockly/theme-modern 7.0.1  
**儲存**: JSON (工具箱設定)、JavaScript (i18n 訊息檔)  
**測試**: 手動測試（WebView 互動功能依 Constitution Principle VII UI 測試例外）  
**目標平台**: VSCode 1.105.0+ WebView 環境  
**專案類型**: VSCode Extension（現有架構）  
**效能目標**: 編輯器載入時間增加 ≤50ms (SC-005)  
**約束**: 必須支援 15 種現有語言的國際化  
**規模/範圍**: 修改 2 個區塊定義、1 個工具箱 JSON、15 個 i18n 訊息檔

## Constitution 檢核

_關卡：必須在 Phase 0 研究前通過。Phase 1 設計後需重新檢核。_

| 原則                   | 狀態    | 說明                                   |
| ---------------------- | ------- | -------------------------------------- |
| I. 簡潔性與可維護性    | ✅ 通過 | 使用函數型 tooltip 是 Blockly 標準模式 |
| II. 模組化與擴展性     | ✅ 通過 | 腳位資訊獨立函數，便於未來新增開發板   |
| III. 避免過度開發      | ✅ 通過 | 僅實作規格中定義的需求                 |
| IV. 彈性與適應性       | ✅ 通過 | 使用資料驅動方式（腳位對應表）         |
| V. 研究驅動開發        | ✅ 通過 | Blockly API 與腳位資訊已透過網路查證   |
| VI. 結構化日誌         | N/A     | WebView 環境使用 console.log           |
| VII. 測試涵蓋率        | ✅ 通過 | WebView UI 測試例外適用                |
| VIII. 純函數與模組架構 | ✅ 通過 | 腳位資訊函數為純函數                   |
| IX. 繁體中文文件標準   | ✅ 通過 | 所有文件以繁體中文撰寫                 |
| X. 專業發布管理        | N/A     | 此為功能開發，非發布流程               |

## 專案結構

### 文件（此功能）

```text
specs/013-huskylens-tooltip-pins/
├── plan.md              # 本檔案
├── research.md          # Phase 0 輸出（已完成 - API 與腳位資訊查證）
├── quickstart.md        # Phase 1 輸出
└── tasks.md             # Phase 2 輸出（/speckit.tasks 命令產生）
```

### 原始碼（需修改的檔案）

```text
media/
├── blockly/blocks/
│   └── huskylens.js           # 修改 huskylens_init_i2c 與 huskylens_init_uart 區塊
├── toolbox/categories/
│   └── vision-sensors.json    # 移除多餘的 sep 分隔符
└── locales/
    ├── en/messages.js         # 新增 HUSKYLENS_I2C_PIN_HINT 等鍵值
    ├── zh-hant/messages.js
    ├── ja/messages.js
    ├── ko/messages.js
    ├── de/messages.js
    ├── fr/messages.js
    ├── es/messages.js
    ├── it/messages.js
    ├── pt-br/messages.js
    ├── ru/messages.js
    ├── pl/messages.js
    ├── tr/messages.js
    ├── hu/messages.js
    ├── bg/messages.js
    └── cs/messages.js
```

**結構決策**: 使用現有專案架構，不新增檔案或目錄。所有修改都在既有檔案內進行。

## 複雜度追蹤

> 無 Constitution Check 違規需要說明

---

## Phase 0：研究（已完成）

### 研究發現摘要

1. **Blockly setTooltip() API**

    - 確認 Blockly 12.3.1 支援函數型參數：`this.setTooltip(() => string)`
    - 函數會在每次滑鼠懸停時執行，支援動態內容
    - 來源：Google Blockly 官方 API 文件

2. **開發板腳位資訊**（已網路查證）

    - Arduino Uno/Nano: I2C → A4(SDA)/A5(SCL)、UART → 任意數位腳位
    - Arduino Mega: I2C → D20(SDA)/D21(SCL)、UART → 任意數位腳位
    - ESP32: I2C → GPIO21(SDA)/GPIO22(SCL)、UART2 → GPIO16(RX2)/GPIO17(TX2)
    - ESP32-C3 Super Mini: I2C → GPIO8(SDA)/GPIO9(SCL)、UART → GPIO20(RX)/GPIO21(TX)

3. **工具箱間距問題**

    - vision-sensors.json 是唯一使用 `sep` 分隔符的類別
    - 其他類別（arduino, sensors, motors 等）均不使用分隔符
    - 需移除第 19、115、142 行的 sep，保留第 96 行（Pixetto 與 HuskyLens 群組間）

4. **現有 i18n 架構**
    - 使用 `window.languageManager.getMessage(key, fallback)` 取得訊息
    - 已有 HUSKYLENS_INIT_I2C_TOOLTIP 等鍵值在 15 個語言檔中

---

## Phase 1：設計

### 資料模型

#### 腳位對應表 (PIN_INFO_MAP)

```javascript
const PIN_INFO_MAP = {
	i2c: {
		uno: 'A4(SDA)/A5(SCL)',
		nano: 'A4(SDA)/A5(SCL)',
		mega: 'D20(SDA)/D21(SCL)',
		esp32: 'GPIO21(SDA)/GPIO22(SCL)',
		supermini: 'GPIO8(SDA)/GPIO9(SCL)',
	},
	uart: {
		uno: null, // 任意數位腳位
		nano: null, // 任意數位腳位
		mega: null, // 任意數位腳位
		esp32: 'GPIO16(RX2)/GPIO17(TX2)',
		supermini: 'GPIO20(RX)/GPIO21(TX)',
	},
};
```

#### 新增 i18n 訊息鍵

| 鍵名                         | 用途              |
| ---------------------------- | ----------------- |
| `HUSKYLENS_I2C_PIN_HINT`     | I2C 接線提示標籤  |
| `HUSKYLENS_UART_PIN_HINT`    | UART 接線提示標籤 |
| `HUSKYLENS_UART_ANY_DIGITAL` | 任意數位腳位提示  |

### 實作設計

#### 1. 動態 Tooltip 函數

在 `huskylens.js` 中新增輔助函數：

```javascript
/**
 * 取得目前開發板的 I2C 腳位資訊
 * @returns {string} 腳位描述
 */
function getI2CPinInfo() {
	const board = window.currentBoard || 'uno';
	const pins = PIN_INFO_MAP.i2c[board] || PIN_INFO_MAP.i2c.uno;
	return pins;
}

/**
 * 取得目前開發板的 UART 腳位建議
 * @returns {string} 腳位描述或任意數位腳位提示
 */
function getUARTPinInfo() {
	const board = window.currentBoard || 'uno';
	const pins = PIN_INFO_MAP.uart[board];
	if (pins) {
		return window.languageManager.getMessage('HUSKYLENS_UART_PIN_HINT', 'Wiring hint: ') + pins;
	}
	return window.languageManager.getMessage('HUSKYLENS_UART_ANY_DIGITAL', 'Wiring hint: Any digital pin');
}
```

#### 2. 區塊 Tooltip 修改

將 `setTooltip(string)` 改為 `setTooltip(() => string)`：

```javascript
// huskylens_init_i2c
this.setTooltip(() => {
	const baseMsg = window.languageManager.getMessage('HUSKYLENS_INIT_I2C_TOOLTIP', 'Initialize HUSKYLENS smart camera using I2C');
	const pinHint = window.languageManager.getMessage('HUSKYLENS_I2C_PIN_HINT', 'Wiring hint: ');
	const pinInfo = getI2CPinInfo();
	return baseMsg + '\n' + pinHint + pinInfo;
});
```

#### 3. 工具箱 JSON 修改

移除 vision-sensors.json 中多餘的 sep：

-   第 19 行（pixetto_set_mode 後）→ 移除
-   第 96 行（HUSKYLENS_LABEL 前）→ **保留**（群組分隔）
-   第 115 行（huskylens_set_algorithm 後）→ 移除
-   第 142 行（huskylens_get_arrow_info 後）→ 移除

---

## Quickstart（開發者快速上手）

### 前置條件

-   Node.js 22.16.0+
-   VSCode 1.105.0+
-   已複製專案並安裝相依套件

### 開發流程

1. **切換到功能分支**

    ```bash
    git checkout 013-huskylens-tooltip-pins
    ```

2. **啟動開發模式**

    ```bash
    npm run watch
    ```

3. **修改檔案順序**

    - 先修改 `vision-sensors.json`（最簡單）
    - 再修改 `huskylens.js`（核心功能）
    - 最後更新 15 個 `messages.js`（i18n）

4. **測試方式**
    - F5 啟動 Extension Development Host
    - 開啟 Blockly 編輯器
    - 測試不同開發板的 tooltip 顯示
    - 測試語言切換後的顯示

### 驗收檢查清單

-   [ ] Arduino Uno 顯示 A4(SDA)/A5(SCL)
-   [ ] Arduino Mega 顯示 D20(SDA)/D21(SCL)
-   [ ] ESP32 顯示 GPIO21(SDA)/GPIO22(SCL)
-   [ ] ESP32-C3 Super Mini 顯示 GPIO8(SDA)/GPIO9(SCL)
-   [ ] UART 區塊 ESP32 顯示 GPIO16(RX2)/GPIO17(TX2)
-   [ ] UART 區塊 AVR 顯示「任意數位腳位」
-   [ ] 切換開發板後 tooltip 自動更新
-   [ ] 切換語言後 tooltip 語言正確
-   [ ] vision-sensors 工具箱間距與其他類別一致
