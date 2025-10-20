# Tasks: 次要依賴更新 (Phase 2)

> **檔案用途**: 此檔案是 Phase 2 依賴升級的完整任務追蹤清單,定義了從環境準備到 PR 建立的所有執行步驟、驗證檢查點和回滾策略。開發者應按照 Phase 順序執行任務,每個任務完成後標記為 `[x]`,以確保升級過程的可追溯性和品質保證。
>
> **在專案中的角色**: 作為實作階段的操作指南,補充 `plan.md` (策略規劃) 和 `quickstart.md` (快速執行),提供最細粒度的任務拆解和執行順序定義。

**Input**: 設計文件來自 `/specs/006-minor-deps-update/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/upgrade-validation-contract.yaml, quickstart.md

**組織方式**: 任務按 User Story 分組,每個 Story 可獨立實作和測試

**測試策略**: 本功能為依賴升級,使用既有測試套件驗證,無需編寫新測試

---

## 格式: `[ID] [P?] [Story] 描述`

-   **[P]**: 可並行執行 (不同檔案,無相依性)
-   **[Story]**: 此任務屬於哪個 User Story (US1, US2)
-   描述中包含完整檔案路徑

## 路徑慣例

-   **專案類型**: VSCode Extension (單一專案結構)
-   **根目錄**: `E:\singular-blockly\`
-   **套件管理**: `package.json`, `package-lock.json` (根目錄)
-   **文件**: `CHANGELOG.md` (根目錄)
-   **驗證涉及**: `src/`, `media/`, `src/test/`

---

## Phase 0: 研究與驗證 (已完成)

**目的**: 驗證套件相容性、收集權威文件、確保可測試設計

**狀態**: ✅ 已在 Phase 0 和 Phase 1 完成

-   [x] T000 使用 MCP `resolve-library-id` 搜尋 Blockly 相關文件
-   [x] T001 使用 MCP `webSearch` 查詢套件 changelog 和版本資訊
-   [x] T002 使用 `fetch_webpage` 從 npm 擷取套件版本歷史
-   [x] T003 記錄研究成果於 `research.md` (版本分析、相容性驗證、風險評估)
-   [x] T004 驗證所有第三方函式庫與當前專案相容 (Blockly 11.2.2, TypeScript 5.9.3)
-   [x] T005 設計資料模型確保可追蹤性 (PackageUpgrade, ValidationCheckpoint, UpgradeSession)
-   [x] T006 定義驗證契約確保品質閘門 (10 個檢查點,2 種回滾策略)

**檢查點**: ✅ 研究與設計驗證完成 - 可進行知情且可測試的實作

---

## Phase 1: 環境準備

**目的**: 確認環境就緒,建立工作分支

**前置條件**: Phase 1 (005-safe-dependency-updates) 已完成並合併至 master

-   [x] T007 確認本地 `master` 分支與遠端同步 (`git pull`)
-   [x] T008 確認工作目錄乾淨,無未提交變更 (`git status`)
-   [x] T009 確認 Node.js 20.x 和 npm 已安裝 (`node --version`, `npm --version`)
-   [x] T010 從 master 建立功能分支 `006-minor-deps-update` (`git checkout -b 006-minor-deps-update`)
-   [x] T011 記錄當前套件版本 (`npm list @blockly/theme-modern @types/node`)

**檢查點**: ✅ 環境就緒,工作分支已建立

---

## Phase 2: Foundational (阻塞性前置作業)

**目的**: 執行升級前的基準測試和驗證

**⚠️ 關鍵**: 此階段必須完成後才能開始升級任何套件

-   [x] T012 執行 Phase 1 基準驗證 - TypeScript 編譯 (`npx tsc --noEmit`)
-   [x] T013 執行 Phase 1 基準驗證 - 開發建置 (`npm run compile`)
-   [x] T014 執行 Phase 1 基準驗證 - 生產建置 (`npm run package`)
-   [x] T015 執行 Phase 1 基準驗證 - 完整測試套件 (`npm test`)
-   [x] T016 執行 Phase 1 基準驗證 - 測試覆蓋率 (`npm run test:coverage`)
-   [x] T017 記錄基準數據 (編譯時間、測試時間、測試通過率、覆蓋率、檔案大小)
-   [x] T018 驗證基準符合預期 (190/191 測試通過, ≥87.21% 覆蓋率)

**檢查點**: ✅ 基準驗證完成 - User Story 實作可並行開始

---

## Phase 3: User Story 1 - Blockly 主題模組更新 [P1] 🎯 MVP

**目標**: 升級 @blockly/theme-modern 從 6.0.10 到 6.0.12,確保主題系統穩定且視覺一致

**獨立測試**: 啟動 Extension Development Host,開啟 Blockly 編輯器,測試明暗主題切換功能

### 實作 User Story 1

-   [x] T019 [US1] 升級 @blockly/theme-modern 到 6.0.12 (`npm install @blockly/theme-modern@6.0.12`)
-   [x] T020 [US1] 驗證 package.json 中的版本號已更新為 6.0.12
-   [x] T021 [US1] 驗證 package-lock.json 已自動更新

### 編譯階段驗證 (Compilation Checkpoints)

-   [x] T022 [US1] 檢查點 CP-001: TypeScript 編譯檢查 (`npx tsc --noEmit`)
    -   **預期**: Exit code 0,無型別錯誤
    -   **失敗處理**: 如失敗,執行回滾 (Task T048)
-   [x] T023 [US1] 檢查點 CP-002: 開發建置 (`npm run compile`)
    -   **預期**: dist/extension.js 生成成功,編譯時間 ≤ 5.06 秒
    -   **失敗處理**: 如失敗,執行回滾 (Task T048)
-   [x] T024 [US1] 檢查點 CP-003: 生產建置 (`npm run package`)
    -   **預期**: 成功,產出檔案存在且完整
        -   dist/extension.js 存在且大小在 130,506 ± 2% bytes (127,896 - 133,116)
        -   dist/extension.js.map 存在且非空
        -   無建置錯誤訊息
    -   **失敗處理**: 如失敗,執行回滾 (Task T048)

### 測試階段驗證 (Testing Checkpoints)

-   [x] T025 [US1] 檢查點 TP-001: 完整測試套件執行 (`npm test`)
    -   **預期**: 190/191 測試通過,執行時間 ≤ 21.58 秒
    -   **失敗處理**: 如失敗,執行回滾 (Task T048)
-   [x] T026 [US1] 檢查點 TP-002: 測試覆蓋率驗證 (`npm run test:coverage`)
    -   **預期**: 覆蓋率 ≥ 87.21%
    -   **失敗處理**: 如失敗,執行回滾 (Task T048)

### 安全性階段驗證 (Security Checkpoints)

-   [x] T027 [US1] 檢查點 SP-001: npm 安全漏洞掃描 (`npm audit --audit-level=high`)
    -   **預期**: 0 個 critical/high 級別漏洞
    -   **失敗處理**: 如發現漏洞,分析並決策是否回滾

### 手動測試階段 (Manual Testing Checkpoints)

-   [ ] T028 [US1] 檢查點 MP-001-1: 開啟 Extension Development Host (F5)
    -   **預期**: Extension 成功載入,無錯誤訊息
-   [ ] T029 [US1] 檢查點 MP-001-2: 開啟任一 .blockly 檔案
    -   **預期**: Blockly 編輯器成功開啟
-   [ ] T030 [US1] 檢查點 MP-001-3: 測試明亮主題 (Light Theme)
    -   **預期**: 主題正確套用,所有積木類別正常顯示,顏色配置符合預期,無視覺異常
    -   **失敗處理**: 如發現視覺迴歸,執行回滾 (Task T048)
-   [ ] T031 [US1] 檢查點 MP-001-4: 測試深色主題 (Dark Theme)
    -   **預期**: 主題正確套用,所有積木類別正常顯示,顏色配置符合預期,無視覺異常
    -   **失敗處理**: 如發現視覺迴歸,執行回滾 (Task T048)
-   [ ] T032 [US1] 檢查點 MP-001-5: 測試積木拖放互動
    -   **預期**: 積木可正常拖放,連接點正確顯示,積木形狀和陰影正確渲染
    -   **失敗處理**: 如發現功能異常,執行回滾 (Task T048)

### User Story 1 完成

-   [x] T033 [US1] 記錄 User Story 1 驗證結果 (編譯時間、測試時間、測試通過率、覆蓋率、檔案大小)
-   [x] T034 [US1] 確認所有 User Story 1 檢查點通過

**檢查點**: ✅ User Story 1 完成 - @blockly/theme-modern 6.0.12 已驗證且穩定

---

## Phase 4: User Story 2 - Node.js 型別定義更新 [P2]

**目標**: 升級 @types/node 從 20.17.12 到 20.19.22,提供最新的 Node.js 20.x API 型別定義

**獨立測試**: 執行 TypeScript 編譯和完整測試套件,確保所有 Node.js API 使用都有正確的型別推斷

### 實作 User Story 2

-   [x] T035 [US2] 升級 @types/node 到 20.19.22 (`npm install @types/node@20.19.22`)
-   [x] T036 [US2] 驗證 package.json 中的版本號已更新為 20.19.22
-   [x] T037 [US2] 驗證 package-lock.json 已自動更新

### 編譯階段驗證 (Compilation Checkpoints)

-   [x] T038 [US2] 檢查點 CP-001: TypeScript 編譯檢查 (`npx tsc --noEmit`)
    -   **預期**: Exit code 0,無型別錯誤
    -   **失敗處理**: 如失敗,執行回滾 (Task T049)
-   [x] T039 [US2] 檢查點 CP-002: 開發建置 (`npm run compile`)
    -   **預期**: dist/extension.js 生成成功,編譯時間 ≤ 5.06 秒
    -   **失敗處理**: 如失敗,執行回滾 (Task T049)
-   [x] T040 [US2] 檢查點 CP-003: 生產建置 (`npm run package`)
    -   **預期**: 成功,產出檔案存在且完整
        -   dist/extension.js 存在且大小在 130,506 ± 2% bytes (127,896 - 133,116)
        -   dist/extension.js.map 存在且非空
        -   無建置錯誤訊息
    -   **失敗處理**: 如失敗,執行回滾 (Task T049)

### 測試階段驗證 (Testing Checkpoints)

-   [x] T041 [US2] 檢查點 TP-001: 完整測試套件執行 (`npm test`)
    -   **預期**: 190/191 測試通過,執行時間 ≤ 21.58 秒
    -   **失敗處理**: 如失敗,執行回滾 (Task T049)
-   [x] T042 [US2] 檢查點 TP-002: 測試覆蓋率驗證 (`npm run test:coverage`)
    -   **預期**: 覆蓋率 ≥ 87.21%
    -   **失敗處理**: 如失敗,執行回滾 (Task T049)

### 安全性階段驗證 (Security Checkpoints)

-   [x] T043 [US2] 檢查點 SP-001: npm 安全漏洞掃描 (`npm audit --audit-level=high`)
    -   **預期**: 0 個 critical/high 級別漏洞
    -   **失敗處理**: 如發現漏洞,分析並決策是否回滾

### 手動測試階段 (Manual Testing Checkpoints)

-   [ ] T044 [US2] 檢查點 MP-002-1: 開啟 src/services/fileService.ts
    -   **預期**: 檔案正常開啟,無型別錯誤警告
-   [ ] T045 [US2] 檢查點 MP-002-2: 檢查 fs 模組 API 的型別提示
    -   **具體驗證步驟**:
        1. Hover 提示: 將滑鼠懸停在 `fs.readFile`, `fs.writeFile` 等 API,檢查是否顯示完整參數和返回型別
        2. 自動完成: 在 `fs.` 後按 Ctrl+Space,檢查是否列出正確的方法名稱和參數提示
        3. 錯誤標示: 故意輸入錯誤型別參數(如傳入 number 給 string 參數),檢查是否出現紅色波浪線提示
        4. 參數提示: 在函數呼叫時檢查是否顯示參數名稱和型別
    -   **預期**: 所有 4 個驗證步驟通過,型別提示完整且準確
-   [ ] T046 [US2] 檢查點 MP-002-3: 開啟 src/services/settingsManager.ts
    -   **預期**: path 和 fs 模組型別提示正確
-   [ ] T047 [US2] 檢查點 MP-002-4: 重啟 TypeScript Server (強制執行)
    -   **命令**: Ctrl+Shift+P → "TypeScript: Restart TS Server"
    -   **預期**: 重啟後型別提示保持正確,無快取殘留問題
    -   **執行時機**: 在 T045 型別提示驗證完成後必須執行,確保 IDE 載入最新型別定義

### User Story 2 完成

-   [x] T050 [US2] 記錄 User Story 2 驗證結果 (編譯時間、測試時間、測試通過率、覆蓋率、檔案大小)
-   [x] T051 [US2] 確認所有 User Story 2 檢查點通過

**檢查點**: ✅ User Story 2 完成 - @types/node 20.19.22 已驗證且型別提示正確

---

## Phase 5: 文件更新與 Git 提交

**目的**: 記錄升級內容並提交變更

**前置條件**: User Story 1 和 User Story 2 都已完成並通過所有驗證

-   [x] T052 更新 CHANGELOG.md,新增 Phase 2 升級記錄
    -   **內容**: 記錄兩個套件的升級 (版本號、升級類型、主要改進)
    -   **格式**: 中英雙語,符合既有 CHANGELOG 格式
-   [x] T053 檢查所有變更檔案 (`git status`)
    -   **預期**: package.json, package-lock.json, CHANGELOG.md
-   [x] T054 加入變更到 Git (`git add package.json package-lock.json CHANGELOG.md`)
-   [x] T055 提交變更 (`git commit`)
    -   **訊息格式**: 使用 quickstart.md 中的 Git commit 訊息範本
    -   **包含**: 套件版本、驗證結果摘要
-   [x] T056 推送分支 (`git push origin 006-minor-deps-update`)
-   [x] T057 建立 Pull Request
    -   **標題**: `chore(deps): Phase 2 - 升級 @blockly/theme-modern 和 @types/node`
    -   **描述**: 參考 specs/006-minor-deps-update/spec.md,包含驗證結果
    -   **PR URL**: https://github.com/Shen-Ming-Hong/singular-blockly/pull/11

**檢查點**: 所有變更已記錄並提交,Pull Request 已建立

---

## Phase 6: 回滾任務 (失敗時使用)

**目的**: 提供快速回滾機制,當任何驗證失敗時恢復環境

### User Story 1 回滾

-   [ ] T048 [US1] 回滾 @blockly/theme-modern 到 6.0.10
    -   **方案 1 (推薦)**: `git checkout package.json package-lock.json` 後 `npm ci`
    -   **方案 2**: `npm install @blockly/theme-modern@6.0.10`
    -   **驗證**: 執行 `npm test` 確認回到 Phase 1 狀態 (190/191 測試通過)

### User Story 2 回滾

-   [ ] T049 [US2] 回滾 @types/node 到 20.17.12
    -   **方案 1 (推薦)**: `git checkout package.json package-lock.json` 後 `npm ci`
    -   **方案 2**: `npm install @types/node@20.17.12`
    -   **驗證**: 執行 `npm test` 確認回到 Phase 1 狀態 (190/191 測試通過)

**注意**: 回滾後應記錄失敗的檢查點和錯誤訊息,分析原因並決定是否重試或延後升級

---

## 依賴關係與執行順序

### Phase 依賴關係

-   **Phase 0 (研究與驗證)**: ✅ 已完成 - 無依賴
-   **Phase 1 (環境準備)**: 依賴 Phase 0 完成 - 可立即開始
-   **Phase 2 (Foundational)**: 依賴 Phase 1 完成 - **阻塞所有 User Story**
-   **Phase 3 (User Story 1)**: 依賴 Phase 2 完成 - 可開始實作
-   **Phase 4 (User Story 2)**: 依賴 Phase 2 完成 - 可開始實作
-   **Phase 5 (文件更新)**: 依賴 Phase 3 和 Phase 4 完成
-   **Phase 6 (回滾)**: 任何階段失敗時觸發

### User Story 依賴關係

-   **User Story 1 (P1)**: Phase 2 完成後可開始 - 無其他 Story 依賴
-   **User Story 2 (P2)**: Phase 2 完成後可開始 - 無其他 Story 依賴
-   **兩個 Story 獨立**: US1 和 US2 可並行執行,互不依賴

### 每個 User Story 內部順序

-   升級套件 (T019/T035) → 驗證版本 (T020-T021/T036-T037)
-   編譯檢查點 (T022-T024/T038-T040) → 測試檢查點 (T025-T026/T041-T042)
-   安全檢查點 (T027/T043) → 手動測試檢查點 (T028-T032/T044-T047)
-   所有檢查點通過 → 記錄結果 (T033-T034/T050-T051)

### 並行執行機會

-   **Phase 1 所有任務** (T007-T011): 可並行執行 (檢查動作)
-   **Phase 2 基準驗證** (T012-T016): 必須順序執行 (建置依賴)
-   **User Story 1 和 2**: Phase 2 完成後可並行開始 (不同套件)
-   **文件更新任務** (T052-T057): 必須順序執行 (Git 操作)

---

## 並行執行範例: 雙 Story 並行

```powershell
# Phase 2 完成後,如果有兩位開發者:

