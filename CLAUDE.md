@AGENTS.md

在 Claude Code（桌面 App 或雲端工作階段）中，貢獻者技能從 `.claude/skills/` 的相對連結讀取，來源在 `.github/skills/`；Spec Kit 技能（`speckit-*`）連結到 `.agents/skills/`。以名稱載不到技能時（工具清單沒有、連結沒被建立或跟隨），直接讀 `.github/skills/<名稱>/SKILL.md`（Spec Kit 讀 `.agents/skills/<名稱>/SKILL.md`），不可因此跳過。寫入任務先用 `maintain-singular-blockly`；雲端工作階段只能推送系統指定的 `claude/…` 分支，以 PR 整合，依 `.github/skills/maintain-singular-blockly/references/merge-queue.md` 自行合併非發布 PR，並用 `cloud-local-verification` 在容器內完成驗證。
