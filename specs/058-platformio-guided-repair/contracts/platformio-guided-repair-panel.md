# Contract：PlatformIO Guided Repair Panel

## 範圍

此契約定義既有 PlatformIO diagnostic panel 在加入 guided repair 後的 Extension Host ↔ WebView 行為。面板仍由 `singular-blockly.checkPlatformioStatus` 開啟，不新增 top-level command。

## 使用者可見區塊

1. **狀態總覽**：沿用現有 overall status、診斷時間與 scope notice。
2. **工具診斷清單**：沿用固定順序 `pio`、`penvRoot`、`python`、`pip`、`mpremote`。
3. **建議修復**：當 overall status 為 `degraded` 或 `unavailable`，且 planner 找到安全 flow 時顯示主要 `自動修復` action。
4. **修復進度**：執行中顯示目前 step、已完成 step、可取消狀態與遮罩後輸出摘要。
5. **修復歷程**：顯示本 workspace 最近修復結果、fingerprint 是否仍有效、清除歷程 action。
6. **AI/Issue 協助**：顯示 `複製 AI 修復摘要` 與 `產生 Issue 草稿`；兩者都使用遮罩後內容。

## Panel State Extension

既有 `PlatformioDiagnosticPanelState` 需可延伸：

- `repair`: `PanelRepairState | null`
  - `availableRepairFlows`: 安全顯示版 flows。
  - `activeRun`: 目前 run 或 `null`。
  - `historySummary`: 最近歷程摘要。
  - `fingerprintStatus`: `current`、`stale`、`unknown`。
  - `confirmation`: 等待確認的 flow 摘要或 `null`。
  - `exportActions`: 可用 actions。
- `availableActions`: 仍保留 `retest`、`copySummary`，並可加入 repair actions。

## WebView → Extension Host Messages

### `platformioDiagnostic:ready`

- **When**: WebView 初始化完成。
- **Expected**: Extension Host 執行診斷、載入 workspace history、規劃 repair flows，回傳 render state。

### `platformioDiagnostic:retest`

- **When**: 使用者重新檢測。
- **Expected**: 重新蒐集 diagnostics，保留歷程，重新計算 fingerprint 與 repair candidates。
- **Guard**: 若有 active repair run，需拒絕或提示先等待/取消。

### `platformioDiagnostic:copySummary`

- **When**: 使用者複製既有診斷摘要。
- **Expected**: 維持現有行為；摘要需可納入新的遮罩邏輯但不得破壞舊格式。

### `platformioDiagnostic:startAutoRepair`

- **Payload**: `{ flowId: string }`
- **When**: 使用者點擊 `自動修復`。
- **Expected**: Extension Host 驗證 flow 仍可用，回傳 confirmation model；不得立即執行有副作用步驟。
- **Failure**: flow 不存在、診斷已過期、已有 active run 時回傳可讀錯誤。

### `platformioDiagnostic:confirmAutoRepair`

- **Payload**: `{ flowId: string, confirmationToken: string }`
- **When**: 使用者在 lightweight confirmation 按下確認。
- **Expected**: Extension Host 建立 `AutoRepairRun`、開始執行，並發送 progress/render 訊息。
- **Guard**: token 必須對應目前 confirmation model，避免 stale confirmation。

### `platformioDiagnostic:cancelAutoRepair`

- **Payload**: `{ runId: string }`
- **When**: 使用者取消尚在執行或等待確認的 run。
- **Expected**: 尚未開始的 step 不得執行；已啟動的 subprocess 可嘗試中止，最終狀態為 `cancelled` 或 `blocked`。

### `platformioDiagnostic:copyAiRepairPacket`

- **Payload**: `{ includeHistory?: boolean }`
- **Expected**: 產生遮罩後 AI packet，寫入 clipboard，並回傳 success/error。

### `platformioDiagnostic:createIssueDraft`

- **Payload**: `{ includeHistory?: boolean }`
- **Expected**: 產生遮罩後 issue draft；可寫入 clipboard 或在 panel 顯示草稿。不得自動發佈。

### `platformioDiagnostic:clearRepairHistory`

- **Expected**: 清除 workspace-scoped repair history，重新 render 面板。

## Extension Host → WebView Messages

### `platformioDiagnostic:loading`

沿用既有 loading state。

### `platformioDiagnostic:render`

- **Payload**: `{ panelState, localizedStrings }`
- **Expected**: WebView 完整重繪。若 `panelState.repair` 為 `null`，UI 必須退回既有診斷顯示。

### `platformioDiagnostic:repairProgress`

- **Payload**: `{ runId, activeStepId, stepResults, summary }`
- **Expected**: WebView 更新進度，不要求完整重跑診斷。

### `platformioDiagnostic:copyResult`

沿用既有 copy result，但需允許 `summary`、`aiPacket`、`issueDraft` 三種來源。

### `platformioDiagnostic:error`

- **Payload**: `{ message, recoverable }`
- **Expected**: 顯示可讀錯誤；recoverable 時保留可重新檢測 action。

## UI/安全規則

- WebView 不可直接執行修復命令。
- 所有從 Extension Host 送入 WebView 的字串仍需 HTML escape。
- 不在 WebView 持久保存 raw diagnostic log。
- Lightweight confirmation 必須清楚列出將執行的 2–3 個步驟、是否會修改 user-space、如何停止。
- 取消/失敗後，面板必須顯示「已完成哪些步驟」與「下一步建議」。
