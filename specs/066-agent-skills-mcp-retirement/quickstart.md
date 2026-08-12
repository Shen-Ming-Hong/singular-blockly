# Phase 1 Quickstart：驗收 Agent Skills 取代 MCP

本文件供實作者與審查者在完成 tasks 後重現主要驗收。產品 Skill 的實際內容仍必須是英文；本驗收文件依專案規範使用繁體中文。

## 1. 開發環境基線

```bash
npm install
npm run generate:skill-contract
npm run check:skill-contract
npm run compile-tests
npm run lint
npm run validate:i18n
npm test
npm run package
```

預期：不需啟動 MCP server；`check:skill-contract` 不修改 working tree；VSIX 含完整 `dist/project-skills/singular-blockly/` 資產。Node.js 只用於此貢獻者驗收，不是終端使用者前置條件。

## 2. 新專案靜默安裝

1. 使用沒有 Singular Blockly MCP 設定、沒有可供 shell 呼叫之系統 Node.js 的 VS Code 1.109+ 驗收環境。
2. 建立或開啟可寫入的 Singular Blockly 專案，不先建立 `.agents` 或 `.claude`。
3. 等待 extension 的專案啟動流程完成，期間不開啟任何 Skills 設定 UI。
4. 確認 30 秒內存在契約文件列出的正式 Skill、Claude 入口、manifest、project notes 與 `ready` 狀態。
5. 確認沒有確認對話框、成功通知、Node.js 警告、MCP 命令或 MCP 設定。
6. 確認所有受管理人類可讀檔案為英文，且 Claude 入口只引用正式契約。
7. 記錄檔案雜湊後再次啟動相同版本，確認 `no-change` 檢查不重寫 manifest、status 或其他專案檔案。

若 `.claude/skills/singular-blockly/SKILL.md` 是在目前 Claude Code session 啟動後首次建立，依官方限制開啟新的 Claude session 再測試發現；extension 不主動重啟外部代理，也不顯示通知。

## 3. 更新與使用者內容保護

1. 安裝舊版 fixture Skill，編輯一個受管理 reference，並在 Skill 目錄加入自訂檔案。
2. 編輯 `project-notes.md`，記錄其原始 bytes。
3. 以新版 extension 重新啟動專案。
4. 確認受管理檔更新、Claude 入口同步、manifest 最後提交。
5. 確認被修改的受管理檔在 `blockly/.singular-blockly/skill-backups/<timestamp>/` 有逐位元相同備份。
6. 確認 project notes 與自訂檔逐位元不變，AI 狀態只列專案相對備份路徑。
7. 注入 Claude 入口寫入失敗，再確認整組 rollback，沒有新舊混合檔被標成 `ready`，且一般使用者通知為零。

## 4. 代理理解與有效修改

分別以 VS Code/Codex 與 Claude Code 從其專案入口開始：

1. 要求代理說明目前板型、主要積木流程與輸出檔位置。
2. 要求代理依 `block-contract.json` 新增一段合法流程，不能發明 type 或 field。
3. 等待 `main.json` runtime 驗證後，在 Blockly 編輯器確認積木可見並可再次儲存。
4. 重新開啟專案並確認工作區仍有效。
5. 對代表性板型產生程式，確認 Arduino 為 `src/main.cpp`、CyberBrick 為 `src/rc_main.py`、TXT Controller 為 `src/main.py`。

兩個代理應解析到相同 `.agents/skills/singular-blockly/SKILL.md` 與相同契約雜湊。

另以既有無效 `main.json` 初次開啟編輯器，確認該檔先經 disposable runtime gate、沒有短暫載入正式 workspace；再關閉面板後外部改檔，確認 activation 層 watcher 仍進入隔離／恢復。

## 5. 無效候選資料保護

先建立已通過驗證的 `main.json` 與 `main.json.bak`，再依序外部寫入：

- 截斷 JSON
- 未知 block type
- 錯誤 field value
- 非法 connection
- 缺少必要 extra state
- 不適用目前板型的 block
- 孤立或產品 guard 拒絕的 block
- 空物件與刪除主檔
- 讓 WebView 驗證超過 10 秒

每次確認候選沒有進入正式畫面、`main.invalid.json` 保存最新候選、主檔恢復最後有效內容，且在地化警告與 Output 診斷沒有完整 workspace 或絕對路徑。連續寫入 6 個不同無效候選後，確認時間歷史只有最近 5 份，且 `main.json`、`main.json.bak` 與固定最新隔離檔未被清理。

## 6. 競態與內部寫入

1. 在 500ms debounce 與 runtime 驗證期間快速寫入三個候選，讓第二個回覆晚於第三個。
2. 確認只有第三個 generation 能提交。
3. 在使用者拖曳積木時送入有效候選，確認驗證 deadline 不延後、正式載入可安全延後。
4. 觀察正常儲存、備份、隔離與恢復，確認 watcher 不形成循環。

## 7. 移除 MCP 與回歸

```bash
rg -n "@modelcontextprotocol|mcpServerDefinitionProviders|checkMcpStatus|mcp\.nodePath|showStartupWarning" package.json package-lock.json src media README.md webpack.config.js
```

預期無產品端 MCP／Node 偵測殘留。接著確認：

- `engines.vscode` 與 `@types/vscode` 基準為 1.109。
- 貢獻者 Node engine、npm 建置、PlatformIO、mpremote 與硬體上傳仍存在。
- 15 語系驗證通過，沒有孤立 MCP 字串。
- 舊版有效專案不需 migration，即可開啟、編輯、儲存與產生三種程式。
