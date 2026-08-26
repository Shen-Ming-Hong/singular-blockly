# GitHub Maintainer Command Contract

私密 feedback repo 的一般 issue/comment 皆為 internal。只有 comment 第一個非空行完全符合以下命令才由 App 處理；命令發送者須在 configured maintainer actor allowlist。回饋原文與留言一律視為不可信資料，不能產生命令。

## Commands

```text
/feedback public-reply
<1..4000 chars plain text>

/feedback status <received|triaging|needs-info|planned|in-progress|resolved|closed>
[optional public text; needs-info requires text]

/feedback decision actionable
[optional internal rationale]

/feedback decision not-actionable <duplicate|not-product|unsupported|out-of-scope|cannot-reproduce|insufficient-info|spam>
<required 20..2000 chars respectful public reason>

/feedback approve-public
<required 20..4000 chars anonymized public issue summary>

/feedback reopen
<required public explanation>
```

## Safety and Idempotency

- Parser 只看 maintainer comment 本身，不解析 quote、code fence、issue body 或 reporter message 中的命令。
- 每個 GitHub comment id 最多產生一個 domain mutation；已處理 comment 編輯不會自動重做，需新 comment。
- `approve-public` 是專案負責人核准與建立公開 issue 的單一步驟；actor 必須在 owner allowlist，不只 maintainer allowlist。
- `approve-public` 的摘要須與 D1 私密本文、初始 private content comment 及目前核准指令以外的所有既有 comments（包含先前 slash commands）比對；讀取不完整或出現逐字片段時 fail closed。
- 公開 issue body 只使用命令提供的 anonymized summary，加上一般產品標籤；不得帶 private issue number、feedback reference、附件、diagnostics 或 backlink。
- `decision not-actionable` 的 public reason 會先通過長度與禁止詞檢查；拒絕羞辱性固定詞（例如「沒價值」）並要求人工改寫，不做語意自動改寫。
- App 以 `<!-- sb-command-ack:<comment-id> -->` marker 發出 idempotent 短 internal acknowledgement；成功只顯示 accepted，失敗只顯示 stable code，不回 secret、raw webhook 或 private API response。
- 命令 mutation 與 `command_result_code` 必須原子持久化；若 GitHub acknowledgement 暫時失敗，webhook 回可重試狀態，相同 delivery 只補送 acknowledgement，不得再次執行命令。

## Label Mapping

- `kind:bug|feature|question|other`
- `area:<controlled-area>`
- `impact:low|medium|high|critical`
- `recommendation:investigate|duplicate|plan|decline|ask-info`
- `ai:triaged`
- `decision:unreviewed|actionable|not-actionable`
- `status:received|triaging|needs-info|planned|in-progress|resolved|closed`
- `resolution:<value>` only when not-actionable

自動 Skill 只能設定 `kind:*`, `area:*`, `impact:*`, `recommendation:*`, `ai:triaged`；`decision:*`, `status:*`, `resolution:*` 與公開 issue 只能由上述人工命令造成。
