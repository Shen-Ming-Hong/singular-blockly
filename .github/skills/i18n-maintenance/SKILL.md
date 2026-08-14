---
name: i18n-maintenance
description: 維護 Singular Blockly 的 15 語系翻譯品質。當新增、修改、審查或發布 media/locales、package.nls、範例 title/description、nameTranslations、stringTranslations，或提到翻譯、i18n、localization、語意審計、缺少 key、placeholder、audit-all 時使用。先執行 deterministic validation，再以版本化政策審計語意；支援最多三輪的增量修復與可續跑全量審計。
---

# i18n 語意維護

把硬性結構檢查交給 deterministic scripts，把需要語境的翻譯判斷留在本 Skill。不要用平均分數取代單一安全或操作錯誤。

## 載入契約

1. 每次都先讀 [semantic-policy.md](references/semantic-policy.md)。
2. 只讀本次涉及語系在 [locale-policy.md](references/locale-policy.md) 的段落；全量審計才讀完整檔案。
3. 校準分類、更新本 Skill 或遇到邊界案例時，讀 [golden-cases.md](references/golden-cases.md)。
4. 讀 `docs/specifications/02-internationalization/audit-state.json` 判斷是否需要恢復或開始全量審計。

## 選擇模式

- **增量修復**：使用者要求新增或修改翻譯。允許修改本次範圍，完成硬檢查與語意修復。
- **唯讀 gate**：code review 或發布 Phase 0。只回報 findings；取得使用者核准前不要修改。
- **`audit-all`**：完整審計所有批次。不得自動改寫既有翻譯，只更新 audit state；既有 Blocker 阻擋，Major 形成待辦。

## 1. 界定增量範圍

1. 使用 `git status --short`、`git diff --name-only`、`git diff --cached --name-only`。
2. 若 `origin/master` 存在，加入 `git diff --name-only $(git merge-base origin/master HEAD)...HEAD`；不要為取得 base 自動 fetch。
3. 納入：
   - `media/locales/*/messages.js`
   - `package.nls*.json`
   - `media/samples/index.json`
   - 範例 JSON 的 `nameTranslations`、`stringTranslations`
   - 新增或改變意義的使用者可見來源文字及其 call site
4. 英文新增 key 時，14 個目標語系都是本次範圍。既有、未修改的錯誤不自動修復。
5. `audit-state.json` 的更新不視為翻譯變更，避免遞迴觸發。

## 2. 執行硬檢查

先取得機器可讀結果：

```bash
node scripts/i18n/validate-translations.js --all --format=json
```

- Exit `0`：進入語意審計。
- Exit `1`：以 `code|surface|locale|key` 建立排序後錯誤簽章，在增量修復模式修正本次範圍。
- Exit `2`：環境、解析或設定失敗；停止並回報 `BLOCKED`，不可假裝通過。

最多進行三輪修復。每輪都重跑 JSON validator；同一簽章連續兩輪、問題數未下降或譯文來回震盪時提前停止。不要為了讓檢查通過而刪除必要 placeholder、key 或例外規則。

## 3. 執行增量語意審計

1. 以實際程式行為與核准規格決定意圖；英文是 key／placeholder 基準，不是凌駕行為的權威。
2. 逐項套用規則 ID，並區分 severity 與 evidence。
3. finding 必須包含：

```text
id: <surface>:<locale>:<key>:<rule-id>
ruleId: SEM-...
severity: Blocker | Major | Minor | Info
evidence: deterministic | policy-backed | context-backed | ambiguous
source, target, context, rationale, recommendation
```

4. 缺規則 ID、來源／目標或具體證據的 finding 不具阻擋力。
5. 在增量修復模式，只自動修正 `deterministic`、`policy-backed` 或意圖唯一的 `context-backed` finding，再重跑硬檢查與語意複審。
6. `ambiguous` Major 輸出逐字回譯、最多兩個候選及各自風險，狀態設為 `NEEDS_USER_DECISION`。使用者選擇後，在 PR 記錄 finding ID、選項與理由。
7. Minor／Info 不自動改寫；只列最高價值項目，避免風格噪音。

## 4. 判斷是否需要全量審計

以下任一成立即需要完整審計：

- `lastFullAudit` 不存在。
- `completedAt` 距現在已滿 30 個 24 小時。
- state 的 `policyVersion` 與語意政策版本不同。
- `inProgress` 已存在。
- 使用者明確要求 `audit-all`。

先取得 manifest 與 deterministic state decision：

```bash
node scripts/i18n/prepare-semantic-audit.js
```

- 依輸出的 `audit.required`、`reason`、`nextBatch` 執行；不要自行改寫 30 天或 policy-version 判斷。
- `state-schema-changed` 或 `invalid-state` 時，不得信任舊時間、cursor 或 findings；以目前 schema 重建 state，從 batch 1 開始。
- `manifest-changed` 時清除舊 checkpoint，從 batch 1 重新開始。
- 逐批執行 `--batch=N`；helper 固定每批 200 組。每完成一批立即更新 `nextBatch`、`manifestHash`、`counts` 與尚未結案的 Blocker／Major。`counts` 固定使用 `Blocker`、`Major`、`Minor`、`Info` 四個非負整數欄位。
- 批次只做審計，不改寫既有翻譯。中斷時保留 checkpoint；下次從 `nextBatch` 繼續。
- 全部批次完成後，寫入 UTC ISO `completedAt`、`manifestHash`、四級 `counts` 與四種結案狀態之一，清除 `inProgress`。
- 全量既有 Blocker 使結果為 `BLOCKED`；既有 Major 留在 findings，但不擴張當前 PR。

## 5. 結案

最後執行人類可讀 gate：

```bash
npm run validate:i18n
```

只使用以下狀態：

- `PASS`：沒有未結案 Blocker／Major。
- `PASS_WITH_ADVISORIES`：只有 Minor／Info、既有 Major，或已有使用者註記的 waiver。
- `NEEDS_USER_DECISION`：本次變更仍有 ambiguous Major。
- `BLOCKED`：硬檢查未通過、三輪未收斂、執行錯誤，或有已證實 Blocker。

回報 scope、validator exit code、修復輪數、finding ID、全量審計狀態與殘餘風險。不得只回報「翻譯看起來很好」。
