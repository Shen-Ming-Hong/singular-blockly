# US2：代理發現、工作區理解與合法輸出驗收

驗證日期：2026-08-12

## 共用契約

- 正式入口：`.agents/skills/singular-blockly/SKILL.md`。
- Claude 相容入口：`.claude/skills/singular-blockly/SKILL.md`，為一般檔案，僅以相對路徑指向正式入口。
- `agentSkillDiscovery.contract.test.ts` 驗證兩個入口解析到同一組 references，沒有第二份可分歧契約。
- `block-contract.json` 是小型索引，19 個 category 分片的內容 hash 均由 packaged manifest 驗證。
- 契約含 7 個板型與 166 個唯一、排序、board-scoped 公開積木類型；每個 type 只路由到一個分片，runtime/toolbox/dynamic flyout 重新產生檢查無缺漏。

## Codex 驗收

本次 Codex task 已從安裝後的正式 `SKILL.md` 依序讀取 workspace format、schema、block contract 索引及所需 category 分片，並以同一契約檢查 Arduino、CyberBrick、TXT fixtures。真實 Blockly 13 的 load/save/load 契約測試全部通過，三種 generator golden output 亦通過：

- Arduino `src/main.cpp` fixture hash：`13a618195bb12a3d6d4f44c2a472d4dbcc943acdf52e9fe6b7c54292b3c0b01d`。
- CyberBrick `src/rc_main.py` fixture hash：`6f04f33770fb1e2171448b38d81ef05fda8b44711a7640327db000da3ef19902`。
- TXT `src/main.py` fixture hash：`2f6bd98fd585fdeadf9bb45ac93beb123693ad857648c19f071a6ba593cffa4f`。

## Claude Code 驗收狀態

靜態發現、相對入口、正式契約 hash 與等價指引均已由契約測試通過。但本機沒有 `claude` executable 或可用 Claude Code session，因此無法誠實執行「由真實 Claude Code session 完成代表性修改」的外部驗收。

## 結論

SC-004 已通過；SC-002 的 Codex 與跨入口契約部分已通過，真實 Claude Code session 仍待人工驗收。因此 T036 保持未完成。
