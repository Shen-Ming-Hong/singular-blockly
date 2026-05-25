# Contract：Issue Draft Proposal

## 範圍

Issue draft proposal 是本地產生、供 human review 的 open-source issue 草稿。v1 不自動開 issue、不呼叫 GitHub API、不繞過使用者審核。

## 產生時機

- 使用者點擊 `產生 Issue 草稿`。
- 診斷或修復流程仍無法解決問題。
- 使用者需要把整理好的 evidence 提供給維護者。

## 必要內容

```markdown
# Title
PlatformIO guided repair still reports <status> when <brief condition>

## Summary
<使用者可讀的一段式摘要>

## Environment
- OS: <masked platform summary>
- Singular Blockly version: <version or unknown>
- VS Code version: <version or unknown>
- PlatformIO extension: <installed/enabled/version or unknown>
- Relevant PlatformIO settings: <masked summary>

## Diagnostics
<fixed-order diagnostic results>

## Repair attempts
<auto repair runs and outcomes>

## Expected behavior
<官方 PlatformIO extension 可用時，Singular Blockly 應能找到或引導修復環境>

## Actual behavior
<目前錯誤/警告>

## Privacy checklist before posting
- [ ] I checked that local usernames and workspace paths are masked.
- [ ] I checked that proxy credentials, tokens, and private hostnames are not included.
- [ ] I searched existing issues using the suggested keywords below.

## Suggested duplicate-search keywords
<keywords>
```

## Governance 規則

- 只產生草稿；不得自動發佈。
- 必須要求 human approval。
- 必須包含 privacy checklist。
- 必須包含 duplicate-search keywords。
- 若 redaction 發現高風險內容，需在面板上警告使用者先檢查。

## Redaction 規則

沿用 AI repair packet redaction，並額外強化：

- Issue draft 預設不包含完整 stdout/stderr。
- 對 public posting 不必要的絕對路徑一律遮罩。
- 若需要展示路徑問題，只保留路徑特徵，例如 `Windows username contains non-ASCII characters`，而不是完整使用者名稱。

## Duplicate Search Hints

建議關鍵字需來自實際 finding，例如：

- `PlatformIO customPATH Singular Blockly`
- `mpremote not found CyberBrick`
- `VS Code PlatformIO useBuiltinPIOCore false negative`
- `Windows Unicode path PlatformIO mpremote`

## 成功回饋

複製或產生草稿後，面板需顯示：

- 草稿已產生。
- 發佈前請人工檢查 privacy checklist。
- 若適用，提醒先搜尋重複 issue。
