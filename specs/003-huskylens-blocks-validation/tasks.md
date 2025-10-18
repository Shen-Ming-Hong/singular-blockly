# Tasks: HuskyLens 積木程式碼驗證與修正

**Input**: Design documents from `/specs/003-huskylens-blocks-validation/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

-   **[P]**: Can run in parallel (different files, no dependencies)
-   **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
-   Include exact file paths in descriptions

---

## Phase 0: Research & Verification (MCP-Powered) ✅ COMPLETE

**Purpose**: Validate library compatibility, gather authoritative documentation, and ensure testable design

**Status**: ✅ All research tasks completed in Phase 0-1 of `/speckit.plan` command

-   [x] T000 [P] Use MCP `resolve-library-id` + `github_repo` to verify HUSKYLENSArduino API (50+ code examples)
-   [x] T001 [P] Use MCP `get-library-docs` to verify Blockly best practices (15+ examples, 8-item checklist)
-   [x] T002 [P] Use MCP `fetch_webpage` to verify PlatformIO lib_deps format (GitHub archive URLs)
-   [x] T003 [P] Use MCP `github_repo` to research ESP32 HardwareSerial alternative to SoftwareSerial
-   [x] T004 [P] Use `grep_search` + `read_file` to verify GCC pragma directive correctness
-   [x] T005 Document all research findings in research.md (650+ lines, 100% complete)
-   [x] T006 Generate data-model.md defining 5 entities and 30+ validation rules (450+ lines)
-   [x] T007 Generate quickstart.md with testing workflows for Arduino AVR + ESP32 (600+ lines)

**Critical Findings from Research**:

-   🔴 Issue #1: `.id` should be `.ID` (uppercase) - affects 2 blocks
-   🔴 Issue #2: ESP32 doesn't support SoftwareSerial - needs HardwareSerial alternative
-   ✅ Arduino AVR: Current SoftwareSerial implementation verified correct
-   ✅ GCC pragma directives: Current implementation correct (JavaScript insertion order preserved)

**Checkpoint**: ✅ Research complete - all technical decisions validated

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

**Status**: ✅ VSCode Extension project already set up, no additional infrastructure needed

-   [x] T008 Project structure already established (Extension Host + WebView architecture)
-   [x] T009 TypeScript + JavaScript build system configured (webpack)
-   [x] T010 Linting and testing infrastructure in place (eslint, mocha)

**Checkpoint**: ✅ Foundation ready - user story implementation can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story validation work

**⚠️ CRITICAL**: Complete these tasks before starting any user story implementation

-   [ ] T011 Read existing HuskyLens block definitions from media/blockly/blocks/huskylens.js to understand current structure
-   [ ] T012 Read existing HuskyLens code generators from media/blockly/generators/arduino/huskylens.js to understand current implementation
-   [ ] T013 Read board configuration from media/blockly/blocks/board_configs.js to understand window.currentBoard usage
-   [ ] T014 Verify test infrastructure supports browser context (WebView) vs Node.js context (Extension Host) testing
-   [ ] T015 Create test helper utilities in src/test/helpers/huskylens-test-utils.ts for block validation functions

**Checkpoint**: Foundation understanding complete - ready to validate and fix blocks

---

## Phase 3: User Story 1 - HuskyLens 積木定義驗證 (Priority: P1) 🎯 MVP

**Goal**: 驗證所有 11 個 HuskyLens 積木的定義完整且正確,確保在 Blockly 編輯器中正常運作

**Independent Test**: 在 Extension Development Host 中載入 Blockly 編輯器,檢查工具箱是否顯示所有 11 個 HuskyLens 積木,並驗證每個積木的欄位、下拉選單、輸入連接埠

**Acceptance Scenarios**: 6 scenarios (spec.md User Story 1)

### Implementation for User Story 1

-   [ ] T016 [P] [US1] Validate huskylens_init_i2c block definition has init() method, correct colour (330), and tooltip in media/blockly/blocks/huskylens.js
-   [ ] T017 [P] [US1] Validate huskylens_init_uart block definition has RX/TX pin fields with FieldNumber type in media/blockly/blocks/huskylens.js
-   [ ] T018 [P] [US1] Validate huskylens_set_algorithm block has FieldDropdown with 7 algorithm options using i18n keys in media/blockly/blocks/huskylens.js
-   [ ] T019 [P] [US1] Validate huskylens_request block definition has correct colour (290) and statement connections in media/blockly/blocks/huskylens.js
-   [ ] T020 [P] [US1] Validate huskylens_is_learned block has setOutput(true, 'Boolean') and correct colour (160) in media/blockly/blocks/huskylens.js
-   [ ] T021 [P] [US1] Validate huskylens_count_blocks block has setOutput(true, 'Number') in media/blockly/blocks/huskylens.js
-   [ ] T022 [P] [US1] Validate huskylens_get_block_info block has FieldDropdown with 5 info type options (xCenter, yCenter, width, height, ID) in media/blockly/blocks/huskylens.js
-   [ ] T023 [P] [US1] Validate huskylens_count_arrows block has setOutput(true, 'Number') in media/blockly/blocks/huskylens.js
-   [ ] T024 [P] [US1] Validate huskylens_get_arrow_info block has FieldDropdown with 5 info type options (xOrigin, yOrigin, xTarget, yTarget, ID) in media/blockly/blocks/huskylens.js
-   [ ] T025 [P] [US1] Validate huskylens_learn block has value input with setCheck('Number') and shadow block default value 1 in media/blockly/blocks/huskylens.js
-   [ ] T026 [P] [US1] Validate huskylens_forget block definition has correct colour (290) in media/blockly/blocks/huskylens.js
-   [ ] T027 [US1] Verify all 11 blocks are listed in toolbox at media/toolbox/categories/sensors.json or media/toolbox/index.json
-   [ ] T028 [US1] Create manual test checklist document for User Story 1 acceptance scenarios in specs/003-huskylens-blocks-validation/MANUAL-TEST-US1.md

**Checkpoint**: All 11 block definitions validated - ready for code generator validation

---

## Phase 4: User Story 2 - Arduino 程式碼生成驗證 (Priority: P1) 🔥 CRITICAL FIXES

**Goal**: 驗證 HuskyLens 積木生成的 Arduino 程式碼正確、完整且可編譯

**Independent Test**: 建立包含各種 HuskyLens 積木組合的測試工作區,生成 Arduino 程式碼,透過 PlatformIO 編譯驗證

**Acceptance Scenarios**: 13 scenarios (spec.md User Story 2)

**🔴 CRITICAL**: This phase includes fixing the two HIGH priority issues found in research:

1. Fix `.id` → `.ID` property name (2 blocks affected)
2. Add ESP32 board detection for UART initialization (HardwareSerial vs SoftwareSerial)

### Implementation for User Story 2

#### Critical Fixes (MUST DO FIRST)

-   [x] T029 🔴 [US2] Fix huskylens_get_block_info generator to use `.ID` instead of `.id` in media/blockly/generators/arduino/huskylens.js lines ~200-220
-   [x] T030 🔴 [US2] Fix huskylens_get_arrow_info generator to use `.ID` instead of `.id` in media/blockly/generators/arduino/huskylens.js lines ~230-250
-   [x] T031 🔴 [US2] Add ESP32 board detection in huskylens_init_uart generator using window.currentBoard in media/blockly/generators/arduino/huskylens.js lines ~149-180

#### Code Generation Validation

-   [ ] T032 [P] [US2] Validate huskylens_init_i2c generator includes #include <HUSKYLENS.h>, #include "Wire.h", pragma directives, and HUSKYLENS huskylens variable in media/blockly/generators/arduino/huskylens.js
-   [ ] T033 [P] [US2] Validate huskylens_init_uart generator for Arduino AVR includes #include <SoftwareSerial.h> and SoftwareSerial huskySerial(rx, tx) in media/blockly/generators/arduino/huskylens.js
-   [ ] T034 [P] [US2] Validate huskylens_init_uart generator for ESP32 uses HardwareSerial huskySerial(1) and begin(9600, SERIAL_8N1, rx, tx) in media/blockly/generators/arduino/huskylens.js
-   [ ] T035 [P] [US2] Validate huskylens*set_algorithm generator produces huskylens.writeAlgorithm(ALGORITHM*\*) with correct algorithm constants in media/blockly/generators/arduino/huskylens.js
-   [ ] T036 [P] [US2] Validate huskylens_request generator produces huskylens.request() in media/blockly/generators/arduino/huskylens.js
-   [ ] T037 [P] [US2] Validate huskylens_is_learned generator returns [huskylens.isLearned(), ORDER_ATOMIC] in media/blockly/generators/arduino/huskylens.js
-   [ ] T038 [P] [US2] Validate huskylens_count_blocks generator returns [huskylens.countBlocks(), ORDER_ATOMIC] in media/blockly/generators/arduino/huskylens.js
-   [ ] T039 [P] [US2] Validate huskylens_count_arrows generator returns [huskylens.countArrows(), ORDER_ATOMIC] in media/blockly/generators/arduino/huskylens.js
-   [ ] T040 [P] [US2] Validate huskylens_learn generator produces huskylens.writeLearn(id) with id from value input in media/blockly/generators/arduino/huskylens.js
-   [ ] T041 [P] [US2] Validate huskylens_forget generator produces huskylens.writeForget() in media/blockly/generators/arduino/huskylens.js

#### Deduplication Implementation (FR-009)

-   [x] T042 [US2] Implement #include deduplication logic in all HuskyLens generators - check if include already exists in arduinoGenerator.includes\_ before adding in media/blockly/generators/arduino/huskylens.js
-   [x] T043 [US2] Implement global variable deduplication logic - check if HUSKYLENS huskylens or SoftwareSerial huskySerial already declared in arduinoGenerator.variables\_ before adding in media/blockly/generators/arduino/huskylens.js
-   [x] T044 [US2] Implement lib*deps deduplication logic - check if HuskyLens library URL already exists in arduinoGenerator.lib_deps* array before adding in media/blockly/generators/arduino/huskylens.js
-   [x] T045 [US2] Implement setupCode deduplication logic - verify setupCode\_.includes(initCode) check works correctly to prevent duplicate initialization code in media/blockly/generators/arduino/huskylens.js

#### Deduplication Validation

-   [x] T046 [US2] Test workspace with multiple I2C init blocks - verify HUSKYLENS huskylens variable not duplicated in generated code
-   [x] T047 [US2] Test workspace with multiple UART init blocks - verify SoftwareSerial huskySerial variable not duplicated in generated code
-   [x] T048 [US2] Test workspace with both I2C and UART init blocks - verify both variables declared correctly without conflicts in generated code
-   [x] T049 [US2] Verify lib_deps includes HuskyLens library URL only once when multiple HuskyLens blocks used in generated platformio.ini

#### PlatformIO Compilation Tests

-   [x] T050 [US2] Create test workspace with huskylens_init_i2c block and generate code for Arduino Uno board
-   [x] T051 [US2] Compile generated code from T050 using PlatformIO (pio run -e uno) and verify success
-   [x] T052 [US2] Create test workspace with huskylens_init_uart block (RX=10, TX=11) for Arduino Nano board
-   [x] T053 [US2] Compile generated code from T052 using PlatformIO (pio run -e nanoatmega328) and verify success
-   [x] T054 [US2] Create test workspace with huskylens_init_uart block (RX=16, TX=17) for ESP32 board
-   [x] T055 [US2] Compile generated code from T054 using PlatformIO (pio run -e esp32dev) and verify success (validates HardwareSerial fix)
-   [x] T056 [US2] Create test workspace with all 11 HuskyLens blocks and compile for Arduino Mega
-   [x] T057 [US2] Document PlatformIO test results in specs/003-huskylens-blocks-validation/PLATFORMIO-TEST-RESULTS.md

**Checkpoint**: All code generators validated and ESP32 compatibility fixed - ready for i18n validation

---

## Phase 5: User Story 3 - 國際化訊息完整性驗證 (Priority: P2)

**Goal**: 驗證所有 HuskyLens 積木的多語言訊息完整且一致

**Independent Test**: 檢查所有語言的 messages.js 檔案,驗證每個 HuskyLens 相關訊息鍵存在且非空,並在編輯器中切換語言進行視覺驗證

**Acceptance Scenarios**: 5 scenarios (spec.md User Story 3)

### Implementation for User Story 3

-   [ ] T058 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/zh-hant/messages.js (繁體中文 - base language)
-   [ ] T059 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/en/messages.js (English)
-   [ ] T060 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/ja/messages.js (Japanese)
-   [ ] T061 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/ko/messages.js (Korean)
-   [ ] T062 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/es/messages.js (Spanish)
-   [ ] T063 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/fr/messages.js (French)
-   [ ] T064 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/de/messages.js (German)
-   [ ] T065 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/it/messages.js (Italian)
-   [ ] T066 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/pt-br/messages.js (Brazilian Portuguese)
-   [ ] T067 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/ru/messages.js (Russian)
-   [ ] T068 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/tr/messages.js (Turkish)
-   [ ] T069 [P] [US3] Validate all 44 HuskyLens message keys exist in media/locales/pl/messages.js (Polish)
-   [ ] T070 [US3] Run existing translation validation script: node scripts/i18n/validate-translations.js
-   [ ] T071 [US3] Generate translation statistics report: node scripts/i18n/translation-stats.js
-   [ ] T072 [US3] Create manual test checklist for multi-language UI testing in specs/003-huskylens-blocks-validation/MANUAL-TEST-US3.md
-   [ ] T073 [US3] Test UI display in Traditional Chinese (VSCode language setting)
-   [ ] T074 [US3] Test UI display in English (VSCode language setting)
-   [ ] T075 [US3] Test algorithm dropdown shows 7 translated options in selected language

**Checkpoint**: All 12 languages validated (528 messages total) - ready for error handling validation

---

## Phase 6: User Story 4 - 錯誤處理與邊界條件驗證 (Priority: P2)

**Goal**: 驗證 HuskyLens 積木在異常情況下的錯誤處理適當,確保系統穩定性

**Independent Test**: 模擬異常狀況 (arduinoGenerator 未初始化、欄位值為空、輸入埠未連接等),驗證程式碼生成器正確處理並記錄錯誤

**Acceptance Scenarios**: 5 scenarios (spec.md User Story 4)

### Implementation for User Story 4

-   [ ] T076 [P] [US4] Test code generation when arduinoGenerator not initialized - verify error comment returned and logged in media/blockly/generators/arduino/huskylens.js
-   [ ] T077 [P] [US4] Test huskylens_learn block with ID input disconnected - verify default value 1 used in generated code
-   [ ] T078 [P] [US4] Test huskylens_get_block_info with negative index - verify code still generates (runtime error acceptable)
-   [ ] T079 [P] [US4] Test code generation with JavaScript exception - verify error caught, logged, and error comment returned
-   [ ] T080 [US4] Test workspace with HuskyLens blocks but no init block - verify no auto-initialization added (user responsibility)
-   [ ] T081 [US4] Add error handling to all 11 code generators if not present - wrap in try-catch with log.error() in media/blockly/generators/arduino/huskylens.js
-   [ ] T082 [US4] Verify all error cases log to Extension Host output channel "Singular Blockly" using src/services/logging.ts
-   [ ] T083 [US4] Document error handling test results in specs/003-huskylens-blocks-validation/ERROR-HANDLING-TESTS.md

**Checkpoint**: Error handling validated - ready for registration mechanism verification

---

## Phase 7: User Story 5 - 積木註冊機制驗證 (Priority: P3)

**Goal**: 驗證 HuskyLens 積木的「總是生成」註冊機制正常運作,確保浮動初始化積木也能生成程式碼

**Independent Test**: 建立包含浮動 HuskyLens 初始化積木的工作區 (未連接流程),生成程式碼並驗證初始化程式碼在 setup 函數中

**Acceptance Scenarios**: 4 scenarios (spec.md User Story 5)

### Implementation for User Story 5

-   [ ] T084 [P] [US5] Verify huskylens_init_i2c registration in "always generate" blocks list in media/js/blocklyEdit.js
-   [ ] T085 [P] [US5] Verify huskylens_init_uart registration in "always generate" blocks list in media/js/blocklyEdit.js
-   [ ] T086 [P] [US5] Verify all 11 HuskyLens blocks registered for "always generate" in media/js/blocklyEdit.js
-   [ ] T087 [US5] Test floating huskylens_init_i2c block (not connected to flow) generates setup code
-   [ ] T088 [US5] Test floating huskylens_init_uart block (not connected to flow) generates setup code
-   [ ] T089 [US5] Verify retry mechanism (10 attempts, 100ms interval) for registerAlwaysGenerateBlock in media/js/blocklyEdit.js
-   [ ] T090 [US5] Test graceful failure when registerAlwaysGenerateBlock function doesn't exist (no page crash)
-   [ ] T091 [US5] Document registration mechanism test results in specs/003-huskylens-blocks-validation/REGISTRATION-TESTS.md

**Checkpoint**: All user stories validated - ready for edge case testing and polish

---

## Phase 8: Edge Cases & Polish

**Purpose**: Handle edge cases from spec.md and finalize validation

### Edge Case Validation

-   [ ] T092 [P] Test workspace with both I2C and UART init blocks - verify both variables declared correctly without conflicts (already covered in T048)
-   [ ] T093 [P] Test workspace with HuskyLens blocks but no init block - verify no auto-init (user responsibility documented)
-   [ ] T094 [P] Test PlatformIO compilation with invalid HuskyLens library URL - document failure in quickstart.md
-   [ ] T095 [P] Verify ESP32 board with UART init uses HardwareSerial (not SoftwareSerial) - covered in T034, T054, T055
-   [ ] T096 [P] Test workspace with multiple identical init blocks - verify setup code deduplication via setupCode\_.includes() check (already covered in T045)
-   [ ] T097 Test pragma directive position in generated code - verify pragma push before includes, pragma pop after includes

### Documentation & Polish

-   [ ] T098 [P] Update CHANGELOG.md with feature changes and fixes
-   [ ] T099 [P] Update README.md if HuskyLens blocks are no longer experimental
-   [ ] T100 [P] Review all code changes for constitution compliance (simplicity, modularity, avoid over-development)
-   [ ] T101 [P] Verify structured logging used throughout (log.info/error/debug, not console.log)
-   [ ] T102 Consolidate all manual test results into specs/003-huskylens-blocks-validation/MANUAL-TEST-RESULTS.md
-   [ ] T103 Run complete validation workflow from quickstart.md
-   [ ] T104 Create pull request with all changes and test results

**Final Checkpoint**: All 11 blocks validated, 3 critical issues fixed, ready for PR

---

## Dependencies & Execution Order

### Phase Dependencies

-   **Phase 0 (Research)**: ✅ COMPLETE - No dependencies
-   **Phase 1 (Setup)**: ✅ COMPLETE - No dependencies
-   **Phase 2 (Foundational)**: Depends on Phase 0-1 completion - BLOCKS all user stories
-   **Phase 3 (US1)**: Depends on Phase 2 completion - Block definition validation
-   **Phase 4 (US2)**: Depends on Phase 2 completion - Can run in parallel with Phase 3, includes CRITICAL fixes
-   **Phase 5 (US3)**: Depends on Phase 2 completion - Can run in parallel with Phase 3-4
-   **Phase 6 (US4)**: Depends on Phase 4 completion (needs fixed generators) - Error handling tests
-   **Phase 7 (US5)**: Depends on Phase 2 completion - Can run in parallel with Phase 3-5
-   **Phase 8 (Edge Cases)**: Depends on Phase 3-7 completion - Final validation

### User Story Independence

-   **US1 (Block Definitions)**: Independent - validates block UI structure
-   **US2 (Code Generation)**: Independent - validates generated Arduino code (includes critical fixes)
-   **US3 (I18n Messages)**: Independent - validates 12 language files
-   **US4 (Error Handling)**: Depends on US2 fixes - tests error conditions
-   **US5 (Registration)**: Independent - validates registration mechanism

### Critical Path (Minimum MVP)

To get working HuskyLens blocks with ESP32 support:

1. **Phase 2** (T011-T015): Foundational understanding
2. **Phase 4 Critical Fixes** (T029-T031): Fix `.id` → `.ID` and add ESP32 board detection
3. **Phase 4 Compilation Tests** (T044-T051): Verify fixes work on Arduino AVR and ESP32

All other phases improve quality but this is the minimum to fix broken functionality.

### Parallel Opportunities

**Within Phase 2 (Foundational)**:

-   T011, T012, T013 can run in parallel (reading different files)

**Within Phase 3 (US1 - Block Validation)**:

-   T016-T026 ALL can run in parallel (different blocks, all in same file but read-only validation)

**Within Phase 4 (US2 - Code Generation)**:

-   After critical fixes (T029-T031) complete:
    -   T032-T041 validation tasks can run in parallel (read-only)
    -   T042-T045 deduplication implementation tasks (sequential, same file)
    -   T046-T049 deduplication validation tasks can run in parallel
    -   T050+T051, T052+T053, T054+T055, T056 compilation tests can run in parallel (different boards)

**Within Phase 5 (US3 - I18n)**:

-   T058-T069 ALL can run in parallel (different language files)

**Within Phase 6 (US4 - Error Handling)**:

-   T076-T080 can run in parallel (different test scenarios)

**Within Phase 7 (US5 - Registration)**:

-   T084-T086 can run in parallel (verification tasks)
-   T087-T088 can run in parallel (different test scenarios)

**Within Phase 8 (Edge Cases)**:

-   T092-T097 ALL can run in parallel (different test scenarios)

**Cross-Phase Parallelism**:

-   Once Phase 2 complete: Phase 3, 4, 5, 7 can ALL start in parallel
-   Phase 6 must wait for Phase 4 critical fixes

---

## Parallel Example: Phase 4 Critical Fixes

```bash
# MUST complete these sequentially (same file, dependent changes):
1. T029: Fix huskylens_get_block_info (.id → .ID)
2. T030: Fix huskylens_get_arrow_info (.id → .ID)
3. T031: Add ESP32 board detection to huskylens_init_uart

