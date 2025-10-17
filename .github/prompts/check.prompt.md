---
mode: 'agent'
tools: ['changes', 'runCommands', 'search', 'searchResults', 'context7', 'get-library-docs']
---

1. 閱讀專案憲章 `.specify/memory/constitution.md` 和開發指導 `.github/copilot-instructions.md`
2. 使用工具 `get_changed_files` 或 `git --no-pager diff HEAD` 檢查程式版本變動是否符合憲章原則
3. 可以使用 `get-library-docs` 工具來檢查目前專案變動是否符合函式庫的官方使用方式
