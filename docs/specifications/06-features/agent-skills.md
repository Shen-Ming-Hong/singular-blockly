# Agent Skills 與安全工作區整合

> 現行設計整合自 `specs/066-agent-skills-mcp-retirement/`。舊版外部伺服器整合已退役，不再屬於產品架構。

## 目標

Singular Blockly 在專案啟動時靜默建立及更新專案內 Agent Skill，讓支援的 AI 直接讀取目前工作區格式與實際 Blockly runtime 衍生的積木契約。一般使用者不需要安裝系統 Node.js、啟動外部程序、回應設定確認或操作 Skill 檔案。

## 專案內配置

```text
.agents/skills/singular-blockly/
├── SKILL.md                         # 唯一正式入口（英文）
├── managed-manifest.json            # 已安裝版本與受管理雜湊
├── project-notes.md                 # 只在缺少時建立，之後由使用者管理
└── references/
    ├── block-contract.json          # category 分片索引
    ├── block-contract/*.json        # runtime 衍生的公開積木 category 分片
    ├── workspace-format.md          # 完整文件修改與復原規則
    └── workspace.schema.json        # main.json 外層 schema

.claude/skills/singular-blockly/
└── SKILL.md                         # 指向正式入口的精簡相容檔
```

正式來源位於 `.agents/skills`；Claude 相容入口是一般檔案，不使用符號連結，也不複製完整契約。所有受管理的人類可讀內容固定使用英文。

## 安裝與更新

- 已有 `blockly/` 的 workspace folder 在 extension activation 時檢查；新專案第一次開啟 Blockly 編輯器時強制檢查。
- 受管理檔案由封裝 manifest 的固定相對路徑與 SHA-256 決定，installed manifest 最後提交。
- 已修改的受管理檔案先逐位元備份到 `blockly/.singular-blockly/skill-backups/<UTC timestamp>/`，再以同目錄暫存檔和原子 rename 更新。
- `project-notes.md`、自訂檔案與新 manifest 未明列的內容不會被覆寫。
- 任一步驟失敗會逆序回復；失敗只寫結構化診斷與可安全建立的英文 AI 狀態，不顯示一般通知，也不阻擋 Blockly。

## 積木契約

`scripts/generate-skill-contract.js` 在貢獻者環境載入 Blockly 英文訊息、產品積木定義、每個板型工具箱與動態 flyout，對所有公開積木建立 headless block 並執行 round-trip。產物以小型索引列出 type 到 category 分片的路由；多 category 共用積木集中於 `shared` 分片，讓代理只讀本次需要的 metadata。契約記錄：

- category 與 board membership；
- previous、next、output 與 input connection checks；
- field 類型、預設值，以及固定或動態 dropdown 選項模式；
- minimal state 與必要 extra state；
- Blockly 版本與支援 board 清單。

使用 `npm run generate:project-skills` 重建契約及 manifest，使用 `npm run check:project-skills` 在 CI 驗證 tracked 資產沒有過時。

## 外部工作區驗證

```text
外部寫入 main.json
  → Extension Host 解析並配置 generation/requestId/10 秒 deadline
  → WebView disposable Blockly workspace load/save
  → 第二個 disposable workspace 再次 load/save
  → live workspace 完成相容修復並回傳最終 normalized document
  → 原子提交該 normalized main.json 與 main.json.bak
```

未知積木、板型不符、非法 field、遺失序列化連線、缺少必要 extra state、新增孤立積木、空白資料、通道中斷與逾時都不會進入正式畫面。動態 dropdown 由候選 runtime 實際選項驗證；舊版板卡 ID 與函式引用則在成功提交前正規化。原始候選保存為 `blockly/main.invalid.json` 及最近五份 UTC 歷史，`main.json` 由磁碟 `.bak` 或記憶體快照恢復；沒有恢復來源時保留原主檔，不以空白資料取代。

候選隔離／恢復與一般編輯器儲存共用單一交易佇列。多根工作區只綁定 primary workspace folder；切換 primary root 時關閉舊專案面板並重建監看服務，避免跨專案寫入。

警告只顯示在地化問題類型、專案相對隔離位置與「顯示 Output 詳情」動作；日誌和 AI 狀態不得包含工作區完整內容、憑證或專案外部絕對路徑。

## 支援基準

- VS Code 1.109 以上；
- Codex 從 `.agents/skills` 發現正式契約；
- Claude Code 從 `.claude/skills` 相容入口定位相同契約；
- Arduino、CyberBrick 與 TXT 的既有輸出分別維持 `src/main.cpp`、`src/rc_main.py`、`src/main.py`。
