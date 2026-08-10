---
name: pr-review-release
description: 本地 Codex Code Review 評估、使用者核准與完整發布流程。當使用者提到 code review、PR 審查、review 建議處理、merge PR、發布版本、release、squash merge、版本標籤時自動啟用。確保版本與雙語 CHANGELOG 在 PR 內完成，合併後只推送 annotated tag，再由 GitHub Actions 發布同一份 VSIX。Local review, approval, protected-branch merge, and tag-driven release workflow.
metadata:
    author: singular-blockly
    version: '2.0.0'
    category: productivity
license: Apache-2.0
---

# PR Code Review 評估與發布流程 PR Review & Release Workflow

把本地審查、兩次使用者核准、受保護分支合併與 tag 驅動發布串成單一流程。不得在 `master` 合併後直接提交版本檔，也不得在本機建立正式 VSIX 或 GitHub Release。

## 核心契約 Release Contract

- 正式發布輸入只能是 annotated `vX.Y.Z` tag。
- `package.json`、`package-lock.json`、`CHANGELOG.md` 與 tag 必須是同一版本。
- 版本與雙語 CHANGELOG 必須在功能分支完成，隨同一 PR 通過 `CI Gate` 與 CodeQL。
- tag 推送後由 `.github/workflows/publish.yml` 重用 CI 產生的唯一 VSIX，發布到 GitHub Releases、VS Code Marketplace 與 Open VSX。
- 未取得 Phase 3.5 明確發布核准，不得 push、建立／更新 PR、merge、建立 tag 或觸發 CD。
- 若只要求 review 而未要求發布，完成 Phase 0–3 後停止；不得自行推定要建立 PR 或 release。

## Phase 0：本地 Codex Review（必須）

1. 確認 base、HEAD、工作區與差異範圍：

    ```bash
    git status --short
    git merge-base origin/master HEAD
    git diff --stat origin/master...HEAD
    git diff origin/master...HEAD
    git diff
    ```

2. 對照目前 spec、測試與架構規則，審查正確性、回歸、邊界條件、安全性及測試覆蓋。
3. 以 P0–P3 列出可執行 findings，包含檔案、行號、影響與建議；若沒有 finding，明確記錄殘餘風險。
4. 不等待 Copilot 或其他遠端 reviewer；PR 已存在時仍以本地 `HEAD` 為準。

## Phase 1：Finding 與版本方案評估

逐條分類 findings：

- 採納：確實影響正確性、安全、相容性或必要維護性。
- 調整後採納：方向正確，但需要縮小範圍。
- 不採納：與專案契約衝突、屬偏好或會造成回歸。
- 待決定：缺少產品決策，不得自行猜測。

若本次範圍包含正式發布，同時提出：

- SemVer 建議（patch／minor／major）及理由。
- 預定的 `vX.Y.Z`。
- 雙語 CHANGELOG 草稿；不得只提供中文或英文。
- 會改動的 `package.json`、`package-lock.json` 與 `CHANGELOG.md`。

## Phase 1.5：修正核准 Gate（必須）

向使用者提交 finding ID、採納判斷、修改範圍、驗證方式，以及適用時的 SemVer／CHANGELOG 草稿。等待使用者明確核准全部方案或指定 finding ID。

修正核准只授權 Phase 2 的本地變更，不等同發布核准。不得把沉默、一般性的「繼續」或先前發布要求視為本次核准。

## Phase 2：只實作已核准內容

1. 修正已核准 findings；拒絕或未決項目保持不變。
2. 若已核准正式發布版本，在目前功能分支執行：

    ```bash
    npm version {VERSION} --no-git-tag-version
    ```

3. 把 `CHANGELOG.md` 的 `[未發布]` 內容整理成核准的 `## [{VERSION}] - YYYY-MM-DD` 雙語區段。
4. 驗證版本契約：

    ```bash
    npm run release:prepare
    ```

5. 依變更範圍執行測試；至少執行：

    ```bash
    npm run ci:static
    npm run test:unit:ci
    ```

6. 使用 Conventional Commits 與繁體中文描述提交。發布檔可使用：

    ```bash
    git add package.json package-lock.json CHANGELOG.md
    git commit -m "chore(release): 準備發布 {VERSION}"
    ```

## Phase 3：簡化與本地 Re-review（必須）

1. 對本次改動的 TS／JS 檔執行 `code-simplifier` 技能。
2. 重跑受影響測試與 `npm run ci:static`。
3. 重新審查 `origin/master...HEAD` 全部差異，確認沒有新增 P0–P3 finding。
4. 確認版本、lockfile 與雙語 CHANGELOG 已在 PR 差異內，不會留到合併後修改。

## Phase 3.5：發布前核准 Gate（必須）

向使用者提交最終變更摘要、完整測試結果、殘餘風險、本地 re-review、確切版本與 CHANGELOG 摘要。明確詢問是否核准後續的 push、PR、squash merge、annotated tag 與 GitHub Actions CD。

只有使用者明確核准才可進入 Phase 4。若最終差異、版本或風險在核准後實質改變，回到此 gate 重新取得核准。

## Phase 4：PR 與受保護主分支

1. 推送功能分支並建立／更新 PR，不得直接 push `master`。
2. PR 描述包含版本、雙語 CHANGELOG 摘要與測試結果。
3. 等待並確認：
   - `CI Gate` 通過。
   - CodeQL 通過。
   - 儲存庫發布擁有者在 Phase 3.5 的明確核准視為 maintainer approval；ruleset 將 required approvals 設為 0，允許發布擁有者直接完成 PR 發布。
   - review 對話已解決、沒有 merge conflict。
   - 單一 maintainer 直發仍必須走 PR、通過必要檢查並使用 squash merge；不得直接 push `master` 或略過 Phase 3.5。
