---
mode: 'agent'
tools: ['changes', 'runCommands', 'search', 'searchResults', 'context7', 'get-library-docs']
---

1. 閱讀設計原則 `.github/instructions/info.instructions.md`
2. 使用工具 `get_changed_files`或`git --no-pager diff HEAD`檢查程式版本變動是否符合設計原則?
3. 可以使用 `get-library-docs` 工具來檢查目前專案變動是否符合用函示庫的官方使用方式
