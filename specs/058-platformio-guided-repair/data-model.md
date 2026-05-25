# 資料模型：PlatformIO Guided Repair

## 概觀

此功能延伸既有 PlatformIO 診斷狀態，新增修復候選、修復執行、歷程保存、AI packet 與 issue draft 的資料模型。模型需以 TypeScript 型別落在 Extension Host (`src/types/` 與 `src/services/`)；WebView 僅接收已序列化、已遮罩且可安全顯示的 panel state。

## Entity：Diagnostic Finding

**用途**：描述單一工具或衍生路徑的診斷結果，延伸既有 `PlatformioDiagnosticItem`。

**欄位**

- `id`: 固定診斷項目 id，例如 `pio`、`penvRoot`、`python`、`pip`、`mpremote`。
- `kind`: `executable` 或 `derived-directory`。
- `status`: `ok`、`warning`、`error`。
- `resolvedPath`: 找到的路徑；無法找到時為 `null`。
- `source`: 來源，例如 `path-search`、`derived-from-penv`、`official-platformio-custom-path`、`common-dir`。
- `exists`: 路徑是否存在。
- `versionProbe`: 可執行工具的版本 probe 結果。
- `reason`: 使用者可讀原因。
- `nextStep`: 使用者可讀下一步。
- `repairHints`: 可選；供 repair planner 使用的結構化提示。

**驗證規則**

- 固定項目順序仍為 `pio` → `penvRoot` → `python` → `pip` → `mpremote`。
- `status = ok` 的 executable 必須有成功的版本 probe，除非該工具被標記為不需 probe。
- WebView 顯示前必須 HTML escape；匯出前必須通過 privacy redactor。

## Entity：Official PlatformIO Settings Evidence

**用途**：將官方 PlatformIO VS Code extension 的公開設定納入診斷與修復判斷。

**欄位**

- `customPath`: `platformio-ide.customPATH` 原始值或 `null`。
- `useBuiltinPython`: boolean 或 `undefined`。
- `useBuiltinPIOCore`: boolean 或 `undefined`。
- `useDevelopmentPIOCore`: boolean 或 `undefined`。
- `customPyPiIndexUrl`: URL 字串或 `null`。
- `httpProxyConfigured`: boolean。
- `proxyStrictSsl`: boolean 或 `undefined`。
- `candidatePathEntries`: 從 `customPath` 正規化出的 PATH entries。

**驗證規則**

- 不保存 proxy credential；若 `customPath` 或 proxy 內容需要輸出，必須遮罩。
- Windows `;` 與 POSIX `:` PATH 分隔需依 `process.platform` 正規化。
- 設定不存在時不得造成診斷失敗；只視為缺少額外候選。

## Entity：Repair Flow

**用途**：描述一個可由使用者確認後執行的 primary repair flow。

**欄位**

- `id`: 穩定識別字，例如 `align-with-official-platformio-settings`、`repair-mpremote-in-detected-python`。
- `title`: 本地化標題。
- `summary`: 本地化摘要。
- `triggerFindingIds`: 觸發此 flow 的 finding id 集合。
- `riskLevel`: v1 固定為 `low` 或 `medium`；不得出現 system-level。
- `requiresConfirmation`: v1 必須為 `true`。
- `steps`: 2–3 個 `RepairStep`。
- `stopPolicy`: `stop-on-success-or-blocking-failure`。
- `estimatedDurationMs`: 顯示用估計值。

**驗證規則**

- 每個 flow 至少 1 個 step，最多 3 個 step。
- v1 不允許 `systemPackageManager`、`shellProfileEdit`、`sudo`、`registryEdit` 類型。
- flow 必須可被序列化成 WebView confirmation summary。

## Entity：Repair Step

**用途**：描述一個 allowlisted 且可回報進度的修復步驟。

**欄位**

- `id`: flow 內唯一識別字。
- `title`: 本地化名稱。
- `description`: 使用者可讀說明。
- `kind`: `diagnostic-retry`、`settings-aware-resolution`、`user-space-python-package`、`platformio-installer-check`、`manual-instruction`。
- `commandPreview`: 遮罩後的命令預覽；不可包含 secret。
- `executable`: 可選；實際 `execFile` 目標。
- `args`: 可選；實際 `execFile` 參數。
- `timeoutMs`: 必填；v1 建議 30–120 秒依步驟而定。
- `mutatesUserSpace`: boolean。
- `blockingFailureCodes`: 使 flow 停止的錯誤類型。

**驗證規則**

- 有副作用 step 必須在使用者確認後才可執行。
- 外部程序不得透過 shell 字串執行。
- timeout、stdout/stderr 上限與敏感資訊遮罩必須在 executor 層套用。

## Entity：Auto Repair Run

**用途**：記錄一次使用者啟動的自動修復流程。

**欄位**

- `runId`: UUID 或時間排序 id。
- `flowId`: 對應 Repair Flow。
- `startedAt` / `finishedAt`: ISO timestamp。
- `status`: `pending-confirmation`、`running`、`succeeded`、`partially-succeeded`、`failed`、`cancelled`、`blocked`。
- `environmentFingerprint`: run 開始時的 fingerprint。
- `initialSessionId`: 初始診斷 session id 或 timestamp。
- `finalSessionId`: 修復後重新診斷 session id 或 `null`。
- `stepResults`: `RepairStepResult[]`。
- `userFacingSummary`: 本地化摘要。

