# Tasks: 防止孤立積木產生無效程式碼

**Input**: Design documents from `/specs/044-prevent-orphan-blocks/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Tests ARE requested — plan.md §RN-006 defines test cases; spec.md requires unit tests for `isInAllowedContext`; constitution principle VII mandates test coverage for core logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: VSCode Extension + WebView
- **Generator code**: `media/blockly/generators/{arduino,micropython}/`
- **Block definitions**: `media/blockly/blocks/`
- **Locales**: `media/locales/{lang}/messages.js`
- **Tests**: `src/test/suite/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, shared helpers, and data definitions

- [x] T001 Define `allowedTopLevelBlocks_` array for Arduino generator in `media/blockly/generators/arduino/index.js` — add property: `['arduino_setup_loop', 'arduino_function', 'procedures_defnoreturn', 'procedures_defreturn']`
- [x] T002 [P] Define `ALLOWED_CONTAINERS` merged array and implement global `window.isInAllowedContext(block)` helper function in `media/blockly/blocks/loops.js` — pure function using `getSurroundParent()` recursive traversal per contract §2
- [x] T003 [P] Implement generator-specific `window.arduinoGenerator.isInAllowedContext(block)` method in `media/blockly/generators/arduino/index.js` — uses Arduino-only container list per RN-005
- [x] T004 [P] Implement generator-specific `window.micropythonGenerator.isInAllowedContext(block)` method in `media/blockly/generators/micropython/index.js` — uses MicroPython-only container list per RN-005

**Checkpoint**: Core helpers ready — all subsequent phases can reference `isInAllowedContext`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Arduino `workspaceToCode` override — MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Implement `workspaceToCode()` override for Arduino generator in `media/blockly/generators/arduino/index.js` — filter top-level blocks via `allowedTopLevelBlocks_`, add `// [Skipped] Orphan block: {type} (not in setup/loop/function)` comment for skipped blocks, preserve `alwaysGenerateBlocks_` mechanism (runs inside `arduino_setup_loop.forBlock`), follow MicroPython pattern at line 106-148
- [x] T006 Enhance MicroPython generator `workspaceToCode()` in `media/blockly/generators/micropython/index.js` — confirm existing `allowedTopLevelBlocks_` filtering is present, then add skip comment format `# [Skipped] Orphan block: {type} (not in setup/loop/function)` for orphan blocks that are filtered out (currently silently skipped)

**Checkpoint**: Foundation ready — both generators now filter orphan blocks at the top level. User story implementation can begin.

---

## Phase 3: User Story 1 — 孤立控制積木不產生程式碼 (Priority: P1) 🎯 MVP

**Goal**: Orphan control/flow blocks produce no code in either Arduino or MicroPython generators. This is the core value of the feature.

**Independent Test**: Drag any control block to workspace blank area, switch to code view → code output must NOT contain that block's syntax. Correctly nested blocks must still generate code normally.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T007 [P] [US1] Create unit test file `src/test/suite/orphan-block-guard.test.ts` with test scaffold — import helpers, set up Blockly workspace mock
- [x] T008 [P] [US1] Write test: `isInAllowedContext` returns `true` for block directly inside allowed container in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T3)
- [x] T009 [P] [US1] Write test: `isInAllowedContext` returns `false` for top-level block with no parent in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T4)
- [x] T010 [P] [US1] Write test: `isInAllowedContext` returns `true` for multi-level nesting (loop > if > while) in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T1)
- [x] T011 [P] [US1] Write test: `isInAllowedContext` returns `false` for nested orphan (orphan if > while) in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T2)
- [x] T012 [P] [US1] Write test: `isInAllowedContext` handles different container types (`procedures_defnoreturn`, `arduino_function`) in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T5)
- [x] T013 [P] [US1] Write test: forBlock guard returns empty string for orphan block in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T9)
- [x] T014 [P] [US1] Write test: forBlock guard returns valid code for block in allowed context in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T10)

### Implementation for User Story 1 — Arduino Generator Guards

