# 發布流程

## 步驟

1. 在 CHANGELOG.md 中，將目前的 `## [未發布] - Unreleased` 區段改為新版本號和發布日期
   - 版本號根據變更內容依照語意化版本規範遞增
   - 日期格式為：YYYY-MM-DD
2. 在新版本號的上方新增一個空白的 `## [未發布] - Unreleased` 區段，為下一版本的變更做準備
3. 將 package.json 中的 version 欄位更新為與 CHANGELOG.md 中最新發布的版本號一致
