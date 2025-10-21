# Tasks: 開發工具依賴升級

**Feature**: 009-dev-tools-upgrade  
**Input**: Design documents from `/specs/009-dev-tools-upgrade/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/upgrade-validation-checklist.md

---

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: 可並行執行(不同檔案,無依賴關係)
-   **[Story]**: 任務所屬的使用者故事(US1, US2, US3)
-   描述中包含明確的檔案路徑

---

## Phase 0: 研究與驗證 (MCP-Powered)

**目的**: 驗證函式庫相容性,收集權威文件,確保可測試設計

**⚠️ 重要**: 在任何實作前完成此階段,確保決策基於最新資訊

-   [x] T000 [P] 使用 MCP `webSearch` 查詢 @typescript-eslint/eslint-plugin 8.46.2 changelog
-   [x] T001 [P] 使用 MCP `webSearch` 查詢 webpack-cli 6.x 破壞性變更和相容性
-   [x] T002 [P] 使用 MCP `webSearch` 驗證 ESLint ecmaVersion 2023 對 ES2023 語法支援
-   [x] T003 記錄研究發現於 research.md
-   [x] T004 驗證所有依賴版本與當前專案相容
-   [x] T005 建立 data-model.md 定義升級實體(DependencyVersion, ConfigChange, TestResult, PerformanceBenchmark)
-   [x] T006 建立 contracts/upgrade-validation-checklist.md 定義驗證步驟
-   [x] T007 建立 quickstart.md 提供開發者快速入門指南

**檢查點**: 研究和設計驗證完成 - 可開始執行升級實作

---

## Phase 1: 環境準備與備份

**目的**: 環境驗證和建立回滾機制

-   [ ] T008 驗證 Node.js 版本 ≥ 22.16.0 (執行 `node --version`)
-   [ ] T009 驗證 npm 版本 ≥ 10.x (執行 `npm --version`)
-   [ ] T010 確認 Git 工作目錄乾淨 (執行 `git status`,無未提交變更)
-   [ ] T011 確保依賴已安裝 (檢查 `node_modules/` 存在,否則執行 `npm install`)
-   [ ] T012 記錄當前依賴版本基準 (執行 `npm list --depth=0 > pre-upgrade-versions.txt`)
-   [ ] T013 測量編譯時間基準 (執行 3 次 `npm run compile`,記錄平均時間至 `performance-baseline.txt`,基準值 ~4000ms)
-   [ ] T014 測量 bundle 大小基準 (檢查 `dist/extension.js` 大小,記錄至 `performance-baseline.txt`,基準值 ~130KB)
-   [ ] T015 記錄測試通過率基準 (執行 `npm test`,確認 189/190 passing)
-   [ ] T016 建立 Git 檢查點 (執行 `git add . && git commit -m "chore: pre-upgrade checkpoint"`)
-   [ ] T017 建立 Git 標籤 (執行 `git tag pre-009-upgrade`)
-   [ ] T018 備份關鍵檔案 (複製 `package.json` 和 `package-lock.json` 為 `.backup` 版本)

**檢查點**: 環境驗證完成,備份機制就緒 - 可開始升級 User Story 1

---

## Phase 2: User Story 1 - TypeScript ESLint Plugin 修補升級 (Priority: P1) 🎯 MVP

**目標**: 將 @typescript-eslint/eslint-plugin 從 8.46.1 升級至 8.46.2,獲得最新 bug 修復

**獨立測試**: 執行 `npm run lint` 驗證所有檔案通過檢查,無新增錯誤或警告

### User Story 1 實作

-   [ ] T019 [US1] 升級 @typescript-eslint/eslint-plugin 到 8.46.2 (執行 `npm install @typescript-eslint/eslint-plugin@8.46.2` 於專案根目錄)
-   [ ] T020 [US1] 驗證 package.json 版本已更新為 8.46.2 (執行 `Get-Content package.json | Select-String "@typescript-eslint/eslint-plugin"`)
-   [ ] T021 [US1] 檢查無 peer dependency 警告 (檢視 npm install 輸出)
-   [ ] T022 [US1] 執行編譯驗證 (執行 `npm run compile`,確認 exit code 0)
-   [ ] T023 [US1] 執行 ESLint 驗證 (執行 `npx eslint src/ --max-warnings=0`,確認無錯誤)
-   [ ] T024 [US1] 執行完整測試套件 (執行 `npm test`,確認 189/190 passing)
-   [ ] T025 [US1] 提交升級變更 (執行 `git add package.json package-lock.json && git commit -m "chore: upgrade @typescript-eslint/eslint-plugin to 8.46.2"`)

**檢查點**: User Story 1 完成 - ESLint plugin 已升級且所有驗證通過

---

## Phase 3: User Story 2 - ESLint ECMAScript 版本對齊 (Priority: P1)

**目標**: 更新 ESLint 配置為 ecmaVersion 2023,對齊 TypeScript 編譯目標

**獨立測試**: 建立測試檔案使用 ES2023 語法(如 `[1,2,3].toSorted()`),驗證 ESLint 不報錯

### User Story 2 實作

-   [ ] T026 [US2] 開啟 eslint.config.mjs 檔案 (於專案根目錄)
-   [ ] T027 [US2] 更新 ecmaVersion 從 2022 到 2023 (修改 `eslint.config.mjs` 約第 17 行 `languageOptions.ecmaVersion: 2023`)
-   [ ] T028 [US2] 儲存檔案變更
-   [ ] T029 [US2] 驗證 ESLint 接受新配置 (執行 `npx eslint src/ --max-warnings=0`,確認無錯誤)
-   [ ] T030 [US2] 執行編譯驗證 (執行 `npm run compile`,確認 exit code 0)
-   [ ] T031 [US2] 執行完整測試套件 (執行 `npm test`,確認 189/190 passing)
-   [ ] T032 [US2] 建立 ES2023 語法測試檔案驗證 (建立 `src/test/es2023-syntax-test.ts`,測試 `toSorted()`, `findLast()`, `toReversed()`, `with()`, `findLastIndex()` 等方法,執行 `npx eslint src/test/es2023-syntax-test.ts`,確認 ESLint 無語法錯誤)
-   [ ] T033 [US2] 提交配置變更 (執行 `git add eslint.config.mjs src/test/es2023-syntax-test.ts && git commit -m "chore: update ESLint ecmaVersion to 2023"`)

**檢查點**: User Story 2 完成 - ESLint 已支援 ES2023 語法,配置與 TypeScript 對齊

---

## Phase 4: User Story 3 - webpack-cli 主版本升級評估 (Priority: P2)

**目標**: 評估並執行 webpack-cli 從 5.1.4 升級到 6.0.1,確認相容性

**獨立測試**: 執行所有 npm scripts(compile, watch, package),驗證產出與升級前一致

### User Story 3 實作

#### 4.1 升級前稽核

-   [ ] T034 [P] [US3] 稽核 package.json scripts 是否使用 `--define-process-env-node-env` (執行 `Get-Content package.json | Select-String "--define-process-env-node-env"`,應無結果)
-   [ ] T035 [P] [US3] 稽核 webpack.config.js 是否有 CLI 選項參考 (執行 `Get-Content webpack.config.js | Select-String "--define-process-env-node-env"`,應無結果)
-   [ ] T036 [US3] 手動檢視 package.json scripts,確認無使用已移除指令(`webpack init`, `webpack loader`, `webpack plugin`)

#### 4.2 升級執行

-   [ ] T037 [US3] 升級 webpack-cli 到 6.0.1 (執行 `npm install webpack-cli@6.0.1 --save-dev` 於專案根目錄)
-   [ ] T038 [US3] 驗證 package.json 版本已更新為 6.0.1 (執行 `Get-Content package.json | Select-String "webpack-cli"`)
-   [ ] T039 [US3] 檢查無 peer dependency 警告 (檢視 npm install 輸出)
-   [ ] T040 [US3] 執行編譯驗證 (執行 `npm run compile`,確認 exit code 0)
-   [ ] T041 [US3] 執行 watch 模式驗證 (執行 `npm run watch`,確認啟動成功後 Ctrl+C 停止)
-   [ ] T042 [US3] 執行完整測試套件 (執行 `npm test`,確認 189/190 passing)
-   [ ] T042a [US3] 記錄 webpack-cli 升級決策過程 (於 research.md 中新增章節記錄: 破壞性變更分析結果、相容性測試結果 (T037-T042)、效能影響評估 (待 T043-T047 完成)、風險等級評定依據 spec.md 風險標準、最終升級決策和理由)

#### 4.3 效能驗證

-   [ ] T043 [US3] 測量升級後編譯時間 (執行 3 次 `npm run compile`,計算平均時間,記錄至 `performance-baseline.txt`)
-   [ ] T044 [US3] 驗證編譯時間在基準範圍內 (3600ms - 4400ms,即 4000ms ±10%)
    -   **失敗處理**: 如超出範圍,記錄實際值和差異百分比至 research.md,評估是否可接受:
        -   如增長 <20% 且有合理解釋 (例如新功能),記錄後繼續
        -   如增長 ≥20% 或無合理解釋,執行回滾程序 (見回滾策略章節)
-   [ ] T045 [US3] 測量升級後 bundle 大小 (檢查 `dist/extension.js` 大小,記錄至 `performance-baseline.txt`)
-   [ ] T046 [US3] 驗證 bundle 大小在基準範圍內 (123.5KB - 136.5KB,即 130KB ±5%)
    -   **失敗處理**: 如超出範圍,記錄實際值和差異百分比至 research.md,評估是否可接受:
        -   如增長 <15% 且有合理解釋,記錄後繼續
        -   如增長 ≥15% 或無合理解釋,執行回滾程序 (見回滾策略章節)
-   [ ] T047 [US3] 驗證測試執行時間 <3000ms (從 `npm test` 輸出檢查 "Time:" 行)

#### 4.4 功能驗證(手動測試)

-   [ ] T048 [US3] 啟動 VSCode Extension Development Host (按 F5 或執行 "Run > Start Debugging")
-   [ ] T049 [US3] 開啟 Blockly 編輯器 (Ctrl+Shift+P → "Singular Blockly: Open Editor")
-   [ ] T050 [US3] 驗證編輯器載入正確
    -   **驗收標準**: 工具箱顯示 8 個類別 (設定、邏輯、數學、文字、變數、函式、陣列、硬體),工作區空白可編輯,開發板選單顯示 5 個選項 (Arduino Uno, Nano, Mega, ESP32, Super Mini)
-   [ ] T051 [US3] 測試積木拖放功能
    -   **驗收標準**: 從工具箱「設定」類別拖曳「初始設定 (setup)" 積木到工作區,積木成功顯示於工作區,可以拖曳移動
-   [ ] T052 [US3] 測試程式碼產生功能
    -   **驗收標準**: 拖曳積木後,右側預覽區顯示對應的 Arduino C++ 程式碼 (包含 `void setup()` 和 `void loop()` 函式)
-   [ ] T053 [US3] 測試開發板切換功能
    -   **驗收標準**: 從開發板下拉選單切換到 "ESP32",工作區配置保持,程式碼預覽區更新為 ESP32 專用的引用標頭 (如有 ESP32 特定積木)
-   [ ] T054 [US3] 測試主題切換功能
    -   **驗收標準**: 切換 VSCode 主題 (明亮/暗黑),Blockly 編輯器主題同步變更,工作區背景色、積木顏色、文字顏色正確變更
-   [ ] T055 [US3] 測試儲存/載入功能
    -   **驗收標準**: 拖曳積木後,儲存工作區 (Ctrl+S),關閉編輯器,重新開啟,積木和開發板配置成功恢復至儲存前狀態

#### 4.5 提交變更

-   [ ] T056 [US3] 提交 webpack-cli 升級 (執行 `git add package.json package-lock.json && git commit -m "chore: upgrade webpack-cli to 6.0.1"`)

**檢查點**: User Story 3 完成 - webpack-cli 已升級,所有驗證通過,效能和功能正常

---

## Phase 5: 最終驗證與文件更新

**目的**: 跨故事驗證和文件記錄

### 5.1 依賴完整性驗證

-   [ ] T057 [P] 檢查無重複套件 (執行 `npm ls @typescript-eslint/eslint-plugin` 和 `npm ls webpack-cli`,確認單一版本)
-   [ ] T058 [P] 執行 clean install 驗證 lockfile (執行 `npm ci`,確認無錯誤和修改)
-   [ ] T059 [P] 執行安全性稽核 (執行 `npm audit`,確認無 high/critical 漏洞)
-   [ ] T060 比對版本變更 (比較 `pre-upgrade-versions.txt` 和 `npm list --depth=0` 輸出)

### 5.2 文件更新

-   [ ] T061 更新 CHANGELOG.md (在 "## [Unreleased]" 下新增三個升級項目和效能指標)
-   [ ] T062 填入實際效能數據 (從 Phase 4 效能驗證任務取得編譯時間和 bundle 大小數據)
-   [ ] T063 提交文件變更 (執行 `git add CHANGELOG.md && git commit -m "docs: update CHANGELOG for dev tools upgrade"`)

### 5.3 最終檢查清單

-   [ ] T064 驗證所有 3 個依賴已升級到目標版本 (@typescript-eslint/eslint-plugin 8.46.2, ecmaVersion 2023, webpack-cli 6.0.1)
-   [ ] T065 驗證編譯成功無錯誤 (執行 `npm run compile`)
-   [ ] T066 驗證測試通過基準 (執行 `npm test`,189/190 passing)
-   [ ] T067 驗證 ESLint 無警告 (執行 `npx eslint src/ --max-warnings=0`)
-   [ ] T068 驗證效能在基準範圍內 (編譯時間 ±10%, bundle 大小 ±5%)
-   [ ] T069 驗證擴充功能功能正常 (手動測試 10 項核心功能已在 T048-T055 完成)
-   [ ] T070 驗證無 peer dependency 警告 (執行 `npm install` 無參數,檢查輸出)
-   [ ] T071 驗證無新增安全漏洞 (執行 `npm audit`)
-   [ ] T072 驗證 CHANGELOG.md 已更新
-   [ ] T073 驗證所有變更已提交 Git (執行 `git status`,確認乾淨工作目錄)

### 5.4 清理與準備合併

-   [ ] T074 刪除備份檔案 (刪除 `package.json.backup`, `package-lock.json.backup`, `pre-upgrade-versions.txt`, `performance-baseline.txt`)
-   [ ] T075 執行最終 code review 自檢 (檢查所有 commit 訊息清晰,變更符合規格)
-   [ ] T076 推送分支到遠端 (執行 `git push origin 009-dev-tools-upgrade`)
-   [ ] T076a 回滾驗證演練 (選擇性任務,建議執行)
    -   **目的**: 驗證回滾機制正常運作,確保發生問題時可快速恢復
    -   **步驟**:
        1. 建立測試分支: `git checkout -b rollback-test`
        2. 執行回滾: `git reset --hard pre-009-upgrade`
        3. 重新安裝依賴: `npm ci`
        4. 驗證系統恢復: `npm run compile` (成功), `npm test` (189/190 passing)
        5. 檢查版本: `npm list @typescript-eslint/eslint-plugin webpack-cli` (確認回到舊版本)
        6. 刪除測試分支: `git checkout 009-dev-tools-upgrade && git branch -D rollback-test`
    -   **驗收標準**: 所有步驟執行成功,系統功能和效能恢復到升級前狀態

**檢查點**: 所有升級完成,驗證通過,準備建立 Pull Request

---

## 依賴關係與執行順序

### Phase 依賴關係

-   **Phase 0 (研究與驗證)**: ✅ 已完成 - 無依賴,可立即開始
-   **Phase 1 (環境準備)**: 依賴 Phase 0 完成 - 阻塞所有 User Story
-   **Phase 2 (US1)**: 依賴 Phase 1 完成 - 可獨立執行
-   **Phase 3 (US2)**: 依賴 Phase 1 完成 - 可獨立執行
-   **Phase 4 (US3)**: 依賴 Phase 1 完成 - 可獨立執行
-   **Phase 5 (最終驗證)**: 依賴所有 User Story 完成

### User Story 依賴關係

-   **User Story 1 (P1)**: Phase 1 完成後即可開始 - 無其他故事依賴
-   **User Story 2 (P1)**: Phase 1 完成後即可開始 - 無其他故事依賴
-   **User Story 3 (P2)**: Phase 1 完成後即可開始 - 建議在 US1 和 US2 完成後執行

### 每個 User Story 內部執行順序

#### User Story 1 (T019-T025)

1. T019: 升級套件 (必須先執行)
2. T020-T024: 驗證步驟 (可部分並行)
3. T025: 提交變更 (最後執行)

#### User Story 2 (T026-T033)

1. T026-T028: 配置修改 (順序執行)
2. T029-T031: 驗證步驟 (可並行)
3. T032: ES2023 測試 (依賴 T027)
4. T033: 提交變更 (最後執行)

#### User Story 3 (T034-T056)

1. T034-T036: 稽核階段 (可並行)
2. T037-T042: 升級與基本驗證 (順序執行)
3. T043-T047: 效能驗證 (依賴 T037,可並行)
4. T048-T055: 功能驗證 (依賴 T037,手動測試順序執行)
5. T056: 提交變更 (最後執行)

### 並行執行機會

#### Phase 0 (已完成)

-   T000, T001, T002 可並行執行(不同研究主題)
-   T005, T006, T007 可並行執行(不同文件)

#### Phase 1

-   T008, T009, T010, T011 可並行執行(獨立檢查)
-   T013, T014, T015 可並行執行(獨立基準測量)

#### User Story 1

-   T020, T021 可並行執行(檢查不同內容)
-   T022, T023, T024 可順序或並行執行(獨立驗證命令)

#### User Story 2

-   T029, T030, T031 可並行執行(獨立驗證命令)

#### User Story 3

-   T034, T035 可並行執行(稽核不同檔案)
-   T043, T045 可並行執行(測量不同指標)

#### Phase 5

-   T057, T058, T059 可並行執行(獨立驗證命令)

### 跨 User Story 並行策略

**單人開發者** (建議順序):

1. Phase 1 (環境準備) → 完成所有任務
2. Phase 2 (US1) → 完整驗證通過
3. Phase 3 (US2) → 完整驗證通過
4. Phase 4 (US3) → 完整驗證通過
5. Phase 5 (最終驗證) → 完成所有任務

**多人團隊** (建議並行):

1. 團隊共同完成 Phase 1
2. Phase 1 完成後:
    - 開發者 A: Phase 2 (US1)
    - 開發者 B: Phase 3 (US2)
    - 開發者 C: Phase 4 (US3)
3. 所有 US 完成後,團隊共同完成 Phase 5

---

## 並行執行範例

### Phase 1: 環境準備

```powershell
# 並行執行環境檢查
Start-Job { node --version }  # T008
Start-Job { npm --version }   # T009
Start-Job { git status }      # T010

