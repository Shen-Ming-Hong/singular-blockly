# Feature Specification: HuskyLens ID-Based Block Query

**Feature Branch**: `036-huskylens-id-blocks`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: User description: "Add HuskyLens blocks to get block info by ID directly, including request by ID and get block by ID blocks, allowing users to retrieve coordinates of a specific ID without loop iteration"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 追蹤特定學習物件的位置 (Priority: P1)

使用者已在 HuskyLens 上學習多個物件（例如 3 種不同顏色的球），現在想要追蹤特定 ID 的物件（例如紅球 ID=1）並取得其 X 座標來控制機器人轉向。使用新的「依 ID 取得方塊資訊」積木，無需使用迴圈遍歷所有偵測到的物件。

**Why this priority**: 這是最核心的使用場景，解決了使用者必須用迴圈遍歷所有方塊來找特定 ID 的痛點，大幅簡化程式邏輯。

**Independent Test**: 可透過在 Blockly 編輯器中拖曳「依 ID 取得方塊資訊」積木，設定 ID=1 並選擇 xCenter 屬性，驗證生成的程式碼正確。

**Acceptance Scenarios**:

1. **Given** 使用者在 Blockly 編輯器中, **When** 拖曳「依 ID 取得方塊資訊」積木並設定 ID=1、索引=0、屬性=xCenter, **Then** 生成正確的程式碼
2. **Given** 使用者設定不同屬性, **When** 選擇 yCenter/width/height/ID 屬性, **Then** 生成對應的屬性存取程式碼
3. **Given** 使用者使用數值積木作為 ID 輸入, **When** 連接一個數值積木（如變數或數學運算）到 ID 欄位, **Then** 生成程式碼正確包含該運算式

---

### User Story 2 - 只請求特定 ID 的辨識結果 (Priority: P2)

使用者只關心特定 ID 的物件，想要優化請求效率。使用「依 ID 請求辨識結果」積木，只請求包含該 ID 的結果，減少不必要的資料傳輸。

**Why this priority**: 這是進階優化功能，雖然不使用也能達成目標，但提供此積木可讓程式更明確且效率更高。

**Independent Test**: 在 Blockly 編輯器中使用「依 ID 請求辨識結果」積木，設定 ID=2，驗證生成正確的請求程式碼。

**Acceptance Scenarios**:

1. **Given** 使用者在 Blockly 編輯器中, **When** 拖曳「依 ID 請求辨識結果」積木並設定 ID=2, **Then** 生成正確的請求程式碼
2. **Given** 使用者連接變數到 ID 欄位, **When** 使用變數積木, **Then** 生成程式碼包含該變數

---

### User Story 3 - 依 ID 取得方塊數量 (Priority: P3)

使用者想知道畫面中特定 ID 的物件出現幾次（例如場上有幾顆紅球），需要「依 ID 取得方塊數量」積木來計數。

**Why this priority**: 此功能是 User Story 1 的補充，讓使用者可以在取得方塊資訊前先確認該 ID 是否存在及數量，避免存取不存在的索引。

**Independent Test**: 使用「依 ID 取得方塊數量」積木，設定 ID=1，驗證生成正確的計數程式碼。

**Acceptance Scenarios**:

1. **Given** 使用者在 Blockly 編輯器中, **When** 拖曳「依 ID 取得方塊數量」積木並設定 ID=1, **Then** 生成正確的計數程式碼
2. **Given** 使用者將此積木用於條件判斷, **When** 放入「如果...那麼」積木的條件欄位, **Then** 可正確編譯並運作

---

### Edge Cases

- 當指定的 ID 不存在於畫面中時，計數回傳 0，取得方塊資訊可能回傳無效資料
    - **處理方式**：文件說明應先用計數積木檢查數量 > 0 再取得資訊
- 當索引超出範圍時（例如只有 1 個 ID=1 的方塊但索引填 5）
    - **處理方式**：依賴底層庫的行為，不在積木層額外處理
- 當使用者輸入負數 ID 或索引
    - **處理方式**：生成的程式碼直接傳入，由編譯器/底層庫處理

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: 系統必須提供「依 ID 取得方塊資訊」積木，允許使用者輸入 ID、索引、屬性來取得特定 ID 方塊的座標/尺寸/ID
- **FR-002**: 系統必須提供「依 ID 請求辨識結果」積木，允許使用者只請求特定 ID 的辨識結果
- **FR-003**: 系統必須提供「依 ID 取得方塊數量」積木，允許使用者取得特定 ID 的方塊數量
- **FR-004**: 所有新積木必須支援 15 種語言的在地化翻譯
- **FR-005**: 所有新積木必須出現在 Toolbox 的 HuskyLens 區塊中
- **FR-006**: 新積木必須與現有 HuskyLens 積木（基於索引的版本）並存，不破壞向後相容性
- **FR-007**: 新積木僅需支援 Arduino 程式碼生成（HuskyLens 目前無 MicroPython 支援）

### Key Entities

- **Block (方塊)**: HuskyLens 偵測到的矩形區域，包含 xCenter、yCenter、width、height、ID 屬性
- **ID**: 學習物件的識別碼，從 1 開始編號，0 表示偵測到但未學習的物件
- **Index (索引)**: 同一 ID 可能有多個方塊時的順序編號，從 0 開始

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 使用者完成「取得特定 ID 物件的 X 座標」僅需拖曳 1 個積木並設定 3 個欄位（ID、索引、屬性），相較於現有方案需要 5+ 個積木（迴圈 + 條件 + 取值）大幅簡化
- **SC-002**: 新積木生成的程式碼可正確編譯且功能正確
- **SC-003**: 15 種語言翻譯完整率達 100%（通過翻譯驗證）
- **SC-004**: 新增積木不影響現有專案的載入與運作（向後相容性測試通過）

## Clarifications

### Session 2026-01-23

- Q: 新積木在 Toolbox 中應該如何組織？ → A: 放在現有 HuskyLens 積木區塊最後（依索引積木之後）
- Q: 新積木的繁體中文顯示名稱應如何命名？ → A: 使用「取得 ID {0} 的第 {1} 個方塊的 {2}」格式
