# Tasks: 階段 1 安全升級 - 型別定義與 TypeScript 目標

**Input**: 設計文件來自 `/specs/007-safe-types-upgrade/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**測試策略**: 本功能使用現有測試套件 (190 測試) 驗證升級,無需新增測試檔案。所有驗證透過執行現有測試完成。

**任務組織**: 任務按 User Story 組織,每個 Story 可獨立實作和驗證。

---

## 格式: `[ID] [P?] [Story] 說明`

-   **[P]**: 可並行執行 (不同檔案,無依賴)
-   **[Story]**: 任務所屬的 User Story (例: US1, US2, US3)
-   所有說明包含明確的檔案路徑

---

## Phase 0: 研究與驗證 (已完成 ✅)

**目的**: 驗證函式庫相容性,收集權威文件,確保可測試設計

**狀態**: ✅ 已完成 - research.md 已建立並記錄所有發現

**完成項目**:

-   ✅ 使用 MCP `resolve-library-id` 搜尋 @types/vscode 和 @types/node 文件
-   ✅ 使用 MCP `webSearch` 驗證 VSCode API 1.96→1.105 無破壞性變更
-   ✅ 驗證 Node.js 22.x 型別定義向後相容
-   ✅ 確認 ES2023 在 TypeScript 5.9.3 和 VSCode Runtime 完全支援
-   ✅ 記錄研究發現於 research.md (5,000+ 行)
-   ✅ 風險評估: 所有升級項目 🟢 極低風險

**Checkpoint**: 研究完成 - 所有技術決策基於最新資訊,可安全進入實作階段

---

## Phase 1: 準備與驗證 (Setup & Verification)

**目的**: 確保環境準備就緒,建立乾淨的升級起點

-   [x] T001 驗證開發環境版本符合前置要求
    -   檢查 Node.js ≥ 22.16.0
    -   檢查 npm ≥ 10.8.1
    -   檢查 VSCode ≥ 1.96.0
    -   執行 `git status` 確認工作目錄乾淨
    -   記錄當前版本於終端輸出
-   [x] T002 建立升級前的基準測量

    -   執行 `npm run compile` 記錄編譯時間 (基準: 4.6s)
    -   執行 `npm test` 記錄測試時間 (基準: 19.6s) 和覆蓋率 (基準: 87.21%)
    -   記錄 dist/extension.js 大小 (基準: 130,506 bytes)
    -   儲存基準資料供 Phase 4 比較

-   [x] T003 [P] 建立升級分支並備份當前狀態
    -   確認已在 `007-safe-types-upgrade` 分支
    -   執行 `git stash` 儲存任何未提交變更 (如果有)
    -   建立備份標籤: `git tag backup-pre-upgrade-$(Get-Date -Format 'yyyyMMdd-HHmmss')`

**Checkpoint**: 環境驗證完成 - 基準資料已記錄,可安全進入升級階段

---

## Phase 2: User Story 1 - VSCode API 型別定義升級 (Priority: P1) 🎯 MVP

**目標**: 升級 @types/vscode 型別定義從 1.96.0 至 1.105.0,獲得最新 VSCode API 型別提示

**獨立測試**: 執行 `npm run compile` 驗證無型別錯誤,執行 `npm test` 確認 190/190 測試通過

**風險等級**: 🟢 極低 (research.md 確認無破壞性變更)

### 實作 User Story 1

-   [x] T004 [US1] 更新 package.json 中的 @types/vscode 版本

    -   開啟 `E:\singular-blockly\package.json`
    -   在 `devDependencies` 中更新: `"@types/vscode": "^1.105.0"`
    -   儲存檔案但**不執行** npm install (等待 T006 一起安裝)

-   [x] T005 [US1] 清理舊依賴並重新安裝

    -   執行 `Remove-Item node_modules -Recurse -Force`
    -   執行 `Remove-Item package-lock.json -Force`
    -   執行 `npm install`
    -   驗證安裝成功: `npm list @types/vscode` 應顯示 1.105.0

-   [x] T006 [US1] 執行 Checkpoint 1: 型別檢查驗證

    -   參考 `contracts/checkpoint-1-type-check.md`
    -   執行 `npm run compile`
    -   驗證編譯成功 (exit code 0)
    -   驗證無 TypeScript 錯誤
    -   驗證編譯時間 ≤ 5 秒
    -   驗證 dist/extension.js 已生成

-   [x] T007 [US1] 執行初步測試驗證 US1 功能正常
    -   執行 `npm test`
    -   驗證 190/190 測試通過
    -   驗證測試執行時間 ≤ 22 秒
    -   驗證覆蓋率 ≥ 87.21%
    -   **不提交** - 等待 US2 和 US3 完成後一起提交

**Checkpoint US1**: 此時 @types/vscode 已成功升級,型別檢查和測試均通過,US1 功能獨立驗證完成

---

## Phase 3: User Story 2 - Node.js 型別定義升級 (Priority: P2)

**目標**: 升級 @types/node 型別定義從 20.19.22 至 22.x,與執行環境 Node.js 22.16.0 對齊

**獨立測試**: 執行 `npm run compile` 和 `npm test` 驗證 Node.js API 型別正確

**風險等級**: 🟢 極低 (Node.js 22.x 型別定義向後相容)

**依賴**: US1 必須完成 (package.json 已更新流程)

### 實作 User Story 2

-   [x] T008 [US2] 更新 package.json 中的 @types/node 版本

    -   開啟 `E:\singular-blockly\package.json`
    -   在 `devDependencies` 中更新: `"@types/node": "^22.0.0"`
    -   儲存檔案

-   [x] T009 [US2] 重新安裝依賴以套用 @types/node 升級

    -   執行 `Remove-Item node_modules -Recurse -Force`
    -   執行 `Remove-Item package-lock.json -Force`
    -   執行 `npm install`
    -   驗證安裝成功: `npm list @types/node` 應顯示 22.x.x
    -   同時驗證 @types/vscode 仍為 1.105.0 (US1 保持)

-   [x] T010 [US2] 重新執行 Checkpoint 1: 驗證 Node.js 型別相容性

    -   參考 `contracts/checkpoint-1-type-check.md`
    -   執行 `npm run compile`
    -   驗證編譯成功,特別檢查 Node.js API 使用 (FileService 中的 fs 操作)
    -   驗證無型別不匹配警告
    -   驗證編譯時間維持 ≤ 5 秒

-   [x] T011 [US2] 執行完整測試驗證 US1+US2 功能正常
    -   執行 `npm test`
    -   驗證 190/190 測試通過
    -   驗證覆蓋率 ≥ 87.21%
    -   特別關注 FileService, SettingsManager 相關測試 (使用 Node.js API)
    -   **不提交** - 等待 US3 完成後一起提交

**Checkpoint US2**: 此時 @types/node 已成功升級,與 Node.js 22.16.0 runtime 對齊,US1+US2 功能獨立驗證完成

---

## Phase 4: User Story 3 - TypeScript 編譯目標升級 (Priority: P3)

**目標**: 升級 TypeScript 編譯目標從 ES2022 至 ES2023,使用最新 ECMAScript 標準

**獨立測試**: 修改 tsconfig.json,執行完整編譯、測試和建置流程驗證

**風險等級**: 🟢 極低 (ES2023 在 TypeScript 5.9.3 和 VSCode Runtime 完全支援)

**依賴**: US1 和 US2 必須完成且穩定

### 實作 User Story 3

-   [x] T012 [US3] 更新 tsconfig.json 的編譯目標

    -   開啟 `E:\singular-blockly\tsconfig.json`
    -   在 `compilerOptions` 中更新: `"target": "ES2023"`
    -   在 `compilerOptions` 中更新: `"lib": ["ES2023"]`
    -   儲存檔案

-   [x] T013 [US3] 執行 Checkpoint 1: 驗證 ES2023 編譯設定

    -   參考 `contracts/checkpoint-1-type-check.md`
    -   執行 `npm run compile`
    -   驗證編譯成功
    -   驗證無 ES2023 相關錯誤
    -   驗證編譯時間維持 ≤ 5 秒

-   [x] T014 [US3] 執行 Checkpoint 2: 完整測試套件驗證

    -   參考 `contracts/checkpoint-2-test-suite.md`
    -   執行 `npm test`
    -   驗證 190/190 測試通過 (100% 通過率)
    -   驗證測試執行時間 ≤ 22 秒
    -   驗證覆蓋率 ≥ 87.21% (允許 -0.5% 誤差,即 ≥ 86.71%)
    -   檢查無測試迴歸或超時

-   [x] T015 [US3] 執行 Checkpoint 3: 建置產物驗證

    -   參考 `contracts/checkpoint-3-build-artifact.md`
    -   檢查 dist/extension.js 檔案大小
    -   計算相對基準線 (130,506 bytes) 的變化百分比
    -   驗證大小變化在 ±5% 範圍內 (123,980 - 137,031 bytes)
    -   記錄實際大小和變化百分比
    -   **故障排除**: 若大小變化超過 ±5%,檢查 webpack 輸出是否引入不必要的 polyfills 或依賴 (可使用 webpack-bundle-analyzer 分析)
    -   **故障排除**: 若大小變化超過 ±5%,檢查 webpack 輸出是否引入不必要的 polyfills 或依賴 (可使用 webpack-bundle-analyzer 分析)

-   [x] T016 [US3] 執行手動功能測試 (Checkpoint 3 的一部分)
    -   按 F5 啟動 Extension Development Host
    -   驗證擴充功能正常啟動 (檢查 Debug Console 無嚴重錯誤)
    -   測試核心功能:
        -   [ ] 開啟 Blockly 編輯器 (右鍵 .ino 檔案 → "Open with Blockly Editor")
        -   [ ] 拖曳積木至工作區
        -   [ ] 儲存工作區 (自動儲存至 blockly/main.json)
        -   [ ] 切換 Light/Dark 主題
        -   [ ] 產生 Arduino 程式碼 (拖曳 setup_loop 積木)
    -   確認所有功能正常運作,使用者體驗無變化

**Checkpoint US3**: 此時所有三個 User Story 已完成,完整升級驗證通過

---

## Phase 5: 最終驗證與文件更新 (Polish & Documentation)

**目的**: 完成升級後的文件更新和最終檢查

-   [x] T017 更新 CHANGELOG.md 記錄升級內容

    -   開啟 `E:\singular-blockly\CHANGELOG.md`
    -   在 `## [Unreleased]` 區段下新增:

        ```markdown
        ### Changed

        -   升級 @types/vscode 從 1.96.0 至 1.105.0
        -   升級 @types/node 從 20.19.22 至 22.x 以對齊 Node.js 22.16.0 runtime
        -   更新 TypeScript target 從 ES2022 至 ES2023

        ### Technical

        -   所有變更向後相容,無破壞性變更
        -   190 測試全數通過,覆蓋率維持 87.21%
        -   建置產物大小變化: +X.XX% (在 ±5% 容忍範圍內)
        ```

    -   將 X.XX% 替換為 T015 記錄的實際變化百分比
    -   儲存檔案

