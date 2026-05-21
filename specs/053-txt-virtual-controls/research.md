# 研究報告：TXT 虛擬控制畫布

**功能分支**：`053-add-txt-virtual-controls`  
**研究日期**：2026-05-21  
**狀態**：完成

---

## 研究議題一：虛擬控制畫布應掛在哪個 UI surface？

**Decision**：虛擬控制畫布維持在**既有 Blockly WebView 內**，以 `blocklyEdit.html` / `blocklyEdit.js` / `blocklyEdit.css` 新增 TXT 專用的畫布介面與切換入口；**不新增新的 VS Code WebviewPanel**。

**Rationale**：

- 目前專案所有 Blockly 互動、TXT 設定與 TXT Test Panel 都已集中在同一個 WebView 中。
- `messageHandler.ts` 與 `webviewManager.ts` 已假設只有一個主要編輯 WebView；若再開新的 VS Code panel，會額外引入雙 panel 狀態同步、生命周期與 reload 一致性問題。
- 使用同一個 WebView 可以直接重用現有的工具列、主題、i18n、save/load 與 TXT 專案判斷邏輯。
- 這也符合本 feature 在規格與澄清中建立的方向：虛擬控制是 TXT 專案的編輯/執行輔助介面，而不是另一個獨立工具視窗。

**Alternatives considered**：

- **獨立 VS Code WebviewPanel**：會增加跨 panel 狀態同步與視窗管理複雜度，對第一版過重。
- **外部瀏覽器頁面**：脫離 VS Code 使用體驗，也會破壞既有 save/load 與專案綁定模型。

---

## 研究議題二：虛擬控制版面應如何持久化？

**Decision**：在 `blockly/main.json` 既有封裝結構下，新增根層級 `txtVirtualControls` 欄位，與 `workspace`、`board` 並列保存；**不把虛擬控制資料硬塞進 Blockly serializer 本體**。

**Rationale**：

- 目前 `handleSaveWorkspace()` / `handleRequestInitialState()` 已掌握 `blockly/main.json` 的根物件格式，擴充 sibling 欄位是最小侵入路徑。
- 虛擬控制不是 Blockly block，本質上屬於 TXT 專案的額外 UI state；放在 serializer 外層，比強行註冊自訂 Blockly serializer 更直觀，也更容易做 migration。
- 這種做法能讓 Extension Host 專責檔案保存與恢復，而 WebView 專注畫布狀態與互動。
- 若未來需要 schema version 或局部修復，也能在 `txtVirtualControls` 節點獨立處理，不影響 Blockly 原本的 block state。

**Alternatives considered**：

- **自訂 Blockly serializer**：理論上可行，但對第一版來說複雜度偏高，也會把非 block 資料綁進 Blockly 生命周期。
- **額外獨立 JSON 檔案**：會增加檔案數量與一致性風險，且 save/reload 需要處理多檔同步。
- **只保存在記憶體中**：不符合 SC-004 與專案重開可完整還原的需求。

---

## 研究議題三：按鈕名稱、程式參照與穩定綁定該怎麼拆？

**Decision**：每個虛擬按鈕都維持三層身分：

1. `stableId`：不可見、不可變的穩定內部識別
2. `displayName`：學生看得到、可自由修改的名稱
3. `identifier`：由系統產生的安全程式參照名稱

程式積木內部只綁 `stableId`；畫面上顯示最新 `displayName`；generator 在產生程式碼時解析目前 `identifier`。

**Rationale**：

- 這直接對應已完成的 clarify：改名不應破壞既有積木引用。
- `displayName` 與 `identifier` 分離後，學生可使用中文、空格、特殊符號；程式端仍可得到安全名稱。
- `stableId` 作為真正引用鍵，能支援 rename、duplicate-like names、刪除後保留失效引用等情境。
- `identifier` 可在 rename 後重新計算並保持唯一，而不影響 block 綁定穩定性。

**Alternatives considered**：

- **直接用 `displayName` 當綁定鍵**：rename 後會斷引用。
- **直接用 `identifier` 當綁定鍵**：學生看到的名稱與內部參照仍會耦合，且 rename 流程不夠直觀。
- **禁止 rename / delete**：與規格中的教學友善要求衝突。

---

## 研究議題四：執行期虛擬按鈕通道是否可以重用 `io_server.py`？

**Decision**：**不可以**。Program Mode 的虛擬控制輸入必須使用**獨立於 `io_server.py` 的 companion runtime**，由 Extension Host 在 TXT 執行流程中另外管理。

**Rationale**：

- 目前 `TxtUploader.upload()` 在啟動使用者程式前，會先 kill 舊的 `main.py` 與 `io_server.py`；這代表 Test Panel runtime 本來就不是為了 Program Mode 並存設計。
- `TxtTestService.installAndStartServer()` / `startServer()` 也會先停用戶程式再啟動 `io_server.py`，反向證明兩者共享同一 ftrobopy owner 時存在衝突。
- 規格已明確要求「虛擬控制輸入 MUST 與既有硬體測試用途分離」。
- 如果把 Program Mode 強行疊在 `io_server.py` 上，會讓「Test Panel」與「執行中虛擬按鈕」共用同一語意，造成生命周期與 UX 混亂。

