---
mode:"agent"
---

## 開始執行指令 Git 提交與發布 Git Commit and Release

### 提交變更 Commit Changes

1. 搜尋並確實閱讀完 `.copilot-commit-message-instructions.md` 檔案當中的"全部"規則，並依照指示撰寫符合規範的 commit 訊息：
   Read and follow the rules in the `.copilot-commit-message-instructions.md` file, and write a compliant commit message according to the instructions:

    ```bash
    git add .
    git commit -m "適合的commit訊息"
    ```

### 標記版本 Tag Version

2. 標記此次發布的版本，格式為 v+版本編號，以 `package.json` 檔案中的`version` 欄位為準：
   Tag this release version, using the format `v+version number`, based on the `version` field in the `package.json` file:

    ```bash
    git tag v1.2.3
    ```

### 上傳到 Git 推送變更 Push to Git

3. 將變更和標記推送到遠端儲存庫：
   Push changes and tags to the remote repository:

    ```bash
    git push && git push --tags
    ```
