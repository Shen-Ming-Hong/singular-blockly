# Research: Blockly 積木 JSON 序列化修復

**Feature Branch**: `014-block-serialization-fix`  
**Created**: 2025-12-11  
**Status**: Complete

## 研究目標

1. 驗證 Blockly 12.x JSON 序列化 API 的正確用法
2. 確認 `saveExtraState`/`loadExtraState` 的實作模式
3. 研究 `scrubNakedValue` 機制的最佳實踐
4. 分析現有 encoder 積木的序列化需求

---

## 研究發現

### 1. Blockly 序列化優先級

**來源**: [Blockly 官方文件 - Mutators](https://developers.google.com/blockly/guides/create-custom-blocks/mutators#extra_state_serialization)

**Decision**: 使用 `saveExtraState`/`loadExtraState` 作為主要序列化機制

**Rationale**:

-   Blockly 12.x 的 JSON 序列化系統優先使用這些 hooks
-   只有在沒有 JSON hooks 時才會回退到 XML hooks（`mutationToDom`/`domToMutation`）
-   JSON 格式更易於閱讀和除錯

**Alternatives Considered**:

-   只保留 XML hooks：被拒絕，因為 Blockly 12.x 預設使用 JSON 序列化，會導致積木狀態丟失
-   移除 XML hooks：被拒絕，因為需要向後相容舊版 `main.json` 檔案

**程式碼範例（來自官方文件）**:

```javascript
saveExtraState: function() {
  return {
    'itemCount': this.itemCount_,
  };
},

loadExtraState: function(state) {
  this.itemCount_ = state['itemCount'];
  this.updateShape_();
},
```

---

### 2. encoder 積木的 ExtraState 結構

**Decision**: 採用與現有 XML 屬性一致的 JSON 結構

**Rationale**:

-   降低維護成本
-   減少認知負擔
-   便於理解新舊格式的對應關係

**各積木的 ExtraState 映射**:

| 積木類型              | XML 屬性               | JSON ExtraState            |
| --------------------- | ---------------------- | -------------------------- |
| `encoder_setup`       | `use_interrupt="true"` | `{ useInterrupt: true }`   |
| `encoder_read`        | `encoder="myEncoder"`  | `{ encoder: "myEncoder" }` |
| `encoder_reset`       | `encoder="myEncoder"`  | `{ encoder: "myEncoder" }` |
| `encoder_pid_setup`   | `encoder="myEncoder"`  | `{ encoder: "myEncoder" }` |
| `encoder_pid_compute` | `pid="myPID"`          | `{ pid: "myPID" }`         |

---

### 3. scrubNakedValue 防護機制

**來源**: [Blockly CodeGenerator API](https://developers.google.com/blockly/reference/js/blockly.codegenerator_class.scrubnakedvalue_1_method)

**Decision**: 覆寫 `arduinoGenerator.scrubNakedValue` 方法，將裸露表達式轉為註釋

**Rationale**:

-   Naked value（獨立的 value block）會被 `workspaceToCode` 處理
-   在 C++ 中，裸露的表達式（如 `myEncoder.getCount()`）是無效語法
-   轉為註釋可保留除錯資訊，同時避免編譯錯誤

**實作方案**:

```javascript
window.arduinoGenerator.scrubNakedValue = function (line) {
	// 將裸露的表達式轉為註釋
	return '// 未連接的表達式: ' + line.trim() + '\n';
};
```

**Alternatives Considered**:

-   完全忽略裸露表達式：被拒絕，因為會隱藏潛在問題，不利於使用者除錯
-   拋出錯誤：被拒絕，因為會中斷程式碼生成流程，使用者體驗差

---

### 4. 向後相容策略

**Decision**: 同時保留 XML 和 JSON 序列化 hooks

**Rationale**:

-   舊版 `main.json` 可能包含 XML 格式的 extraState
-   Blockly 在載入時會根據資料格式自動選擇對應的 hook
-   新保存的檔案將使用 JSON 格式

**相容性測試案例**:

1. 載入只有 XML extraState 的舊檔案 → 應正確還原
2. 載入 JSON extraState 的新檔案 → 應正確還原
3. 修改後保存 → 應使用 JSON 格式

---

### 5. 序列化的 JSON 結構

**來源**: MCP Context7 Blockly 文件查詢

**範例輸出**（使用 `Blockly.serialization.workspaces.save()`）:

```json
{
	"blocks": {
		"languageVersion": 0,
		"blocks": [
			{
				"type": "encoder_read",
				"id": "block_id",
				"x": 100,
				"y": 100,
				"extraState": {
					"encoder": "myEncoder"
				}
			}
		]
	}
}
```

**關鍵發現**:

-   `extraState` 欄位由 `saveExtraState()` 的返回值填充
-   連接的子積木會在 `inputs` 欄位中保存
-   JSON 序列化會保留積木間的連接關係

---

## 現有程式碼分析

### motors.js 中的積木定義現況

| 積木類型              | `mutationToDom` | `domToMutation` | `saveExtraState` | `loadExtraState` |
| --------------------- | --------------- | --------------- | ---------------- | ---------------- |
| `encoder_setup`       | ✅ 已實作       | ✅ 已實作       | ❌ 缺少          | ❌ 缺少          |
| `encoder_read`        | ✅ 已實作       | ✅ 已實作       | ❌ 缺少          | ❌ 缺少          |
| `encoder_reset`       | ✅ 已實作       | ✅ 已實作       | ❌ 缺少          | ❌ 缺少          |
| `encoder_pid_setup`   | ✅ 已實作       | ✅ 已實作       | ❌ 缺少          | ❌ 缺少          |
| `encoder_pid_compute` | ✅ 已實作       | ✅ 已實作       | ❌ 缺少          | ❌ 缺少          |

### arduinoGenerator（index.js）現況

-   `scrubNakedValue` 方法：**未定義**（使用 Blockly 預設行為，直接輸出裸露表達式）

---

## 風險評估

| 風險                           | 影響 | 緩解措施                            |
| ------------------------------ | ---- | ----------------------------------- |
| JSON 格式與現有 XML 不相容     | 低   | 保留 XML hooks 作為 fallback        |
| `scrubNakedValue` 影響其他積木 | 低   | 該方法只處理獨立的 value blocks     |
| 破壞現有工作區檔案             | 中   | 手動測試載入舊版 `main.json`        |
| Undo/Redo 功能異常             | 低   | 使用 Blockly 標準 API，已有內建支援 |

---

## 實作建議

### 優先順序

1. **P0**: 為 5 個 encoder 積木添加 `saveExtraState`/`loadExtraState`
2. **P0**: 實作 `scrubNakedValue` 防護機制
3. **P1**: 手動測試向後相容性
4. **P2**: 考慮為 servo、function 等積木添加類似修復（後續版本）

### 程式碼模板

```javascript
// encoder_read 積木的 JSON 序列化範例
Blockly.Blocks['encoder_read'] = {
	init: function () {
		/* 現有程式碼 */
	},

	// JSON 序列化 hooks（新增）
	saveExtraState: function () {
		return {
			encoder: this.getFieldValue('VAR') || 'myEncoder',
		};
	},

	loadExtraState: function (state) {
		if (state.encoder) {
			this.restoredEncoderValue = state.encoder;
			this.getField('VAR').setValue(state.encoder);
		}
	},

	// 保留現有 XML hooks 以確保向後相容
	mutationToDom: function () {
		/* 現有程式碼 */
	},
	domToMutation: function (xmlElement) {
		/* 現有程式碼 */
	},
};
```

---

## 驗證完成日期

**2025-12-11** - 所有研究項目已完成，技術方案已確認可行。