-   [x] T018 [P] 執行最終完整性檢查

    -   執行 `npm run compile` (最後一次編譯檢查)
    -   執行 `npm test` (最後一次測試驗證)
    -   若專案有 lint 腳本,執行 `npm run lint` (ESLint 檢查)
    -   驗證所有檢查通過 (編譯和測試為必要,lint 為可選)

-   [x] T019 [P] 驗證 package.json 和 package-lock.json 一致性

    -   執行 `npm list @types/vscode @types/node typescript`
    -   確認版本符合預期:
        -   @types/vscode: 1.105.0
        -   @types/node: 22.x.x
        -   typescript: 5.9.3
    -   確認 package-lock.json 已自動更新

-   [x] T020 提交升級變更

    -   執行 `git add package.json package-lock.json tsconfig.json CHANGELOG.md`
    -   執行 commit:

        ```powershell
        git commit -m "chore: upgrade @types/vscode to 1.105.0 and @types/node to 22.x

        - Upgrade @types/vscode from 1.96.0 to 1.105.0
        - Upgrade @types/node from 20.19.22 to 22.x to align with Node.js 22.16.0 runtime
        - Update TypeScript target from ES2022 to ES2023
        - All 190 tests passing with 87.21% coverage
        - Build artifact size change: +X.XX% (within ±5% tolerance)

        Checkpoints:
        ✅ Type check passed
        ✅ Test suite passed (190/190)
        ✅ Build artifact validated

        Closes #007-safe-types-upgrade
        "
        ```

    -   將 X.XX% 替換為實際變化百分比

