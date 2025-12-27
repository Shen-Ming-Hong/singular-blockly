# 研究文件: 修正 HuskyLens 積木 RX/TX 標籤顯示

**Branch**: `020-fix-huskylens-rxtx` | **Date**: 2025-12-28

## 研究目標

1. 確認 HuskyLens UART 積木現有結構和欄位名稱
2. 確認各開發板的建議預設腳位
3. 確認 15 種語言的翻譯格式
4. 確認向後相容性要求

---

## 研究結果

### 1. HuskyLens UART 積木現有結構

**檔案位置**: `media/blockly/blocks/huskylens.js`

**現有積木定義**:

```javascript
Blockly.Blocks['huskylens_init_uart'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_INIT_UART', '初始化 HUSKYLENS (UART)'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_RX_PIN', 'RX 腳位'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'RX_PIN'
			);

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_TX_PIN', 'TX 腳位'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'TX_PIN'
			);
		// ...
	},
};
```

**關鍵發現**:

-   欄位名稱為 `RX_PIN` 和 `TX_PIN`（必須保持不變以確保向後相容）
-   使用 `window.getDigitalPinOptions()` 取得腳位選項
-   目前沒有設定預設腳位的邏輯
-   使用 `HUSKYLENS_RX_PIN` 和 `HUSKYLENS_TX_PIN` 訊息鍵

**Decision**: 保持欄位名稱不變，僅更新訊息鍵的翻譯內容  
**Rationale**: 欄位名稱用於序列化/反序列化，改變會破壞舊版 main.json 相容性  
**Alternatives considered**: 新增欄位名稱（rejected - 破壞相容性）

---

### 2. 開發板預設腳位配置

**檔案位置**: `media/blockly/blocks/board_configs.js`

**現有 HUSKYLENS_PIN_INFO**:

```javascript
const HUSKYLENS_PIN_INFO = {
    i2c: { ... },
    uart: {
        uno: null,      // AVR 使用 SoftwareSerial，任意數位腳位
        nano: null,
        mega: null,
        esp32: 'GPIO16(RX2)/GPIO17(TX2)',
        supermini: 'GPIO20(RX)/GPIO21(TX)',
    },
};
```

**各開發板腳位配置分析**:

| 開發板       | RX 腳位 | TX 腳位 | 原因                                      |
| ------------ | ------- | ------- | ----------------------------------------- |
| ESP32        | GPIO16  | GPIO17  | 使用 Serial2 (RX2/TX2) 的預設腳位         |
| Super Mini   | GPIO20  | GPIO21  | LOLIN C3 Mini 的建議 UART 腳位            |
| Arduino Uno  | D2      | D3      | 常用 SoftwareSerial 腳位（支援中斷）      |
| Arduino Nano | D2      | D3      | 同 Uno                                    |
| Arduino Mega | D2      | D3      | 雖有多個硬體 UART，但與 Uno/Nano 保持一致 |

**Decision**: 使用上表的預設腳位配置  
**Rationale**: ESP32/Super Mini 有明確的 UART 腳位建議，AVR 系列使用中斷腳位 D2/D3 是 SoftwareSerial 最佳實踐  
**Alternatives considered**: AVR 使用 D10/D11（rejected - D2/D3 更常見且支援中斷）

---

### 3. i18n 訊息格式

**現有訊息**:

-   `HUSKYLENS_RX_PIN`: 'RX 腳位' (zh-hant), 'RX Pin' (en)
-   `HUSKYLENS_TX_PIN`: 'TX 腳位' (zh-hant), 'TX Pin' (en)

**新訊息格式**:

| 訊息鍵             | 繁體中文              | 英文                        |
| ------------------ | --------------------- | --------------------------- |
| `HUSKYLENS_RX_PIN` | '連接 HuskyLens TX →' | 'Connect to HuskyLens TX →' |
| `HUSKYLENS_TX_PIN` | '連接 HuskyLens RX →' | 'Connect to HuskyLens RX →' |

**15 種語言翻譯**:

