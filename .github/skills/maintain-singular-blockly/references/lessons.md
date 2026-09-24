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
