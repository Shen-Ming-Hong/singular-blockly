---
name: cloud-local-verification
description: 在雲端容器或無螢幕的 Linux（Claude Code on the web、Codex cloud、CI 以外的遠端環境）本地驗證 Singular Blockly 的 PR 或分支。當使用者要求「解 PR」、「雲端本地測試」、「不要只看 GitHub CI」、「視覺／互動驗證」、「截圖 Blockly 編輯器」時使用。涵蓋 Node 24 工具鏈切換、與 CI 對齊的靜態／安全／單元測試、Node 22 最低相容檢查，以及用 Playwright 驅動真實 VS Code 開啟 Blockly webview 截圖與拖曳積木。Verify PRs locally in a headless cloud container, including VS Code webview screenshots and Blockly drag-and-drop checks.
---

# 雲端本地驗證與視覺互動檢查

GitHub CI 是第二道把關，不是唯一證據。每個要交付或合併的變更，都先在本地容器跑完與 CI 對齊的檢查；有 UI 影響時再做真實 VS Code 的視覺與互動驗證。只回報實際執行過的結果，不把未執行或失敗的項目寫成通過。

驗證照 [驗證分層](../maintain-singular-blockly/references/verification-tiers.md) 控制在幾分鐘內：合併門檻是型別檢查、單元測試、API 測試、建置與受影響畫面五項；畫面只看這次改到的元件用在哪些畫面，多個組合同時跑；完整流程（所有寬度、README GIF、逐張比對）只在改到全站樣式、版面框架、大版本升級或 Ray 要求時跑。

## 1. 準備工具鏈

1. 確認 Node 版本與 `.nvmrc`（目前 24.20.0）一致。雲端映像的 `PATH` 常先找到 `/opt/node22/bin`，`node -v` 會是 22：

   ```bash
   node -v; cat .nvmrc
   # 不是 24.20.0 時，安裝到 /opt/node24 並放到 PATH 最前面（每個 shell 都要 export）
   curl -fsSLO https://nodejs.org/dist/v24.20.0/node-v24.20.0-linux-x64.tar.xz
   mkdir -p /opt/node24 && tar -xJf node-v24.20.0-linux-x64.tar.xz -C /opt/node24 --strip-components=1
   export PATH=/opt/node24/bin:$PATH
   ```

2. 網路允許清單至少需要：`nodejs.org`、`registry.npmjs.org`、VS Code 下載（`update.code.visualstudio.com`、`*.vo.msecnd.net`／`vscode.download.prss.microsoft.com`）、需要硬體建置時的 PlatformIO 與 Arduino 相關網域。被擋時回報缺少的網域，不要關閉 TLS 驗證或繞過 proxy。
3. 一個 PR 一個 worktree，各自 `npm ci`；不要共用 `node_modules`。VS Code 測試執行檔下載後在 `.vscode-test/`，可複製到其他 worktree 省下下載時間。

## 2. 與 CI 對齊的檢查

依變更範圍選擇；依賴、工具鏈、發布或共用程式碼變更時全部執行。開發中先只跑改到的測試檔（例如 `xvfb-run -a npx vscode-test --label unit --skip-extension-dependencies --run out/test/messageHandler.test.js`，約 5 秒），最後在最終 head 跑一次完整命令。

| 檢查                | 命令                                                                                                                      | 對應 CI job                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 安全                | `npm audit --audit-level=high`                                                                                            | Static and security checks              |
| 靜態                | `npm run ci:static`                                                                                                       | Static and security checks              |
| 單元                | `xvfb-run -a npm run test:unit:ci`                                                                                        | Unit tests（vscode／vscodium × 三平台） |
| 最低 Node           | 用 Node 22.x 執行 `npm ci && npm run compile-tests && npm run compile && npm run test:release && npm run release:prepare` | Minimum Node.js 22 compatibility        |
| 積木／工具箱／Skill | `npm run generate:project-skills` 後 `npm run check:project-skills`                                                       | `ci:static`                             |
| 貢獻者技能          | `npm run check:skills`                                                                                                    | `ci:static` 第一步                      |

- `ci:static` 不含 `npm audit`；CI 的安全步驟是獨立的，兩者都要跑。
- Blockly 版本寫在產品 Skill contract 中。升級 `blockly` 後 `check:skill-contract` 會回報 stale，需重新產生並提交。
- 失敗時先判斷是否為既有問題：在 merge-base 的乾淨 worktree 重跑相同命令。base 也失敗（例如 master 的 audit 紅燈）時，先以獨立 PR 修 base，再讓其他 PR 跟上。
- 只改文件的 PR（`docs/`、`specs/`、`.github/skills|prompts|agents/`、`.agents/skills/`、`.claude/skills/`、`AGENTS.md`、`CLAUDE.md`、`CONTRIBUTING.md` 等，完整清單見 `.github/workflows/ci.yml` 的 `changes` job）在 CI 只跑 static，不跑 Node 22、單元矩陣與 VSIX 打包；合併後 `master` push 仍跑完整 CI。若文件 PR 夾帶技能腳本（例如 `.github/skills/*/scripts/*.mjs`），本地實際執行一次該腳本並回報結果。
- 最低 Node 檢查使用容器內現有的 Node 22（例如 `/opt/node22/bin`）時，回報實際版本；與 CI 的 22.16.0 不同時要寫明。