-   [x] T021 [P] 驗證 Constitution 原則符合性 (最終檢查)

    -   確認符合 Principle I (Code Entities as Contracts) - 無新增實體,現有契約不變 ✅
    -   確認符合 Principle V (MCP Tools) - research.md 記錄 MCP 工具使用 ✅
    -   確認符合 Principle VII (Testing) - 190 測試覆蓋率維持 87.21% ✅
    -   確認符合 Principle IX (繁體中文) - 所有文件使用繁體中文 ✅

-   [x] T022 建立升級完成報告
    -   在終端輸出升級摘要 (不需建立檔案,僅顯示於終端):
        -   升級套件清單和版本
        -   編譯時間 (相對基準)
        -   測試時間 (相對基準)
        -   建置產物大小變化
        -   所有 Checkpoint 通過狀態
    -   確認升級總時程 ≤ 45 分鐘

**Checkpoint 最終**: 升級完成,所有變更已提交,文件已更新,可推送至遠端或建立 PR

---

## 依賴關係與執行順序

### Phase 依賴

```
Phase 0 (研究) ✅ 已完成
    ↓
Phase 1 (準備) - 必須完成才能進入 User Stories
    ↓
Phase 2 (US1: VSCode 型別) - 可獨立開始
    ↓
Phase 3 (US2: Node.js 型別) - 依賴 US1 (package.json 已更新流程)
    ↓
Phase 4 (US3: ES2023 目標) - 依賴 US1 和 US2 穩定
    ↓
Phase 5 (最終驗證) - 依賴所有 User Stories 完成
```

