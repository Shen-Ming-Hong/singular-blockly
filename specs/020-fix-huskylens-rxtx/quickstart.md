# 快速入門指南: 修正 HuskyLens 積木 RX/TX 標籤顯示

**Branch**: `020-fix-huskylens-rxtx` | **Date**: 2025-12-28

## 功能概述

本功能修正 HuskyLens UART 初始化積木的 RX/TX 標籤顯示，將標籤從「RX 腳位」「TX 腳位」改為「連接 HuskyLens TX →」「連接 HuskyLens RX →」格式，使使用者能直觀理解 Arduino 腳位應連接到 HuskyLens 的哪個腳位。同時根據不同開發板設定智慧預設腳位。

## 修改檔案清單

### 必須修改的檔案

1. **積木定義** (`media/blockly/blocks/huskylens.js`)
   - 新增預設腳位配置常數
   - 新增取得預設腳位的輔助函式
   - 在 `huskylens_init_uart` 積木 `init()` 中設定預設腳位

2. **語言檔案** (15 個檔案)
   - `media/locales/en/messages.js` - 英語
   - `media/locales/zh-hant/messages.js` - 繁體中文
   - `media/locales/ja/messages.js` - 日語
   - `media/locales/ko/messages.js` - 韓語
   - `media/locales/de/messages.js` - 德語
   - `media/locales/fr/messages.js` - 法語
   - `media/locales/es/messages.js` - 西班牙語
   - `media/locales/pt-br/messages.js` - 巴西葡萄牙語
   - `media/locales/it/messages.js` - 義大利語
   - `media/locales/ru/messages.js` - 俄語
   - `media/locales/pl/messages.js` - 波蘭語
   - `media/locales/hu/messages.js` - 匈牙利語
   - `media/locales/tr/messages.js` - 土耳其語
   - `media/locales/bg/messages.js` - 保加利亞語
   - `media/locales/cs/messages.js` - 捷克語

## 實作步驟

### 步驟 1: 修改 huskylens.js

在 `media/blockly/blocks/huskylens.js` 中：

1. **新增預設腳位配置常數**（在 `HUSKYLENS_PIN_INFO` 之後）:
   ```javascript
   const HUSKYLENS_UART_DEFAULTS = {
       esp32: { rx: '16', tx: '17' },
       supermini: { rx: '20', tx: '21' },
       uno: { rx: '2', tx: '3' },
       nano: { rx: '2', tx: '3' },
       mega: { rx: '2', tx: '3' },
   };
   ```

2. **新增輔助函式**:
   ```javascript
   function getHuskyLensUARTDefaults() {
       const board = window.currentBoard || 'uno';
       return HUSKYLENS_UART_DEFAULTS[board] || HUSKYLENS_UART_DEFAULTS.uno;
   }
   ```

3. **修改 `huskylens_init_uart` 積木**:
   - 在 `init()` 結束前加入預設腳位設定邏輯

### 步驟 2: 更新語言檔案

修改 `HUSKYLENS_RX_PIN` 和 `HUSKYLENS_TX_PIN` 的值：

| 語言 | HUSKYLENS_RX_PIN | HUSKYLENS_TX_PIN |
|------|------------------|------------------|
| en | `'Connect to HuskyLens TX →'` | `'Connect to HuskyLens RX →'` |
| zh-hant | `'連接 HuskyLens TX →'` | `'連接 HuskyLens RX →'` |
| ja | `'HuskyLens TX に接続 →'` | `'HuskyLens RX に接続 →'` |
| ko | `'HuskyLens TX에 연결 →'` | `'HuskyLens RX에 연결 →'` |
| de | `'Mit HuskyLens TX verbinden →'` | `'Mit HuskyLens RX verbinden →'` |
| fr | `'Connecter à HuskyLens TX →'` | `'Connecter à HuskyLens RX →'` |
| es | `'Conectar a HuskyLens TX →'` | `'Conectar a HuskyLens RX →'` |
| pt-br | `'Conectar ao HuskyLens TX →'` | `'Conectar ao HuskyLens RX →'` |
| it | `'Connetti a HuskyLens TX →'` | `'Connetti a HuskyLens RX →'` |
| ru | `'Подключить к HuskyLens TX →'` | `'Подключить к HuskyLens RX →'` |
| pl | `'Połącz z HuskyLens TX →'` | `'Połącz z HuskyLens RX →'` |
| hu | `'Csatlakozás HuskyLens TX-hez →'` | `'Csatlakozás HuskyLens RX-hez →'` |
| tr | `'HuskyLens TX\'e bağlan →'` | `'HuskyLens RX\'e bağlan →'` |
| bg | `'Свържи с HuskyLens TX →'` | `'Свържи с HuskyLens RX →'` |
| cs | `'Připojit k HuskyLens TX →'` | `'Připojit k HuskyLens RX →'` |

## 測試指南

### 驗證步驟

1. **標籤顯示測試**:
   - 開啟 Blockly 編輯器
   - 從工具箱拖曳 HuskyLens UART 初始化積木
   - 確認標籤顯示「連接 HuskyLens TX →」和「連接 HuskyLens RX →」

2. **預設腳位測試**:
   - 切換到 ESP32 開發板，新增 HuskyLens UART 積木
   - 確認 RX 預設為 GPIO16，TX 預設為 GPIO17
   - 切換到 Arduino Uno，新增 HuskyLens UART 積木
   - 確認 RX 預設為 D2，TX 預設為 D3

3. **向後相容性測試**:
   - 載入包含舊版 HuskyLens UART 積木的 main.json
   - 確認腳位設定正確還原（不受預設值影響）

4. **i18n 驗證**:
   ```bash
   npm run validate:i18n
   ```
   確認 HuskyLens 相關訊息通過驗證

### 手動測試檢查清單

- [ ] 英文標籤顯示正確
- [ ] 繁體中文標籤顯示正確
- [ ] ESP32 預設腳位正確 (GPIO16/GPIO17)
- [ ] Super Mini 預設腳位正確 (GPIO20/GPIO21)
- [ ] Arduino Uno/Nano/Mega 預設腳位正確 (D2/D3)
- [ ] 舊版 main.json 載入正常
- [ ] 切換開發板後，已存在的積木腳位不變
- [ ] i18n 驗證腳本通過

## 注意事項

1. **欄位名稱不可更改**: `RX_PIN` 和 `TX_PIN` 欄位名稱必須保持不變，否則會破壞舊版 main.json 的相容性。

2. **預設值僅影響新積木**: 修改預設腳位邏輯不會影響已儲存在 main.json 中的積木。

3. **翻譯品質**: 箭頭符號 `→` 在所有語言中保持一致，不需翻譯。

4. **土耳其語跳脫字元**: 土耳其語的 `TX'e` 和 `RX'e` 中的單引號需要跳脫為 `\'`。
