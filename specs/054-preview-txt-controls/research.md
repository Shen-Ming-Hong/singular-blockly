# 研究報告：TXT 預覽虛擬控制畫布

**功能分支**：`054-preview-txt-controls`  
**研究日期**：2026-05-22  
**狀態**：完成

---

## 研究議題一：TXT 預覽應掛在哪個 UI surface？

**Decision**：沿用既有的備份 preview panel，直接擴充 `blocklyPreview.html`、`blocklyPreview.js` 與 `webviewManager.ts`，讓 TXT 預覽在同一個 preview 視窗中同時顯示 Blockly 工作區與唯讀虛擬控制畫布；**不新增第二個編輯器或第二個 WebviewPanel**。

**Rationale**：

- 現有備份預覽流程已由 `WebViewManager.previewBackup()` 與 `loadBackupContent()` 管理，擴充現有 preview path 是最小侵入做法。
- 規格已明確要求「preview 是唯讀投影，不是第二個 editor」；維持單一 preview surface 最能符合這個語意。
- 沿用現有 preview panel 可以重用目前的主題、語言同步與備份讀取邏輯，降低狀態分裂風險。

**Alternatives considered**：

- **直接重用編輯器 WebView 並切成 readonly 模式**：會把 preview 與 editor 生命週期混在一起，容易誤觸保存與可編輯邏輯。
- **新增第二個 TXT 專屬 WebviewPanel**：需要額外處理多 panel 狀態同步，對這個 feature 過重。

---

## 研究議題二：TXT 資料應如何傳到 preview？

**Decision**：保留目前 preview 的兩段式訊息流程：先送 `setBoard`，再送擴充後的 `loadWorkspaceState`；其中 `loadWorkspaceState` 新增 `txtVirtualControls` 與 `previewWarnings` 欄位，讓 preview 一次收到 Blockly state、TXT 虛擬控制快照與降級提示資訊。

**Rationale**：

- `webviewManager.ts` 目前已採用 `setBoard` → `loadWorkspaceState` 的順序；延續這個順序可避免破壞現有 preview 載入模型。
- `previewMessages.ts` 目前尚未納入 `txt` 與虛擬控制 payload，先補齊型別契約可讓後續 host / webview 兩端都維持型別安全。
- 把 `txtVirtualControls` 與 `previewWarnings` 一起交給 preview，可讓 preview 端只負責唯讀投影與文案呈現，不必自行解析原始備份 JSON。

**Alternatives considered**：

- **額外新增 `loadTxtVirtualControls` 訊息**：會讓 preview 載入流程多一段時序依賴，增加 race condition 風險。
- **讓 WebView 自己重新讀備份 JSON**：會把檔案解析責任從 Extension Host 洩漏到 WebView，違反現有分層。

---

## 研究議題三：唯讀互動邊界要怎麼定義？

**Decision**：為 preview 建立**專用 readonly presenter**，只允許以下互動：

1. Blockly 預覽既有的平移 / 縮放
2. 虛擬控制畫布的唯讀捲動
3. 虛擬控制面板與 Blockly 區域的左右佔比調整

除此之外，preview **不得**允許拖曳按鈕、改名、改色、新增、刪除、按壓或送出任何保存 / runtime 訊息。

**Rationale**：

- `blocklyEdit.js` 的 TXT 虛擬控制邏輯是可編輯控制器；若直接重用，極易把 preview 變成第二個 editor。
- 規格已明確接受：左右佔比可調整，但這只影響當前檢視，不影響內容唯讀與持久化資料。
- 用 preview 專用 presenter 能讓「可調整版面比例」與「不可編輯內容」兩者同時成立，且邊界清楚。

**Alternatives considered**：

- **沿用 editor 控制器並用旗標關閉部分功能**：容易遺漏互動分支，留下可編輯漏洞。
- **完全禁止 splitter 調整**：不符合已澄清的需求。

---

## 研究議題四：舊備份與部分壞掉資料如何降級？

**Decision**：由 Extension Host 先做防禦性正規化，再把結果投影給 preview：

- 缺少 `txtVirtualControls`：顯示保留中的唯讀面板與空狀態訊息
- 部分可恢復：保留可渲染的控制元件，並附帶 `previewWarnings`
- 嚴重錯誤：仍優先保住 Blockly 預覽與可理解警示，不讓整個 preview 崩潰

