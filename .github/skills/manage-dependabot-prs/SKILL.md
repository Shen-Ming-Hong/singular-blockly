---
name: manage-dependabot-prs
description: 盤點、排序、分類並逐項處理本專案的 Dependabot Pull Requests。當使用者提到 Dependabot PR、依賴更新 PR、GitHub Actions 更新、套件升級排序、批次依賴維護、評估 dependency PR 是否需要 SDD、合併或關閉 Dependabot PR 時使用。先以唯讀 triage 區分 Security Update 與 Version Update、建立相依順序與 SDD gate，再一次處理一個獨立風險群組；不得把例行版本更新誤當安全發布。Triage, prioritize, classify, and safely resolve this repository's Dependabot PRs, including SDD decisions and routing security updates to the dedicated vulnerability workflow.
---

# Dependabot PR 管理

把大量自動 PR 轉成可審查的工作佇列。先完成全體唯讀盤點並取得使用者對順序與處置的核准，再一次處理一個獨立風險群組。

## 核心規則

- Triage 階段只讀取資料；不得 comment、rebase、close、merge、push 或修改 `dependabot.yml`。
- 不依 PR 標題猜測是否為安全更新；交叉比對 Dependabot Alerts、PR body／files 與 `npm audit`。
- Security Update 與 Version Update 分流。只有安全公告／Alert／audit finding 才使用安全修補發布流程。
- 不按 PR 編號盲目處理。先排序 urgency、blast radius、依賴關係與 CI 狀態。
- 一次只實作一個獨立風險群組。上一項未合併且 `master` 未同步前，不開始下一項。
- 不直接把額外 commits 推到 Dependabot bot branch。需要相容性修正時，從最新 `master` 建立 human-owned `codex/deps-*` 分支與替代 PR。
- 不使用 `npm audit fix --force`、寬鬆 `npm update` 或未限定範圍的 overrides。
- 依賴與 Actions 的 breaking change 必須查官方 release notes／migration guide；技術判斷只採一手來源。

## Phase 0：確認操作模式

把請求分類為：

- **Triage only**：盤點、排序、分群、SDD 判斷；完成報告後停止。
- **Resolve one item**：處理已核准佇列中的一項或一個同風險群組。
- **Reconfigure Dependabot**：調整 grouping、cooldown、ignore 或 open PR limit；視為獨立設定變更，不混入套件升級。

使用者只說「處理 Dependabot PR」時，預設先執行 Triage only，不得直接合併。

## Phase 1：唯讀盤點

1. 確認 repo、default branch、本地分支與工作區狀態。
2. 取得所有 open Dependabot PR，至少包含：number、title、URL、author、head/base、created/updated time、labels、body、files、mergeability 與 checks。
3. 取得 open Dependabot Security Alerts，並執行本地 `npm audit` 交叉比對。
4. 對每張 PR 記錄：
   - ecosystem：npm 或 GitHub Actions。
   - package／group 與 from → to。
   - security update 或 version update。
   - direct／transitive、runtime／dev／CI。
   - SemVer delta：patch／minor／major。
   - lockfile、manifest、workflow 與 production code 變更範圍。
   - CI 狀態、merge conflict、blocked peer dependency 與其他 PR 的重疊。
5. 查詢目標版本的官方 changelog、migration guide、engines／peer requirements 與已知 breaking changes。

可使用唯讀命令：

```bash
gh pr list --state open --author app/dependabot --json number,title,url,headRefName,baseRefName,createdAt,updatedAt
gh pr view {PR_NUMBER} --json title,body,labels,files,commits,mergeable,statusCheckRollup
gh api repos/{OWNER}/{REPO}/dependabot/alerts
npm audit
```

GitHub API、registry 或 PR 狀態是即時資料，每次 triage 都重新查詢，不沿用舊對話快取。

## Phase 2：排序與分群

依序套用以下優先級；同級再依 blast radius 由小到大：

| 等級 | 條件 | 預設處置 |
| --- | --- | --- |
| P0 | open Critical／High Security Alert、已知可利用 runtime 漏洞 | 立即路由安全修補技能 |
| P1 | 阻擋 CI/CD、目前 runtime 即將失效、必要相容性基線 | 優先建立獨立修復項目 |
| P2 | 低風險 patch／minor、lockfile-only、同域 grouped update | 驗證後優先清理 |
| P3 | test runner、lint、CLI 等非語言基線工具的 major update | 獨立相容性評估後處理 |
| P4 | runtime、language／compiler、VS Code engine 或無急迫性的高 blast radius major migration | 延後並先做 SDD gate |

排序時另外遵守：

- 先處理其他 PR 的 prerequisite，再處理被依賴者。
- 不把 npm 與 GitHub Actions 混為同一實作項目。
- 只在套件、風險、驗證方式與 rollback 邊界相同時分群。
- grouped PR 若只有單一 dependency 失敗，優先拆出該 dependency；不要讓整組長期阻塞。
- 多張 PR 更新同一 manifest／lockfile 時，排定序列並預期 Dependabot 重新 rebase 或自動關閉過時 PR。

## Phase 3：SDD Gate

為每個工作項目輸出 `No SDD`、`Lightweight plan` 或 `Full SDD`，並附一句理由。

### No SDD

符合以下全部條件時使用：

