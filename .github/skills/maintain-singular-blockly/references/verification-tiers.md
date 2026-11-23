# 驗證分層（快速版）

Ray 2026-11-23 定的規則：每個 PR 的驗證在幾分鐘內完成，合併門檻不靠一條從頭點到底的長流程。本文件把那九條對應到本專案（VS Code 擴充套件、Blockly webview、回饋服務 Worker）。命令細節在 `cloud-local-verification`，合併條件在 [整合佇列與自主合併](merge-queue.md)。

參考：Google Testing Blog〈Just Say No to More End-to-End Tests〉與 Test Sizes（測試金字塔：多數在單元與服務層，少量 UI）、Playwright Best Practices 與 Locators（`getByTestId`、測試互相隔離、平行執行）、Cloudflare Workers Vitest integration（`@cloudflare/vitest-pool-workers`，本專案用其後繼套件 `@cloudflare/vitest-plugin`）、expand/contract（parallel change）遷移模式、WCAG 2.2 SC 2.5.8 Target Size (Minimum)。

## 1. 合併門檻：五項

| 門檻 | 本專案的命令 | 何時跑 |
| --- | --- | --- |
| 型別檢查 | `npm run compile-tests`（tsc）、`npm run feedback:typecheck`、`npm run lint` | 都在 `npm run ci:static` 裡，每個 PR |
| 單元測試 | `xvfb-run -a npm run test:unit:ci`（Mocha，跑在 VS Code 內） | 程式碼 PR；只改文件時不跑 |
| API 測試 | 回饋 Worker：`npm run feedback:test`（在 `ci:static` 裡）；Extension Host 的服務與 WebView 訊息約定：`src/test/services/`、`src/test/webview/`、`src/test/messageHandler.test.ts`、`src/test/suite/*contract*`（含在 `test:unit:ci`） | 碰到對應程式時 |
| 建置 | `npm run compile`（webpack），CI 另打包 VSIX | 每個程式碼 PR |
| 受影響畫面 | `vscode-webview-smoke.mjs`，參數依下方「元件對畫面」選 | 改到 `media/` 或 webview 時 |

另外照舊：`npm audit --audit-level=high`、GitHub 上的 `CI Gate` 與 CodeQL。最低 Node 22 檢查由 CI 跑；本地只在依賴、工具鏈或發布設定變更時跑。

開發中先跑改到的那幾個測試檔（`xvfb-run -a npx vscode-test --label unit --skip-extension-dependencies --run out/test/<路徑>.test.js`，`messageHandler.test.js` 約 5 秒，或 `npx vitest run --config workers/feedback/vitest.config.mts <檔案>`），全部通過再跑一次完整的門檻命令。

## 2. 規則放在 API 層測

- **對應：** 權限、資料規則、連動行為寫成不開瀏覽器的測試。
  - 回饋 Worker：401／403、Access、`OWNER_ACTOR_IDS`、webhook HMAC、狀態轉換、刪除 fail closed，都寫在 `workers/feedback/test/`。Vitest 透過 `@cloudflare/vitest-plugin` 在 workerd 裡跑，D1 是 miniflare 的本機資料庫，會先套用 `migrations/` 全部檔案，不連正式環境。
  - Extension Host：WebView 送來的訊息驗證（檔名、路徑、板子名稱、工作區 JSON 的 load/save/load 閘門）、`FileService` 的寫入規則、上傳流程的參數組裝，用 Mocha + Sinon 直接呼叫 handler 或服務，注入 `FileSystem` 假物件。
- 每支測試幾秒內跑完。等待用假時鐘（Sinon fake timers）或注入的延遲，不寫真的 `setTimeout` 等候。
- **新增規則時先故意改壞一次：** 暫時把守門條件拿掉或反轉，只跑那個測試檔，確認它失敗、而且失敗訊息指向這條規則；還原後再跑一次確認通過。PR 描述寫「已確認改壞時會失敗」與用的測試檔。
- 不適用：本專案沒有對外的使用者登入或多租戶權限，擴充套件端的「權限」指工作區信任、檔案路徑邊界與 WebView 訊息來源。

## 3. 畫面驗證只看受影響的畫面

找出這次改到的檔案用在哪些畫面，每個畫面直接開、只點改到的元件。

- 備資料用 `--main-json <檔案>`：直接放入準備好的 `blockly/main.json`（板子、積木都寫在檔案裡），不靠拖曳積木備資料。檔案放在 scratchpad 或 `/tmp`，不進 repo。
- 只點改到的元件用 `--click "<選擇器>,<選擇器>"`，每點一下截一張圖；不需要工具箱、拖曳、右鍵選單時加 `--skip-default`。其他面板用 `--command "<命令標題>" --ready "<選擇器>"` 開。
- 每個狀態腳本會自動檢查並寫進 `result.json`：webview console error、原生對話框（`alert`／`confirm`／`prompt` 與 VS Code 模態對話框）、水平捲動、小於 12px 的字、小於 24×24 px 的點擊目標（WCAG 2.5.8）。`auditSummary` 任一項不是 0 或 false，就和 `origin/master` 用同一組參數比較；本次新增的要修，既有的寫進 PR 描述。點擊目標的候選項要人工判斷：行內連結、與鄰近目標有 24px 間距的小目標是 2.5.8 的例外。
- 每張截圖都要用圖片檢視工具看過。

### 元件對畫面