- [x] T015 [P] [US1] Add `isInAllowedContext` guard to `controls_whileUntil` forBlock in `media/blockly/generators/arduino/loops.js` — return `''` if orphan
- [x] T016 [P] [US1] Add `isInAllowedContext` guard to `controls_for` forBlock in `media/blockly/generators/arduino/loops.js` — return `''` if orphan
- [x] T017 [P] [US1] Add `isInAllowedContext` guard to `controls_forEach` forBlock in `media/blockly/generators/arduino/loops.js` — return `''` if orphan
- [x] T018 [P] [US1] Add `isInAllowedContext` guard to `controls_repeat_ext` forBlock in `media/blockly/generators/arduino/loops.js` — return `''` if orphan
- [x] T019 [P] [US1] Add `isInAllowedContext` guard to `controls_duration` forBlock in `media/blockly/generators/arduino/loops.js` — return `''` if orphan (spec enhancement per RN-004, Arduino-only)
- [x] T020 [P] [US1] Add `isInAllowedContext` guard to `controls_if` forBlock in `media/blockly/generators/arduino/logic.js` — return `''` if orphan
- [x] T021 [P] [US1] Add `isInAllowedContext` guard to `singular_flow_statements` forBlock in `media/blockly/generators/arduino/loops.js` — return `''` if orphan

### Implementation for User Story 1 — MicroPython Generator Guards

- [x] T022 [P] [US1] Add `isInAllowedContext` guard to `controls_whileUntil` forBlock in `media/blockly/generators/micropython/loops.js` — return `''` if orphan
- [x] T023 [P] [US1] Add `isInAllowedContext` guard to `controls_for` forBlock in `media/blockly/generators/micropython/loops.js` — return `''` if orphan
- [x] T024 [P] [US1] Add `isInAllowedContext` guard to `controls_forEach` forBlock in `media/blockly/generators/micropython/loops.js` — return `''` if orphan
- [x] T025 [P] [US1] Add `isInAllowedContext` guard to `controls_repeat_ext` forBlock in `media/blockly/generators/micropython/loops.js` — return `''` if orphan
- [x] T026 [P] [US1] Add `isInAllowedContext` guard to `controls_if` forBlock in `media/blockly/generators/micropython/logic.js` — return `''` if orphan
- [x] T027 [P] [US1] Add `isInAllowedContext` guard to `singular_flow_statements` forBlock in `media/blockly/generators/micropython/loops.js` — return `''` if orphan — NOTE: 目前 micropython/loops.js 使用 controls_flow_statements 鍵名，需先重命名為 singular_flow_statements 以匹配 blocks/loops.js 積木定義

### User Story 4 Integration (P1 — Regression Protection)

- [x] T028 [P] [US1] Write test: `workspaceToCode` skips orphan top-level block in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T6)
- [x] T029 [P] [US1] Write test: `alwaysGenerateBlocks_` blocks (e.g. `servo_setup`) are not affected by filtering in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T8)
- [x] T030 [US1] Run full test suite (`npm test`) and verify all existing tests still pass — no regressions in `src/test/suite/`

**Checkpoint**: At this point, User Story 1 (and the regression protection of User Story 4) should be fully functional. No orphan control block produces code in either generator; all correctly nested blocks continue to work.

---

## Phase 4: User Story 2 — 孤立積木顯示視覺警告 (Priority: P2)

**Goal**: Orphan control blocks display a visual warning icon/text via `setWarningText()`. Warning auto-clears when block is moved into a valid container.

**Independent Test**: Drag a control block to blank workspace → yellow warning icon appears. Drag it into `loop()` → warning disappears within 1 second.

### Implementation for User Story 2

