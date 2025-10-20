# Quick Start: 次要依賴更新 (Phase 2)

**功能**: 升級 @blockly/theme-modern 和 @types/node 到最新穩定次要版本  
**預估時間**: 30-45 分鐘 (包含手動測試)  
**前置條件**: Phase 1 (005-safe-dependency-updates) 已完成並合併

---

## 🎯 一句話總結

升級兩個低風險的開發依賴套件 (@blockly/theme-modern 6.0.12, @types/node 20.19.22),透過自動化測試和手動主題驗證確保零迴歸。

---

## 📋 前置檢查清單

在開始升級前,請確認以下條件:

-   [ ] Phase 1 已合併至 `master` 分支
-   [ ] 本地 `master` 分支已與遠端同步 (`git pull`)
-   [ ] 工作目錄乾淨,無未提交變更 (`git status`)
-   [ ] Node.js 20.x 已安裝 (`node --version`)
-   [ ] npm 已更新至最新版本 (`npm --version`)
-   [ ] VSCode 1.96.0+ 已安裝

---

## 🚀 快速執行步驟 (完整流程)

### 步驟 1: 準備環境 (2 分鐘)

```powershell
# 切換到專案目錄
cd E:\singular-blockly

# 從 master 建立新分支
git checkout master
git pull
git checkout -b 006-minor-deps-update

# 確認當前版本
npm list @blockly/theme-modern @types/node
# 預期輸出:
# @blockly/theme-modern@6.0.10
# @types/node@20.17.12
```

### 步驟 2: 升級套件 (3-5 分鐘)

```powershell
# 同時升級兩個套件
npm install @blockly/theme-modern@6.0.12 @types/node@20.19.22

# 驗證版本
npm list @blockly/theme-modern @types/node
# 預期輸出:
# @blockly/theme-modern@6.0.12
# @types/node@20.19.22
```

### 步驟 3: 自動化驗證 (1-2 分鐘)

```powershell
# 1. TypeScript 編譯檢查
npx tsc --noEmit
# ✅ 預期: 無錯誤訊息

# 2. 開發建置
npm run compile
# ✅ 預期: dist/extension.js 生成成功

# 3. 生產建置
npm run package
# ✅ 預期: 成功,檢查檔案大小
Get-ChildItem dist/extension.js | Select-Object Name, Length
# ✅ 預期: 130,506 ± 2% bytes (127,896 - 133,116)

# 4. 完整測試套件
npm test
# ✅ 預期: 190/191 tests passed

# 5. 測試覆蓋率
npm run test:coverage
# ✅ 預期: Coverage ≥ 87.21%

# 6. 安全漏洞掃描
npm audit --audit-level=high
# ✅ 預期: 0 critical/high vulnerabilities
```

**🔴 如果任一檢查失敗,立即執行回滾** (見下方「快速回滾」章節)

### 步驟 4: 手動主題測試 (5-8 分鐘)

```powershell
# 在 VSCode 中按 F5 開啟 Extension Development Host
```

**測試步驟**:

1. **開啟 Blockly 編輯器**:

    - 在測試視窗中開啟任一 `.blockly` 檔案
    - ✅ 預期: Blockly 編輯器成功載入

2. **明亮主題測試**:

    - 切換 VSCode 至明亮主題 (File → Preferences → Color Theme → Light)
    - 使用以下視覺驗證檢查清單:
        - [ ] 積木邊框完整無斷裂
        - [ ] 積木顏色與 Phase 1 基準一致(可切換至 master 分支對照)
        - [ ] 積木文字清晰可讀,無模糊或重疊
        - [ ] 無 CSS 渲染錯誤(如錯位、溢出、背景穿透)
        - [ ] 工具箱背景和分隔線正確顯示
    - ✅ 預期: 所有檢查項目通過,無視覺異常

3. **深色主題測試**:

    - 切換 VSCode 至深色主題 (File → Preferences → Color Theme → Dark)
    - 使用以下視覺驗證檢查清單:
        - [ ] 積木邊框完整無斷裂
        - [ ] 積木顏色與 Phase 1 基準一致(可切換至 master 分支對照)
        - [ ] 積木文字清晰可讀,無模糊或重疊
        - [ ] 無 CSS 渲染錯誤(如錯位、溢出、背景穿透)
        - [ ] 工具箱背景和分隔線正確顯示
    - ✅ 預期: 所有檢查項目通過,無視覺異常

