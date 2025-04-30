---
mode:"agent"
---

# 更新變更日誌流程 Update Changelog Process

本文檔描述了將新變動加入到專案變更日誌(CHANGELOG.md)的標準流程，確保變更追蹤的一致性。
This document describes the standard process for adding new changes to the project's changelog (CHANGELOG.md), ensuring consistency in change tracking.

此格式基於 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，
並且本專案遵循 [語意化版本](https://semver.org/lang/zh-TW/)。
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 檢視變更流程 Review Changes Process

### 檢視變更 Review Changes

1. 執行以下命令檢視近期的變更：
   Run the following command to view recent changes:

    ```
    git --no-pager diff HEAD
    ```

## 更新變更日誌流程 Update Changelog Process

### 確認變更類型 Confirm Change Types

2. 根據變更的性質，將更新分類為以下類別：
   Based on the nature of the changes, categorize updates into the following categories:

    - **新增 Added**: 新功能或新特性
      New features or functionalities
    - **已修復 Fixed**: 錯誤修復
      Bug fixes
    - **已更新 Updated**: 依賴項更新或次要改進
      Dependency updates or minor improvements
    - **已修改 Changed**: 對現有功能的修改
      Modifications to existing features

### 更新 CHANGELOG.md Update CHANGELOG.md

3. 打開專案的 CHANGELOG.md 檔案
   Open the project's CHANGELOG.md file

4. 在 `## [未發布] - Unreleased` 區段下的適當分類中，添加新的變更項目。使用以下格式：
   Add new change items under the appropriate category in the `## [未發布] - Unreleased` section. Use the following format:

    ```markdown
    ## [未發布] - Unreleased

    ### 新增 Added

    -   添加了新功能 X，用於處理 Y 情況
        Added new feature X for handling Y situations

    ### 已修復 Fixed

    -   修復了在 Z 環境下的問題
        Fixed issue under Z environment

    ### 已更新 Updated

    -   更新了依賴項 A 至版本 B
        Updated dependency A to version B

    ### 已修改 Changed

    -   修改了功能 C 的行為
        Modified behavior of feature C
    ```

5. 確保每個變更都有清晰的描述，並且同時提供中文和英文說明
   Ensure each change has a clear description, providing both Chinese and English explanations

### 最佳實踐 Best Practices

-   使用簡潔明了的語言描述變更
    Use concise and clear language to describe changes
-   包含足夠的上下文，使用戶了解變更的影響
    Include sufficient context for users to understand the impact of changes
-   如果變更與議題（issues）或合併請求（pull requests）相關，添加相應的參考
    If changes are related to issues or pull requests, add corresponding references
-   保持一致的格式和語言風格
    Maintain consistent formatting and language style

## 注意事項 Notes

-   定期更新變更日誌有助於追蹤專案進展
    Regular updates to the changelog help track project progress
-   詳細的變更記錄使團隊成員和用戶能夠了解專案的發展方向
    Detailed change logs enable team members and users to understand the project's development direction
-   變更日誌不是 git log 的複製品，而是為用戶提供有意義的變更摘要
    The changelog is not a copy of git log, but a meaningful summary of changes for users