| 語言    | RX 標籤                        | TX 標籤                        |
| ------- | ------------------------------ | ------------------------------ |
| en      | Connect to HuskyLens TX →      | Connect to HuskyLens RX →      |
| zh-hant | 連接 HuskyLens TX →            | 連接 HuskyLens RX →            |
| ja      | HuskyLens TX に接続 →          | HuskyLens RX に接続 →          |
| ko      | HuskyLens TX에 연결 →          | HuskyLens RX에 연결 →          |
| de      | Mit HuskyLens TX verbinden →   | Mit HuskyLens RX verbinden →   |
| fr      | Connecter à HuskyLens TX →     | Connecter à HuskyLens RX →     |
| es      | Conectar a HuskyLens TX →      | Conectar a HuskyLens RX →      |
| pt-br   | Conectar ao HuskyLens TX →     | Conectar ao HuskyLens RX →     |
| it      | Connetti a HuskyLens TX →      | Connetti a HuskyLens RX →      |
| ru      | Подключить к HuskyLens TX →    | Подключить к HuskyLens RX →    |
| pl      | Połącz z HuskyLens TX →        | Połącz z HuskyLens RX →        |
| hu      | Csatlakozás HuskyLens TX-hez → | Csatlakozás HuskyLens RX-hez → |
| tr      | HuskyLens TX'e bağlan →        | HuskyLens RX'e bağlan →        |
| bg      | Свържи с HuskyLens TX →        | Свържи с HuskyLens RX →        |
| cs      | Připojit k HuskyLens TX →      | Připojit k HuskyLens RX →      |

**Decision**: 使用「連接 HuskyLens TX/RX →」格式，含箭頭符號  
**Rationale**: 使用者確認此格式，箭頭增加視覺引導效果  
**Alternatives considered**: 「Arduino RX → HuskyLens TX」（rejected - 過長）

---

### 4. 向後相容性分析

**Blockly 序列化機制**:

-   Blockly 使用 `Blockly.serialization.workspaces.save/load()` 序列化/反序列化
-   欄位值透過欄位名稱（如 `RX_PIN`）儲存和還原
-   欄位名稱改變會導致舊值無法還原

**測試案例**:

```json
// 舊版 main.json 中的 HuskyLens UART 積木
{
	"type": "huskylens_init_uart",
	"fields": {
		"RX_PIN": "10",
		"TX_PIN": "11"
	}
}
```

**相容性保證**:

-   欄位名稱 `RX_PIN` 和 `TX_PIN` 保持不變
-   標籤文字改變不影響序列化
-   預設值改變僅影響新建積木，不影響已儲存的積木

**Decision**: 僅修改訊息內容和預設值邏輯，不改變欄位名稱  
**Rationale**: 確保 100% 向後相容  
**Alternatives considered**: 無

---

### 5. 預設腳位實作方式

**Blockly FieldDropdown API 研究**:

```javascript
// 方法 1: 使用 validator 設定預設值（推薦）
new Blockly.FieldDropdown(function() {
    return window.getDigitalPinOptions();
}, function(newValue) {
    // validator 可用於驗證但不適合設定預設值
    return newValue;
});

// 方法 2: 在 init 後使用 setFieldValue（推薦）
this.appendDummyInput()
    .appendField(...)
    .appendField(new Blockly.FieldDropdown(...), 'RX_PIN');
// 設定預設值
const defaultRx = getDefaultRxPin();
this.setFieldValue(defaultRx, 'RX_PIN');
```

**Decision**: 在積木 `init()` 結束前使用 `setFieldValue()` 設定預設腳位  
**Rationale**: 最簡潔且不改變現有 API 呼叫模式  
**Alternatives considered**: 修改 `getDigitalPinOptions()` 返回排序後的陣列（rejected - 影響其他積木）

---

## 實作決策摘要

| 決策項目            | 選擇                       | 原因                    |
| ------------------- | -------------------------- | ----------------------- |
| 欄位名稱            | 保持 `RX_PIN`/`TX_PIN`     | 向後相容性              |
| 訊息格式            | 「連接 HuskyLens TX/RX →」 | 使用者確認，直觀明確    |
| ESP32 預設腳位      | GPIO16/GPIO17              | Serial2 預設腳位        |
| Super Mini 預設腳位 | GPIO20/GPIO21              | 官方建議 UART 腳位      |
| AVR 預設腳位        | D2/D3                      | SoftwareSerial 最佳實踐 |
| 預設值設定方式      | `setFieldValue()`          | 簡潔且不影響其他積木    |

---

## 風險評估

| 風險                     | 影響 | 機率 | 緩解措施                       |
| ------------------------ | ---- | ---- | ------------------------------ |
| 預設腳位在某開發板不存在 | 中   | 低   | 實作 fallback 到第一個可用腳位 |
| 翻譯品質問題             | 低   | 中   | 使用 i18n 驗證腳本檢查         |
| 舊版 main.json 載入失敗  | 高   | 極低 | 保持欄位名稱不變               |
