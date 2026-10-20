# 維護經驗

只讀與本次變更相關的條目。每條規則須有可指向的根因或驗證證據；新證據改變既有規則時，修正原條目。

## [工作區] 候選資料先通過真實 Blockly 驗證

- **問題：** 外部程式可直接寫入 `blockly/main.json`，JSON 語法正確仍可能含未知積木、錯誤連線或不適用板型。
- **規則：** 保留 `WorkspaceCandidateService` 與 WebView disposable workspace 的 load/save 驗證及復原流程；不要只靠 JSON schema 就提交到正式工作區，也不要以空白狀態覆蓋有效備份。
- **證據：** `src/services/workspaceCandidateService.ts`、`src/test/services/workspaceCandidateService.test.ts`、`src/test/suite/workspaceValidation.contract.test.ts`。

## [專案 Skill] 修改來源後重建契約與 manifest

- **問題：** 已安裝 Skill、runtime 積木分片與封裝 manifest 各有產生或複製流程，直接改輸出會造成下一次更新時漂移。
- **規則：** 修改 `resources/project-skills/singular-blockly/` 的封裝來源；積木、工具箱或 schema 變更也重建 runtime 契約。核對生成差異及 `check:project-skills`。
- **證據：** `scripts/generate-skill-contract.js`、`scripts/generate-project-skill-manifest.js`、`src/test/suite/projectSkillLayout.contract.test.ts`。

## [邊界] 一般資料夾須先取得編輯器開啟授權

- **問題：** Extension 啟動或管理 Runtime 預熱時，工作區不一定已是 Singular Blockly 專案。
- **規則：** 保留專案辨識與 editor-open 的 `opened` 邊界；一般資料夾在取消或沒有 workspace 時，不應由 Skill 安裝或設定讀取建立專案檔案。
- **證據：** `docs/specifications/06-features/agent-skills.md`、`src/services/projectSkillService.ts`、`src/test/services/projectSkillService.test.ts`。

## [PR / CodeQL] Ready PR 必須確認目前 head 已產生 CodeQL 結果

- **問題：** PR #183 先以 draft 建立，之後轉為 ready；原本的 CI Gate 已成功，但 branch rules 仍因目前 head 沒有 CodeQL 結果而拒絕 squash merge。單純 `ready_for_review` 沒有讓該 head 產生 required CodeQL result。
- **規則：** 已核准且準備立即驗證的 human-owned PR 預設直接建立 ready PR。合併前必須檢查目前 PR head 的 CodeQL 結果，不能只看 `CI Gate`。若 PR 曾是 draft 且轉 ready 後仍沒有 CodeQL，在確認 branch rules、CodeQL default setup 與 tree 內容後，可在已核准的 human-owned branch 建立不改檔案內容的 empty commit 觸發新的 PR commit event；不得繞過 ruleset，也不得把此復原手段當成一般流程。
- **證據：** PR #183、repository ruleset `master protection` 的 `code_scanning: CodeQL` 規則，以及 PR #183 後續空 commit 觸發的 Actions／Python／JavaScript-TypeScript CodeQL 全綠結果。

## [依賴] Vitest major 必須跟隨 Cloudflare plugin 的 peer contract

- **問題：** Dependabot PR #175 與 #185 都嘗試把 Vitest 4 升到 Vitest 5，但 `@cloudflare/vitest-plugin` 目前最新版 1.3.0 的 `peerDependencies.vitest` 仍為 `^4.1.0`；直接升級會讓 `npm ci` 因 peer dependency 衝突失敗。
- **規則：** 自 2026-09-28 起，例行 `vitest` semver-major version update 暫時由 Dependabot ignore；Vitest 4.x 的 minor／patch 更新仍照常評估，security update 不得以此規則延後。當 Cloudflare plugin 官方 peer contract 支援 Vitest 5 時，移除此 major hold 並重新做 Lightweight plan／相容性驗證。
- **證據：** PR #175、PR #185，以及 `cloudflare/workers-sdk` 的 `packages/vitest-plugin/package.json`（1.3.0：`vitest ^4.1.0`）。

## [Blockly] 不同來源的警告使用獨立 ID

- **問題：** Blockly 的 `setWarningText(null)` 未帶 ID 時會清除全部警告；板型刷新可能連帶清掉孤立積木警告。
- **規則：** 板型、孤立及其他獨立警告的設定與清除都帶各自的 ID；新積木仍保留產生器與 onchange 的三層孤立 guard。
- **證據：** `media/js/blocklyEdit.js`、`media/blockly/blocks/esp32-rc.js`、`src/test/suite/esp32Rc.contract.test.ts`。

## [PR / 並行] base 紅燈會讓所有開啟中的 PR 同時失敗

- **問題：** 2026-10-20 時 #195–#198 與 #179 全部紅燈，看起來像各自的問題；實際上 `master` 的 `npm audit --audit-level=high` 有 11 個 high（sharp、braces、source-map-js），每個 PR 的 Static and security checks 都因此失敗。#198 另外還有 Blockly 版本寫入 Skill contract、`@types/node` 型別變更兩個真正的失敗。
- **規則：** 多個 PR 同一個 check 失敗時，先在 `master` 重現；base 的問題以獨立 PR 修並排在合併佇列最前面，再逐一同步其他 PR，依 `references/merge-queue.md` 的「base 紅燈先修 base」處理。不要把 base 修補混進各 PR 的主要變更。
- **證據：** PR #199（audit 修補）、#200（取代 #198 並疊在 #199 上）、#179 與 #201 以 merge 併入 #199 後轉綠。

## [發布] 雲端工作階段不推 tag，改由 Actions 建立

- **問題：** 2026-10-20 發布 0.90.0 時，發布 PR 已合併，但雲端工作階段推 annotated tag 被安全檢查擋下，發布卡在最後一步，只能請 Ray 回本機推。
- **規則：** 雲端發布在發布 PR 合併、`master` CI 綠燈後，由工作階段自行排程檢查並立即從 `master` 觸發 `create-release-tag.yml`（不等 Ray 提醒），由它建立 tag 並在同一 run 發布；不要在雲端嘗試 `git push origin v*`，也不要因 workflow 已建立 tag 就重新觸發它，失敗時只重跑失敗 jobs。workflow 推 tag 需要 ruleset「release tag creation」的 bypass 含 GitHub Actions；0.90.0 首次 run（39443756197）因缺少它被拒，修正是儲存庫設定，由 Ray 處理。
- **證據：** `.github/workflows/create-release-tag.yml`、`publish.yml` 的 `workflow_call` 入口、`scripts/release/prepare-release.test.js` 的契約測試。
