# Phase 0 研究：Agent Skills 取代 MCP

## R-001：專案 Skill 的正式來源與相容入口

**決策**：以 `.agents/skills/singular-blockly/` 為唯一正式契約，另在 `.claude/skills/singular-blockly/SKILL.md` 建立不含重複規則的精簡入口。正式與相容 `SKILL.md` 都使用 `name: singular-blockly`，並以測試確保相容入口只導向正式契約。

**理由**：目前 VS Code Agent Skills 文件將 `.agents/skills`、`.claude/skills` 與 `.github/skills` 列為 workspace 搜尋位置；VS Code 1.109 發布時則以 `.github/skills` 與 `.claude/skills` 為預設專案位置。因此 `.claude` 入口能覆蓋最低支援版，`.agents` 能提供跨代理、工具中立的正式來源。Claude Code 官方文件明列專案 Skills 位於 `.claude/skills/<skill-name>/SKILL.md`，且支援模型依 description 自動載入。

**替代方案**：

- 只建立 `.agents/skills`：VS Code 1.109 與 Claude Code 的最低相容性不足。
- 在兩個位置複製完整 Skill：更新時可能產生兩份分歧契約，違反唯一正式來源。
- 使用符號連結：Windows、版本控制與受限 workspace 的行為不一致。

**來源**：