| 改到的檔案 | 受影響的畫面 | 冒煙參數 |
| --- | --- | --- |
| `media/blockly/blocks/`、`generators/`、`media/toolbox/` | 編輯器：工具箱、flyout、工作區、程式碼 | 用到該積木的板子（`--board`），`--main-json` 放入那個積木；淺色一次 |
| `media/js/blocklyEdit.js` 工具列與選單、`media/css/blocklyEdit.css` 的對應區塊 | 編輯器工具列、語言／主題／板子選單 | `--click "#toolbarActionsToggle,<改到的按鈕>"`（腳本略過導覽後工具列是收合的）；淺色＋深色；寬＋窄 |
| `blocklyEdit.html` 的 `#backupModal`、`#functionSearchModal`、`#blockPackModal`、`#blockDesignerModal`、`#sampleModal`、`#txtConnectionModal`、`#txtTestPanelDialog`、`#cyberbrickUploadSettingsModal` | 該對話框 | `--click` 開啟按鈕（例如 `#backupButton`）；對話框規則見 `cloud-local-verification` |
| `media/js/guidedTour.js` | 導覽各步驟 | `--keep-tour`，`--click` 依序點下一步 |
| `media/js/blocklyPreview.js`、`blocklyPreview.html` | 備份預覽 | 從 `#backupModal` 開預覽 |
| `media/html/feedback.html`、`media/js/feedback.js`、`media/css/feedback.css` | 回饋面板 | `--command "Singular Blockly: Provide Feedback" --ready "#feedbackForm"` |
| `platformioDiagnostic.*` | PlatformIO 診斷面板 | `--command "Singular Blockly: Check PlatformIO Status" --ready "#contentRoot"` |
| `media/blockly/themes/`、`blocklyEdit.css` 的根變數與版面、`blocklyEdit.html` 的整體結構 | 全部 | 依第 6 條跑完整流程 |
| `media/locales/` | 文字變長的畫面 | 受影響語系至少一個，窄視窗 |

表上沒有的檔案，用 `grep -rn <函式或 id> media/ src/webview/` 從 import 與 DOM id 找呼叫端，再補進這張表。

## 4. 兩種尺寸同時跑

VS Code 擴充套件沒有手機版（vscode.dev 在手機瀏覽器不是支援範圍），「筆電與手機」對應成寬視窗（預設 1440×900）與窄視窗（`--size 900x700`），淺色與深色也照這樣同時跑：每個組合一個獨立程序，各自 `xvfb-run -a` 與 `--out`，用 `&` 一起啟動再 `wait`。腳本每次都建立隔離的使用者資料與工作區，可以並行。

## 5. 選元素用固定的 test id

- 新增或改到的 webview 元素加 `data-testid`（kebab-case，例如 `data-testid="upload-button"`），腳本與測試用 `[data-testid="…"]` 找它；還沒改到的元素先用既有的固定 `id`。不用文字、`nth-child` 或 DOM 結構猜。
- Blockly 產生的 DOM 不是本專案的，用 Blockly 的公開 API（`Blockly.getMainWorkspace()`）與公開 CSS class。
- 改功能時，對應的測試與冒煙參數在同一個 PR 一起改。

## 6. 完整流程只在必要時跑

完整流程是：所有寬度（1920、1440、1280、1024、900、768、600）、淺色與深色、浮動捲軸、所有板子、README GIF 重錄、和 `origin/master` 逐張比對。只在以下情況跑：

- 改到全站樣式或版面框架（主題檔、`blocklyEdit.css` 根變數與整體版面、`blocklyEdit.html` 結構、工具列整體排列）。
- Blockly、`@blockly/theme-modern` 或 VS Code 引擎的大版本升級。
- Ray 要求。

其他 PR 只做第 3 條的受影響畫面。

## 7. 合併後的部署與版本核對

- **擴充套件：** 合併不會發布。發布由協調者依 `pr-review-release` 推 annotated tag，`publish.yml` 自動發到 GitHub Release、Marketplace 與 Open VSX，`verify` job 核對 checksum 與 Release 資產。等 workflow 結束的通知，不要手動一直查。Marketplace 與 Open VSX 上架版本還沒有自動核對，目前由發布流程人工確認。
- **回饋服務：** 部分不適用。Ray 2026-10-21 定的規則是每次正式部署都要 Ray 在討論串同意（見 `maintain-feedback-service`），所以合併後不會自動部署。部署後的核對（`/health`、三個政策頁、新的 version id）照部署手冊用命令一次跑完，不要人工逐頁點。
- 本專案沒有網站要部署。

## 8. 資料遷移：expand／contract

- **D1（回饋服務）：** 先上只新增欄位或資料表、新舊程式都能讀的 migration 與 Worker；確認流量都在新版後再搬資料；最後才用另一個 migration 移除舊欄位。三步各是一個 PR、各自經 Ray 同意部署。
- **正式資料寫入前先備份：** 套用 migration 或寫入正式 D1 前，用 `npx wrangler d1 time-travel info singular-blockly-feedback --config workers/feedback/wrangler.jsonc`（一律作用在遠端資料庫）取得目前的 bookmark 並寫進部署紀錄，以便回復；回饋內容是私人資料，不匯出到容器或 repo。
- **工作區檔案（`blockly/main.json`）：** 新欄位先讓讀取端接受、寫入端照舊；新版本發布一段時間後才改寫入格式；舊欄位最後才移除。改變持久化格式屬於 SDD 範圍。覆寫使用者的工作區前，沿用既有的自動備份。

## 9. 回報時附上量測

- 記下四個時間：開始改、改完（第一次推送）、本地驗證開始與結束、合併。
- 回報寫「改完到合併 N 分鐘（其中等 CI M 分鐘）、本地驗證 K 分鐘」，列出跑了哪些命令；有並行時寫實際經過的時間，不寫各程序加總。
- 本專案「上線」：非發布 PR 指合併進 `master`；發布指 `publish.yml` 的 `verify` 成功。