### User Story 依賴關係

-   **US1 (P1)**: 可在 Phase 1 完成後立即開始 - 無其他 Story 依賴
-   **US2 (P2)**: 依賴 US1 完成 (需要 package.json 已更新流程)
-   **US3 (P3)**: 依賴 US1 和 US2 完成且穩定 (確保型別定義正確後再變更編譯目標)

### 關鍵順序規則

1. **嚴格循序**: US1 → US2 → US3 (不可並行,因為共用 package.json 和 node_modules)
2. **Checkpoint 順序**: 每個 US 完成後必須執行對應 Checkpoints 再進入下一個 US
3. **單一提交**: 所有三個 US 完成後一次性提交 (T020),避免中間狀態

### 任務內並行機會

**Phase 1 (準備階段)**:

-   T002 (基準測量) 和 T003 (備份) 可並行執行

**Phase 5 (最終驗證)**:

-   T018 (完整性檢查), T019 (版本驗證), T021 (原則檢查) 可並行執行

**限制**: User Story 內的任務必須嚴格循序執行,因為都操作相同檔案

---

## 並行範例: Phase 1 準備階段

```powershell
# 同時執行兩個獨立任務
Start-Job -ScriptBlock {
    # T002: 基準測量
    npm run compile
    npm test
    Get-Item dist/extension.js | Select-Object Length
}

Start-Job -ScriptBlock {
    # T003: 備份
    git tag "backup-pre-upgrade-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
}

# 等待所有任務完成
Get-Job | Wait-Job | Receive-Job
```

---

## 實作策略

### MVP 優先 (僅 User Story 1)

如果需要最小可行升級:

1. 完成 Phase 1: 準備 (T001-T003)
2. 完成 Phase 2: US1 - VSCode 型別升級 (T004-T007)
3. **停止並驗證**: 測試 US1 獨立功能
4. 如果 US1 穩定,可選擇:
    - 立即部署 US1 (僅升級 @types/vscode)
    - 或繼續完成 US2 和 US3

### 完整升級 (推薦)

完整執行所有 5 個 Phases:

1. Phase 1: 準備 → 環境就緒
2. Phase 2: US1 → VSCode 型別升級 ✅
3. Phase 3: US2 → Node.js 型別升級 ✅
4. Phase 4: US3 → ES2023 目標升級 ✅
5. Phase 5: 最終驗證 → 單一提交

**推薦原因**: 三個升級項目互相獨立但一起提交可避免多次 npm install 和測試執行

### 漸進式交付

若需要分階段驗證:

