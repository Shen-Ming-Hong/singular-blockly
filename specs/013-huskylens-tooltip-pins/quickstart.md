# 快速上手指南：HuskyLens 動態腳位提示與工具箱間距修復

**功能分支**: `013-huskylens-tooltip-pins`  
**建立日期**: 2025-11-25  
**適用對象**: 開發者、貢獻者

---

## 功能概述

此功能為 HuskyLens I2C/UART 初始化區塊新增動態腳位提示，根據使用者選擇的開發板顯示對應的接線資訊。同時修復 vision-sensors 工具箱的間距問題。

### 主要變更

1. **huskylens_init_i2c** 區塊 tooltip 新增 I2C 腳位提示
2. **huskylens_init_uart** 區塊 tooltip 新增 UART 腳位建議
3. **vision-sensors.json** 移除多餘的分隔符
4. **15 個 messages.js** 新增 i18n 訊息鍵

---

## 開發環境設置

### 前置條件

-   Node.js 22.16.0+
-   npm 10.x+
-   VSCode 1.105.0+
-   Git

### 設置步驟

```bash
# 1. 複製專案（若尚未複製）
git clone https://github.com/Shen-Ming-Hong/singular-blockly.git
cd singular-blockly

# 2. 安裝相依套件
npm install

# 3. 切換到功能分支
git checkout 013-huskylens-tooltip-pins

# 4. 啟動開發模式
npm run watch
```

---

## 檔案修改指南

### 1. 修改工具箱 JSON（最簡單）

**檔案**: `media/toolbox/categories/vision-sensors.json`

需移除的 sep 位置：

```json
// 移除第 19 行附近的 sep
{
    "kind": "block",
    "type": "pixetto_set_mode"
},
// ❌ 移除這個 sep
// {
//     "kind": "sep"
// },
{
    "kind": "block",
    "type": "pixetto_is_detected"
},
```

```json
// 保留第 96 行附近的 sep（Pixetto 與 HuskyLens 群組分隔）
{
    "kind": "sep"  // ✅ 保留
},
{
    "kind": "label",
    "text": "%{HUSKYLENS_LABEL}"
},
```

### 2. 修改區塊定義（核心功能）

**檔案**: `media/blockly/blocks/huskylens.js`

#### 新增腳位對應表

在檔案頂部（版權聲明之後）新增：

```javascript
/**
 * 開發板腳位對應表
 */
const HUSKYLENS_PIN_INFO = {
	i2c: {
		uno: 'A4(SDA)/A5(SCL)',
		nano: 'A4(SDA)/A5(SCL)',
		mega: 'D20(SDA)/D21(SCL)',
		esp32: 'GPIO21(SDA)/GPIO22(SCL)',
		supermini: 'GPIO8(SDA)/GPIO9(SCL)',
	},
	uart: {
		uno: null,
		nano: null,
		mega: null,
		esp32: 'GPIO16(RX2)/GPIO17(TX2)',
		supermini: 'GPIO20(RX)/GPIO21(TX)',
	},
};

/**
 * 取得目前開發板的 I2C 腳位資訊
 * @returns {string} 腳位描述
 */
function getHuskyLensI2CPinInfo() {
	const board = window.currentBoard || 'uno';
	return HUSKYLENS_PIN_INFO.i2c[board] || HUSKYLENS_PIN_INFO.i2c.uno;
}

/**
 * 取得目前開發板的 UART 腳位建議
 * @returns {string} 腳位描述
 */
function getHuskyLensUARTPinInfo() {
	const board = window.currentBoard || 'uno';
	const pins = HUSKYLENS_PIN_INFO.uart[board];
	if (pins) {
		return pins;
	}
	return window.languageManager.getMessage('HUSKYLENS_UART_ANY_DIGITAL', 'Any digital pin');
}
```

#### 修改 huskylens_init_i2c 區塊

找到現有的 `setTooltip()` 呼叫並替換：

```javascript
// 原本（靜態 tooltip）
this.setTooltip(window.languageManager.getMessage('HUSKYLENS_INIT_I2C_TOOLTIP', '使用 I2C 初始化 HUSKYLENS 智慧鏡頭'));

// 修改為（動態 tooltip）
this.setTooltip(() => {
	const baseMsg = window.languageManager.getMessage('HUSKYLENS_INIT_I2C_TOOLTIP', 'Initialize HUSKYLENS smart camera using I2C');
	const pinHint = window.languageManager.getMessage('HUSKYLENS_I2C_PIN_HINT', 'Wiring: ');
	return baseMsg + '\n' + pinHint + getHuskyLensI2CPinInfo();
});
```

#### 修改 huskylens_init_uart 區塊

```javascript
// 修改為（動態 tooltip）
this.setTooltip(() => {
	const baseMsg = window.languageManager.getMessage('HUSKYLENS_INIT_UART_TOOLTIP', 'Initialize HUSKYLENS smart camera using UART');
	const pinHint = window.languageManager.getMessage('HUSKYLENS_UART_PIN_HINT', 'Recommended pins: ');
	return baseMsg + '\n' + pinHint + getHuskyLensUARTPinInfo();
});
```

