# PlatformIO 診斷命令合約

**版本**：v1（獨立 WebView Editor Panel 診斷 UI）  
**命令註冊**：`src/extension.ts`  
**命令貢獻**：`package.json` + `package.nls*.json`  
**panel host**：`src/webview/platformioDiagnosticPanel.ts`  
**診斷服務**：`src/services/platformioDiagnosticService.ts`  
**實作狀態**：已落地，僅剩手動 smoke test 驗證未完成

---

## 合約概述

第一版 PlatformIO 診斷採用 **獨立 command + 專用 WebView Editor Panel** 作為唯一正式入口與主要資訊載體。

本命令 MUST：

1. 不綁定 upload 流程
2. 開啟或揭露專用診斷 panel
3. 在 panel 中顯示完整診斷清單
4. 只提供 `重新測試` 與 `複製診斷摘要` 兩個主要操作

本命令 MUST NOT 直接修改 Blockly WebView 的 upload button state machine；既有 `media/js/blocklyEdit.js` / `media/css/blocklyEdit.css` upload icon 修正屬於回歸保護基線。

通知訊息在本合約中的角色僅限：

- 複製摘要成功／失敗的輕量回饋
- panel 無法建立時的頂層錯誤提示

通知訊息 MUST NOT 成為第一版主要報告載體。

---

## 命令定義

### Command ID

```text
singular-blockly.checkPlatformioStatus
```

### Command Title Key

```text
command.checkPlatformioStatus.title
```

### 顯示位置

- Command Palette
- `category: "Singular Blockly"`

**第一版不要求**：

- Activity Bar 專屬快捷入口
- WebView 內的額外啟動按鈕
- upload 失敗時自動彈出診斷 panel

---

## Panel Lifecycle 合約

### 1. 第一次執行命令

當使用者第一次執行命令時，系統 MUST：

1. 建立單一 `WebviewPanel`
2. 以 Editor Panel 形式顯示診斷介面
3. 在約 1 秒內呈現可見的 loading 狀態
4. 啟動一輪新的診斷收集流程

### 2. 再次執行命令

當使用者再次執行命令且 panel 已存在時，系統 MUST：

1. 揭露既有 panel，而不是新建第二個 panel
2. 保留目前 panel 狀態（最後一次成功結果、loading 中或 error 狀態），而不是因重複執行 command 自動重跑診斷
3. 將真正重新執行診斷的責任保留給 panel 內的 `重新測試` 操作，避免 command 與 panel action 形成兩條 refresh 路徑
4. 保持 panel 的單一來源狀態，避免多份報告互相競爭

### 3. 關閉 panel

當使用者關閉 panel 時，系統 MUST：

- 釋放 panel 相關資源與 reference
- 不影響 upload button 既有狀態機
- 不改變 uploader 的既有 path fallback 行為

---

## Extension Host ↔ WebView 訊息契約

### WebView → Extension Host

| 訊息 | 必填欄位 | 說明 |
|------|----------|------|
| `platformioDiagnostic:ready` | 無 | WebView 完成初始化，可接收狀態資料 |
| `platformioDiagnostic:retest` | 無 | 使用者按下 `重新測試`，要求重新執行診斷 |
| `platformioDiagnostic:copySummary` | 無 | 使用者按下 `複製診斷摘要`，要求複製最新摘要 |

### Extension Host → WebView

| 訊息 | 必填欄位 | 說明 |
|------|----------|------|
| `platformioDiagnostic:loading` | `panelState` | 進入 loading 狀態，停用不適合在 loading 中操作的按鈕 |
| `platformioDiagnostic:render` | `panelState` | 傳送完整 render state，顯示摘要、工具清單與 scope notice |
| `platformioDiagnostic:error` | `panelState` | 傳送頂層錯誤狀態，保留 `重新測試` 操作 |
| `platformioDiagnostic:copyResult` | `status`, `message` | 回報複製摘要成功或失敗的輕量結果 |

**要求**：

- Extension Host 必須是唯一的診斷資料來源
- WebView 不可自行發明第二套診斷規則
- 訊息名稱與 payload 必須穩定，方便測試與後續擴充

