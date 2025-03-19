# 發布流程 Release Process

本文檔描述了專案的版本發布標準流程，確保版本控制和變更追蹤的一致性。
This document describes the standard release process for the project, ensuring consistency in version control and change tracking.

此格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
並且本專案遵循 [語意化版本](https://semver.org/lang/zh-TW/)。
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 準備工作 Preparation

### 檢視變更 Review Changes

1. 執行以下命令檢視自上次發布以來的所有變更：
   Run the following command to view all changes since the last release:

   ```
   git --no-pager diff HEAD
   ```

2. 依照指令結果的內容來更新 CHANGELOG.md 當中的 `## [未發布] - Unreleased` 區段，確保所有重要變更都被記錄。
   Update the `## [未發布] - Unreleased` section in CHANGELOG.md according to the command results, ensuring all significant changes are documented.

### 發布確認 Release Confirmation

3. 詢問使用者是否接著繼續發布還是終止動作
   Ask the user whether to continue with the release or terminate the action
   - 如果選擇停止，則不需要執行後續流程
     If stop is chosen, no further steps are needed
   - 如果確認繼續，則進行版本更新步驟
     If continue is confirmed, proceed with the version update steps

## 版本更新流程 Version Update Process

### 準備發布日期 Prepare Release Date

4. 執行以下指令獲得今天日期：
   Execute the following command to get today's date:

   ```
   Get-Date -Format "yyyy-MM-dd"
   ```

### 更新 CHANGELOG.md Update CHANGELOG.md

5. 在 CHANGELOG.md 中進行以下修改：
   Make the following modifications in CHANGELOG.md:
   - 將目前的 `## [未發布] - Unreleased` 區段改為新版本號和發布日期
     Change the current `## [未發布] - Unreleased` section to the new version number and release date
   - 版本號規則：
     Version number rules:
     - 根據變更內容依照[語意化版本規範](https://semver.org/lang/zh-TW/)遞增
       Increment according to the [Semantic Versioning](https://semver.org/spec/v2.0.0.html) based on the changes
     - 主要版本(MAJOR)：當你做了不相容的 API 修改
       Major version: When you make incompatible API changes
     - 次要版本(MINOR)：當你做了向下相容的功能性新增
       Minor version: When you add functionality in a backward-compatible manner
     - 修訂版本(PATCH)：當你做了向下相容的問題修正
       Patch version: When you make backward-compatible bug fixes
   - 日期格式：YYYY-MM-DD（例如：2023-05-20）
     Date format: YYYY-MM-DD (e.g., 2023-05-20)

6. 在新版本號的上方新增一個空白的 `## [未發布] - Unreleased` 區段，為下一版本的變更做準備，格式如下：
   Add a blank `## [未發布] - Unreleased` section above the new version number to prepare for the next version's changes, in the following format:

   ```markdown
   ## [未發布] - Unreleased

   ### 新增 Added

   ### 已修復 Fixed

   ### 已更新 Updated

   ### 已修改 Changed


   ## [1.2.3] - 2023-05-20
   
   (原有的變更內容...)
   (Original change content...)
   ```

### 更新套件版本 Update Package Version

7. 將 package.json 中的 version 欄位更新為與 CHANGELOG.md 中最新發布的版本號一致：
   Update the version field in package.json to match the latest released version in CHANGELOG.md:

   ```json
   "version": "1.2.3"
   ```

## 發布後檢查 Post-Release Checks

- [ ] 確認 CHANGELOG.md 已正確更新
      Confirm CHANGELOG.md has been correctly updated
- [ ] 確認 package.json 版本號已更新
      Confirm the version number in package.json has been updated

## 注意事項 Notes

- 保持一致的發布流程有助於專案的長期維護
  Maintaining a consistent release process helps with the long-term maintenance of the project
- 詳細的變更日誌讓使用者和開發者能夠清楚了解每個版本的更新內容
  Detailed changelogs allow users and developers to clearly understand the updates in each version
- 遵循語意化版本規範可以清楚傳達每次發布的變更程度
  Following semantic versioning clearly communicates the extent of changes in each release
