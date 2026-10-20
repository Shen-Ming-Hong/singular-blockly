---
name: cloud-local-verification
description: 在雲端容器或無螢幕的 Linux（Claude Code on the web、Codex cloud、CI 以外的遠端環境）本地驗證 Singular Blockly 的 PR 或分支。當使用者要求「解 PR」、「雲端本地測試」、「不要只看 GitHub CI」、「視覺／互動驗證」、「截圖 Blockly 編輯器」時使用。涵蓋 Node 24 工具鏈切換、與 CI 對齊的靜態／安全／單元測試、Node 22 最低相容檢查，以及用 Playwright 驅動真實 VS Code 開啟 Blockly webview 截圖與拖曳積木。Verify PRs locally in a headless cloud container, including VS Code webview screenshots and Blockly drag-and-drop checks.
---

# 雲端本地驗證與視覺互動檢查

GitHub CI 是第二道把關，不是唯一證據。每個要交付或合併的變更，都先在本地容器跑完與 CI 對齊的檢查；有 UI 影響時再做真實 VS Code 的視覺與互動驗證。只回報實際執行過的結果，不把未執行或失敗的項目寫成通過。

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

依變更範圍選擇；依賴、工具鏈、發布或共用程式碼變更時全部執行。

| 檢查                | 命令                                                                                                                      | 對應 CI job                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 安全                | `npm audit --audit-level=high`                                                                                            | Static and security checks              |
| 靜態                | `npm run ci:static`                                                                                                       | Static and security checks              |
| 單元                | `xvfb-run -a npm run test:unit:ci`                                                                                        | Unit tests（vscode／vscodium × 三平台） |
| 最低 Node           | 用 Node 22.x 執行 `npm ci && npm run compile-tests && npm run compile && npm run test:release && npm run release:prepare` | Minimum Node.js 22 compatibility        |
| 積木／工具箱／Skill | `npm run generate:project-skills` 後 `npm run check:project-skills`                                                       | `ci:static` 第一步                      |

- `ci:static` 不含 `npm audit`；CI 的安全步驟是獨立的，兩者都要跑。
- Blockly 版本寫在產品 Skill contract 中。升級 `blockly` 後 `check:skill-contract` 會回報 stale，需重新產生並提交。
- 失敗時先判斷是否為既有問題：在 merge-base 的乾淨 worktree 重跑相同命令。base 也失敗（例如 master 的 audit 紅燈）時，先以獨立 PR 修 base，再讓其他 PR 跟上。
- 只改文件的 PR（`docs/`、`specs/`、`.github/skills|prompts|agents/`、`.agents/skills/`、`.claude/skills/`、`AGENTS.md`、`CLAUDE.md`、`CONTRIBUTING.md` 等，完整清單見 `.github/workflows/ci.yml` 的 `changes` job）在 CI 只跑 static，不跑 Node 22、單元矩陣與 VSIX 打包；合併後 `master` push 仍跑完整 CI。若文件 PR 夾帶技能腳本（例如 `.github/skills/*/scripts/*.mjs`），本地實際執行一次該腳本並回報結果。
- 最低 Node 檢查使用容器內現有的 Node 22（例如 `/opt/node22/bin`）時，回報實際版本；與 CI 的 22.16.0 不同時要寫明。

## 3. 視覺與互動驗證

有 webview、積木、工具箱、主題、i18n 或 Blockly 依賴變更時執行。腳本以 Playwright 驅動 `.vscode-test/` 中真實的 VS Code，載入本分支的擴充，開啟 Blockly 編輯器，截圖並從 flyout 拖一個積木到工作區。

```bash
npm run compile                      # 產生 dist/extension.js
xvfb-run -a npm run test:unit:ci     # 第一次執行時順便下載 .vscode-test/ 的 VS Code

# playwright-core 裝在 repo 外，不要加入專案依賴
mkdir -p /tmp/sb-pw && (cd /tmp/sb-pw && npm init -y >/dev/null && npm i playwright-core@1.56.1 --no-audit --no-fund)

NODE_PATH=/tmp/sb-pw/node_modules xvfb-run -a -s "-screen 0 1440x900x24" \
  node .github/skills/cloud-local-verification/scripts/vscode-webview-smoke.mjs \
  --out /tmp/sb-visual --board uno --theme light
```

- 參數：`--board`（`uno`、`esp32`、`cyberbrick` 等 `main.json` 的 board 值）、`--theme light|dark`、`--repo`（預設目前目錄）。依變更挑選會受影響的組合，例如主題變更就各跑一次 light／dark。
- 腳本會建立隔離的使用者資料與工作區，並放一個 PlatformIO 擴充空殼，讓擴充在沒有真實 PlatformIO IDE 時也能啟用；結束後刪除暫存目錄。
- 輸出：`01-editor-open.png`、`02-flyout-open.png`、`03-after-drag.png`（失敗時 `99-failure.png`）與 `result.json`。
- `result.json` 判讀：`workspaceRendered` 為 true、`blocklyVersion` 符合預期、`toolboxCategories` 大於 0、`dragAddedBlocks` 為 1、`generatedCode` 有內容；`webviewErrors` 只收 webview 內的 console error，與 base 分支比較後只回報新增的錯誤。
- 一定要用圖片檢視工具實際看截圖，確認版面、配色與文字，不能只依數值判斷。
- 已知雜訊：以 root 執行的警告、Singular Core／PlatformIO Core 安裝進度通知、切換板子後的 reload 提示。它們不是本次變更造成的，除非變更本身與這些流程有關。
- 需要更深的互動（特定積木、右鍵選單、程式碼預覽）時，沿用腳本找出 Blockly frame 的方式，在 frame 內用 `Blockly.getMainWorkspace()` 與 DOM 操作補充步驟；新增的流程若可重用，更新本腳本。

## 4. 回報

- 在 PR 描述的測試計劃中列出實際執行的命令、Node 版本與結果數字（例如 `1403 passing, 2 pending`）。
- 截圖附在對話或 PR 留言中，說明看到了什麼；Marketplace／發布相關的證據不要放在暫存路徑後就宣稱已保存。
- 本機通過但 CI 失敗時，以 CI log 為準重新診斷，不要因為本機通過就略過。
- Commit／push／PR 交給 `git-workflow`；依賴 PR 交給 `manage-dependabot-prs`；安全 finding 交給 `security-vulnerability-fix`；合併與發布交給 `pr-review-release`。
