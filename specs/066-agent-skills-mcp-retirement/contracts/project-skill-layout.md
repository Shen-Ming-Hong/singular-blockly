# 契約：專案 Skill 佈局與受管理更新

## 產品建立的專案檔案

```text
<project>/
├── .agents/skills/singular-blockly/
│   ├── SKILL.md                         # extension 管理；英文；正式入口
│   ├── managed-manifest.json            # extension 管理；英文 JSON
│   ├── project-notes.md                 # 只建立一次；之後使用者擁有
│   └── references/
│       ├── block-contract.json          # extension 管理；runtime 產生；英文 JSON
│       ├── workspace-format.md           # extension 管理；英文
│       └── workspace.schema.json         # extension 管理；英文 JSON Schema
├── .claude/skills/singular-blockly/
│   └── SKILL.md                         # extension 管理；英文；精簡相容入口
└── blockly/.singular-blockly/
    ├── skill-status.json                # extension 管理；英文 AI 狀態
    └── skill-backups/<UTC timestamp>/   # 被覆寫受管理檔的逐位元備份
```

`managed-manifest.json` 是固定位置的最後提交記錄，不得列入自己的 `managedFiles` 或自我雜湊。除此記錄外，任何未列於可信 manifest 與目前 packaged allowlist 交集的既有檔案均屬使用者內容。更新器不得列舉後重建整個 `.agents/skills` 或 `.claude/skills` 目錄。

## 正式 SKILL.md 契約

- 路徑與名稱必須為 `.agents/skills/singular-blockly/SKILL.md` 與 `name: singular-blockly`。
- YAML frontmatter 只包含 `name` 與 `description`。
- 全文使用英文，description 必須同時表達「理解既有 Singular Blockly workspace」與「建立／修改合法 Blockly JSON」的觸發情境。
- 本文必須直接引用：
  - `references/workspace-format.md`
  - `references/block-contract.json`
  - `references/workspace.schema.json`
  - `project-notes.md`
- 本文必須要求 AI：修改前先讀 `blockly/main.json` 與相關 references；只寫回完整文件；不得臆造 block type／field／connection；寫回後等待 runtime 驗證結果；若被隔離則讀取狀態與修正候選，不得刪除最後有效備份。
- 不得要求啟動 MCP、安裝 Node.js、執行封裝內腳本或使用外部絕對路徑。

## Claude 相容入口契約

- 路徑固定為 `.claude/skills/singular-blockly/SKILL.md`。
- 使用相同的 `name: singular-blockly` 與等價觸發 description。
- 本文只允許說明正式來源位於 `../../../.agents/skills/singular-blockly/SKILL.md`，並要求先讀該檔；不得複製 workspace 或 block 規則。
- 不使用符號連結。

## Manifest 信任與更新規則

1. 更新器先驗證封裝 manifest 自身 schema、來源雜湊及所有 target containment；固定 installed manifest target 不得出現在 payload `managedFiles`。
2. 目標不存在時可安裝；同名目錄存在且沒有 `manager: singular-blockly` 的有效 manifest 時，整次操作為 `conflict`。
3. 已安裝 manifest 有效時，只能處理「目前 packaged allowlist 與舊 manifest 相同 target」的 payload；舊 manifest 額外路徑不授予任何讀、寫或刪除權限。
4. 實際檔案等於舊 manifest 雜湊時可直接更新；不相等時先備份原始 bytes，再更新。
5. `project-notes.md` 僅在不存在時建立；之後不計算內容雜湊、不更新、不備份、不刪除。
6. 使用者建立的其他檔案或 Skill 目錄不讀取內容、不改名、不刪除。
7. canonical 與 compatibility 必須在同一交易完成；不自我雜湊的 installed manifest 是最後提交點。
8. 失敗時逆序 rollback；只有 manifest 與全部檔案一致才寫入 `status: ready`。
9. 啟動檢查為 `no-change` 時不得重寫 manifest、status 或其他專案檔案；`lastAttemptAt` 只表示實際安裝、更新、衝突或失敗嘗試。

## AI 狀態範例

下列 payload 的鍵值與值為產品生成內容，因此使用英文：

```json
{
  "schemaVersion": 1,
  "status": "failed",
  "skillVersion": null,
  "manifestPath": ".agents/skills/singular-blockly/managed-manifest.json",
  "backupPaths": [
    "blockly/.singular-blockly/skill-backups/20260812T081530123Z"
  ],
  "issues": [
    {
      "code": "WRITE_FAILED",
      "path": ".claude/skills/singular-blockly/SKILL.md",
      "action": "RETRY_ON_WRITABLE_WORKSPACE"
    }
  ],
  "lastAttemptAt": "2026-08-12T08:15:30.123Z"
}
```

不得加入原始錯誤訊息中未清理的路徑、stack、workspace 內容、環境變數或使用者檔案片段。

## 驗收契約

- 新專案、舊 manifest、manifest 自我參照拒絕、舊 manifest 額外路徑忽略、受管理檔被修改、未知同名 Skill、唯讀、途中寫入失敗與 rollback 失敗都需有測試。
- 受管理檔被修改的備份必須與更新前 bytes 完全相同。
- 正常安裝／更新不得呼叫任何確認或通知 API；無更新啟動不得改變 working tree。
- 封裝測試必須從 VSIX 內容找到完整來源資產，並確認所有受管理人類可讀內容通過英文檢查。