4. 若 CI 或人工 review 出現新的實質 finding，回到 Phase 1 評估；未核准不得擴大修正。
5. 只使用 squash merge，並刪除遠端功能分支：

    ```bash
    gh pr merge --squash --delete-branch
    ```

6. 明確切換並同步本地 `master`，確認 squash commit 已包含版本與 CHANGELOG。不得在此時執行 `npm version` 或新增 release commit：

    ```bash
    git switch master
    git fetch origin
    git merge --ff-only origin/master
    git status --short
    git rev-parse HEAD
    git rev-parse origin/master
    ```

    `git status --short` 必須沒有輸出，兩個 revision 必須完全相同；否則不得建立 tag。

## Phase 5：Annotated Tag 與 Actions CD

### 5.1 建立 tag 前檢查

在最新 `origin/master` 上確認工作區乾淨、版本契約通過、目標 tag 不存在：

```bash
git switch master
git fetch origin
git merge --ff-only origin/master
git status --short
git rev-parse HEAD
git rev-parse origin/master
npm ci
npm run release:prepare
git ls-remote --tags origin "refs/tags/v{VERSION}"
```

工作區必須乾淨，且 `HEAD` 必須等於 `origin/master`。若不同或遠端已有 tag，停止並查明；不得刪除、覆寫或重建正式 tag。

### 5.2 建立並推送 annotated tag

```bash
git tag -a v{VERSION} -m "Release v{VERSION}"
git cat-file -t v{VERSION}
git push origin v{VERSION}
```

`git cat-file -t` 必須輸出 `tag`。禁止 `git tag v{VERSION}` 產生 lightweight tag。

### 5.3 等待發布 workflow

tag push 只負責觸發 `.github/workflows/publish.yml`。不得執行本機正式打包、全域安裝 `vsce`／`ovsx` 或 `gh release create`。

```bash
gh run list --workflow publish.yml --branch v{VERSION} --limit 1
gh run watch {RUN_ID} --exit-status
gh run view {RUN_ID} --json status,conclusion,jobs,url
```

若任一發布端失敗，只重跑失敗 jobs：

```bash
gh run rerun {RUN_ID} --failed
gh run watch {RUN_ID} --exit-status
gh run view {RUN_ID} --json attempt,status,conclusion,jobs,url
```

重跑後必須等待同一 run 的新 attempt 完成並再次確認 conclusion；若仍失敗就停止。不得重建 tag，也不得重發已成功的發布端。

若 tag 觸發的 run 在任何發布 job 開始前，因 workflow 本身的缺陷於 `quality` 階段失敗，先用新 PR 修正 workflow；修正合併後可從 `master` 手動 dispatch 同一個既有 annotated tag。這是不可變 tag 的復原入口，不得用來改換 release commit：

```bash
gh workflow run publish.yml --ref master -f release_tag=v{VERSION}
```

手動 run 仍必須驗證 tag 格式、annotated object、tag 指向的 commit、版本檔與雙語 CHANGELOG，並從該 tag checkout 建置唯一 VSIX。

若 Marketplace 與 Open VSX 已成功，但 GitHub Release 因 workflow 缺陷失敗，不得建立新 VSIX 或重發市集。先用 PR 修正 workflow，再以原失敗 run 的同一 artifact 只補 GitHub Release：

```bash
gh workflow run recover-github-release.yml --ref master \
  -f release_tag=v{VERSION} \
  -f source_run_id={FAILED_RUN_ID}
```

GitHub Release 復原 workflow 必須驗證來源是失敗的正式發布 run，並重新驗證 annotated tag、release metadata、VSIX archive 與 SHA-256。

市集的第一次 publish 必須嚴格拒絕重複版本；只有 `github.run_attempt > 1` 的重跑 job 可使用 `--skip-duplicate`，以復原伺服器已接受但 runner 未取得成功回應的情況。

### 5.4 驗證三個發布端

1. GitHub Release 是 Latest 且含：
   - `singular-blockly-{VERSION}.vsix`
   - `singular-blockly-{VERSION}.vsix.sha256`
   - 對應版本的雙語 CHANGELOG notes
2. 下載 Release 的 VSIX 與 checksum 到經驗證的暫存目錄，執行 SHA-256 驗證。
3. 確認 workflow 的 Marketplace 與 Open VSX jobs 都成功，並在兩個市集頁面確認版本為 `{VERSION}`。
4. 確認三端來自 `quality` job 的同一 artifact；不得用本機重新建置品補發。

## Checklist

- [ ] 本地 review findings 已評估並取得修正核准
- [ ] 只實作已核准內容，測試與 re-review 通過
- [ ] 版本、lockfile 與雙語 CHANGELOG 已在功能分支／同一 PR
- [ ] 已取得 Phase 3.5 明確發布核准
- [ ] `CI Gate`、CodeQL、發布擁有者的 Phase 3.5 明確核准與對話解決條件通過
- [ ] PR 已 squash merge，未直接提交到 `master`
- [ ] annotated tag 已驗證為 `tag` 並推送
- [ ] Actions 使用同一 VSIX 完成 GitHub Release、Marketplace、Open VSX
- [ ] Release assets 與 SHA-256 驗證通過
- [ ] 發布失敗時只重跑失敗 jobs，未重建 tag

## 完成摘要

回報 findings 採納數、使用者兩次核准、PR／CI 結果、版本、tag 類型、publish run URL、GitHub Release URL、兩個市集版本與 checksum 驗證結果。

## 相關資源

- [CI/CD 操作手冊](../../../docs/ci-cd.md)
- [git-workflow 技能](../git-workflow/SKILL.md)
- [code-simplifier 技能](../code-simplifier/SKILL.md)