4. **互動測試**:
    - 從工具箱拖放積木至工作區
    - 連接多個積木
    - 測試積木刪除功能
    - ✅ 預期: 所有互動正常,無視覺錯誤

**🔴 如發現視覺迴歸,立即執行回滾**

### 步驟 5: TypeScript 型別提示驗證 (3 分鐘)

1. **開啟關鍵檔案**:

    ```
    src/services/fileService.ts
    src/services/settingsManager.ts
    ```

2. **檢查型別提示**:

    - 將滑鼠懸停在 `fs.readFile`, `fs.writeFile` 等 API 上
    - 檢查自動完成功能 (Ctrl+Space)
    - ✅ 預期: 型別提示正確且完整

3. **重啟 TypeScript Server** (如需要):
    - Ctrl+Shift+P → 輸入 "TypeScript: Restart TS Server"
    - ✅ 預期: 重啟後無新增型別錯誤

### 步驟 6: 更新文件 (2 分鐘)

**編輯 CHANGELOG.md**:

```markdown
## [0.37.1] - 2025-10-20

### 已更新 Updated

-   升級開發依賴套件 (Phase 2 - 次要版本更新)
    Upgraded development dependencies (Phase 2 - Minor updates)
    -   @blockly/theme-modern: 6.0.10 → 6.0.12 (主題系統 bug 修復)
        @blockly/theme-modern: 6.0.10 → 6.0.12 (theme system bug fixes)
    -   @types/node: 20.17.12 → 20.19.22 (Node.js 20.x 型別定義改進)
        @types/node: 20.17.12 → 20.19.22 (Node.js 20.x type definition improvements)
```

### 步驟 7: Git 提交 (1 分鐘)

```powershell
# 檢查變更
git status
# 預期看到: package.json, package-lock.json, CHANGELOG.md

# 加入變更
git add package.json package-lock.json CHANGELOG.md

# 提交變更
git commit -m "chore(deps): 升級 @blockly/theme-modern 和 @types/node (Phase 2)

- @blockly/theme-modern: 6.0.10 → 6.0.12
- @types/node: 20.17.12 → 20.19.22

驗證結果:
- ✅ TypeScript 編譯成功
- ✅ 測試通過率: 190/191 (與基準一致)
- ✅ 測試覆蓋率: ≥87.21%
- ✅ 主題視覺測試通過
- ✅ npm audit: 0 漏洞
- ✅ 建置檔案大小: 130,506 ± 2% bytes

Refs: specs/006-minor-deps-update/"
```

### 步驟 8: 推送並建立 PR (1 分鐘)

```powershell
# 推送分支
git push origin 006-minor-deps-update

# 在瀏覽器中建立 Pull Request
# 標題: chore(deps): Phase 2 - 升級 @blockly/theme-modern 和 @types/node
# 描述: 參考 specs/006-minor-deps-update/spec.md
```

---

## 🔥 快速回滾 (失敗時使用)

如果任何驗證步驟失敗,立即執行以下命令:

```powershell
# 方案 1: Git 回滾 (最快,推薦)
git checkout package.json package-lock.json
npm ci

# 方案 2: 手動降版 (如 Git 不可用)
npm install @blockly/theme-modern@6.0.10 @types/node@20.17.12

# 驗證回滾成功
npm test
# ✅ 預期: 回到 Phase 1 狀態,190/191 測試通過
```

**回滾後**:

1. 記錄失敗的檢查點和錯誤訊息
2. 查詢套件 changelog 和已知問題
3. 在 GitHub Issues 回報問題或等待修復版本

---

## 📊 驗證檢查表 (Validation Checklist)

執行過程中使用此檢查表追蹤進度:

### 編譯階段

-   [ ] CP-001: TypeScript 編譯成功 (`npx tsc --noEmit`)
-   [ ] CP-002: 開發建置成功 (`npm run compile`)
-   [ ] CP-003: 生產建置成功,檔案大小正確 (`npm run package`)

### 測試階段

-   [ ] TP-001: 測試通過率 190/191 (`npm test`)
-   [ ] TP-002: 測試覆蓋率 ≥ 87.21% (`npm run test:coverage`)

### 安全性階段

-   [ ] SP-001: 無 critical/high 漏洞 (`npm audit`)