## 3. 視覺與互動驗證

有 webview、積木、工具箱、主題、i18n 或 Blockly 依賴變更時執行。腳本以 Playwright 驅動 `.vscode-test/` 中真實的 VS Code，載入本分支的擴充，開啟 Blockly 編輯器，截圖並從 flyout 拖一個積木到工作區。先依驗證分層的「元件對畫面」表找出受影響的畫面與參數，只跑那些組合。

```bash
npm run compile                      # 產生 dist/extension.js
xvfb-run -a npm run test:unit:ci     # 第一次執行時順便下載 .vscode-test/ 的 VS Code

# playwright-core 裝在 repo 外，不要加入專案依賴
mkdir -p /tmp/sb-pw && (cd /tmp/sb-pw && npm init -y >/dev/null && npm i playwright-core@1.56.1 --no-audit --no-fund)

NODE_PATH=/tmp/sb-pw/node_modules xvfb-run -a -s "-screen 0 1440x900x24" \
  node .github/skills/cloud-local-verification/scripts/vscode-webview-smoke.mjs \
  --out /tmp/sb-visual --board uno --theme light
```

- 多個組合（例如寬＋窄、淺色＋深色）同時跑：每個組合一個程序，各自 `xvfb-run -a` 與 `--out`，用 `&` 啟動後 `wait`。實測兩個組合並行約 20 秒、三個約 25 秒，和只跑一個差不多。
- 受影響畫面的參數：`--main-json <檔案>` 直接放入準備好的 `blockly/main.json`（板子與積木寫在檔案裡，不靠拖曳備資料）；`--click "<選擇器>,<選擇器>"` 依序點擊並各截一張 `05-click-1.png`、`06-click-2.png`…；`--skip-default` 略過工具箱、拖曳與右鍵選單；`--command "<命令標題>" --ready "<選擇器>"` 開其他面板（例如 `--command "Singular Blockly: Provide Feedback" --ready "#feedbackForm"`）。選擇器優先用 `[data-testid="…"]`，其次固定的 `id`，不用文字或結構。
- 全新的使用者資料會自動開導覽並展開工具列；腳本預設先按「略過」，這時工具列收合，次要按鈕（語言、主題、搜尋等）要先點 `#toolbarActionsToggle`，例如 `--click "#toolbarActionsToggle,#languageToggle"`。要驗導覽本身時加 `--keep-tour`。
- 每個截圖狀態都會自動檢查並寫進 `result.json` 的 `checks.uiAudit`，彙總在 `auditSummary`：`webviewErrors`、`nativeDialogs`（frame 內的 `alert`／`confirm`／`prompt` 與 VS Code 模態對話框）、`horizontalScrollStates`、`maxSmallText`（HTML 文字小於 12px，不含 Blockly SVG 積木文字）、`maxSmallTargets`（按鈕、連結、表單元件、`role=button|menuitem|tab|option` 小於 24×24 px，WCAG 2.2 SC 2.5.8）。任一項不是 0，就用同一組參數在 `origin/master` 跑一次比較，本次新增的要修；點擊目標候選要人工判斷 2.5.8 的例外（行內連結、間距足夠）。已知基準：`origin/master` 目前每次都有 1 筆 `[實驗積木] 實驗積木提示元素未找到`，其餘四項為 0。改前的腳本不略過導覽，窄視窗時導覽卡片蓋住積木，右鍵選單步驟會被跳過（`contextMenu` 為 null）。
- 參數：`--board`（`uno`、`esp32`、`cyberbrick` 等 `main.json` 的 board 值）、`--theme light|dark`、`--repo`（預設目前目錄）、`--size 寬x高`（調整 VS Code 視窗大小，`result.json` 的 `checks.windowSize` 記錄實際內容區大小）、`--overlay-scrollbars`（開啟 Chromium 浮動捲軸，近似 macOS 預設，用來檢查捲軸樣式在 Mac 上是否仍生效）。依變更挑選會受影響的組合，例如主題變更就各跑一次 light／dark。
- 腳本會建立隔離的使用者資料與工作區，並放一個 PlatformIO 擴充空殼，讓擴充在沒有真實 PlatformIO IDE 時也能啟用；結束後刪除暫存目錄。
- 輸出：`01-editor-open.png`、`02-flyout-open.png`、`03-after-drag.png`、`04-context-menu.png`（在積木上按右鍵並把選單高度限制為 48px，強制出現捲軸）（失敗時 `99-failure.png`）與 `result.json`；`checks.contextMenu` 記錄未限制高度時 `fitsWithoutScrollbar` 應為 true、限制後是否溢出，以及計算後的 `scrollbar-color`／`scrollbar-width`。
- `result.json` 判讀：`workspaceRendered` 為 true、`blocklyVersion` 符合預期、`toolboxCategories` 大於 0、`dragAddedBlocks` 為 1、`generatedCode` 有內容；`webviewErrors` 只收 webview 內的 console error，與 base 分支比較後只回報新增的錯誤。
- 一定要用圖片檢視工具實際看截圖，確認版面、配色與文字，不能只依數值判斷。
- UI/UX 變更：截圖拿來對照 `maintain-singular-blockly`「動手前」選定的業界參考，亮色與深色主題各看一次，並檢查受影響元件（含右鍵選單、捲軸、對話框等）在兩個主題下的配色與狀態是否一致。
- 以下幾條（窄視窗、Mac 捲軸、改前改後比對、點擊之後、對話框）只套用在改到的元件與畫面；所有寬度與所有板子的完整掃描屬於驗證分層第 6 條的完整流程。
- **窄視窗：** 改到工具列、工具箱、右鍵選單、對話框或面板版面時，除了預設大小，再用 `--size 900x700` 跑一次（約等於 13 吋筆電開著側邊欄或分割編輯器時的編輯器寬度），確認按鈕沒有被擠掉、文字沒有截斷到看不懂、選單沒有超出畫面。工具列或對話框的版面大改（新外觀、重新排列）時，改跑一組寬度：1920、1440、1280、1024、900、768、600（Ray 2026-11-16 要求做不同尺寸檢查）。
- **Mac 捲軸：** 新增或改到會捲動的區域（下拉選單、清單、對話框內容、flyout）時，加 `--overlay-scrollbars` 再跑一次，實際展開到出現捲軸，亮暗主題各看一次，並確認同一區塊只有一層在捲動。只在一般捲軸下截圖會漏掉 Mac 才有的粗黑滑桿（#255 修了右鍵選單後，#266 的語言選單與備份清單又在 Ray 的 Mac 上出現同樣問題）。
- **改前改後比對：** 不該改變外觀的變更（重構、依賴升級、Blockly 或 VS Code 相容性修正），在 `origin/master` 的乾淨 worktree 與本分支用同一組參數各跑一次，逐張比對 `01`～`04` 截圖（例如 ImageMagick 的 `compare -metric AE`，再用圖片檢視工具看差異位置）。有差異就查出原因，確認是預期內的才放行；本來就要改外觀的變更，用這組改前截圖做 PR 的前後對照。比對時兩邊用同一個 `.vscode-test/` 的 VS Code 與同一組字型，不另外塞測試用 CSS，避免差異來自環境而不是程式。
- **點擊之後的畫面：** 只截開啟後的第一個畫面會漏掉點了之後才出現的問題。改到的流程要實際點開（對話框、選單、展開收合、切換板子），每一步都截圖。逐張看浮動元件（工具列、回饋按鈕、通知）有沒有蓋住積木清單、積木或按鈕；有被蓋住就算不通過，即使拖曳仍然成功。
- **對話框：** 改到對話框時再確認按 Esc 會關閉、關閉後焦點回到開啟它的按鈕（`document.activeElement`）、預設大小與 `--size 900x700` 都沒有水平捲軸或被截掉的欄位。
- 已知雜訊：以 root 執行的警告、Singular Core／PlatformIO Core 安裝進度通知、切換板子後的 reload 提示。它們不是本次變更造成的，除非變更本身與這些流程有關。
- 需要更深的互動（特定積木、右鍵選單、程式碼預覽）時，沿用腳本找出 Blockly frame 的方式，在 frame 內用 `Blockly.getMainWorkspace()` 與 DOM 操作補充步驟；新增的流程若可重用，更新本腳本。