- [x] T031 [P] [US2] Add `onchange` orphan-warning callback to `controls_repeat_ext` block definition in `media/blockly/blocks/loops.js` — use `window.isInAllowedContext(this)` + `setWarningText()` — NOTE: Blockly 內建積木，需透過 Extension/Mixin 或 post-init onchange 覆寫方式掛載（同 T037 策略）
- [x] T032 [P] [US2] Add `onchange` orphan-warning callback to `controls_whileUntil` block definition in `media/blockly/blocks/loops.js` — NOTE: Blockly 內建積木，需透過 Extension/Mixin 或 post-init onchange 覆寫方式掛載（同 T037 策略）
- [x] T033 [P] [US2] Add `onchange` orphan-warning callback to `controls_for` block definition in `media/blockly/blocks/loops.js` — NOTE: Blockly 內建積木，需透過 Extension/Mixin 或 post-init onchange 覆寫方式掛載（同 T037 策略）
- [x] T034 [P] [US2] Add `onchange` orphan-warning callback to `controls_forEach` block definition in `media/blockly/blocks/loops.js` — NOTE: Blockly 內建積木，需透過 Extension/Mixin 或 post-init onchange 覆寫方式掛載（同 T037 策略）
- [x] T035 [P] [US2] Add `onchange` orphan-warning callback to `controls_duration` block definition in `media/blockly/blocks/loops.js` (Arduino-only, spec enhancement per RN-004)
- [x] T036 [US2] Integrate orphan-warning into existing `singular_flow_statements` `onchange` in `media/blockly/blocks/loops.js` — add orphan check with priority over loop warning per contract block-warning-events.md §1
- [x] T037 [US2] Add orphan-warning to `controls_if` (Blockly built-in) via Extension/Mixin or direct `onchange` assignment in `media/blockly/blocks/loops.js` — per RN-003, verify Blockly 12.x allows post-init `onchange` override
- [x] T038 [US2] Implement generator-mode detection in `onchange` callback to select correct i18n key (`ORPHAN_BLOCK_WARNING_ARDUINO` vs `ORPHAN_BLOCK_WARNING_MICROPYTHON`) per RN-001 and RN-008 — 使用 window.currentProgrammingLanguage 全域變數判斷當前 generator 模式（需在 generator 切換時由 blocklyEdit.js 設定）

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Orphan blocks are visually flagged and produce no code.

---

## Phase 5: User Story 3 — 多語系警告訊息支援 (Priority: P3)

**Goal**: Warning messages display in the user's interface language across all 15 supported locales, with generator-specific wording (Arduino mentions `setup()`/`loop()`, MicroPython mentions `main()`).

**Independent Test**: Switch interface language to any supported locale, drag control block to blank area → warning shows in that language.

### Implementation for User Story 3

- [x] T039 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/en/messages.js` — English: Arduino: "This block must be placed inside setup(), loop(), or a function to generate code." / MicroPython: "This block must be placed inside main() or a function to generate code."
- [x] T040 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/zh-hant/messages.js` — 繁體中文
- [x] T041 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/ja/messages.js` — 日本語
- [x] T042 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/ko/messages.js` — 한국어
- [x] T043 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/de/messages.js` — Deutsch
- [x] T044 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/fr/messages.js` — Français
- [x] T045 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/es/messages.js` — Español
- [x] T046 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/it/messages.js` — Italiano
- [x] T047 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/pt-br/messages.js` — Português (BR)
- [x] T048 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/ru/messages.js` — Русский
- [x] T049 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/pl/messages.js` — Polski
- [x] T050 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/tr/messages.js` — Türkçe
- [x] T051 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/hu/messages.js` — Magyar
- [x] T052 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/cs/messages.js` — Čeština
- [x] T053 [P] [US3] Add `ORPHAN_BLOCK_WARNING_ARDUINO` and `ORPHAN_BLOCK_WARNING_MICROPYTHON` i18n keys to `media/locales/bg/messages.js` — Български