### 手動測試階段

-   [ ] MP-001: Blockly 主題切換正常 (明亮 + 深色)
-   [ ] MP-002: TypeScript 型別提示正確

### 文件更新

-   [ ] CHANGELOG.md 已更新
-   [ ] Git commit 訊息完整且清晰

---

## ⏱️ 時間預估細分

| 階段            | 預估時間       | 說明                   |
| --------------- | -------------- | ---------------------- |
| 環境準備        | 2 分鐘         | 切換分支,檢查版本      |
| 套件升級        | 3-5 分鐘       | npm install (網速影響) |
| 自動化驗證      | 1-2 分鐘       | 編譯 + 測試 + audit    |
| 手動主題測試    | 5-8 分鐘       | 明亮/深色主題,互動測試 |
| TypeScript 驗證 | 3 分鐘         | 型別提示檢查           |
| 文件更新        | 2 分鐘         | CHANGELOG.md           |
| Git 提交與推送  | 1 分鐘         | commit + push + PR     |
| **總計**        | **17-23 分鐘** | 不含緩衝時間           |
| **含緩衝**      | **30-45 分鐘** | 加上問題排查時間       |

---

## 🛠️ 常見問題與解決方案

### Q1: npm install 很慢或失敗

**解決方案**:

```powershell
# 清除 npm 快取
npm cache clean --force

# 刪除 node_modules 重新安裝
Remove-Item -Recurse -Force node_modules
npm install
```

### Q2: TypeScript 編譯出現新的型別錯誤

**分析步驟**:

1. 檢查錯誤是否為真實問題 (先前被 @types/node 錯誤型別定義隱藏)
2. 如果是改進,應修正程式碼而非回滾
3. 如果是 @types/node bug,查詢 GitHub Issues 或暫時回滾

### Q3: 主題測試發現視覺異常

**處理流程**:

1. 截圖記錄異常
2. 比較 Phase 1 版本的視覺 (切換回 master 分支測試)
3. 如確認為迴歸,立即回滾
4. 在 Google Blockly Samples 專案回報問題

### Q4: 測試失敗率上升

**處理流程**:

1. 檢查失敗的測試是否為新失敗 (Phase 1 為 190/191)
2. 如新增失敗,立即回滾
3. 記錄失敗測試名稱和錯誤訊息
4. 分析是否與 @types/node 型別變更有關

### Q5: npm audit 發現新漏洞

**處理流程**:

1. 執行 `npm audit` 查看詳細資訊
2. 確認漏洞是否為新引入 (vs Phase 1)
3. 檢查是否有可用的修補版本
4. 如無法修復且為 critical/high,回滾並記錄問題

---

## 📚 相關文件參考

-   **功能規格**: `specs/006-minor-deps-update/spec.md`
-   **實作計畫**: `specs/006-minor-deps-update/plan.md`
-   **研究報告**: `specs/006-minor-deps-update/research.md`
-   **資料模型**: `specs/006-minor-deps-update/data-model.md`
-   **驗證契約**: `specs/006-minor-deps-update/contracts/upgrade-validation-contract.yaml`
-   **Phase 1 報告**: `specs/005-safe-dependency-updates/PHASE-7-COMPLETION-REPORT.md`

---

## 🎓 學習要點

本次升級的關鍵學習點:

1. **低風險升級模式**: patch/minor 版本更新,遵循 semver 規範
2. **效能基準驗證**: 使用 Phase 1 基準確保零迴歸
3. **手動測試重要性**: Blockly 主題為視覺功能,必須手動驗證
4. **快速回滾策略**: Git 提供安全網,失敗時可快速恢復
5. **文件化最佳實踐**: CHANGELOG 和 Git commit 訊息記錄完整驗證結果

---

## ✅ 完成確認

升級完成後,請確認:

-   [ ] 所有自動化檢查點通過 (8/8)
-   [ ] 所有手動測試通過 (2/2)
-   [ ] CHANGELOG.md 已更新
-   [ ] Git commit 已推送
-   [ ] Pull Request 已建立
-   [ ] 本地環境可正常開發 (Extension Development Host 運作正常)

**🎉 恭喜!Phase 2 升級完成!**

---

**最後更新**: 2025-10-20  
**維護者**: GitHub Copilot  
**問題回報**: 請在 GitHub Issues 提出