### 3. 更新 i18n 訊息檔

需在 15 個語言檔案中新增以下訊息鍵。

**範例：`media/locales/en/messages.js`**

找到 HUSKYLENS 相關區段，新增：

```javascript
// HuskyLens Pin Hints
HUSKYLENS_I2C_PIN_HINT: 'Wiring: ',
HUSKYLENS_UART_PIN_HINT: 'Recommended pins: ',
HUSKYLENS_UART_ANY_DIGITAL: 'Any digital pin',
```

**範例：`media/locales/zh-hant/messages.js`**

```javascript
// HuskyLens 腳位提示
HUSKYLENS_I2C_PIN_HINT: '接線：',
HUSKYLENS_UART_PIN_HINT: '建議腳位：',
HUSKYLENS_UART_ANY_DIGITAL: '任意數位腳位',
```

#### 15 個語言檔案列表

| 語言           | 檔案路徑                            |
| -------------- | ----------------------------------- |
| English        | `media/locales/en/messages.js`      |
| 繁體中文       | `media/locales/zh-hant/messages.js` |
| 日本語         | `media/locales/ja/messages.js`      |
| 한국어         | `media/locales/ko/messages.js`      |
| Deutsch        | `media/locales/de/messages.js`      |
| Français       | `media/locales/fr/messages.js`      |
| Español        | `media/locales/es/messages.js`      |
| Italiano       | `media/locales/it/messages.js`      |
| Português (BR) | `media/locales/pt-br/messages.js`   |
| Русский        | `media/locales/ru/messages.js`      |
| Polski         | `media/locales/pl/messages.js`      |
| Türkçe         | `media/locales/tr/messages.js`      |
| Magyar         | `media/locales/hu/messages.js`      |
| Български      | `media/locales/bg/messages.js`      |
| Čeština        | `media/locales/cs/messages.js`      |

---

## 測試方式

### 手動測試步驟

1. **啟動 Extension Development Host**

    - 在 VSCode 中按 F5
    - 選擇 "Run Extension"

2. **開啟 Blockly 編輯器**

    - 在活動欄點擊 Singular Blockly 圖示
    - 開啟或建立新專案

3. **測試 I2C Tooltip**

    - 從 Vision Sensors 類別拖入 "初始化 HUSKYLENS (I2C)" 區塊
    - 滑鼠懸停在區塊上，確認 tooltip 顯示腳位資訊
    - 切換不同開發板，重新懸停確認腳位資訊更新

4. **測試 UART Tooltip**

    - 拖入 "初始化 HUSKYLENS (UART)" 區塊
    - 確認 ESP32 顯示 GPIO16/17
    - 確認 AVR 板顯示「任意數位腳位」

5. **測試工具箱間距**

    - 開啟 Vision Sensors 類別
    - 與其他類別（如 Arduino、感測器）比較間距
    - 確認只有 Pixetto 與 HuskyLens 群組之間有明顯分隔

6. **測試多語言**
    - 切換 VSCode 語言設定
    - 確認 tooltip 語言隨之變更

### 驗收檢查清單

-   [ ] Arduino Uno 顯示 A4(SDA)/A5(SCL)
-   [ ] Arduino Nano 顯示 A4(SDA)/A5(SCL)
-   [ ] Arduino Mega 顯示 D20(SDA)/D21(SCL)
-   [ ] ESP32 顯示 GPIO21(SDA)/GPIO22(SCL)
-   [ ] ESP32-C3 Super Mini 顯示 GPIO8(SDA)/GPIO9(SCL)
-   [ ] UART 區塊 ESP32 顯示 GPIO16(RX2)/GPIO17(TX2)
-   [ ] UART 區塊 AVR 顯示「任意數位腳位」（或對應語言）
-   [ ] 切換開發板後 tooltip 自動更新
-   [ ] 繁體中文介面顯示中文提示
-   [ ] 英文介面顯示英文提示
-   [ ] vision-sensors 工具箱間距與其他類別一致

---

## 常見問題

### Q: tooltip 沒有更新？

確認 `setTooltip()` 使用的是函數而非字串：

```javascript
// ✅ 正確 - 動態
this.setTooltip(() => { ... });

// ❌ 錯誤 - 靜態
this.setTooltip('...');
```

### Q: window.currentBoard 是什麼？

這是 Singular Blockly 用於追蹤目前選擇開發板的全域變數。可能的值：

-   `'uno'` - Arduino Uno
-   `'nano'` - Arduino Nano
-   `'mega'` - Arduino Mega
-   `'esp32'` - ESP32 DevKit
-   `'supermini'` - ESP32-C3 Super Mini

### Q: i18n 訊息沒有顯示？

檢查 `window.languageManager.getMessage()` 的 fallback 參數是否正確設定。

---

## 相關文件

-   [功能規格](./spec.md)
-   [實作計畫](./plan.md)
-   [研究報告](./research.md)
-   [專案 Constitution](./../../../.specify/memory/constitution.md)