**狀態轉換**

```text
pending-confirmation -> running -> succeeded
pending-confirmation -> cancelled
running -> partially-succeeded
running -> failed
running -> blocked
running -> cancelled
running -> succeeded
```

**驗證規則**

- 同一 panel 同時間只能有一個 active repair run。
- `succeeded` 必須有修復後診斷證據，不能只依 command exit code。
- `cancelled` 不得執行尚未開始的後續 step。

## Entity：Repair Step Result

**用途**：描述單一步驟的執行結果。

**欄位**

- `stepId`: 對應 Repair Step。
- `startedAt` / `finishedAt`: ISO timestamp。
- `status`: `skipped`、`running`、`succeeded`、`failed`、`blocked`、`cancelled`、`timed-out`。
- `exitCode`: number 或 `null`。
- `durationMs`: number。
- `sanitizedOutput`: 遮罩後摘要，不保存過長原始 log。
- `evidence`: 結構化證據，例如 resolved path、版本摘要、設定命中情況。
- `nextAction`: 使用者可讀下一步。

**驗證規則**

- `sanitizedOutput` 必須套用 redaction。
- 每個結果都必須可被 AI packet 引用。
- timeout 或 blocking failure 必須含 next action。

## Entity：Environment Fingerprint

**用途**：判斷修復歷程是否仍適用。

**欄位**

- `fingerprintVersion`: 模型版本，例如 `1`。
- `workspaceHash`: workspace path 的 hash。
- `platform`: `process.platform`。
- `arch`: `process.arch`。
- `settingsHash`: PlatformIO/HTTP 相關設定摘要 hash。
- `pathHintsHash`: PATH/customPATH/common candidates 摘要 hash。
- `toolVersions`: `pio`、`python`、`pip`、`mpremote` 版本摘要。
- `createdAt`: ISO timestamp。

**驗證規則**

- 不存原始 secret 或 proxy credential。
- fingerprint 版本升級時，舊歷程需標記為 stale。
- fingerprint 改變時 UI 需提示清除或確認保留歷程。

## Entity：Repair History Snapshot

**用途**：儲存在 `context.workspaceState` 的 workspace-scoped 歷程。

**欄位**

- `schemaVersion`: number。
- `workspaceHash`: string。
- `activeFingerprint`: Environment Fingerprint。
- `runs`: 最近 repair runs；v1 建議最多 20 筆。
- `lastClearedAt`: ISO timestamp 或 `null`。
- `staleReason`: fingerprint 改變時的原因摘要或 `null`。

**驗證規則**

- 歷程只保存在 workspace scope。
- 超過上限時移除最舊 run。
- 使用者清除後不得在 AI packet/issue draft 中引用舊歷程。

## Entity：AI Repair Packet

**用途**：可複製給 AI 助手的結構化故障摘要。

**欄位**

- `generatedAt`: ISO timestamp。
- `featureVersion`: string。
- `problemStatement`: 使用者可讀問題描述。
- `environmentSummary`: 遮罩後 OS、VS Code、extension、PlatformIO 設定摘要。
- `diagnosticSummary`: 遮罩後診斷結果。
- `attemptedRepairs`: 修復歷程摘要。
- `currentBlocker`: 目前阻塞點。
- `knownConstraints`: v1 repair 邊界與使用者限制。
- `requestedResponseContract`: 要求 AI 回覆「原因、已排除項目、下一步、風險」。
- `plainText`: 最終可複製文字。

**驗證規則**

- 預設遮罩敏感資訊。
- 不包含 raw stdout/stderr 全文，只包含摘要。
- 不承諾 AI 會自動修復，只提供可行下一步。

## Entity：Issue Draft Proposal

**用途**：產生可供 human approval 的 open-source issue 草稿。

**欄位**

- `title`: 建議標題。
- `body`: Markdown 草稿。
- `labels`: 建議 labels，例如 `bug`、`platformio`、`needs-triage`。
- `privacyChecklist`: 使用者需確認的遮罩項目。
- `duplicateSearchHints`: 建議搜尋關鍵字。
- `generatedAt`: ISO timestamp。

**驗證規則**

- 不可自動發佈 issue。
- 必須顯示 privacy checklist 與 duplicate search 提醒。
- 草稿 body 必須基於目前 session/history，不可編造未執行的修復步驟。

## Entity：Panel Repair State

**用途**：WebView render payload 中的 repair UI 狀態。

**欄位**

- `availableRepairFlows`: Repair Flow 的安全顯示版。
- `activeRun`: 進行中的 run 顯示狀態或 `null`。
- `historySummary`: 歷程摘要。
- `fingerprintStatus`: `current`、`stale`、`unknown`。
- `exportActions`: `copyAiPacket`、`copyIssueDraft`、`clearHistory` 等可用 action。
- `confirmation`: 需要確認時的 prompt model 或 `null`。

**驗證規則**

- WebView state 不得包含 executor 所需 raw secret。
- 所有動作都必須透過 Extension Host 驗證目前 session/run 狀態。
- render payload 必須向後相容：無 repair state 時仍可顯示既有診斷。