- 行為與架構契約不變。
- 變更侷限於版本、lockfile、Action SHA 或少量相容性設定。
- 官方 migration 指引清楚，驗收可由現有測試覆蓋。
- 不改 runtime API、使用者設定、持久化格式或跨 Extension Host／WebView contract。

Language／compiler major（例如 TypeScript major）不得在未讀官方 migration guide 與編譯差異前直接判為 No SDD；至少先做 SDD gate，依實際 blast radius 選 Lightweight plan 或 Full SDD。

### Lightweight plan

用於主要 test／lint／build 工具升級，或涉及多個設定檔但沒有產品設計決策。先列出受影響設定、相容性修正、測試矩陣與 rollback，再實作；不建立完整 spec artifacts。

### Full SDD

符合任一條件時使用：

- 依賴升級迫使產品 runtime 行為、API、資料格式、安全模型或使用者設定改變。
- 涉及多個架構層或 Extension Host／WebView／generator contract。
- 有多種遷移方案、重大 breaking change 或不可逆決策。
- 需大規模程式碼遷移，現有驗收標準不足以界定完成狀態。

先檢查既有 `specs/` 是否已有相符 feature；需要完整 SDD 時依專案順序使用：`$speckit-clarify` → `$speckit-specify` → `$speckit-plan` → `$speckit-tasks` → `$speckit-analyze` → `$speckit-implement` → `$speckit-checklist`。未通過對應 gate 前不得開始依賴實作。

## Phase 4：提交 Triage 報告並停止

輸出固定表格：

| Priority | PR | Update type | Scope | Delta | CI | Dependencies | SDD | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

Recommendation 只能是：

- `merge as-is after validation`
- `replace with human-owned PR`
- `split or regroup`
- `defer`
- `ignore with documented reason`
- `close as superseded`

接著列出：

1. 建議處理順序與分群。
2. 每項必要測試與官方資料來源。
3. 適合另開新對話的工作項目及 handoff prompt。
4. 需要使用者決定的 ignore、defer、split、close 或 SDD 選項。

等待使用者核准排序與指定第一個工作項目。Triage 核准不自動授權後續所有 merge 或發布。

## Phase 5：逐項處理

每個獨立工作項目建議使用新對話，並帶入：PR URL、from/to、分類、官方 migration 重點、SDD 決定、驗證清單與已核准處置。不要把整份歷史 triage 原文塞入每個對話。

### Security Update

完整使用 [security-vulnerability-fix](../security-vulnerability-fix/SKILL.md)。由該技能決定修復版本、雙語 CHANGELOG、PATCH release、PR、annotated tag 與 Actions CD。不要在本技能複製或繞過其核准 gate。

### Version Update

1. 從最新且乾淨的 `master` 建立隔離分支／worktree。
2. 先檢查 Dependabot diff；不得假設 bot 產生的 lockfile 一定正確。
3. 若可原樣合併，直接在隔離環境驗證該 PR commit，不新增無關變更。
4. 若需程式碼、設定、測試或多 PR 合併：建立 human-owned branch，重做最小版本更新並加入必要修正；保留原 PR URL 作為追蹤依據。
5. npm 更新至少驗證：`npm ci`、`npm audit`、`npm ls {PACKAGE}`、`npm run ci:static`、`npm run test:unit:ci`。工具鏈／發布相關更新再執行 `npm run test:release` 與 `npm run release:prepare`。
6. GitHub Actions 更新必須保留完整 commit SHA pin，核對 upstream tag／SHA，並執行 workflow YAML、release contract 與受影響 CI 驗證。
7. 使用本地 code review 比較 `origin/master...HEAD`，檢查 regression、breaking changes、lockfile 異常、engine／peer mismatch 與供應鏈風險。
8. 例行 Version Update 不自動 bump extension 版本或發布。若使用者要求正式發布，再完整使用 [git-workflow](../git-workflow/SKILL.md) 與 [pr-review-release](../pr-review-release/SKILL.md)。

## Phase 6：遠端動作與完成條件

- comment、`@dependabot recreate`、ignore、close、push、建立替代 PR 或 merge 都是遠端 mutation；執行前重述確切 PR 與動作，並確認已在使用者核准範圍內。
- grouped PR 建置失敗時，可在核准後使用 `@dependabot recreate`；若單一套件持續失敗，調整 `exclude-patterns` 或建立獨立人工 PR。
- ignore 必須記錄套件、版本範圍、原因、風險、重新評估條件與日期；不得用 ignore 掩蓋 Security Alert。
- 只在 required checks、review 與 branch rules 全部通過後 merge。
- merge 後同步 `master`，重新盤點剩餘 PR；確認 Dependabot 是否自動 rebase／關閉 superseded PR，再開始下一項。

每項完成時回報：PR／replacement PR、實際版本、SDD 決定、測試、merge 狀態、剩餘風險，以及下一個佇列項目。不得聲稱整批完成，除非重新 triage 後已無待處理項目。

## 相關資源

- [安全漏洞修補技能](../security-vulnerability-fix/SKILL.md)
- [Git 工作流程技能](../git-workflow/SKILL.md)
- [PR Review 與發布技能](../pr-review-release/SKILL.md)
- [CI/CD 操作手冊](../../../docs/ci-cd.md)
- [Dependabot 設定](../../dependabot.yml)
