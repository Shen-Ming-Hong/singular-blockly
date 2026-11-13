# SDD 分級與 Spec Kit 版本門檻

寫程式前依技能主文件「動手前」第 1 步判斷要不要走 SDD；本文件補上分級方式、啟動 SDD 前的版本門檻，以及 SDD 進行中的規則。觸發清單與階段順序以 `AGENTS.md`「Spec-Driven Development」為準，這裡不重複。

## 依複雜度與規模分三級

先看 `AGENTS.md` 的觸發清單，再看規模訊號；兩者取較高的一級。拿不準時往上一級算。

| 等級 | 什麼時候用 | 要做的事 |
| --- | --- | --- |
| **No SDD** | 文案、翻譯、文件與技能；沿用既有樣式的小修正；根因已知、只改一個模組且不改任何約定的 bug；版本或 lockfile 小幅更新 | 直接依本技能維護。PR 的「SDD 判斷」寫一句為何不符合 |
| **Lightweight plan** | 沒有碰到觸發清單，但符合任一規模訊號：同一表面內改到多個檔案或模組；根因未知、要先追查的 bug；主要 test／lint／build 工具或多個設定檔升級；新增不改約定的內部重構 | 動手前在 PR 描述（或草稿 PR）先寫：範圍與受影響檔案、做法、驗證矩陣、回退方式。不建立 `specs/` 產物 |
| **Full SDD** | 碰到 `AGENTS.md` 觸發清單任一項；或規模上同時改到兩個以上表面（Extension Host、WebView、產生器、上傳器、產品 Skill）；新增使用者設定、指令、板型或積木類別；有多種做法要取捨，或決定之後難以回頭 | 先通過下方版本門檻，再依 `AGENTS.md` 的順序跑完 Spec Kit |

`manage-dependabot-prs` 的 Phase 3 用同樣三級判斷依賴升級。等級在工作中途變高（例如追查後發現要改約定）時，停下來改走較高的一級，不要把已寫的程式當成理由留在較低的一級。

## Spec Kit 版本門檻（啟動或接續 SDD 前必做）

判定要走 Full SDD、使用者指定 `speckit-*`，或要接續既有的 SDD 功能時，先完成以下五步，才能產生或修改 SDD 產物。每個新任務或接續工作時重做一次；同一段連續工作可沿用這次的結果。No SDD 與 Lightweight plan 不需要這道門檻。

1. **查最新版。** 執行 `specify version`（CLI 支援時加 `specify self check`），並查官方最新穩定 release：`git ls-remote --tags https://github.com/github/spec-kit` 取最大的 `vX.Y.Z`，或看 [官方 releases](https://github.com/github/spec-kit/releases/latest)。以當天查到的穩定 tag 為準，不用預覽版、開發分支或過去的紀錄。`specify check` 只檢查環境，不能代替版本查詢。
2. **升級 CLI。** 沒裝或不是最新穩定版時，依 [官方升級指南](https://github.github.io/spec-kit/upgrade.html) 升到剛查到的 tag：支援時用 `specify self upgrade --tag <tag>`，否則用 `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@<tag>`（已安裝時加 `--force`；這個 `--force` 只重裝 CLI，不是第 4 步禁止的專案覆寫）。
3. **同步專案整合。** 在本任務的 worktree 執行 `specify integration status`，對照 `.specify/integration.json` 與 manifest；版本沒同步時執行 `specify integration upgrade codex`。只升級全域 CLI 不算完成。
4. **保留專案自訂內容。** 檢查升級產生的 diff：保留 `AGENTS.md`、`.github/skills` 的貢獻者技能、constitution、既有 `specs/`、自訂範本，以及 `.github/agents/speckit.*.agent.md`、`.github/prompts/speckit.*.prompt.md` 這些 Copilot SDD 檔案（`AGENTS.md` 規定保留，`integration.json` 仍只裝 Codex）。遇到 managed-file 衝突先看過再整合，不用專案升級的 `--force` 覆蓋。
5. **驗證後才放行。** 重跑 `specify version` 與 `specify integration status`，確認 CLI 是最新穩定版、專案整合已同步、沒有缺檔或未解衝突，再重新讀一次更新後的 `speckit-*` 技能。命令結束碼是 0 不代表升級成功。

在 PR 描述的「SDD 判斷」段落記錄查核日期、官方來源、升級前後的 CLI 與整合版本。Spec Kit 升級本身改到 `.specify/` 與 `.agents/skills/speckit-*`，用獨立的先行 PR 合併，再開始功能的 SDD，不要和功能變更混在同一個 PR。

查不到官方版本、安裝或升級失敗、版本不一致或整合仍有衝突時，**停下 SDD**，回報原因與修復方式；不要沿用舊版繼續，也不要把未確認的狀態當成通過。雲端工作階段被權限擋下安裝時，用決策卡請 Ray 核准安裝那個官方 tag，核准前不寫 SDD 產物。

## SDD 進行中

- **接續前先確認階段。** 讀 `.specify/feature.json` 與對應的 `specs/NNN-*/`，判斷已完成 spec、plan、tasks 中的哪幾個，再從下一個階段接著做。
- **中間產物不單獨合併。** specify、clarify、plan、tasks、analyze 的產物在功能完成前留在任務分支（可以是草稿 PR），不進整合佇列；完成 implement 與 converge、`speckit-analyze` 沒有阻擋發布的不一致後，功能才算可以合併。Spec Kit 升級或治理類的先行 PR 不受此限。
- **一路做完。** 通過版本門檻後，依 `AGENTS.md` 的順序做完所有階段，不在階段之間停下來問「要不要繼續」。clarify 有合理預設時把預設寫進 spec 的 Assumptions 繼續，只有影響範圍、安全或使用者體驗、又沒有合理預設的問題才問 Ray，一次最多三題。
- **只在真的卡住時停。** 例如需要新的權限或憑證、版本門檻失敗、需要 Ray 的產品決定或硬體實測、發現自己修不好的產品問題。停下時回報已完成的產物與下一個階段，保留分支與檔案以便接續。
