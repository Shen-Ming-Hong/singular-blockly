# VSIX、離線啟動與期限驗證

驗證日期：2026-08-12

## Production package

- `npm run package`：production webpack 通過。
- 最低 VS Code：`^1.109.0`。
- 正式 versioned VSIX 不在本地偽造；版本、tag 與 CHANGELOG 核准後，由 GitHub Actions 以同一個 production bundle 產生並發布。

## 內容檢查

- Skill 資產只輸出於 `dist/project-skills/singular-blockly/`，包含 manifest、Claude wrapper、canonical Skill、project notes、小型 `block-contract.json` 索引、19 個 category 分片、workspace format 與 schema。
- `.vscodeignore` 排除 source `resources/`，VSIX 內沒有第二份可能分歧的 Skill。
- Production package 與 minified `dist/extension.js` 掃描未找到舊 MCP bundle、SDK、status command、設定、Node detection service 或相容 server。
- Production package 仍保留貢獻者／Extension Host 所需 package metadata，以及既有 PlatformIO、mpremote 與 TXT 功能資產。

## 離線／無系統 Node.js 啟動

以 VS Code 1.109、空 extension 目錄、隔離 workspace 與 `PATH=/usr/bin:/bin` 啟動 development extension；extension 看不到可由 shell 呼叫的系統 Node.js。約 3.55 秒產生完整 Skill 與英文 `ready` 狀態，遠低於 30 秒。Production package 使用相同 `ProjectSkillService` bundle 與已驗證的 `dist/project-skills` bytes，且未封裝或呼叫外部 server。

## 期限

- 安裝／更新：隔離實測約 3.55 秒，門檻 30 秒。
- 候選驗證：Extension Host 與 WebView 共用 `deadlineAt`，固定常數 10,000ms；validation 及 live load 都使用剩餘共同期限，逾時自動隔離並復原。
- watcher debounce：500ms，不會重設或延長已開始的 10 秒 deadline。

## 結論

SC-001、SC-008、SC-011 與 SC-012 的封裝與啟動檢查通過。
