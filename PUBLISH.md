# 發布流程

## 步驟

1. 執行 `git --no-pager diff HEAD` 之後
2. 依照指令結果的內容來更新 CHANGELOG.md 當中的`## [未發布] - Unreleased`
3. 詢問使用者是否接著繼續發布還是終止動作，如果選擇停止，則不需要執行後續流程
4. 執行指令獲得今天日期 `Get-Date -Format "yyyy-MM-dd"`
5. 在 CHANGELOG.md 中，將目前的 `## [未發布] - Unreleased` 區段改為新版本號和發布日期
   - 版本號根據變更內容依照語意化版本規範遞增
   - 日期格式為：YYYY-MM-DD
6. 在新版本號的上方新增一個空白的 `## [未發布] - Unreleased` 區段，為下一版本的變更做準備
7. 將 package.json 中的 version 欄位更新為與 CHANGELOG.md 中最新發布的版本號一致