---

## 執行流程契約

### Step 1：開啟／揭露 panel

命令觸發後，系統 MUST 先保證使用者進入專用診斷 panel，而不是直接跳出最終摘要通知。

### Step 2：顯示 loading 狀態

panel 在**第一次建立**或使用者按下 `重新測試` 後 MUST 呈現 loading 狀態，讓使用者知道系統正在進行新的檢查；單純重複執行 command 只負責 reveal 既有 panel，不自動重設為 loading。

此外：

- MUST 讓 loading UI 於使用者觸發診斷後約 1 秒內可見，避免長時間無回饋
- MUST 於 10 秒內離開 loading，並進入 `platformioDiagnostic:render` 或 `platformioDiagnostic:error`；其中部分失敗 / timeout 應收斂為 `render` + `degraded` / `unavailable` 結果，只有無法建立 session 的頂層例外才進入 `error`

### Step 3：收集診斷 session

命令 MUST 呼叫 `PlatformioDiagnosticService` 產生一份 `PlatformioDiagnosticSession`。

**固定項目順序**：

1. `pio`
2. `penv` 根目錄
3. `python`
4. `pip`
5. `mpremote`

**要求**：

- 不可依機器環境動態增減項目
- 即使其中某些工具失敗，也要保留整份 session

### Step 4：render panel 狀態

panel MUST 在診斷完成後顯示：

- 整體狀態摘要
- 五個固定項目的完整清單
- 每個項目的原因與必要時的下一步建議
- 範圍提醒
- `重新測試`、`複製診斷摘要` 兩個操作

若單一 probe timeout 或部分工具失敗，panel 仍 MUST 在 10 秒內以 `platformioDiagnostic:render` + `degraded` / `unavailable` 對應結果離開 loading，並保留可讀的原因說明；只有無法建立 session 的頂層例外才可使用 `platformioDiagnostic:error`。

---

## 動作按鈕契約

### 動作 1：重新測試

**按鈕 key（建議）**：

```text
BUTTON_RETEST_DIAGNOSTICS
```

**行為**：

- MUST 重新執行完整診斷
- MUST 不沿用前一次結果冒充最新狀態
- MUST 讓 panel 回到 loading，再更新為新結果或錯誤狀態
- SHOULD 重用同一條 command / service pipeline，而不是建立平行入口

### 動作 2：複製診斷摘要

**按鈕 key（建議）**：

```text
BUTTON_COPY_DIAGNOSTIC_SUMMARY
```

**行為**：

- MUST 使用最新一次成功 render 的 session 產生摘要
- MUST 將摘要寫入剪貼簿
- MUST 使用純文字格式，方便貼到 Issue、PR 或對話中
- SHOULD 在成功後提供輕量但明確的成功回饋

---

## 錯誤處理契約

### 部分失敗

當部分工具失敗時：

- MUST 仍顯示完整清單
- MUST 將整體狀態降為 `degraded` 或 `unavailable`
- MUST 為失敗項目顯示具體原因與下一步建議

### 頂層例外

當命令層級或 panel host 發生未預期例外、導致連 session 都無法建立時：

- MUST 顯示 panel 內的 error state，而不是只留下空白頁
- MUST 保留 `重新測試` 操作，讓使用者可再次嘗試
- MUST 不讓 extension crash
- SHOULD 寫入 structured log

### 無可複製摘要

當使用者在沒有有效 session 的情況下按下 `複製診斷摘要` 時：

- MUST 提供清楚回饋，說明目前沒有可複製的診斷結果
- MUST 不產生空白或誤導性摘要

---

## 非目標（v1 不承諾）

以下不屬於本合約的第一版範圍：

- Quick Pick 診斷 UI
- notification-only 診斷摘要
- 綁定 upload 流程的自動診斷
- 自動安裝 `mpremote`
- 自動修復 PATH 或設定
- 手動設定 `pio` / `penv` / `python` / `pip` / `mpremote` 路徑
- 顯示 PlatformIO VS Code 擴充套件安裝狀態
- dedicated settings editor