**Alternatives considered**：

- **直接重用 `io_server.py`**：與 `txtUpload` / Test Panel 現有 lifecycle 衝突。
- **讓使用者程式自己開 HTTP server 接收 UI 輸入**：會把 runtime 通訊與使用者程式邏輯耦合過深，generator 複雜度過高。
- **透過不斷 SSH 覆寫檔案傳狀態**：延遲高、可靠度差，不適合按鈕 press/release 互動。

---

## 研究議題五：companion runtime 與使用者程式如何共享按鈕狀態？

**Decision**：companion runtime 透過 HTTP 接收 Extension Host 傳來的最新按鈕 snapshot，並將 canonical state 寫入 TXT 本機檔案（例如 `/tmp/singular_blockly/virtual_controls_state.json`）；生成的使用者程式透過 helper 函式以 `stableId` 讀取快取後的狀態。

**Rationale**：

- Extension Host 已具備與 TXT 建立 SSH/HTTP 互動的 service 模式，新增一個 companion runtime 最符合現有架構。
- 讓使用者程式直接讀本機 state file，比每次按鈕判斷都去打 HTTP 更穩定，也更容易在 generator 端包裝成簡單 API。
- canonical state file 可被 runtime 重設、初始化與 session 切換明確管理，避免上一次執行殘留狀態滲入新 session。
- 這條路徑讓 WebView、Extension Host、TXT runtime、generated Python code 四層責任分離清楚。

**Alternatives considered**：

- **使用者程式直接 HTTP 輪詢 runtime**：每次讀值都做網路 I/O，對 Blockly 生成出的 tight loop 不是好預設。
- **runtime 與使用者程式共用 stdout / stdin 通道**：`TxtUploader` 目前是 foreground SSH exec，互動通道控制會變得非常脆弱。
- **用資料庫或更重的 IPC**：對教學裝置與第一版功能都是過度設計。

---

## 研究議題六：失效引用應如何影響執行流程？

**Decision**：一旦工作區中仍有虛擬按鈕失效引用，系統就**阻止開始執行**；前端與 Host 端都需要做 preflight 檢查與明確提示。

**Rationale**：

- 這是 clarify 已正式寫入 spec 的決策，不能在 planning 階段再弱化成 fallback 行為。
- 對學生來說，「不能開始，先修正這個按鈕」比「程式有跑但行為默默變成 false」更容易理解。
- WebView 先做檢查可即時顯示哪個 block 壞掉；Host 端再做一次檢查可避免 UI 漏網或 message 被繞過。
- 這也與目前 TXT upload 流程是一致的：開始執行前應先確保產出與環境是可執行的。

**Alternatives considered**：

- **缺失引用視為未按下**：會把真正的配置錯誤偽裝成正常執行。
- **略過相關積木**：學生更難理解為什麼某段邏輯消失。
- **刪除按鈕時自動刪 block**：破壞使用者工作內容，也與 clarify 結論相反。

---

## 研究議題七：測試策略應如何分層？

**Decision**：採用「Host/service 與資料邏輯盡量自動化、WebView drag/互動採契約 + 手動驗證」的混合測試策略。

**Rationale**：

- 憲法 Principle VII 已允許對高互動 WebView 功能使用手動驗證，只要手動情境明確列在 spec / plan。
- 本功能最大的風險點同時涵蓋：
  - save/load persistence
  - 命名/綁定/失效引用
  - WebView 編輯模式拖曳
  - 執行模式 press/release 與 runtime 傳輸
- 其中 persistence、preflight validation、identifier 生成與 Host service 行為適合做單元 / 契約測試；drag、顏色即時預覽與執行時 UI 鎖位則較適合手動驗證。

**Alternatives considered**：

- **全部手動測試**：容易漏掉 stableId / persistence / invalid reference regression。
- **第一版就全做 E2E 瀏覽器自動化**：投入成本過大，不符合本 feature 第一版範圍。

---

## 研究摘要表

| 議題 | 決策 | 信心度 |
|------|------|--------|
| UI 承載面 | 同一個 Blockly WebView 內新增 TXT 虛擬控制畫布 | 高 |
| 持久化位置 | `blockly/main.json` 根層級 `txtVirtualControls` | 高 |
| 參照模型 | `stableId + displayName + identifier` 三層分離 | 高 |
| 執行期通道 | 獨立 companion runtime，不重用 `io_server.py` | 高 |
| 狀態共享 | runtime 寫 canonical state file，generated helper 讀取 | 中高 |
| 失效引用策略 | 阻止開始執行，前後端雙重 preflight | 高 |
| 測試策略 | 單元/契約 + 手動 WebView / 硬體驗證混合 | 高 |