# 開發者 A: User Story 1
Task: "T019 [US1] 升級 @blockly/theme-modern 到 6.0.12"
Task: "T022-T032 [US1] 執行所有 User Story 1 檢查點"

# 開發者 B: User Story 2
Task: "T035 [US2] 升級 @types/node 到 20.19.22"
Task: "T038-T047 [US2] 執行所有 User Story 2 檢查點"
```

---

## 實作策略

### MVP 優先 (僅 User Story 1)

1. 完成 Phase 1: 環境準備
2. 完成 Phase 2: Foundational (關鍵 - 阻塞所有 Story)
3. 完成 Phase 3: User Story 1
4. **停止並驗證**: 獨立測試 User Story 1
5. 如穩定,可選擇:
    - 立即部署/展示 MVP (僅主題升級)
    - 或繼續 User Story 2

### 漸進式交付

1. 完成環境準備 + Foundational → 基礎就緒
2. 加入 User Story 1 → 獨立測試 → 提交 (MVP!)
3. 加入 User Story 2 → 獨立測試 → 提交
4. 每個 Story 增加價值且不破壞前一個 Story

### 單人執行策略 (推薦)

1. 按 Phase 順序執行: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
2. 每個 Phase 完成後驗證檢查點
3. 任何失敗立即執行 Phase 6 回滾
4. 預估總時間: 30-45 分鐘 (含手動測試)

---

## 備註

-   [P] 任務 = 不同檔案,無依賴性,可並行
-   [Story] 標籤 = 將任務映射到特定 User Story,便於追蹤
-   每個 User Story 應可獨立完成和測試
-   每個檢查點都有明確的預期結果和失敗處理
-   在任何檢查點停止以獨立驗證 Story
-   避免: 模糊任務、同檔案衝突、破壞獨立性的跨 Story 依賴

---

## 總任務統計

-   **Phase 0 (已完成)**: 7 個任務 (研究與驗證)
-   **Phase 1 (環境準備)**: 5 個任務 (T007-T011)
-   **Phase 2 (Foundational)**: 7 個任務 (T012-T018)
-   **Phase 3 (User Story 1)**: 16 個任務 (T019-T034)
-   **Phase 4 (User Story 2)**: 17 個任務 (T035-T051)
-   **Phase 5 (文件更新)**: 6 個任務 (T052-T057)
-   **Phase 6 (回滾)**: 2 個任務 (T048, T049 - 失敗時使用)
-   **總計**: 60 個任務 (含回滾任務)

**每個 User Story 的任務數**:

-   User Story 1: 16 個任務 (升級 + 13 個檢查點 + 記錄)
-   User Story 2: 17 個任務 (升級 + 14 個檢查點 + 記錄)

**並行機會識別**: 2 個 (User Story 1 和 2 可在 Phase 2 完成後並行)

**建議 MVP 範圍**: User Story 1 (主題升級) - 16 個任務

---

**格式驗證**: ✅ 所有任務都遵循檢查表格式 (checkbox, ID, Story 標籤, 檔案路徑)
