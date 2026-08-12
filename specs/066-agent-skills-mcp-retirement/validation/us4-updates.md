# US4：Skill 更新、備份與 rollback 驗收

驗證日期：2026-08-12

## 已驗證案例

- 最新版啟動不重寫 managed files 或 `ready` 狀態。
- 舊版 trusted manifest 可直接更新；受管理檔若與舊 hash 不同，先保存逐位元相同備份，再寫入新版。
- 備份位置固定為 `blockly/.singular-blockly/skill-backups/<UTC timestamp>/`，AI 狀態只記錄專案相對目錄。
- `project-notes.md` 採 create-if-missing；使用者筆記、自訂檔及不在舊 trusted allowlist 的同名內容不被覆寫。
- 版本控制回復舊 Skill 後若又有使用者修改，重新更新前仍會逐位元備份該版本。
- backup 失敗會在任何 managed replace 前停止；Claude entry 寫入失敗會逆序 rollback canonical files 與 manifest。
- 全新安裝 rollback 會移除本次新建 managed files；rollback 自身失敗會寫入穩定英文 `ROLLBACK_FAILED` 與 `RESTORE_BACKUP` 動作。
- manifest 最後提交，並序列化同一 workspace 的並行更新，避免第二次更新覆蓋第一份使用者備份。
- 正常、衝突與失敗皆無一般使用者通知；狀態不含候選內容、使用者檔案內容、secret 或專案外絕對路徑。

## 結論

SC-007、SC-012 與 SC-013 全部通過。