# Then ALL validation tasks can run in parallel:
Task T032-T041: Read-only validation (10 tasks in parallel)

# Then implement deduplication logic sequentially:
Task T042-T045: Deduplication implementation (4 tasks, same file)

# Then deduplication validation can run in parallel:
Task T046-T049: Deduplication tests (4 tasks in parallel)

# Then ALL compilation tests can run in parallel:
Task T050+T051: Arduino Uno test
Task T052+T053: Arduino Nano test
Task T054+T055: ESP32 test (validates HardwareSerial fix)
Task T056: Arduino Mega test
```

---

## Implementation Strategy

### Critical Fixes First (Immediate MVP)

**Day 1 - Critical Fixes**:

1. Complete Phase 2: Foundational (T011-T015) - 30 mins
2. Complete Phase 4 Critical Fixes (T029-T031) - 2 hours
3. Implement Deduplication Logic (T042-T045) - 1 hour
4. Test on ESP32 (T054-T055) - 30 mins
5. **MILESTONE**: ESP32 HuskyLens blocks now work! 🎉

**Day 2 - Validation**: 6. Complete Phase 3: Block validation (T016-T028) - 2 hours 7. Complete Phase 4: Code generation validation (T032-T057) - 3 hours 8. **MILESTONE**: All blocks validated on all boards ✅

**Day 3 - Quality & Polish**: 9. Complete Phase 5: I18n validation (T058-T075) - 2 hours 10. Complete Phase 6: Error handling (T076-T083) - 2 hours 11. Complete Phase 7: Registration (T084-T091) - 1 hour 12. Complete Phase 8: Edge cases & docs (T092-T104) - 2 hours 13. **MILESTONE**: Feature complete and documented 📝

### Incremental Delivery

1. **MVP (Day 1)**: ESP32 compatibility fixed - users can deploy
2. **Validation Complete (Day 2)**: All blocks verified correct - quality assured
3. **Production Ready (Day 3)**: Error handling, i18n, docs complete - ship it!

### Parallel Team Strategy

With 3 developers:

**After Phase 2 complete**:

-   Developer A: Phase 4 (US2) - Critical fixes & code generation
-   Developer B: Phase 3 (US1) + Phase 7 (US5) - Block validation & registration
-   Developer C: Phase 5 (US3) - I18n validation

**After fixes complete**:

-   Developer A: Phase 6 (US4) - Error handling
-   Developer B: Phase 8 - Edge cases & documentation
-   Developer C: Testing & verification

---

## Task Count Summary

| Phase                  | Tasks   | Parallel | Critical               |
| ---------------------- | ------- | -------- | ---------------------- |
| Phase 0 (Research)     | 8       | 5        | ✅ Done                |
| Phase 1 (Setup)        | 3       | 0        | ✅ Done                |
| Phase 2 (Foundational) | 5       | 3        | ⚠️ Blocking            |
| Phase 3 (US1)          | 13      | 11       | 📋 Validation          |
| Phase 4 (US2)          | 29      | 18       | 🔥 3 Critical + FR-009 |
| Phase 5 (US3)          | 18      | 13       | 🌐 I18n                |
| Phase 6 (US4)          | 8       | 4        | 🛡️ Error Handling      |
| Phase 7 (US5)          | 8       | 3        | 🔗 Registration        |
| Phase 8 (Edge Cases)   | 13      | 6        | ✨ Polish              |
| **TOTAL**              | **105** | **63**   | **11 blocks**          |

**Parallelization Potential**: 60% of tasks can run in parallel (63/105)

**Critical Path**:

-   Phase 2 (5 tasks) → Phase 4 Critical Fixes (3 tasks) → Phase 4 Deduplication (4 tasks) → Phase 4 Testing (8 tasks) = **20 tasks minimum**
-   All other 85 tasks improve quality/coverage but aren't blocking for ESP32 fix + deduplication

---

## Notes

-   ✅ Phase 0-1 already complete with comprehensive research (1,700+ lines of documentation)
-   🔴 3 critical fixes identified in research: `.id` → `.ID` (×2) + ESP32 HardwareSerial
-   ✨ FR-009 (避免重複) now fully covered: T042-T045 implement deduplication, T046-T049 validate deduplication
-   [P] tasks = different files or read-only operations, no write conflicts
-   [Story] label maps task to specific user story for traceability
-   Each user story independently testable after Phase 2 completion
-   Stop at any checkpoint to validate story independently
-   Commit after completing critical fixes (T029-T031) and deduplication (T042-T045) before proceeding to validation
-   All manual tests documented in separate markdown files for reproducibility
