# Research: HuskyLens ID-Based Block Query

**Feature Branch**: `036-huskylens-id-blocks`  
**Date**: 2026-01-23  
**Status**: 完成

## 研究摘要

本文件記錄 HuskyLens ID-Based 積木功能的技術研究成果，涵蓋 API 確認、實作模式選擇與翻譯策略。

---

## 1. HUSKYLENSArduino 函式庫 API 確認

### 1.1 可用的 ID-Based API 函式

從官方 GitHub 文件確認以下函式可直接使用：

| API 函式                              | 說明                      | 回傳值                 |
| ------------------------------------- | ------------------------- | ---------------------- |
| `requestBlocks(int16_t ID)`           | 只請求特定 ID 的方塊      | `bool` 成功/失敗       |
| `countBlocks(int16_t ID)`             | 取得特定 ID 的方塊數量    | `int16_t` 數量         |
| `getBlock(int16_t ID, int16_t index)` | 取得特定 ID 的第 N 個方塊 | `HUSKYLENSResult` 結構 |
| `requestArrows(int16_t ID)`           | 只請求特定 ID 的箭頭      | `bool` 成功/失敗       |
| `countArrows(int16_t ID)`             | 取得特定 ID 的箭頭數量    | `int16_t` 數量         |
| `getArrow(int16_t ID, int16_t index)` | 取得特定 ID 的第 N 個箭頭 | `HUSKYLENSResult` 結構 |

### 1.2 HUSKYLENSResult 結構

```cpp
struct HUSKYLENSResult {
    // 通用屬性
    int16_t ID;       // 物件 ID（1+ 已學習，0 未學習）

    // 方塊屬性
    int16_t xCenter;  // 中心 X 座標
    int16_t yCenter;  // 中心 Y 座標
    int16_t width;    // 寬度
    int16_t height;   // 高度

    // 箭頭屬性
    int16_t xOrigin;  // 起點 X 座標
    int16_t yOrigin;  // 起點 Y 座標
    int16_t xTarget;  // 終點 X 座標
    int16_t yTarget;  // 終點 Y 座標
};
```

### 1.3 API 使用注意事項

**Decision**: 直接使用函式庫 API，無需額外包裝  
**Rationale**: API 設計良好且穩定，與現有積木使用的 API 一致  
**Alternatives considered**:

- 建立包裝函式 — 增加複雜度但無實質好處，拒絕

---

## 2. 積木設計決策

### 2.1 三個新積木規格

| 積木類型                      | 輸入欄位                                          | 輸出類型  | 生成程式碼                               |
| ----------------------------- | ------------------------------------------------- | --------- | ---------------------------------------- |
| `huskylens_request_blocks_id` | ID (Number)                                       | Statement | `huskylens.requestBlocks(ID);`           |
| `huskylens_count_blocks_id`   | ID (Number)                                       | Number    | `huskylens.countBlocks(ID)`              |
| `huskylens_get_block_id`      | ID (Number), INDEX (Number), INFO_TYPE (Dropdown) | Number    | `huskylens.getBlock(ID, INDEX).property` |

### 2.2 是否新增箭頭版本積木？

**Decision**: 暫不新增箭頭版本（`requestArrows(ID)`, `countArrows(ID)`, `getArrow(ID, index)`）  
**Rationale**:

- 規格只要求方塊相關積木
- 箭頭用於線路追蹤演算法，使用場景較少
- 可作為後續功能擴展

**Alternatives considered**:

- 同時新增箭頭版本 — 增加範疇但無明確需求，拒絕
- 新增通用版本（同時支援方塊和箭頭） — 增加使用者複雜度，拒絕

### 2.3 ID 輸入欄位設計

**Decision**: 使用 ValueInput 搭配 Number shadow block  
**Rationale**:

- 允許使用者直接輸入數字或連接變數/表達式
- 與現有 `huskylens_get_block_info` 的 INDEX 輸入一致

**Alternatives considered**:

- FieldNumber（純數字欄位） — 無法接受變數，拒絕
- FieldDropdown（固定選項） — 無法動態選擇 ID，拒絕

### 2.4 INDEX 索引從 0 開始

**Decision**: 索引從 0 開始，與 API 一致  
**Rationale**:

- HUSKYLENSArduino API 索引從 0 開始
- 與現有 `huskylens_get_block_info` 積木一致

---

## 3. 翻譯策略

