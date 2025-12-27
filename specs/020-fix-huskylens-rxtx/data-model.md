# 資料模型: 修正 HuskyLens 積木 RX/TX 標籤顯示

**Branch**: `020-fix-huskylens-rxtx` | **Date**: 2025-12-28

## 實體定義

### 1. HuskyLens UART 積木 (huskylens_init_uart)

**用途**: 初始化 HuskyLens 智慧鏡頭的 UART 通訊

**欄位結構**:

| 欄位名稱 | 類型 | 說明 | 預設值 |
|----------|------|------|--------|
| `RX_PIN` | Dropdown | Arduino 接收腳位（連接 HuskyLens TX） | 依開發板動態設定 |
| `TX_PIN` | Dropdown | Arduino 發送腳位（連接 HuskyLens RX） | 依開發板動態設定 |

**預設腳位對照表**:

| 開發板 | `RX_PIN` 預設值 | `TX_PIN` 預設值 |
|--------|----------------|----------------|
| `esp32` | `"16"` | `"17"` |
| `supermini` | `"20"` | `"21"` |
| `uno` | `"2"` | `"3"` |
| `nano` | `"2"` | `"3"` |
| `mega` | `"2"` | `"3"` |

**驗證規則**:
- 欄位值必須在 `window.getDigitalPinOptions()` 返回的有效腳位列表中
- 若預設值不在有效列表中，fallback 到第一個可用腳位

---

### 2. i18n 訊息 (Messages)

**用途**: 多語言標籤文字

**訊息鍵對照表**:

| 訊息鍵 | 用途 | 舊值範例 | 新值範例 |
|--------|------|----------|----------|
| `HUSKYLENS_RX_PIN` | RX 腳位標籤 | `'RX 腳位'` | `'連接 HuskyLens TX →'` |
| `HUSKYLENS_TX_PIN` | TX 腳位標籤 | `'TX 腳位'` | `'連接 HuskyLens RX →'` |

**多語言翻譯**:

```javascript
// 英語 (en)
{
    HUSKYLENS_RX_PIN: 'Connect to HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Connect to HuskyLens RX →',
}

// 繁體中文 (zh-hant)
{
    HUSKYLENS_RX_PIN: '連接 HuskyLens TX →',
    HUSKYLENS_TX_PIN: '連接 HuskyLens RX →',
}

// 日語 (ja)
{
    HUSKYLENS_RX_PIN: 'HuskyLens TX に接続 →',
    HUSKYLENS_TX_PIN: 'HuskyLens RX に接続 →',
}

// 韓語 (ko)
{
    HUSKYLENS_RX_PIN: 'HuskyLens TX에 연결 →',
    HUSKYLENS_TX_PIN: 'HuskyLens RX에 연결 →',
}

// 德語 (de)
{
    HUSKYLENS_RX_PIN: 'Mit HuskyLens TX verbinden →',
    HUSKYLENS_TX_PIN: 'Mit HuskyLens RX verbinden →',
}

// 法語 (fr)
{
    HUSKYLENS_RX_PIN: 'Connecter à HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Connecter à HuskyLens RX →',
}

// 西班牙語 (es)
{
    HUSKYLENS_RX_PIN: 'Conectar a HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Conectar a HuskyLens RX →',
}

// 巴西葡萄牙語 (pt-br)
{
    HUSKYLENS_RX_PIN: 'Conectar ao HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Conectar ao HuskyLens RX →',
}

// 義大利語 (it)
{
    HUSKYLENS_RX_PIN: 'Connetti a HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Connetti a HuskyLens RX →',
}

// 俄語 (ru)
{
    HUSKYLENS_RX_PIN: 'Подключить к HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Подключить к HuskyLens RX →',
}

// 波蘭語 (pl)
{
    HUSKYLENS_RX_PIN: 'Połącz z HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Połącz z HuskyLens RX →',
}

// 匈牙利語 (hu)
{
    HUSKYLENS_RX_PIN: 'Csatlakozás HuskyLens TX-hez →',
    HUSKYLENS_TX_PIN: 'Csatlakozás HuskyLens RX-hez →',
}

// 土耳其語 (tr)
{
    HUSKYLENS_RX_PIN: 'HuskyLens TX\'e bağlan →',
    HUSKYLENS_TX_PIN: 'HuskyLens RX\'e bağlan →',
}

// 保加利亞語 (bg)
{
    HUSKYLENS_RX_PIN: 'Свържи с HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Свържи с HuskyLens RX →',
}

// 捷克語 (cs)
{
    HUSKYLENS_RX_PIN: 'Připojit k HuskyLens TX →',
    HUSKYLENS_TX_PIN: 'Připojit k HuskyLens RX →',
}
```

---

### 3. 開發板預設腳位配置 (HUSKYLENS_UART_DEFAULTS)

**用途**: 定義各開發板的 HuskyLens UART 預設腳位

**資料結構**:

```javascript
const HUSKYLENS_UART_DEFAULTS = {
    esp32: { rx: '16', tx: '17' },
    supermini: { rx: '20', tx: '21' },
    uno: { rx: '2', tx: '3' },
    nano: { rx: '2', tx: '3' },
    mega: { rx: '2', tx: '3' },
};
```

**輔助函式**:

```javascript
/**
 * 取得目前開發板的 HuskyLens UART 預設腳位
 * @returns {{ rx: string, tx: string }} 預設腳位
 */
function getHuskyLensUARTDefaults() {
    const board = window.currentBoard || 'uno';
    return HUSKYLENS_UART_DEFAULTS[board] || HUSKYLENS_UART_DEFAULTS.uno;
}

/**
 * 驗證腳位是否在有效列表中，若無效則返回 fallback 值
 * @param {string} pin 要驗證的腳位
 * @param {Array} validPins 有效腳位列表
 * @returns {string} 有效的腳位值
 */
function validatePin(pin, validPins) {
    const isValid = validPins.some(([, value]) => value === pin);
    return isValid ? pin : validPins[0]?.[1] || '0';
}
```

---

## 狀態轉換

### 積木生命週期

```
[新建積木] → init() → 設定預設腳位 → [使用者互動] → 修改腳位 → [儲存] → main.json
                                                                        ↓
[載入積木] ← Blockly.serialization.load() ← 讀取 fields ← main.json ←←←←←↵
```

**關鍵點**:
- 新建積木：使用 `HUSKYLENS_UART_DEFAULTS` 設定預設腳位
- 載入積木：Blockly 自動從 JSON 還原欄位值，不受預設值影響

---

## 向後相容性

### main.json 格式（不變）

```json
{
    "blocks": {
        "blocks": [
            {
                "type": "huskylens_init_uart",
                "id": "abc123",
                "fields": {
                    "RX_PIN": "10",
                    "TX_PIN": "11"
                }
            }
        ]
    }
}
```

**保證**:
- 欄位名稱 `RX_PIN`、`TX_PIN` 保持不變
- 欄位值格式（字串）保持不變
- 舊版 main.json 100% 相容