# 並行測量基準
Start-Job { npm run compile }  # T013 (第1次)
Start-Job { Get-Item dist/extension.js }  # T014
Start-Job { npm test }  # T015
```

### User Story 3: webpack-cli 升級稽核

```powershell
# 並行稽核
Start-Job { Get-Content package.json | Select-String "--define-process-env-node-env" }  # T034
Start-Job { Get-Content webpack.config.js | Select-String "--define-process-env-node-env" }  # T035
```

---

## 實作策略

### MVP 優先 (僅 User Story 1)

1. 完成 Phase 0: 研究與驗證 ✅
2. 完成 Phase 1: 環境準備與備份
3. 完成 Phase 2: User Story 1 (ESLint plugin 升級)
4. **停止並驗證**: 獨立測試 User Story 1
5. 若就緒可部署/展示 MVP

### 漸進式交付

1. 完成 Phase 0-1 → 基礎就緒
2. 新增 User Story 1 → 獨立測試 → 部署/展示 (MVP!)
3. 新增 User Story 2 → 獨立測試 → 部署/展示
4. 新增 User Story 3 → 獨立測試 → 部署/展示
5. 完成 Phase 5 → 最終驗證和文件更新
6. 每個故事新增價值而不破壞先前故事

### 回滾策略

**任何階段失敗時**:

```powershell
# 選項 1: 重置到升級前標籤
git reset --hard pre-009-upgrade