### 3.1 新增翻譯鍵

需要為 15 種語言新增以下翻譯：

```javascript
// 依 ID 請求辨識結果
HUSKYLENS_REQUEST_BLOCKS_ID: '請求 ID {0} 的 HUSKYLENS 方塊',
HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP: '只請求特定 ID 的方塊辨識結果',

// 依 ID 取得方塊數量
HUSKYLENS_COUNT_BLOCKS_ID: 'HUSKYLENS ID {0} 的方塊數量',
HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP: '取得特定 ID 的方塊數量',

// 依 ID 取得方塊資訊
HUSKYLENS_GET_BLOCK_ID: '取得 ID {0} 的第 {1} 個方塊的 {2}',
HUSKYLENS_GET_BLOCK_ID_TOOLTIP: '取得特定 ID 方塊的位置、大小或 ID 資訊',
```

### 3.2 翻譯優先順序

1. **zh-hant** — 主要語言，最優先
2. **en** — 英文版本，作為其他語言的參考基礎
3. **ja, ko** — 東亞語系，語法結構接近
4. **其他 11 種語言** — 使用英文版本為基礎進行翻譯

### 3.3 佔位符格式

**Decision**: 使用 `{0}`, `{1}`, `{2}` 格式  
**Rationale**: 與專案現有慣例一致（見 copilot-instructions.md）

---

## 4. 與現有積木的關係

### 4.1 現有積木保留

| 現有積木                   | 用途                   | 保留原因                     |
| -------------------------- | ---------------------- | ---------------------------- |
| `huskylens_request`        | 請求所有辨識結果       | 當不需要篩選 ID 時使用       |
| `huskylens_count_blocks`   | 取得所有方塊數量       | 當不需要篩選 ID 時使用       |
| `huskylens_get_block_info` | 取得指定索引的方塊資訊 | 當不知道 ID 只知道索引時使用 |

### 4.2 向後相容性

**Decision**: 100% 向後相容  
**Rationale**:

- 新積木使用不同的 block type 名稱
- 現有積木不做任何修改
- 現有專案載入時不受影響

---

## 5. Toolbox 組織

**Decision**: 新積木放置於 HuskyLens 區塊末端（現有積木之後）  
**Rationale**: 依據規格中的 Clarification 決策

**Toolbox 順序**:

```
HUSKYLENS 區塊
├── huskylens_init_i2c
├── huskylens_init_uart
├── huskylens_set_algorithm
├── huskylens_request
├── huskylens_is_learned
├── huskylens_count_blocks
├── huskylens_get_block_info
├── huskylens_count_arrows
├── huskylens_get_arrow_info
├── huskylens_learn
├── huskylens_forget
├── [分隔線]
├── huskylens_request_blocks_id    ← 新增
├── huskylens_count_blocks_id      ← 新增
└── huskylens_get_block_id         ← 新增
```

---

## 6. 測試策略

### 6.1 手動測試案例

依據 Constitution Principle VII 的 UI Testing Exception，使用手動測試：

| 測試案例 | 步驟                                            | 預期結果                               |
| -------- | ----------------------------------------------- | -------------------------------------- |
| TC-001   | 拖曳 `huskylens_request_blocks_id` 積木         | 積木正確顯示，ID 輸入欄位有預設值      |
| TC-002   | 設定 ID=1 並檢視生成程式碼                      | 程式碼為 `huskylens.requestBlocks(1);` |
| TC-003   | 連接變數到 ID 欄位                              | 程式碼正確包含變數名稱                 |
| TC-004   | 拖曳 `huskylens_count_blocks_id` 積木           | 積木正確顯示為數值輸出                 |
| TC-005   | 設定 ID=2 並放入條件判斷                        | 程式碼正確編譯                         |
| TC-006   | 拖曳 `huskylens_get_block_id` 積木              | 積木正確顯示 ID、索引、屬性三個輸入    |
| TC-007   | 選擇不同屬性（xCenter/yCenter/width/height/ID） | 生成正確的屬性存取程式碼               |
| TC-008   | 切換語言並檢視積木                              | 積木文字正確翻譯                       |

### 6.2 程式碼生成測試

可進行自動化單元測試的項目：

- Generator 函式輸出格式驗證
- 翻譯鍵完整性檢查（`npm run validate:i18n`）

---

## 7. 結論

所有技術問題已釐清，無需進一步研究。可進入 Phase 1 設計階段。
