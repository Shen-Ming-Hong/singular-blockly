# Implementation Tasks: Safe Dependency Updates (Phase 1)

**Branch**: `005-safe-dependency-updates` | **Date**: 2025-10-20 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

**Input**: Design documents from Phase 1 (plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/)

## Task Overview

本任務清單將依賴升級分解為 80 個可執行任務,組織為 7 個階段。每個任務標示優先級 [P1/P2/P3]、關聯的 User Story [US#]、執行預估時間和檔案路徔。並行任務標示為 [P] (parallelizable)。

**總預估時間**: PT2H40M (2 小時 40 分鐘)  
**任務總數**: 80 個任務  
**User Stories**: 4 個獨立可測試的使用者故事  
**驗證檢查點**: 7 個自動化驗證關卡

---

## Phase 1: Setup & Prerequisites (前置準備)

**目的**: 建立升級環境和效能基準線,確保工作目錄乾淨

**預估時間**: PT15M (15 分鐘)

**Tasks**:

-   [ ] **T001** 驗證 Node.js 版本 >= 20.x 和 npm >= 10.x  
         **Files**: N/A (command line check)  
         **Command**: `node --version && npm --version`  
         **Success**: Node v20.x.x+ and npm 10.x.x+

-   [ ] **T002** 確認 Git 工作目錄乾淨且在正確分支  
         **Files**: N/A  
         **Command**: `git status` and `git branch`  
         **Success**: On branch `005-safe-dependency-updates`, no uncommitted changes

-   [ ] **T003** 執行 `npm list --depth=0` 確認當前依賴完整  
         **Files**: `package.json`, `package-lock.json`  
         **Success**: No missing dependencies, all packages listed

-   [ ] **T004** 建立效能基準 - 記錄編譯時間、測試時間、產出檔案大小  
         **Files**: `specs/005-safe-dependency-updates/data/performance-baseline.json`  
         **Commands**:

    -   `Measure-Command { npm run compile }` → record compilation duration
    -   `Measure-Command { npm test }` → record testing duration
    -   `Get-ChildItem dist/extension.js` → record bundle size
    -   `Measure-Command { npm run lint }` → record lint duration  
        **Success**: JSON file created with all baseline metrics

-   [ ] **T004a** 執行完整測試套件建立功能基準  
         **Files**: `specs/005-safe-dependency-updates/data/baseline-test-results.json`  
         **Command**: `npm test -- --reporter json > specs/005-safe-dependency-updates/data/baseline-test-results.json`  
         **Success**: 所有 63 個測試名稱、狀態和執行時間記錄於 JSON 檔案  
         **Note**: 此功能基準用於升級後比對測試案例是否有新增失敗或執行時間異常

-   [ ] **T005** 創建升級追蹤日誌檔案結構  
         **Files**:
    -   `specs/005-safe-dependency-updates/data/upgrade-log.json` (empty array)
    -   `specs/005-safe-dependency-updates/data/validation-results/` (directory)
    -   `specs/005-safe-dependency-updates/data/build-artifacts/` (directory)  
        **Success**: All directories and files created

---

## Phase 2: Baseline Validation (基準驗證)

**目的**: 執行所有驗證檢查點以建立升級前的基準狀態

**預估時間**: PT10M (10 分鐘)

**Tasks**:

-   [ ] **T006** [P] 執行 TypeScript 編譯基準檢查  
         **Files**: N/A  
         **Command**: `npx tsc --noEmit`  
         **Success**: Exit code 0, no type errors  
         **Checkpoint**: `compilation-check` (contracts/upgrade-validation-contract.yaml)

-   [ ] **T007** [P] 執行單元測試基準檢查  
         **Files**: N/A  
         **Command**: `npm test`  
         **Success**: All 63 tests pass, 100% pass rate  
         **Checkpoint**: `unit-test-check`

-   [ ] **T008** [P] 執行測試覆蓋率基準檢查  
         **Files**: `coverage/` (generated)  
         **Command**: `npm run test:coverage`  
         **Success**: >= 87.21% coverage (lines, statements)  
         **Checkpoint**: `coverage-check`

-   [ ] **T009** [P] 執行 ESLint 基準檢查  
         **Files**: N/A  
         **Command**: `npm run lint`  
         **Success**: Exit code 0, <= 10 warnings  
         **Checkpoint**: `lint-check`

-   [ ] **T010** [P] 執行開發建置基準檢查  
         **Files**: `dist/extension.js`, `dist/extension.js.map`  
         **Command**: `npm run compile`  
         **Success**: Build succeeds, files generated  
         **Checkpoint**: `dev-build-check`

-   [ ] **T011** [P] 執行生產建置基準檢查  
         **Files**: `dist/extension.js`  
         **Command**: `npm run package`  
         **Success**: Build succeeds, 0 warnings  
         **Checkpoint**: `prod-build-check`

-   [ ] **T012** 記錄基準驗證結果  
         **Files**: `specs/005-safe-dependency-updates/data/validation-results/baseline-validation.json`  
         **Success**: All 6 checkpoints recorded with status, duration, metrics

**Parallel Opportunities**: T006-T011 可並行執行 (6 個檢查點獨立)

---

## Phase 3: US1 - TypeScript Ecosystem Upgrade (優先級 P1)

**目的**: 升級 TypeScript 及其 ESLint 工具至最新版本,確保型別系統和程式碼品質工具正常運作

**預估時間**: PT30M (30 分鐘)

**User Story**: US1 - TypeScript Ecosystem Update (Priority: P1)  
**Packages**: typescript 5.7.2 → 5.9.3, @typescript-eslint/eslint-plugin 8.19.1 → 8.46.1, @typescript-eslint/parser 8.19.1 → 8.46.1

**Tasks**:

### Subtask 1: 升級 TypeScript

-   [ ] **T013** [P1] [US1] 升級 TypeScript 到 5.9.3  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `npm update typescript@5.9.3`  
         **Success**: `npm list typescript` shows 5.9.3

-   [ ] **T014** [P1] [US1] 記錄 TypeScript 升級到日誌  
         **Files**: `specs/005-safe-dependency-updates/data/upgrade-log.json`  
         **Action**: Append ChangeLogEntry (action: upgrade-started, packageName: typescript)  
         **Success**: JSON entry created with timestamp, beforeState, afterState

-   [ ] **T015** [P1] [US1] 執行 TypeScript 編譯驗證  
         **Files**: N/A  
         **Command**: `npx tsc --noEmit`  
         **Success**: Exit code 0, no "ArrayBuffer" type errors  
         **Checkpoint**: `compilation-check` (post-typescript-upgrade stage)  
         **Note**: 此任務必須先於 T016 和 T017 執行,編譯失敗則後續建置無意義

-   [ ] **T016** [P1] [US1] 執行單元測試驗證 (TypeScript)  
         **Files**: N/A  
         **Command**: `npm test`  
         **Success**: All 63 tests pass  
         **Checkpoint**: `unit-test-check`  
         **Prerequisite**: T015 compilation-check 通過

-   [ ] **T017** [P1] [US1] 執行開發建置驗證 (TypeScript)  
         **Files**: `dist/extension.js`  
         **Command**: `npm run compile`  
         **Success**: Build succeeds, compare duration with baseline (≤ +10%)  
         **Checkpoint**: `dev-build-check`  
         **Prerequisite**: T015 compilation-check 通過

-   [ ] **T018** [P1] [US1] 記錄 TypeScript 驗證結果  
         **Files**: `specs/005-safe-dependency-updates/data/validation-results/typescript-5.9.3.json`  
         **Success**: ValidationResult with all checks status, metrics (compilation, test, build)

### Subtask 2: 升級 @typescript-eslint

-   [ ] **T019** [P1] [US1] 升級 @typescript-eslint packages 到 8.46.1  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `npm update @typescript-eslint/eslint-plugin@8.46.1 @typescript-eslint/parser@8.46.1`  
         **Success**: Both packages at 8.46.1

-   [ ] **T020** [P1] [US1] 記錄 @typescript-eslint 升級到日誌  
         **Files**: `specs/005-safe-dependency-updates/data/upgrade-log.json`  
         **Success**: 2 ChangeLogEntry records created

-   [ ] **T021** [P1] [US1] [P] 執行 TypeScript 編譯驗證  
         **Command**: `npx tsc --noEmit`  
         **Checkpoint**: `compilation-check` (post-typescript-eslint-upgrade stage)

-   [ ] **T022** [P1] [US1] [P] 執行 ESLint 驗證  
         **Files**: N/A  
         **Command**: `npm run lint`  
         **Success**: Exit code 0, no new errors, warnings documented  
         **Checkpoint**: `lint-check`

-   [ ] **T023** [P1] [US1] [P] 執行單元測試驗證  
         **Command**: `npm test`  
         **Checkpoint**: `unit-test-check`

-   [ ] **T024** [P1] [US1] [P] 執行開發建置驗證  
         **Command**: `npm run compile`  
         **Checkpoint**: `dev-build-check`

-   [ ] **T025** [P1] [US1] [P] 執行生產建置驗證  
         **Files**: `dist/extension.js`  
         **Command**: `npm run package`  
         **Success**: 0 warnings, bundle size ±5%  
         **Checkpoint**: `prod-build-check`

-   [ ] **T026** [P1] [US1] 記錄 @typescript-eslint 驗證結果  
         **Files**: `specs/005-safe-dependency-updates/data/validation-results/typescript-eslint-8.46.1.json`  
         **Success**: ValidationResult with all 5 checks

-   [ ] **T027** [P1] [US1] Git commit: TypeScript Ecosystem 升級  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `git add package.json package-lock.json && git commit -m "chore: upgrade TypeScript ecosystem to 5.9.3 and @typescript-eslint to 8.46.1"`  
         **Success**: Commit created with descriptive message

**Parallel Opportunities**: T021-T025 可並行執行 (5 個驗證檢查點)

---

## Phase 4: US2 - Testing Frameworks Upgrade (優先級 P2)

**目的**: 升級測試框架相關套件,確保測試環境穩定且結果一致

**預估時間**: PT25M (25 分鐘)

**User Story**: US2 - Testing Framework Update [P2]  
**Packages**: @vscode/test-electron 2.4.1 → 2.5.2, @vscode/test-cli 0.0.10 → 0.0.12, sinon 20.0.0 → 21.0.0

**Tasks**:

-   [ ] **T028** [P2] [US2] 升級測試框架套件 (3 packages 同時)  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `npm update @vscode/test-electron@2.5.2 @vscode/test-cli@0.0.12 sinon@21.0.0`  
         **Success**: All 3 packages at target versions

-   [ ] **T029** [P2] [US2] 記錄測試框架升級到日誌  
         **Files**: `specs/005-safe-dependency-updates/data/upgrade-log.json`  
         **Success**: 3 ChangeLogEntry records created

-   [ ] **T030** [P2] [US2] 執行單元測試驗證 - 特別留意 sinon API  
         **Files**: N/A  
         **Command**: `npm test`  
         **Success**: All 63 tests pass, no sinon API errors  
         **Checkpoint**: `unit-test-check` (post-testing-upgrade stage)  
         **Note**: sinon 20→21 major version, verify mock/stub/spy functionality

-   [ ] **T031** [P2] [US2] 執行測試覆蓋率驗證  
         **Files**: `coverage/`  
         **Command**: `npm run test:coverage`  
         **Success**: >= 87.21% coverage, delta within -0.5%  
         **Checkpoint**: `coverage-check`

-   [ ] **T032** [P2] [US2] 測試執行時間比對  
         **Files**: N/A  
         **Command**: `Measure-Command { npm test }`  
         **Success**: Duration increase ≤ 10% vs baseline  
         **Metrics**: Record totalTests, passedTests, averageTestDuration

-   [ ] **T033** [P2] [US2] 驗證 @vscode/test-cli 功能  
         **Files**: N/A  
         **Command**: `npm test` (uses test-cli internally)  
         **Success**: Test output format correct, no CLI errors  
         **Note**: 0.0.x = experimental API, check for warnings

-   [ ] **T034** [P2] [US2] 記錄測試框架驗證結果  
         **Files**: `specs/005-safe-dependency-updates/data/validation-results/testing-frameworks-upgrade.json`  
         **Success**: ValidationResult with test + coverage checks

-   [ ] **T035** [P2] [US2] Git commit: Testing Frameworks 升級  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `git commit -m "chore: upgrade testing frameworks"`  
         **Success**: Commit created

**Parallel Opportunities**: T030-T031 可獨立但建議順序執行 (測試優先,覆蓋率依賴測試成功)

---

## Phase 5: US3 - Build Tools Upgrade (優先級 P3)

**目的**: 升級 Webpack 和 ts-loader,確保建置流程穩定且效能改進

**預估時間**: PT25M (25 分鐘)

**User Story**: US3 - Build Tools Update [P3]  
**Packages**: webpack 5.97.1 → 5.102.1, ts-loader 9.5.1 → 9.5.4

**Tasks**:

-   [ ] **T036** [P3] [US3] 升級建置工具套件 (webpack + ts-loader 同步)  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `npm update webpack@5.102.1 ts-loader@9.5.4`  
         **Success**: Both packages at target versions  
         **Note**: webpack and ts-loader must upgrade together for compatibility

-   [ ] **T037** [P3] [US3] 記錄建置工具升級到日誌  
         **Files**: `specs/005-safe-dependency-updates/data/upgrade-log.json`  
         **Success**: 2 ChangeLogEntry records

-   [ ] **T038** [P3] [US3] 清除舊建置產出  
         **Files**: `dist/`, `out/`  
         **Command**: `Remove-Item -Recurse -Force dist/, out/`  
         **Success**: Directories removed (clean build environment)

-   [ ] **T039** [P3] [US3] 執行開發建置驗證  
         **Files**: `dist/extension.js`, `dist/extension.js.map`  
         **Command**: `npm run compile`  
         **Success**: Build succeeds, source map generated  
         **Checkpoint**: `dev-build-check` (post-build-tools-upgrade stage)

-   [ ] **T040** [P3] [US3] 執行生產建置驗證  
         **Files**: `dist/extension.js`  
         **Command**: `npm run package`  
         **Success**: 0 warnings, bundle optimization correct  
         **Checkpoint**: `prod-build-check`

-   [ ] **T041** [P3] [US3] 建置產出大小和結構驗證  
         **Files**: `dist/extension.js`, `dist/extension.js.map`  
         **Commands**:

    -   `Get-ChildItem dist/extension.js | Select-Object Length` → verify size
    -   `Test-Path dist/extension.js.map` → verify source map exists  
        **Success**: 建置產出大小變化在 ±5% 範圍內 AND source map 檔案存在  
        **Metrics**: Record buildArtifactSize, deltaFromBaseline, sourceMapExists

-   [ ] **T042** [P3] [US3] 建置時間驗證  
         **Command**: `Measure-Command { npm run compile }`  
         **Success**: Duration increase ≤ 10% (or faster due to webpack 5.102.1 improvements)  
         **Metrics**: Record buildTime, deltaFromBaseline

-   [ ] **T043** [P3] [US3] 執行單元測試驗證 (確認建置正確)  
         **Command**: `npm test`  
         **Checkpoint**: `unit-test-check`

-   [ ] **T044** [P3] [US3] 執行 TypeScript 編譯驗證  
         **Command**: `npx tsc --noEmit`  
         **Checkpoint**: `compilation-check`

-   [ ] **T045** [P3] [US3] 記錄建置工具驗證結果  
         **Files**: `specs/005-safe-dependency-updates/data/validation-results/build-tools-upgrade.json`  
         **Success**: ValidationResult with build + compilation + test checks

-   [ ] **T046** [P3] [US3] Git commit: Build Tools 升級  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `git commit -m "chore: upgrade build tools"`  
         **Success**: Commit created

**Parallel Opportunities**: T039-T040 建置檢查必須順序執行 (開發建置先,生產建置後)

---

## Phase 6: US4 - ESLint Upgrade (優先級 P3)

**目的**: 升級 ESLint 程式碼品質工具,確保無新增錯誤且 lint 時間符合預期

**預估時間**: PT20M (20 分鐘)

**User Story**: US4 - ESLint Update [P3]  
**Packages**: eslint 9.32.0 → 9.38.0

**Tasks**:

-   [ ] **T047** [P3] [US4] 升級 ESLint  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `npm update eslint@9.38.0`  
         **Success**: eslint@9.38.0

-   [ ] **T048** [P3] [US4] 記錄 ESLint 升級到日誌  
         **Files**: `specs/005-safe-dependency-updates/data/upgrade-log.json`  
         **Success**: ChangeLogEntry created

-   [ ] **T049** [P3] [US4] 執行 ESLint 驗證  
         **Files**: N/A  
         **Command**: `npm run lint`  
         **Success**: Exit code 0, no new errors, warnings <= 10  
         **Checkpoint**: `lint-check` (post-eslint-upgrade stage)

-   [ ] **T050** [P3] [US4] 執行 i18n lint 驗證 (optional)  
         **Files**: N/A  
         **Command**: `npm run lint:i18n`  
         **Success**: No errors  
         **Checkpoint**: `i18n-lint-check`  
         **Note**: Medium priority, warn only

-   [ ] **T051** [P3] [US4] ESLint 時間驗證  
         **Command**: `Measure-Command { npm run lint }`  
         **Success**: Duration ≤ 30 seconds  
         **Metrics**: Record lint duration, filesScanned

-   [ ] **T052** [P3] [US4] 檢視新規則警告並記錄  
         **Command**: `npm run lint -- --format json > lint-results.json`  
         **Success**: JSON report generated, warnings documented  
         **Action**: Review new warnings, decide if code fix or rule adjustment needed

-   [ ] **T053** [P3] [US4] 記錄 ESLint 驗證結果  
         **Files**: `specs/005-safe-dependency-updates/data/validation-results/eslint-9.38.0.json`  
         **Success**: ValidationResult with lint checks

-   [ ] **T054** [P3] [US4] Git commit: ESLint 升級  
         **Files**: `package.json`, `package-lock.json`  
         **Command**: `git commit -m "chore: upgrade eslint to 9.38.0"`  
         **Success**: Commit created

**Parallel Opportunities**: T049-T050 可並行執行 (lint 和 i18n lint 獨立)

---

## Phase 7: Final Validation & Polish (最終驗證與收尾)

**目的**: 執行完整回歸測試、跨平台驗證、更新文件並創建 Pull Request

**預估時間**: PT45M (45 分鐘)

**Tasks**:

### Subtask 1: 完整回歸測試

-   [ ] **T055** 清除所有快取和建置產出  
         **Files**: `dist/`, `out/`, `coverage/`, `node_modules/.cache/`  
         **Command**: `Remove-Item -Recurse -Force dist/, out/, coverage/, node_modules/.cache/`  
         **Success**: All cache directories removed

-   [ ] **T056** 重新安裝依賴 (確保 lock file 正確)  
         **Files**: `node_modules/`  
         **Command**: `npm ci`  
         **Success**: All packages installed from lock file, no warnings

-   [ ] **T057** [P] 執行最終 TypeScript 編譯驗證  
         **Command**: `npx tsc --noEmit`  
         **Checkpoint**: `compilation-check` (final-validation stage)

-   [ ] **T058** [P] 執行最終單元測試驗證  
         **Command**: `npm test`  
         **Success**: All 63 tests pass  
         **Checkpoint**: `unit-test-check`

-   [ ] **T059** [P] 執行最終測試覆蓋率驗證  
         **Command**: `npm run test:coverage`  
         **Success**: >= 87.21% coverage  
         **Checkpoint**: `coverage-check`

-   [ ] **T060** [P] 執行最終 ESLint 驗證  
         **Command**: `npm run lint`  
         **Checkpoint**: `lint-check`

-   [ ] **T061** [P] 執行最終開發建置驗證  
         **Command**: `npm run compile`  
         **Checkpoint**: `dev-build-check`

-   [ ] **T062** [P] 執行最終生產建置驗證  
         **Command**: `npm run package`  
         **Checkpoint**: `prod-build-check`

-   [ ] **T063** [P] 執行最終 i18n lint 驗證  
         **Command**: `npm run lint:i18n`  
         **Checkpoint**: `i18n-lint-check`

-   [ ] **T063a** [P] 執行安全性漏洞掃描  
         **Files**: N/A  
         **Command**: `npm audit --audit-level=high`  
         **Success**: Exit code 0 (無 critical 或 high 級別漏洞)  
         **Note**: 如有 moderate 或 low 級別漏洞,記錄但不阻斷升級  
         **Checkpoint**: `security-audit-check`

-   [ ] **T064** 記錄最終驗證結果  
         **Files**: `specs/005-safe-dependency-updates/data/validation-results/final-validation.json`  
         **Success**: All 8 checkpoints recorded with pass status (包含 security-audit-check)

**Parallel Opportunities**: T057-T063a 所有最終驗證可並行執行 (8 個檢查點)

### Subtask 2: 跨平台驗證 (CI/CD)

-   [ ] **T065** 推送分支到遠端觸發 CI  
         **Command**: `git push origin 005-safe-dependency-updates`  
         **Success**: GitHub Actions workflow triggered

-   [ ] **T066** 驗證 CI 在 Windows 環境通過  
         **Files**: `.github/workflows/*.yml`  
         **Success**: All jobs pass on Windows runner

-   [ ] **T067** 驗證 CI 在 macOS 環境通過  
         **Success**: All jobs pass on macOS runner

-   [ ] **T068** 驗證 CI 在 Ubuntu 環境通過  
         **Success**: All jobs pass on Ubuntu runner

### Subtask 3: 手動功能整合測試

-   [ ] **T069** 在 Extension Development Host 測試 Blockly 編輯器開啟  
         **Command**: `code --extensionDevelopmentPath=. .`  
         **Success**: Blockly editor opens without errors

-   [ ] **T070** 測試積木拖曳和編輯功能  
         **Success**: Blocks can be dragged, connected, and edited

-   [ ] **T071** 測試程式碼生成功能  
         **Success**: Arduino code generated correctly

-   [ ] **T072** 測試工作區儲存和載入  
         **Files**: `{workspace}/blockly/main.json`  
         **Success**: Workspace saves and loads correctly

-   [ ] **T073** 測試板子選擇功能  
         **Success**: Board selection works (Arduino Uno, ESP32, etc.)

-   [ ] **T074** 測試主題切換 (亮/暗)  
         **Success**: Theme switches without visual issues

-   [ ] **T075** 測試 PlatformIO 整合  
         **Files**: `{workspace}/platformio.ini`  
         **Success**: PlatformIO config synced correctly

-   [ ] **T076** 測試多語言切換  
         **Success**: UI switches between languages (EN, ZH-HANT)

### Subtask 4: 效能比對報告

-   [ ] **T077** 生成效能比對報告  
         **Files**: `specs/005-safe-dependency-updates/data/performance-comparison.json`  
         **Success**: JSON report with before/after metrics, all deltas within tolerances  
         **Metrics**: compilation delta, testing delta, build size delta, lint duration delta

### Subtask 5: 文件更新

-   [ ] **T078** 更新 CHANGELOG.md  
         **Files**: `CHANGELOG.md`  
         **Content**:

    ```markdown
    ### Dependencies

    -   Upgraded TypeScript from 5.7.2 to 5.9.3 for improved build performance
    -   Updated @typescript-eslint packages from 8.19.1 to 8.46.1 (bug fixes)
    -   Upgraded webpack from 5.97.1 to 5.102.1 (ES modules support improvements)
    -   Updated ts-loader from 9.5.1 to 9.5.4
    -   Upgraded ESLint from 9.32.0 to 9.38.0
    -   Updated testing frameworks:
        -   @vscode/test-electron: 2.4.1 → 2.5.2
        -   @vscode/test-cli: 0.0.10 → 0.0.12
        -   sinon: 20.0.0 → 21.0.0
    ```

-   [ ] **T079** Git commit: CHANGELOG 更新  
         **Command**: `git add CHANGELOG.md && git commit -m "docs(changelog): update for dependency upgrades"`

### Subtask 6: Pull Request 創建

-   [ ] **T080** 創建 Pull Request  
         **Command**: `gh pr create --title "chore: upgrade dependencies (Phase 1 - Safe Updates)" --body "..."`  
         **Success**: PR created with:
    -   Descriptive title
    -   Complete upgrade list (9 packages)
    -   Validation results (✅ all tests pass, ✅ coverage maintained, ✅ build size OK)
    -   Risk assessment (Low - minor/patch updates only)
    -   Cross-platform verification status

---

## Task Dependencies

### Sequential Dependencies (必須順序執行)

```
Phase 1 (Setup) → Phase 2 (Baseline) → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (Final)

Within Phases:
- US1: T013 → T014 → T015-T017 → T018 → T019 → T020 → T021-T025 → T026 → T027
- US2: T028 → T029 → T030-T033 → T034 → T035
- US3: T036 → T037 → T038 → T039-T044 → T045 → T046
- US4: T047 → T048 → T049-T052 → T053 → T054
- Final: T055 → T056 → T057-T063 → T064 → T065 → T066-T068 → T069-T076 → T077 → T078 → T079 → T080
```

**Rationale**: 各 User Story 階段必須順序執行,因為所有升級共享 `package.json` 和 `package-lock.json`,無法並行修改同一檔案。每個階段內的驗證檢查點可並行。

### Parallel Opportunities (可並行執行)

**Phase 2 (Baseline Validation)**:

-   T006, T007, T008, T009, T010, T011 可同時執行 (6 個獨立驗證檢查點)

**Phase 3 (US1 - TypeScript)**:

-   T015, T016, T017 可並行 (升級後立即驗證)
-   T021, T022, T023, T024, T025 可並行 (5 個驗證檢查點)

**Phase 4 (US2 - Testing)**:

-   T030, T031 建議順序 (測試優先,覆蓋率依賴測試成功)

**Phase 5 (US3 - Build Tools)**:

-   T039, T040 必須順序 (dev build → prod build)
-   T043, T044 可並行 (測試和編譯驗證)

**Phase 6 (US4 - ESLint)**:

-   T049, T050 可並行 (lint 和 i18n lint 獨立)

**Phase 7 (Final Validation)**:

-   T057, T058, T059, T060, T061, T062, T063 可並行 (7 個最終檢查點)
-   T066, T067, T068 CI 驗證自動並行 (GitHub Actions matrix)

---

## Independent Test Criteria per User Story

### US1 - TypeScript Ecosystem

**Independent Test**: 可透過執行完整的編譯流程 (`npm run compile`) 和測試套件 (`npm test`) 獨立驗證,確保所有現有功能正常運作且無型別錯誤。

**Validation Checkpoints**:

-   ✅ `compilation-check`: `npx tsc --noEmit` (exit code 0)
-   ✅ `unit-test-check`: `npm test` (63/63 tests pass)
-   ✅ `dev-build-check`: `npm run compile` (build succeeds)
-   ✅ `prod-build-check`: `npm run package` (0 warnings)
-   ✅ `lint-check`: `npm run lint` (0 errors)

**Tasks**: T013-T027

---

### US2 - Testing Frameworks

**Independent Test**: 可透過執行完整測試套件 (`npm test`) 和覆蓋率測試 (`npm run test:coverage`) 獨立驗證,確保所有測試正常執行且結果一致。

**Validation Checkpoints**:

-   ✅ `unit-test-check`: `npm test` (100% pass rate, sinon API 正常)
-   ✅ `coverage-check`: `npm run test:coverage` (>= 87.21%, delta ≤ -0.5%)

**Tasks**: T028-T035

---

### US3 - Build Tools

**Independent Test**: 可透過執行開發模式建置 (`npm run watch`)、生產模式建置 (`npm run package`) 和擴充功能載入測試獨立驗證。

**Validation Checkpoints**:

-   ✅ `dev-build-check`: `npm run compile` (source map 生成, duration ≤ +10%)
-   ✅ `prod-build-check`: `npm run package` (bundle size ±5%, 0 warnings)
-   ✅ `compilation-check`: `npx tsc --noEmit` (webpack + ts-loader 相容)
-   ✅ `unit-test-check`: `npm test` (建置產出正確)

**Tasks**: T036-T046

---

### US4 - ESLint

**Independent Test**: 可透過執行 `npm run lint` 命令獨立驗證,確保現有程式碼符合新規則或合理調整規則配置。

**Validation Checkpoints**:

-   ✅ `lint-check`: `npm run lint` (0 errors, warnings <= 10, duration ≤ 30s)
-   ✅ `i18n-lint-check`: `npm run lint:i18n` (optional, 0 errors)

**Tasks**: T047-T054

---

## Suggested MVP (Minimum Viable Product)

**MVP Scope**: 僅執行 Phase 1-3 (Setup + Baseline + US1 TypeScript Ecosystem)

**Rationale**:

-   US1 是 P1 最高優先級,影響最廣 (TypeScript 是核心開發工具)
-   TypeScript 5.9.3 提供 11% 建置效能改進,立即獲益
-   @typescript-eslint 8.46.1 提供 27 個次要版本的 bug 修復
-   風險最低 (無 breaking changes,完全向後相容)
-   可獨立驗證和部署,不依賴其他 User Stories

**MVP Tasks**: T001-T027 (27 個任務)  
**MVP Time**: PT55M (約 55 分鐘: Setup PT15M + Baseline PT10M + US1 PT30M)

**MVP Verification**:

1. TypeScript 編譯成功且無型別錯誤
2. 所有 63 個測試通過
3. 測試覆蓋率維持 >= 87.21%
4. ESLint 檢查無新增錯誤
5. 開發和生產建置成功,檔案大小在 ±5% 範圍內

**Incremental Rollout**:

-   MVP 完成後 → 驗證生產環境 → 部署 US2 (Testing) → 驗證 → 部署 US3 (Build) → 驗證 → 部署 US4 (ESLint)

---

## Rollback Strategy

每個 User Story 階段都是獨立的 Git commit,可單獨回滾:

### 完整回滾 (回到升級前狀態)

```powershell
# 回滾所有 4 個升級 commits
git reset --hard HEAD~4

# 重新安裝依賴
npm ci
```

### 部分回滾 (僅回滾特定 User Story)

```powershell
# 範例: 回滾 US4 (ESLint) 但保留 US1-US3
git revert HEAD  # 回滾最後一個 commit (US4)

# 或使用 interactive rebase
git rebase -i HEAD~4
# 在編輯器中刪除或標記為 'drop' 要回滾的 commit

npm ci
npm test
```

### Rollback Triggers (自動回滾觸發條件)

參考 `contracts/upgrade-validation-contract.yaml`:

-   ❌ **TypeScript 編譯失敗** → 立即回滾 US1
-   ❌ **單元測試失敗** → 立即回滾當前階段
-   ❌ **生產建置失敗** → 立即回滾當前階段
-   ❌ **Bundle 大小增加 > 10%** → 立即回滾當前階段
-   ⚠️ **測試覆蓋率降低 > 2%** → 警告,不回滾 (手動審查)
-   ⚠️ **Lint 錯誤** → 警告,不回滾 (可能需規則調整)

---

## Task Execution Format Validation

所有任務遵循標準格式:

```
- [ ] **T### [Priority?] [US#?] [P?] Task Description**
  **Files**: file/path or N/A
  **Command**: command to execute (if applicable)
  **Success**: success criteria
  **Checkpoint**: checkpoint-id (if applicable, references contracts/)
  **Metrics**: metrics to record (if applicable)
  **Note**: additional context (optional)
```

**Format Legend**:

-   `[P1/P2/P3]`: Priority (optional, if task belongs to specific user story priority)
-   `[US#]`: User Story number (optional, if task belongs to specific user story)
-   `[P]`: Parallelizable (optional, marks tasks that can run in parallel with others)

**Examples**:

-   ✅ `T013 [P1] [US1] 升級 TypeScript 到 5.9.3` (Priority P1, User Story 1, sequential)
-   ✅ `T021 [P1] [US1] [P] 執行 TypeScript 編譯驗證` (Priority P1, User Story 1, parallelizable)
-   ✅ `T001 驗證 Node.js 版本` (Setup task, no user story, no priority)

---

## Completion Checklist

升級完成後,確認以下所有項目:

### 功能驗證 (Functional)

-   [ ] 所有 63 個單元測試通過 (T058)
-   [ ] 測試覆蓋率 >= 87.21% (T059)
-   [ ] TypeScript 編譯無錯誤 (T057)
-   [ ] ESLint 檢查無錯誤 (T060)
-   [ ] 開發建置成功 (T061)
-   [ ] 生產建置成功 (T062)
-   [ ] i18n lint 通過 (T063)

### 效能驗證 (Performance)

-   [ ] 測試執行時間增幅 ≤ 10% (T032)
-   [ ] 編譯時間增幅 ≤ 10% (T042)
-   [ ] ESLint 檢查時間 ≤ 30 秒 (T051)
-   [ ] Bundle 大小變化 ±5% 內 (T041)

### 跨平台驗證 (Cross-Platform)

-   [ ] Windows 10/11 CI 通過 (T066)
-   [ ] macOS CI 通過 (T067)
-   [ ] Ubuntu 22.04 CI 通過 (T068)

### 手動功能測試 (Manual)

-   [ ] Blockly 編輯器正常開啟 (T069)
-   [ ] 積木拖曳和編輯功能正常 (T070)
-   [ ] 程式碼生成功能正常 (T071)
-   [ ] 工作區儲存和載入正常 (T072)
-   [ ] 板子選擇功能正常 (T073)
-   [ ] 主題切換正常 (T074)
-   [ ] PlatformIO 整合正常 (T075)
-   [ ] 多語言切換正常 (T076)

### 文件更新 (Documentation)

-   [ ] CHANGELOG.md 已更新 (T078)
-   [ ] 所有升級變更已提交到 Git (T079)
-   [ ] Pull Request 已創建並包含完整說明 (T080)
-   [ ] 效能比對報告已生成 (T077)

---

## Summary

**總任務數**: 80 個任務  
**階段數**: 7 個階段  
**User Stories**: 4 個獨立可測試的使用者故事  
**驗證檢查點**: 8 個自動化驗證關卡 (新增 security-audit-check)  
**預估時間**: PT2H40M (2 小時 40 分鐘,不含問題排查)

**並行機會**:

-   Phase 2: 6 個檢查點可並行 (基準驗證)
-   Phase 3: 5 個檢查點可並行 (US1 @typescript-eslint 驗證)
-   Phase 7: 7 個檢查點可並行 (最終驗證)

**建議 MVP**: Phase 1-3 (Setup + Baseline + US1 TypeScript Ecosystem, 27 tasks, 55 min)

**回滾策略**: 每個 User Story 獨立 Git commit,可單獨回滾或完整回滾

**關鍵成功因素**:

1. 每個階段完成後立即驗證,不跳過檢查點
2. 記錄所有效能基準和驗證結果
3. 遇到問題立即回滾,不強行繼續
4. 跨平台驗證確保一致性

---

## Next Steps

執行此任務清單:

1. **開始前**: 閱讀 `quickstart.md` 了解完整執行流程
2. **執行**: 按照 Phase 1 → Phase 7 順序執行任務
3. **驗證**: 每個階段完成後執行所有驗證檢查點
4. **記錄**: 更新 `upgrade-log.json` 和 `validation-results/`
5. **提交**: 每個 User Story 完成後創建 Git commit
6. **完成**: Phase 7 完成後創建 Pull Request

**開始執行**: `T001 驗證 Node.js 版本`

---

_Generated by `/speckit.tasks` workflow on 2025-01-20_
