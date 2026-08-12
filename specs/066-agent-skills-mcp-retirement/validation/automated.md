# 自動化驗證結果

驗證日期：2026-08-12

## 正式命令矩陣

| 命令 | 結果 |
| --- | --- |
| `npm run check:project-skills` | 通過；contract 為目前版本，含 166 個公開積木與 19 個 category 分片；packaged manifest 為目前版本 |
| `npm run compile-tests` | 通過 |
| `npm run lint` | 通過 |
| `npm run lint:i18n` | 通過 |
| `npm run validate:i18n` | 通過；14/14 非英文 locale 為 0 errors，連同英文基準共 15 locale |
| `npm run test:unit:ci` | 通過；1082 passing、1 pending |
| `npm run test:integration` | exit 0；9 passing、3 pending；3 項真實 Copilot API 測試因本機未登入而明確 skip |
| `npm run test:coverage:ci` | exit 0；1080 passing、3 pending；global statements/lines 69.85%、branches 73.96%、functions 11.27% |
| `npm run package` | production webpack 通過；小型索引與 19 個分片均複製至 `dist/project-skills/` |
| `git diff --check` | 通過 |

唯一 unit pending 是既有的真實 AI suggestion E2E，需要外部 AI provider；不影響 Agent Skill、runtime workspace validation 或 generator contract。Integration 的 3 個 pending 同樣是明確的未登入 Copilot 外部條件，不是 assertion failure。

## 066 核心 business logic coverage

以完整 `test:coverage:ci` 報告核對 FileService／ProjectSkillService／WorkspaceCandidateService／BlockContractService。逐檔 coverage：

| 檔案 | Statements | Branches | Functions | Lines |
| --- | ---: | ---: | ---: | ---: |
| `projectSkillService.ts` | 100% (340/340) | 100% (140/140) | 100% (17/17) | 100% (340/340) |
| `workspaceCandidateService.ts` | 100% (404/404) | 100% (159/159) | 100% (25/25) | 100% (404/404) |
| `blockContractService.ts` | 100% (117/117) | 100% (45/45) | 100% (4/4) | 100% (117/117) |
| `fileService.ts` | 100% (346/346) | 100% (86/86) | 100% (17/17) | 100% (346/346) |

## 相容性證據

- 真實 Blockly 13 的 Arduino、CyberBrick、TXT fixture load/save/load 全通過。
- 三種板型 generator golden output 全通過，輸出位置維持 `src/main.cpp`、`src/rc_main.py`、`src/main.py`。
- 既有 Blockly 12 JSON/XML fixture 在 Blockly 13 round-trip 後維持語意。
- package retirement、Skill discovery、Skill layout、runtime contract 與 workspace validation 契約測試全通過。
- `block-contract.json` 僅保留 323 行索引；166 個公開 type 只路由到一個分片，多 category type 統一置於 `shared`，不存在按 board 複製的契約內容。
- 舊版動態 `controls_if/ELSE` 工作區的初次載入邊界測試通過：只走正常 `init`，不觸發外部候選驗證；正式 runtime 成功回覆後建立 normalized `.bak`，但不改寫 `main.json`。
- 初始 malformed bytes 會逐位元隔離且不被空白狀態覆寫；外部 B 候選在 A 驗證期間進入 debounce 時會立即 supersede A，只提交 B。
- 舊版動態 `controls_if/ELSE` 工作區只外部修改 `math_number.fields.NUM` 後，真實 Blockly load/save/load 保留 `ELSE` 與新數值；候選預檢不再以最小契約誤判動態 input，非法連線仍由 runtime 拒絕。
- 同一候選保留 live workspace 中 ID/type 相同的既有孤立積木時，無關的 `NUM` 修改可通過；外部變更新增孤立積木或沿用 ID 但改變 type 時，仍以 `ORPHAN_BLOCK` 拒絕。
- 候選 rejection 與一般 editor save 共用交易佇列，不會回復蓋掉較新 save；service dispose 會使 pending 結果及後續寫入失效。
- 舊版板卡 ID 在 runtime 驗證前正規化；動態 dropdown 由實際 field options 驗證，候選既有序列化連線不得在 round-trip 中靜默遺失。
- live workspace 完成函式引用等相容修復後回傳最終 normalized document，Extension Host 只提交該版本；primary workspace root 切換會關閉舊面板並重建 service。

## 結論

T060 的命令矩陣與新增 business logic 100% coverage 門檻通過。