# 選項 2: 從備份恢復
Copy-Item package.json.backup package.json -Force
Copy-Item package-lock.json.backup package-lock.json -Force

# 重新安裝依賴
npm ci

# 驗證回滾
npm run compile  # 應成功
npm test         # 應顯示 189/190 passing
```

---

## 任務統計

### 總任務數

-   **總計**: 78 個任務 (新增 T042a, T076a)
-   **階段 0 (已完成)**: 8 個任務 ✅
-   **階段 1**: 11 個任務
-   **階段 2 (US1)**: 7 個任務
-   **階段 3 (US2)**: 8 個任務
-   **階段 4 (US3)**: 24 個任務 (新增 T042a 記錄 webpack-cli 決策)
-   **階段 5**: 20 個任務 (新增 T076a 回滾驗證演練)

### 每個使用者故事任務數

-   **使用者故事 1 (P1)**: 7 個任務 (T019-T025)
-   **使用者故事 2 (P1)**: 8 個任務 (T026-T033)
-   **使用者故事 3 (P2)**: 24 個任務 (T034-T056, 含 T042a)

### 並行機會識別

-   **階段 0**: 6 個任務可並行 (T000-T002, T005-T007)
-   **階段 1**: 7 個任務可並行 (T008-T011, T013-T015)
-   **階段 2 (US1)**: 3 個任務可並行 (T020-T021, T022-T024)
-   **階段 3 (US2)**: 3 個任務可並行 (T029-T031)
-   **階段 4 (US3)**: 4 個任務可並行 (T034-T035, T043+T045)
-   **階段 5**: 3 個任務可並行 (T057-T059)
-   **跨使用者故事**: US1, US2, US3 可在階段 1 完成後並行開始

### 建議 MVP 範圍

**MVP = 階段 0 + 階段 1 + 階段 2 (使用者故事 1)**

-   升級 @typescript-eslint/eslint-plugin 到 8.46.2
-   獲得最新 bug 修復和穩定性改善
-   低風險,快速驗證
-   可立即交付價值

---

## 注意事項

-   **[P] 任務** = 不同檔案,無依賴關係,可並行執行
-   **[Story] 標籤** = 將任務對應到特定使用者故事以便追蹤
-   **每個使用者故事應可獨立完成和測試**
-   **在每個檢查點停下來獨立驗證故事**
-   **每個任務或邏輯群組完成後提交**
-   **避免**: 模糊任務、相同檔案衝突、破壞獨立性的跨故事依賴

---

## 格式驗證

✅ **所有任務遵循檢查清單格式**:

-   [x] 每個任務以 `- [ ]` 開頭(markdown 核取方塊)
-   [x] 每個任務有唯一 ID (T000-T076)
-   [x] 並行任務標記 [P]
-   [x] User Story 階段任務標記 [US1]/[US2]/[US3]
-   [x] 每個任務描述包含明確檔案路徑或執行命令
-   [x] Setup/Foundational 階段無 Story 標籤
-   [x] Polish 階段無 Story 標籤

---

**Tasks 檔案產生完成**  
**日期**: 2025-10-21  
**狀態**: ✅ 完成 - 準備開始實作