### README 操作說明 GIF

README 的 `docs/images/readme/*.gif` 由 `scripts/record-readme-gifs.mjs` 在真實 VS Code 中錄製（開啟編輯器與選板子、拖積木並在下方看 `src/main.cpp` 更新、切換語言與深色主題），VS Code 本身固定用預設亮色主題（Default Light Modern）。積木、工具列或主題的外觀明顯改變時重錄：準備步驟同上，再依腳本開頭的命令跑 `open`、`build`、`language` 三個場景（`build` 要在 `language` 之前），需要 `ffmpeg`。看過輸出的 GIF 再複製到 `docs/images/readme/`，三個檔案合計保持在約 1.5 MB 以內。`docs/**` 已被 `.vscodeignore` 排除，不會進 VSIX。

## 4. 回報

- 在 PR 描述的測試計劃中列出實際執行的命令、Node 版本與結果數字（例如 `1403 passing, 2 pending`）。
- 截圖附在對話或 PR 留言中，說明看到了什麼；Marketplace／發布相關的證據不要放在暫存路徑後就宣稱已保存。
- 本機通過但 CI 失敗時，以 CI log 為準重新診斷，不要因為本機通過就略過。
- Commit／push／PR 交給 `git-workflow`；依賴 PR 交給 `manage-dependabot-prs`；安全 finding 交給 `security-vulnerability-fix`；合併與發布交給 `pr-review-release`。