- [VS Code — Use Agent Skills in VS Code](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [VS Code 1.109 Release Notes — Agent Skills](https://code.visualstudio.com/updates/v1_109)
- [Claude Code — Extend Claude with skills](https://code.claude.com/docs/en/slash-commands)

## R-002：Skill 格式與漸進式揭露

**決策**：正式 `SKILL.md` frontmatter 只放 `name` 與 `description`，名稱使用小寫英數與連字號且與目錄一致。主要流程留在 `SKILL.md`，大量積木 metadata、工作區格式與 JSON schema 放在一層 references，全部直接由主文件連結且固定使用英文。

**理由**：VS Code 與 Claude Code 都以 YAML frontmatter 的名稱與描述判斷 Skill 是否相關，並在需要時載入本文及 references。官方建議主檔精簡、資源使用相對路徑；本地 `skill-creator` 也要求避免多餘說明文件及深層 reference chain。

**替代方案**：

- 把全部積木資料塞入 `SKILL.md`：會在每次載入時消耗過多 context，降低代理判斷品質。
- 由使用者執行腳本查詢積木：重新引入系統 Node.js／執行環境要求，也增加安全面。
- 為 15 種 UI 語言產生 Skill：內容容易漂移，且不符合已決定的全英文產品契約。

**來源**：

- [VS Code — Agent Skill folder structure](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [Claude Code — Skill structure and invocation](https://code.claude.com/docs/en/slash-commands)

## R-003：積木契約的權威來源

**決策**：由建置腳本實際載入目前 Blockly runtime、專案 block definitions、所有板型工具箱及動態 flyout 公開類型，對每個可建立 type 實例化並序列化，產生穩定排序的英文契約。CI 使用 `--check` 驗證 tracked 產物未過時。

**理由**：現有 MCP dictionary 是手工 metadata，與工具箱已出現差異；只有 runtime 實例能反映實際 inputs、fields、connections、extra state 與序列化結果。Blockly 官方建議使用 JSON serialization，並指出反序列化有明確的依賴順序，因此契約範例也必須完成真實 load/save round-trip。

**替代方案**：

- 延用 MCP dictionary：手工內容已經可能缺漏或包含 UI 不可建立的積木，無法證明完整性。
- 只掃描 toolbox JSON：無法得知 runtime 連線、欄位、extra state，也會漏掉動態 flyout 積木。
- 只掃描 `Blockly.Blocks` registry：會把 mutator、內部 helper 或目前 UI 不可建立的類型列為公開契約。

**來源**：

- [Blockly — Save and load](https://developers.google.com/blockly/guides/configure/web/serialization)

## R-004：候選工作區的真實驗證位置

**決策**：Extension Host 負責檔案監看、逾時、隔離與恢復；WebView 使用已載入的相同 block definitions，在 disposable headless workspace 中執行候選資料的 load/save round-trip。驗證成功前不改動正式畫面 workspace。

**理由**：自訂積木與 WebView runtime 無法安全地直接匯入現有 Node.js 測試環境；只做 JSON schema 檢查也無法驗證未知 block、dynamic extra state、field validator 及連線。一次性 workspace 能使用產品真實 runtime，又能在例外時直接 dispose，不污染使用者畫面。

**替代方案**：

- 先載入正式 workspace 再捕捉錯誤：失敗可能已清空或部分改變使用者畫面。
- 在 Extension Host 另建一套 validator：會複製 Blockly 規則並持續漂移。
- 只要求 AI 自我驗證：無法形成產品端資料保護邊界。

**來源**：

- [Blockly — JSON workspace serialization](https://developers.google.com/blockly/guides/configure/web/serialization)

## R-005：最後有效版本與隔離保留

**決策**：沿用 `blockly/main.json.bak` 作為持久化最後有效版本；驗證成功後才原子更新。失敗候選保存為固定最新檔 `main.invalid.json`，另保存最多 5 份 UTC 時間歷史。主檔刪除、WebView 不可用及 10 秒逾時都使用相同恢復路徑。

**理由**：專案已有 `.bak` 慣例，可減少新格式；把所有失敗收斂到同一狀態機能避免不同錯誤路徑的資料遺失。固定檔名與嚴格歷史檔 pattern 讓保留清理可被安全測試。

**替代方案**：

- 只保留最新無效檔：無法診斷連續 AI 修改。
- 無上限保存：專案可能持續膨脹。
- 依賴版本控制復原：未提交專案或初學者環境不能獲得即時保護。

## R-006：受管理檔案更新策略

**決策**：封裝 manifest 使用固定相對目標與 SHA-256 辨識受管理 payload；installed manifest 本身是最後提交記錄，不列入自己的雜湊清單。更新前逐位元備份被修改的已知檔案，未知檔案永不接管；以同一 workspace volume 的暫存檔、原子 rename、rollback 資料與最後提交 manifest 組成交易。舊 manifest 只能為新版 allowlist 中相同 target 提供既有雜湊，不能宣告額外寫入路徑。狀態與診斷只記錄英文錯誤碼及專案相對路徑。

**理由**：整個 Skill 目錄替換會刪除專案筆記與自訂檔；逐檔直接覆寫則可能留下新舊混合。manifest 加內容雜湊能區分官方舊版、使用者修改及未知內容，而 rollback 能滿足任一必要入口失敗時不得標示成功的要求。

**替代方案**：

- 永遠覆寫整個目錄：破壞使用者內容。
- 永遠保留被修改的受管理檔：新版規則無法可靠到達 AI，且不符合已確認的覆寫決策。
- 遇到修改就詢問：違反專案啟動靜默自動更新要求。

## R-007：Claude Code 的執行中發現限制

**決策**：安裝在專案啟動即進行；驗收時若 `.claude/skills` 頂層目錄是在目前 Claude Code session 開始後首次建立，重新啟動該代理 session 後再驗證發現。這不是使用者確認，也不影響之後對既有 skills 目錄的變更偵測。

**理由**：Claude Code 官方文件指出既有 skills 目錄中的變更可即時偵測，但在執行中首次新增頂層 skills 目錄需要重新啟動 session。產品應盡早建立入口，測試也必須區分「檔案建立成功」與「既有代理 session 已重新掃描」。

**替代方案**：

- 由擴充套件重啟外部代理：超出權限與產品範圍。
- 顯示要求使用者重啟的成功通知：違反 Skills 建立過程不顯示一般通知的要求。

**來源**：

- [Claude Code — Discover skills](https://code.claude.com/docs/en/slash-commands)