**Rationale**：

- 規格要求 preview 對舊備份與部分損壞資料保持可讀，而不是整體失敗。
- 在 Host 端先正規化，可把 preview JS 保持在「投影與顯示」的責任範圍內。
- 這也與現有 `messageHandler.ts` 中對 TXT 儲存文件做正規化的做法一致。

**Alternatives considered**：

- **資料一有缺損就拒絕顯示虛擬控制區**：會讓使用者無法分辨是「真的沒有資料」還是「preview 壞掉」。
- **靜默忽略錯誤資料**：容易誤導使用者，以為原始備份本來就長這樣。

---

## 研究議題五：invalid reference 在 preview 中應扮演什麼角色？

**Decision**：preview 對 invalid reference 採**非阻斷揭露**：

- 保留可恢復的按鈕與版面
- 對缺失控制項或失效引用顯示 warning / placeholder
- 不把 preview 變成執行前 preflight gate

**Rationale**：

- 在 editor / upload 流程中，invalid reference 需要阻止執行；但 preview 只負責檢視，不應承擔執行 gate 的責任。
- 規格明確要求對壞掉資料「可閱讀、可理解、不可誤導」，最適合的做法就是非阻斷顯示。
- 以 `PreviewWarning` 與 placeholder 呈現，能清楚區分「資料缺損」與「整體載入失敗」。

**Alternatives considered**：

- **發現 invalid reference 就把整個虛擬控制區改成錯誤畫面**：犧牲過多可讀資訊。
- **完全不顯示 warning**：與規格中對可理解結果的要求相衝突。

---

## 研究議題六：佔比調整是否需要持久化？

**Decision**：preview 中的左右佔比只屬於**當前視窗 session state**；關閉後重新開啟，一律回到預設比例。

**Rationale**：

- 規格已明確接受「只在本次 preview 視窗有效」。
- 這樣能保持 preview 是暫時檢視狀態，而不是引入新的使用者設定或專案儲存責任。
- 不持久化也可避免舊備份、不同檔案與不同視窗之間出現難以預期的比例殘留。

**Alternatives considered**：

- **全域記住上次比例**：會把 preview 拉向偏設定導向的行為，超出目前範圍。
- **每份備份各自記住比例**：會新增不必要的狀態持久化複雜度。

---

## 研究議題七：測試策略應如何分層？

**Decision**：採混合測試策略：

- 自動化：`webviewPreview.test.ts` 與 host-side 載入 / 映射測試
- 手動：唯讀畫布滾動、左右佔比調整、舊備份降級、部分損壞資料呈現、非 TXT 無回歸

**Rationale**：

- 憲法 Principle VII 允許高互動 WebView 功能用手動驗證補足。
- Preview feature 的高風險點同時涵蓋訊息契約、資料降級、CSS/DOM 互動邊界，適合自動化 + 手動分層驗證。
- `webviewPreview.test.ts` 已有 preview 面板建立與 `loadBackupContent()` 測試基礎，擴充成本最低。

**Alternatives considered**：

- **全部手動**：容易漏掉 board mapping、legacy backup 與 partial data regression。
- **第一版就補完整 E2E**：相對此 feature 的規模成本過高。

---

## 研究摘要表

| 議題 | 決策 | 信心度 |
|------|------|--------|
| UI 承載面 | 擴充既有 backup preview panel，不新增第二個 editor/panel | 高 |
| 訊息契約 | 維持 `setBoard` → `loadWorkspaceState`，擴充 `txtVirtualControls` 與 `previewWarnings` | 高 |
| 唯讀互動 | 使用 preview 專用 readonly presenter；僅允許捲動與左右佔比調整 | 高 |
| 舊資料降級 | Host 先正規化，再讓 preview 顯示空狀態 / 部分恢復 / warning | 高 |
| Invalid reference | Preview 採非阻斷揭露，不承擔執行 gate | 高 |
| Splitter 狀態 | 只屬於目前 preview session，不做持久化 | 高 |
| 測試策略 | 自動化契約測試 + 手動互動驗證混合 | 高 |
