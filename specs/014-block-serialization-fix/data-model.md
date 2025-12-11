# Data Model: Blockly 積木 JSON 序列化修復

**Feature Branch**: `014-block-serialization-fix`  
**Created**: 2025-12-11  
**Status**: Complete

## 資料模型概覽

本功能涉及 Blockly 積木的序列化狀態（ExtraState），用於在保存/載入工作區時保留積木的動態配置資訊。

---

## 實體定義

### 1. EncoderSetupExtraState

**用途**: 儲存 `encoder_setup` 積木的中斷引腳配置狀態

```typescript
interface EncoderSetupExtraState {
	/** 是否使用中斷引腳（預設 false） */
	useInterrupt: boolean;
}
```

**欄位說明**:

| 欄位           | 類型      | 必填 | 預設值  | 說明                                       |
| -------------- | --------- | ---- | ------- | ------------------------------------------ |
| `useInterrupt` | `boolean` | 是   | `false` | 控制引腳下拉選單顯示中斷引腳或一般數位引腳 |

**驗證規則**:

-   `useInterrupt` 必須是布林值

**XML 對應**:

```xml
<mutation use_interrupt="true"></mutation>
```

---

### 2. EncoderRefExtraState

**用途**: 儲存 `encoder_read`、`encoder_reset`、`encoder_pid_setup` 積木的編碼馬達參考

```typescript
interface EncoderRefExtraState {
	/** 參考的編碼馬達變數名稱 */
	encoder: string;
}
```

**欄位說明**:

| 欄位      | 類型     | 必填 | 預設值        | 說明                                    |
| --------- | -------- | ---- | ------------- | --------------------------------------- |
| `encoder` | `string` | 是   | `"myEncoder"` | 對應 `encoder_setup` 積木定義的馬達名稱 |

**驗證規則**:

-   `encoder` 必須是非空字串
-   應對應工作區中存在的 `encoder_setup` 積木的 VAR 欄位

**XML 對應**:

```xml
<mutation encoder="myEncoder"></mutation>
```

**適用積木**:

-   `encoder_read`
-   `encoder_reset`
-   `encoder_pid_setup`

---

### 3. PIDRefExtraState

**用途**: 儲存 `encoder_pid_compute` 積木的 PID 控制器參考

```typescript
interface PIDRefExtraState {
	/** 參考的 PID 控制器變數名稱 */
	pid: string;
}
```

**欄位說明**:

| 欄位  | 類型     | 必填 | 預設值    | 說明                                         |
| ----- | -------- | ---- | --------- | -------------------------------------------- |
| `pid` | `string` | 是   | `"myPID"` | 對應 `encoder_pid_setup` 積木定義的 PID 名稱 |

**驗證規則**:

-   `pid` 必須是非空字串
-   應對應工作區中存在的 `encoder_pid_setup` 積木的 PID_VAR 欄位

**XML 對應**:

```xml
<mutation pid="myPID"></mutation>
```

---

## 序列化格式對照表

### JSON 格式（新）

```json
{
	"blocks": {
		"languageVersion": 0,
		"blocks": [
			{
				"type": "encoder_setup",
				"id": "abc123",
				"x": 100,
				"y": 50,
				"extraState": {
					"useInterrupt": true
				},
				"fields": {
					"VAR": "myEncoder",
					"USE_INTERRUPT": "TRUE",
					"PIN_A": "2",
					"PIN_B": "3"
				}
			},
			{
				"type": "encoder_read",
				"id": "def456",
				"extraState": {
					"encoder": "myEncoder"
				},
				"fields": {
					"VAR": "myEncoder"
				}
			}
		]
	}
}
```

### XML 格式（舊/向後相容）

```xml
<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="encoder_setup" id="abc123" x="100" y="50">
    <mutation use_interrupt="true"></mutation>
    <field name="VAR">myEncoder</field>
    <field name="USE_INTERRUPT">TRUE</field>
    <field name="PIN_A">2</field>
    <field name="PIN_B">3</field>
  </block>
  <block type="encoder_read" id="def456">
    <mutation encoder="myEncoder"></mutation>
    <field name="VAR">myEncoder</field>
  </block>
</xml>
```

---

## 積木 ExtraState 映射總表

| 積木類型              | ExtraState 類型          | JSON 格式                   | XML 格式                         |
| --------------------- | ------------------------ | --------------------------- | -------------------------------- |
| `encoder_setup`       | `EncoderSetupExtraState` | `{ useInterrupt: boolean }` | `<mutation use_interrupt="...">` |
| `encoder_read`        | `EncoderRefExtraState`   | `{ encoder: string }`       | `<mutation encoder="...">`       |
| `encoder_reset`       | `EncoderRefExtraState`   | `{ encoder: string }`       | `<mutation encoder="...">`       |
| `encoder_pid_setup`   | `EncoderRefExtraState`   | `{ encoder: string }`       | `<mutation encoder="...">`       |
| `encoder_pid_compute` | `PIDRefExtraState`       | `{ pid: string }`           | `<mutation pid="...">`           |

---

## 狀態轉換圖

```
┌─────────────────┐    保存工作區    ┌──────────────────┐
│  Blockly Block  │ ───────────────> │   main.json      │
│  (記憶體中)      │                  │   (檔案系統)      │
└─────────────────┘                  └──────────────────┘
        │                                     │
        │ saveExtraState()                    │ Blockly.serialization.
        │                                     │ workspaces.load()
        ▼                                     ▼
┌─────────────────┐                  ┌──────────────────┐
│  ExtraState     │                  │  ExtraState      │
│  { encoder:     │                  │  JSON Object     │
│    "myEncoder"} │                  │                  │
└─────────────────┘                  └──────────────────┘
        │                                     │
        │ JSON.stringify()                    │ loadExtraState()
        │                                     │
        ▼                                     ▼
┌─────────────────┐    載入工作區    ┌──────────────────┐
│  JSON 格式      │ <─────────────── │  Blockly Block   │
│  extraState     │                  │  (記憶體中)       │
└─────────────────┘                  └──────────────────┘
```

---

## 向後相容性

### 載入舊版檔案的流程

1. Blockly 讀取 `main.json`
2. 檢查積木是否有 `extraState` 欄位
    - **有 JSON extraState**: 呼叫 `loadExtraState(state)`
    - **無 JSON extraState 但有 XML mutation**: 呼叫 `domToMutation(xmlElement)`
3. 積木狀態正確還原

### 保存新檔案的流程

1. 呼叫 `Blockly.serialization.workspaces.save(workspace)`
2. 對每個積木：
    - 如果積木有 `saveExtraState` 方法，呼叫它
    - 返回值存入 `block.extraState`
3. 輸出 JSON 格式的 `main.json`

---

## 錯誤處理

### 空值處理

```javascript
saveExtraState: function() {
  const value = this.getFieldValue('VAR');
  // 確保返回有效值
  return {
    encoder: value || 'myEncoder'
  };
},

loadExtraState: function(state) {
  // 防禦性檢查
  if (state && state.encoder) {
    this.restoredEncoderValue = state.encoder;
    const field = this.getField('VAR');
    if (field) {
      field.setValue(state.encoder);
    }
  }
}
```

### 無效資料處理

-   如果 `extraState` 缺少必要欄位，使用預設值
-   如果欄位值類型錯誤，記錄警告並使用預設值