**Checkpoint**: All user stories should now be independently functional. Warnings display in all 15 locales with generator-specific wording.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T054 [P] Write test: skipped orphan block produces correct comment format in `src/test/suite/orphan-block-guard.test.ts` (RN-006 T7)
- [x] T055 [P] Write test: `controls_duration` guard works for Arduino-only (RN-006 T11) in `src/test/suite/orphan-block-guard.test.ts`
- [x] T056 [P] Write test: generator-specific warning message text validation (RN-006 T12) in `src/test/suite/orphan-block-guard.test.ts`
- [x] T057 Run full build (`npm run compile`) and verify no TypeScript compilation errors
- [x] T058 Run full test suite (`npm test`) and verify all tests pass including new orphan-block-guard tests
- [ ] T059 Run quickstart.md manual test scenarios (6 scenarios) to validate end-to-end behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001-T004) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 1 (T002 global `isInAllowedContext`) — can start in parallel with US1 after Phase 2
- **User Story 3 (Phase 5)**: No code dependencies on other stories — can start in parallel after Phase 2 (i18n keys are independent files)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **User Story 2 (P2)**: Can start after Phase 2 — Uses `window.isInAllowedContext` from Phase 1 (T002); independent of US1 guards
- **User Story 3 (P3)**: Can start after Phase 2 — Independent i18n file edits; US2 (T038) references i18n keys from US3
- **User Story 4 (P1)**: Integrated into US1 phase as regression tests (T028, T029, T030) — no separate phase needed

### Within Each User Story

- Tests MUST be written and FAIL before implementation (US1)
- Guards can be added in parallel across different files (Arduino loops.js, Arduino logic.js, MicroPython loops.js, MicroPython logic.js)
- `onchange` callbacks can be added in parallel across different block types
- i18n keys can be added in parallel across all 15 locale files

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can all run in parallel (different files)
- **Phase 3 Tests**: T007-T014 can all run in parallel (same file, different test cases)
- **Phase 3 Arduino Guards**: T015-T021 can all run in parallel (T015-T019, T021 in loops.js; T020 in logic.js — group by file)
- **Phase 3 MicroPython Guards**: T022-T027 can all run in parallel (T022-T025, T027 in loops.js; T026 in logic.js — group by file)
- **Phase 4**: T031-T035 can all run in parallel (same file, different block defs)
- **Phase 5**: T039-T053 ALL run in parallel (15 independent locale files)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T007: "Create test scaffold in src/test/suite/orphan-block-guard.test.ts"
Task T008-T014: "Write individual test cases" (all in same file, no conflicts)

# Launch Arduino guards in parallel (grouped by file):
# File: media/blockly/generators/arduino/loops.js
Task T015: "Guard controls_whileUntil"
Task T016: "Guard controls_for"
Task T017: "Guard controls_forEach"
Task T018: "Guard controls_repeat_ext"
Task T019: "Guard controls_duration"
Task T021: "Guard singular_flow_statements"

# File: media/blockly/generators/arduino/logic.js
Task T020: "Guard controls_if"

# Launch MicroPython guards in parallel (grouped by file):
# File: media/blockly/generators/micropython/loops.js
Task T022-T025, T027: "Guard loop/flow blocks"

# File: media/blockly/generators/micropython/logic.js
Task T026: "Guard controls_if"
```

## Parallel Example: User Story 3

```bash
# All 15 locale files can be edited simultaneously:
Task T039-T053: Each adds 2 i18n keys to a different locale file
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T006)
3. Complete Phase 3: User Story 1 — tests first (T007-T014), then guards (T015-T030)
4. **STOP and VALIDATE**: Run `npm test` — all orphan blocks filtered, all existing blocks unaffected
5. Deploy/demo if ready — core protection is active

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Core protection active (MVP!)
3. Add User Story 2 → Test independently → Visual warnings active
4. Add User Story 3 → Test independently → All 15 locales active
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Arduino guards + MicroPython guards)
   - Developer B: User Story 2 (block onchange callbacks)
   - Developer C: User Story 3 (15 locale files)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (US1)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- RN-001: Use dual i18n keys (`ORPHAN_BLOCK_WARNING_ARDUINO` / `ORPHAN_BLOCK_WARNING_MICROPYTHON`) per spec FR-008
- RN-002: Use `singular_flow_statements` (not `controls_flow_statements`) — project custom block
- RN-003: `controls_if` is Blockly built-in — use Extension/direct override for onchange
- RN-004: `controls_duration` included as spec enhancement (Arduino-only timer loop)
- RN-005: Two versions of `isInAllowedContext` — global (merged containers for block.onchange) and generator-specific (for forBlock guards)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