1. 完成 Phase 1 + Phase 2 → 驗證 US1 → 提交
2. 完成 Phase 3 → 驗證 US2 → 提交
3. 完成 Phase 4 → 驗證 US3 → 提交
4. Phase 5 → 最終文件更新

**注意**: 此策略需要三次 npm install 和測試執行,總時間會超過 45 分鐘

---

## 回滾策略

### 完整回滾 (任何 Checkpoint 失敗)

```powershell
# 回滾所有變更
git checkout HEAD -- package.json package-lock.json tsconfig.json CHANGELOG.md

# 重新安裝依賴
Remove-Item node_modules -Recurse -Force
npm install

# 驗證回滾成功
npm run compile
npm test
```

### 部分回滾 (僅回滾特定 User Story)

**回滾 US3 (保留 US1+US2)**:

```powershell
# 僅回滾 tsconfig.json
git checkout HEAD -- tsconfig.json
npm run compile
npm test
```

**回滾 US2+US3 (僅保留 US1)**:

```powershell
# 回滾 package.json 中的 @types/node
# 手動編輯 package.json 改回 "@types/node": "^20.19.22"
npm install
git checkout HEAD -- tsconfig.json
npm run compile
npm test
```

---

## 時間估算

| Phase    | 說明                  | 預估時間             |
| -------- | --------------------- | -------------------- |
| 0        | 研究 (已完成)         | ✅ 完成 (設計階段)   |
| 1        | 準備與驗證            | 5 分鐘 (實作階段)    |
| 2        | US1: VSCode 型別升級  | 10 分鐘              |
| 3        | US2: Node.js 型別升級 | 10 分鐘              |
| 4        | US3: ES2023 目標升級  | 15 分鐘 (含手動測試) |
| 5        | 最終驗證與文件        | 5 分鐘               |
| **總計** |                       | **45 分鐘**          |

**注意**: 時間依機器效能和網路速度而定,npm install 可能需要更長時間

---

## 成功標準檢查清單

### 所有 User Stories 完成後

-   [ ] ✅ @types/vscode 版本為 1.105.0
-   [ ] ✅ @types/node 版本為 22.x.x
-   [ ] ✅ tsconfig.json target 為 ES2023
-   [ ] ✅ tsconfig.json lib 為 ["ES2023"]
-   [ ] ✅ 編譯成功,無型別錯誤
-   [ ] ✅ 190/190 測試通過 (100% 通過率)
-   [ ] ✅ 測試覆蓋率 ≥ 87.21%
-   [ ] ✅ 編譯時間 ≤ 5 秒
-   [ ] ✅ 測試執行時間 ≤ 22 秒
-   [ ] ✅ 建置產物大小變化 ±5% (123,980 - 137,031 bytes)
-   [ ] ✅ 手動功能測試通過 (5 項核心功能)
-   [ ] ✅ CHANGELOG.md 已更新
-   [ ] ✅ Git commit 完成,訊息符合 Conventional Commits 格式

### Constitution 原則符合性

-   [ ] ✅ Principle I: 無新增實體,現有契約不變
-   [ ] ✅ Principle V: MCP 工具使用記錄於 research.md
-   [ ] ✅ Principle VII: 測試覆蓋率維持 87.21%
-   [ ] ✅ Principle VIII: 無副作用引入 (僅配置變更)
-   [ ] ✅ Principle IX: 所有文件使用繁體中文

---

## 注意事項

-   **嚴格循序**: US1 → US2 → US3 不可並行 (共用檔案)
-   **單一提交**: 三個 User Story 完成後一次性提交
-   **Checkpoint 驗證**: 每個 US 完成後必須執行對應 Checkpoints
-   **手動測試**: US3 的 Checkpoint 3 需要手動功能測試 (2 分鐘)
-   **時間緩衝**: 實際時間可能超過預估,建議預留 60 分鐘
-   **回滾準備**: 任何 Checkpoint 失敗立即執行回滾程序

---

**任務清單產生日期**: 2025-10-21  
**總任務數**: 22 個任務  
**MVP 範圍**: Phase 1 + Phase 2 (US1 only) = 6 個任務  
**完整升級**: 所有 5 個 Phases = 22 個任務  
**預估總時程**: 45 分鐘 (完整升級)
