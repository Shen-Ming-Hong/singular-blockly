# Tasks: Singular Block — 自訂積木 JSON 系統

**Input**: Design documents from `/specs/046-custom-block-json/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/messages.md, quickstart.md

**Tests**: Extension Host 服務包含單元測試任務。WebView UI 為手動測試（符合 UI Testing Exception）。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 建立型別定義、JSON Schema、基礎服務骨架

- [ ] T001 [P] Create TypeScript type definitions for CustomBlockDefinition, CustomBlockInput, ArduinoTemplate, MicroPythonTemplate, PlaceholderBlockMeta in `src/types/customBlock.ts`
- [ ] T002 [P] Create JSON Schema file for custom block validation with all field definitions, descriptions (中英文), and enum constraints in `media/schemas/custom-block.schema.json`
- [ ] T003 [P] Add i18n keys for custom block system (category name, error messages, placeholder text) to all 15 locale files in `media/locales/*/messages.js`
- [ ] T004 Create `customBlockService.ts` skeleton with `validateCustomBlock()` pure function and `isBuiltinBlockType()` check in `src/services/customBlockService.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 核心驗證邏輯與 WebView 端動態註冊引擎 — 所有 User Story 的必要基礎

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Implement `validateCustomBlock(json)` pure function: validate required fields (type, message, colour, shape), type regex `^[a-z][a-z0-9_]*$`, colour range 0-360, shape enum, inputs array consistency, template `${NAME}` reference check in `src/services/customBlockService.ts`
- [ ] T006 Implement `isBuiltinBlockType(type)` in `customBlockService.ts`: maintain a hardcoded `BUILTIN_BLOCK_TYPES` Set (collected from all `media/blockly/blocks/*.js` definitions) in Extension Host; additionally, accept a WebView-provided built-in type list via `initCustomBlocks` response to cover dynamically loaded blocks. Note: `Blockly.Blocks` registry only exists in WebView context, Extension Host cannot access it directly in `src/services/customBlockService.ts`
- [ ] T007 [P] Create `customBlocks.js` with `registerCustomBlock(def)` using `Blockly.Blocks[type] = { init() { this.jsonInit(blocklyDef) } }` pattern, converting CustomBlockDefinition shape to Blockly connections (statement→previousStatement/nextStatement, value→output, hat→no connections) in `media/blockly/blocks/customBlocks.js`
- [ ] T008 [P] Implement `registerCustomGenerator(def)` in `customBlocks.js`: register `arduinoGenerator.forBlock[type]` and `micropythonGenerator.forBlock[type]` with string template replacement (`${NAME}` → `generator.valueToCode(block, 'NAME', ORDER)`), handle `includes_`, `lib_deps_`, `addImport()`, `addHardwareInit()` from definition in `media/blockly/blocks/customBlocks.js`
- [ ] T009 Implement `unregisterCustomBlock(type)`: `delete Blockly.Blocks[type]`, `delete arduinoGenerator.forBlock[type]`, `delete micropythonGenerator.forBlock[type]` in `media/blockly/blocks/customBlocks.js`
- [ ] T010 [P] Write unit tests for `validateCustomBlock()`: valid definition, missing required fields, invalid type regex, colour out of range, invalid shape, duplicate input names, mismatched `%1` placeholders in `src/test/suite/customBlockService.test.ts`
- [ ] T011 [P] Write unit tests for `isBuiltinBlockType()`: known built-in types return true, custom types return false in `src/test/suite/customBlockService.test.ts`

**Checkpoint**: 驗證邏輯和 WebView 端積木動態註冊/取消/generator 已就位，可開始 User Story 實作

---

## Phase 3: User Story 1 — 手動建立自訂積木 JSON (Priority: P1) 🎯 MVP

**Goal**: 使用者放入 JSON 到 `blockly/custom-blocks/`，積木自動出現在工具箱「Singular Block」分類，可拖曳使用並生成 Arduino/MicroPython 程式碼

**Independent Test**: 建立一份 JSON 放入資料夾 → 開啟積木編輯器 → 工具箱出現積木 → 拖曳到工作區 → 生成程式碼

### Implementation for User Story 1

- [ ] T012 [US1] Implement `loadAllCustomBlocks(folderPath)` in `customBlockService.ts`: scan folder for `*.json` (skip `_*.json` prefix files), read each file, parse JSON, validate, deduplicate by type (alphabetical priority), return array of `{ definition: CustomBlockDefinition, filePath: string }` (include source file path for edit/delete operations), log warnings for invalid/duplicate in `src/services/customBlockService.ts`
- [ ] T013 [US1] Implement `ensureCustomBlocksFolder(workspacePath)` in `customBlockService.ts`: create `blockly/custom-blocks/` if not exists. Create a simple English-only `_example.json` as initial fallback (Phase 12 T063 will upgrade to full multi-locale support) in `src/services/customBlockService.ts`
- [ ] T014 [US1] Modify `webviewManager.ts` to call `customBlockService.loadAllCustomBlocks()` during panel initialization, store result and pass to messageHandler in `src/webview/webviewManager.ts`
- [ ] T015 [US1] Modify `messageHandler.ts` to include `customBlocks` array in the `init` message (or send separate `initCustomBlocks` message before `init`) so WebView registers blocks before `load()` in `src/webview/messageHandler.ts`
- [ ] T016 [US1] Add `initCustomBlocks` message handler in `blocklyEdit.js`: iterate customBlocks array, call `registerCustomBlock(def)` and `registerCustomGenerator(def)` for each, BEFORE workspace `load()` is called in `media/js/blocklyEdit.js`
- [ ] T017 [US1] Implement toolbox injection: after `updateToolboxForBoard()` fetches toolbox JSON, inject "Singular Block" category with all custom block types before calling `workspace.updateToolbox()` in `media/js/blocklyEdit.js`
- [ ] T018 [US1] Add `<script>` tag for `customBlocks.js` in `blocklyEdit.html`, ensure load order is after Blockly core and generators in `media/html/blocklyEdit.html`
- [ ] T019 [US1] Write unit tests for `loadAllCustomBlocks()`: valid folder with multiple JSONs, skip `_*.json`, deduplicate by type (alphabetical), empty folder, non-existent folder in `src/test/suite/customBlockService.test.ts`
- [ ] T020 [US1] Write unit tests for `ensureCustomBlocksFolder()`: folder already exists (no-op), folder doesn't exist (create + example) in `src/test/suite/customBlockService.test.ts`

**Checkpoint**: 使用者可手動放入 JSON → 啟動後工具箱出現 Singular Block 分類 → 拖曳積木到工作區 → 生成 Arduino/MicroPython 程式碼。MVP 完成。

---

## Phase 4: User Story 1 (cont.) — FileWatcher 即時更新 (Priority: P1)

**Goal**: JSON 檔案即時新增/修改後，工具箱無需重開即自動更新

**Independent Test**: 積木編輯器開啟中 → 新增 JSON 到資料夾 → 工具箱即時出現新積木

### Implementation for FileWatcher

- [ ] T021 [US1] Implement `setupCustomBlockWatcher()` in `webviewManager.ts`: create `FileSystemWatcher` for `blockly/custom-blocks/**/*.json` using `vscode.RelativePattern`, with 500ms debounce, handle `onDidCreate`/`onDidChange`/`onDidDelete` events in `src/webview/webviewManager.ts`
- [ ] T022 [US1] Implement watcher event handler: on file change, reload all custom blocks via `customBlockService.loadAllCustomBlocks()`, diff against previous state to determine `added`/`changed`/`removed` types, send `updateCustomBlocks` message to WebView in `src/webview/webviewManager.ts`
- [ ] T023 [US1] Add `updateCustomBlocks` message handler in `blocklyEdit.js`: unregister removed types, register/re-register added/changed types, rebuild toolbox category, call `workspace.updateToolbox()` in `media/js/blocklyEdit.js`
- [ ] T024 [US1] Add `saveCustomBlock` message handler in `messageHandler.ts`: receive definition from WebView, generate sanitized filename from type, write JSON to `blockly/custom-blocks/` folder (FileWatcher will auto-detect) in `src/webview/messageHandler.ts`
- [ ] T025 [US1] Ensure watcher disposal on panel close: add `customBlockWatcher.dispose()` to panel `onDidDispose` handler in `src/webview/webviewManager.ts`
- [ ] T025a [US1] Handle edge case: drag-while-delete scenario. In FileWatcher change handler (T022), check if workspace is currently in a drag operation (`Blockly.getSelected()` or drag state flag); if so, queue the update until drag ends via `workspace.addChangeListener` for `Blockly.Events.BLOCK_DRAG` end event in `media/js/blocklyEdit.js`

**Checkpoint**: 積木編輯器開啟期間，新增/修改/刪除 JSON 檔案後工具箱即時同步更新

---

## Phase 5: User Story 2 — 佔位積木保護 (Priority: P1)

**Goal**: JSON 刪除/損壞時，工作區中的積木不消失，替換為橘紅色警告佔位積木

**Independent Test**: 建立並使用自訂積木 → 刪除 JSON → 驗證積木變為橘紅色佔位積木（保留位置和連接）

### Implementation for User Story 2

- [ ] T026 [US2] Implement `registerPlaceholderBlock(type, shape)` in `customBlocks.js`: register block with hue 20 (orange-red), display type name as message text, match connections based on shape (statement→previous/next, value→output, hat→none), register generators outputting `// [Missing block: {type}]` (Arduino) / `# [Missing block: {type}]` (MicroPython) in `media/blockly/blocks/customBlocks.js`
- [ ] T027 [US2] Implement placeholder tracking: maintain `window._customBlockPlaceholders` Set to track which types are currently placeholder in `media/blockly/blocks/customBlocks.js`
- [ ] T028 [US2] Modify `updateCustomBlocks` handler for delete scenario: when `removed` types have instances in workspace, save workspace state → unregister old definition → register placeholder → reload workspace state to preserve connections in `media/js/blocklyEdit.js`
- [ ] T029 [US2] Implement pre-scan placeholder registration for workspace load: before `Blockly.serialization.workspaces.load()`, scan workspace state JSON for block types, identify unregistered types, infer shape from serialized data (`output` field → value, `previousConnection` → statement, else hat), register placeholders before `load()` in `media/js/blocklyEdit.js`
- [ ] T030 [US2] Add `PlaceholderBlockMeta` tracking in `customBlockService.ts`: maintain in-memory array of placeholder metadata, include in `updateCustomBlocks` and `initCustomBlocks` messages in `src/services/customBlockService.ts`
- [ ] T031 [US2] Add i18n keys for placeholder warning messages (tooltip text explaining the block is missing) to all 15 locale files in `media/locales/*/messages.js`

**Checkpoint**: JSON 刪除/損壞後，工作區中積木安全替換為佔位積木，位置和連接保留，程式碼生成輸出注解

---

## Phase 6: User Story 3 — 佔位積木自動恢復 (Priority: P2)

**Goal**: 重建同名 JSON 後，佔位積木自動恢復為正常積木

**Independent Test**: 刪除 JSON 觸發佔位積木 → 重建同名 JSON → 佔位積木自動回復

### Implementation for User Story 3

- [ ] T032 [US3] Modify `updateCustomBlocks` handler for restore scenario: when added/changed type matches a tracked placeholder, save workspace state → unregister placeholder → register normal block + generator → reload workspace state in `media/js/blocklyEdit.js`
- [ ] T033 [US3] Update `PlaceholderBlockMeta` tracking: remove restored type from placeholder tracking, clear from `window._customBlockPlaceholders` Set in `media/blockly/blocks/customBlocks.js`
- [ ] T034 [US3] Validate restore preserves block position and connections: ensure serialized workspace state round-trips correctly when transitioning placeholder → normal block in `media/js/blocklyEdit.js`

**Checkpoint**: 佔位積木恢復完整迴路驗證：建立 → 使用 → 刪除(佔位) → 重建(恢復) → 位置和連接完好

---

## Phase 7: User Story 4 — 精靈 UI 建立積木 (Priority: P2)

**Goal**: 點擊「＋ 建立新積木」按鈕，經 4 步驟精靈引導建立自訂積木

**Independent Test**: 點擊建立按鈕 → 填寫四個步驟 → 完成 → JSON 自動產生 → 積木出現在工具箱

### Implementation for User Story 4

- [ ] T035 [P] [US4] Add wizard Modal HTML structure in `blocklyEdit.html`: `#customBlockWizardModal` container with progress bar (4 steps clickable), left panel (form area), right panel (preview area with SVG + code tabs), bottom buttons (previous/next/cancel/finish) in `media/html/blocklyEdit.html`
- [ ] T036 [P] [US4] Add wizard step 1 HTML (基本設定): type input (with regex validation hint), message textarea, colour picker (hue slider 0-360), shape dropdown (statement/value/hat), tooltip textarea in `media/html/blocklyEdit.html`
- [ ] T037 [P] [US4] Add wizard step 2 HTML (輸入欄位): input list container with add/remove/reorder buttons, each input row has: name (uppercase), type dropdown (value/text/number/dropdown/angle/colour), label, default, type-specific options (check, min/max/precision, dropdown options) in `media/html/blocklyEdit.html`
- [ ] T038 [P] [US4] Add wizard step 3 HTML (程式碼模板): Arduino section (code textarea with `${NAME}` hint, includes chips input, libDeps chips input, variables key-value pairs, setupCode textarea), MicroPython section (code textarea, imports chips input, hardwareInit key-value pairs) in `media/html/blocklyEdit.html`
- [ ] T039 [P] [US4] Add wizard step 4 HTML (確認): full block preview (SVG), generated code preview (Arduino tab + MicroPython tab), JSON preview tab, finish button in `media/html/blocklyEdit.html`
- [ ] T040 [P] [US4] Add wizard CSS styles in `blocklyEdit.css`: modal overlay, modal content (max-width 900px, max-height 80vh), progress bar steps, left/right panel layout (60%/40%), form elements, preview area, button bar, light/dark theme support matching existing blocklyEdit.css patterns in `media/css/blocklyEdit.css`
- [ ] T041 [US4] Implement wizard JavaScript controller in `blocklyEdit.js`: WizardState object, `openWizard(mode, definition?)`, `closeWizard()`, step navigation (show/hide panels, update progress bar), form data binding, cancel confirmation in `media/js/blocklyEdit.js`
- [ ] T042 [US4] Implement wizard live preview: create hidden mini Blockly workspace, on form change → build temporary block definition → `jsonInit()` in mini workspace → render SVG preview, code preview via template string replacement in `media/js/blocklyEdit.js`
- [ ] T043 [US4] Implement wizard finish action: collect WizardState → build CustomBlockDefinition JSON → send `saveCustomBlock` message to Extension → close wizard in `media/js/blocklyEdit.js`
- [ ] T044 [US4] Add toolbox "＋ 建立新積木" button: inject `<button>` element into "Singular Block" category in toolbox, bind click to `openWizard('create')` in `media/js/blocklyEdit.js`
- [ ] T045 [US4] Add i18n keys for all wizard UI text (step titles, field labels, button labels, validation messages, placeholder hints) to all 15 locale files in `media/locales/*/messages.js`

**Checkpoint**: 使用者可透過精靈 UI 從零建立自訂積木，即時預覽外觀和程式碼，完成後積木出現在工具箱

---

## Phase 8: User Story 5 — 精靈編輯模式 + 右鍵選單 (Priority: P2)

**Goal**: 右鍵自訂積木 → 選擇「編輯積木定義」→ 精靈以編輯模式開啟

**Independent Test**: 工作區中有自訂積木 → 右鍵選擇「編輯積木定義」→ 精靈預填現有定義 → 修改顏色 → 完成 → 所有同型積木即時更新

### Implementation for User Story 5

- [ ] T046 [US5] Register context menu item using `Blockly.ContextMenuRegistry.registry.register()` with id `edit_custom_block_definition`, scopeType BLOCK, `preconditionFn` checking if block.type is in custom blocks registry (return 'enabled' or 'hidden'), `displayText` using i18n key, callback directly invoking `openWizard('edit', definition)` in WebView (no postMessage round-trip needed since both context menu and wizard run in WebView context). The `openCustomBlockWizard` message is reserved for Extension-initiated wizard opens only in `media/blockly/blocks/customBlocks.js`
- [ ] T047 [US5] Implement edit mode in wizard: when `openWizard('edit', definition)` called, pre-fill all form fields from definition, set type field as readonly, store `sourceFilePath` for overwrite on finish in `media/js/blocklyEdit.js`
- [ ] T048 [US5] Modify `saveCustomBlock` handler in `messageHandler.ts` to support edit mode: when `filePath` is provided, validate that resolved path is strictly within `blockly/custom-blocks/` directory (path traversal protection — reject if `path.resolve(filePath)` escapes the custom-blocks folder), then overwrite existing file. For new blocks, Extension Host derives filename from `type` field, ignoring any WebView-provided path in `src/webview/messageHandler.ts`
- [ ] T049 [US5] Add i18n keys for context menu "Edit block definition" text and edit mode specific labels to all 15 locale files in `media/locales/*/messages.js`

**Checkpoint**: 右鍵選單編輯自訂積木定義完整流程可運作

---

## Phase 9: User Story 4 (cont.) — PlatformIO 函式庫搜尋 (Priority: P2)

**Goal**: 精靈步驟三中搜尋 PlatformIO 函式庫，自動填入 includes 和 libDeps

**Independent Test**: 精靈步驟三 → 點擊「搜尋函式庫」→ 輸入 "servo" → 結果列表出現 → 選取 → includes 和 libDeps 自動填入

### Implementation for PIO Library Search

- [ ] T050 [US4] Add `searchPioLibrary` message handler in `messageHandler.ts`: receive query string, resolve PlatformIO CLI path using the same approach as `ArduinoUploader.getPioPath()` (check PlatformIO extension path + system PATH), execute `pio pkg search --type library --json-output "{query}"` via `child_process.exec`, parse JSON result, extract name/version/description/authors/headers, send `pioLibraryResults` message back to WebView. Note: `getPioPath()` is a method on `ArduinoUploader` class — either extract to shared utility or replicate the path resolution logic in `src/webview/messageHandler.ts`
- [ ] T051 [US4] Add PIO search UI in wizard step 3: search input + button, results list (name, description, version), select button per result, auto-fill includes (from headers) and libDeps (from formatted lib_dep string) on selection in `media/js/blocklyEdit.js`
- [ ] T052 [US4] Add `pioLibraryResults` message handler in `blocklyEdit.js`: populate search results list, handle error state (PIO not installed, search failed) in `media/js/blocklyEdit.js`
- [ ] T053 [US4] Add i18n keys for PIO search UI (search button label, placeholder text, result column headers, error messages, "PlatformIO not found" guidance) to all 15 locale files in `media/locales/*/messages.js`

**Checkpoint**: PlatformIO 函式庫搜尋整合到精靈 UI 完成

---

## Phase 10: User Story 6 — MCP 聊天工具 (Priority: P3)

**Goal**: Copilot 聊天可用 4 個 MCP 工具操作自訂積木

**Independent Test**: 在 Copilot 聊天中呼叫 `create_custom_block` → JSON 寫入 → 積木出現在工具箱

### Implementation for User Story 6

- [ ] T054 [P] [US6] Create `src/mcp/tools/customBlock.ts` with `registerCustomBlockTools(server)` function skeleton, export in `src/mcp/tools/index.ts`
- [ ] T055 [US6] Implement `create_custom_block` MCP tool: accept CustomBlockDefinition fields via Zod schema, validate via `customBlockService.validateCustomBlock()`, check name conflicts (append numeric suffix if needed), write JSON to `blockly/custom-blocks/` in `src/mcp/tools/customBlock.ts`
- [ ] T056 [US6] Implement `list_custom_blocks` MCP tool: call `customBlockService.loadAllCustomBlocks()`, return formatted list with type, message, shape, has-arduino, has-micropython info in `src/mcp/tools/customBlock.ts`
- [ ] T057 [US6] Implement `validate_custom_block` MCP tool: accept JSON string, parse, validate via `customBlockService.validateCustomBlock()`, return success or detailed error messages in `src/mcp/tools/customBlock.ts`
- [ ] T058 [US6] Implement `delete_custom_block` MCP tool: accept type string, find corresponding JSON file, delete it (FileWatcher handles placeholder) in `src/mcp/tools/customBlock.ts`
- [ ] T059 [US6] Register all 4 tools in `mcpServer.ts` by calling `registerCustomBlockTools(server)` in `src/mcp/mcpServer.ts`
- [ ] T060 [US6] Write unit tests for MCP tools: create (valid input, duplicate name suffix), list, validate (valid/invalid), delete in `src/test/suite/customBlockMcp.test.ts`

**Checkpoint**: 4 個 MCP 工具可在 Copilot 聊天中正常使用

---

## Phase 11: User Story 7 — JSON Schema IntelliSense (Priority: P3)

**Goal**: VS Code 自動補全和錯誤高亮 for custom block JSON files

**Independent Test**: 開啟 `blockly/custom-blocks/test.json` → 輸入欄位 → VS Code 提供自動補全 → 輸入錯誤值 → 紅色底線

### Implementation for User Story 7

- [ ] T061 [US7] Add `json.schemas` configuration in `package.json` contributes section: associate `blockly/custom-blocks/*.json` (excluding `_*.json`) with schema path in `package.json`
- [ ] T062 [US7] Verify JSON Schema completeness: test all field autocompletion, enum validation (shape, input type), pattern validation (type regex), range validation (colour), nested object completion (arduino, micropython, inputs) in `media/schemas/custom-block.schema.json`

**Checkpoint**: JSON 手動編輯有完整的 IntelliSense 支援

---

## Phase 12: User Story 8 — 範例檔案與語系同步 (Priority: P3)

**Goal**: `_example.json` 建立與語系切換同步

**Independent Test**: 切換積木編輯器語系至日文 → 驗證 `_example.json` 內容為日文

### Implementation for User Story 8

- [ ] T063 [US8] Implement `ensureExampleFile(folderPath, locale)` in `customBlockService.ts`: create `_example.json` from locale-specific template dictionary (15 locales × template content), include warning comment about overwrite in `src/services/customBlockService.ts`
- [ ] T064 [US8] Implement `updateExampleLocale(folderPath, locale)` in `customBlockService.ts`: overwrite `_example.json` content with new locale template in `src/services/customBlockService.ts`
- [ ] T065 [US8] Create example template content for all 15 locales: Traditional Chinese, English, Japanese, Korean, German, French, Spanish, Italian, Portuguese-BR, Russian, Polish, Bulgarian, Czech, Hungarian, Turkish as data dictionary in `src/services/customBlockService.ts`
- [ ] T066 [US8] Hook language change event: when WebView sends language change notification, call `updateExampleLocale()` with new locale in `src/webview/messageHandler.ts`
- [ ] T067 [US8] Write unit tests for `ensureExampleFile()` and `updateExampleLocale()`: file creation, locale switching, overwrite behavior in `src/test/suite/customBlockService.test.ts`

**Checkpoint**: 範例檔案隨語系更新正確

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: 全功能整合驗證與收尾

- [ ] T068 Run `npm run validate:i18n` to verify all 15 locale files have all new custom block i18n keys
- [ ] T069 Run `npm run generate:dictionary` to update `block-dictionary.json` with new MCP tools
- [ ] T070 Run `npm run lint` and fix any ESLint errors in all modified/new TypeScript files under `src/`
- [ ] T071 Run `npm test` to verify all existing tests still pass plus new custom block tests
- [ ] T072 Manual end-to-end test: create JSON manually → toolbox shows block → drag to workspace → generate Arduino code → generate MicroPython code → delete JSON → placeholder appears → recreate JSON → block restores
- [ ] T073 Manual end-to-end test: open wizard → complete 4 steps → block created → right-click edit → modify → save → block updated
- [ ] T074 Manual end-to-end test: MCP create_custom_block → block appears → list_custom_blocks → validate_custom_block → delete_custom_block → placeholder
- [ ] T075 Run quickstart.md validation: follow quickstart.md steps literally and verify all work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (types) from Setup — BLOCKS all user stories
- **US1 Core Load (Phase 3)**: Depends on Phase 2 completion
- **US1 FileWatcher (Phase 4)**: Depends on Phase 3 completion (extends same files)
- **US2 Placeholder (Phase 5)**: Depends on Phase 4 completion (uses `updateCustomBlocks` message)
- **US3 Restore (Phase 6)**: Depends on Phase 5 completion (extends placeholder logic)
- **US4 Wizard UI (Phase 7)**: Depends on Phase 3 completion (uses `saveCustomBlock` message)
- **US5 Edit Mode (Phase 8)**: Depends on Phase 7 completion (extends wizard)
- **US4 PIO Search (Phase 9)**: Depends on Phase 7 completion (extends wizard step 3)
- **US6 MCP Tools (Phase 10)**: Depends on Phase 3 completion (uses `customBlockService`)
- **US7 Schema (Phase 11)**: Depends on Phase 1 T002 only — can run in parallel with Phases 3+
- **US8 Example (Phase 12)**: Depends on Phase 3 T013 (uses `ensureCustomBlocksFolder`)
- **Polish (Phase 13)**: Depends on all desired phases being complete

### User Story Dependencies

- **US1 (P1)**: Core — no dependencies on other stories. **MVP target.**
- **US2 (P1)**: Depends on US1 (needs FileWatcher `updateCustomBlocks` flow)
- **US3 (P2)**: Depends on US2 (extends placeholder mechanism)
- **US4 (P2)**: Depends on US1 core load only (wizard creates JSON via `saveCustomBlock`)
- **US5 (P2)**: Depends on US4 (extends wizard with edit mode)
- **US6 (P3)**: Depends on US1 core only (MCP tools use `customBlockService`)
- **US7 (P3)**: Nearly independent — depends only on Phase 1 Setup (JSON Schema)
- **US8 (P3)**: Depends on US1 folder creation logic

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can all run in parallel
- **Phase 2**: T007, T008 (WebView) can run in parallel with T005, T006 (Extension)
- **Phase 2**: T010, T011 (tests) can run in parallel with each other
- **After Phase 3 completes**: US4 (wizard), US6 (MCP), US7 (schema), US8 (example) can all start in parallel
- **After Phase 5 completes**: US3 (restore) can start

---

## Parallel Example: After Phase 2 Foundational Complete

```
┌──────────────────────────────────────────────────────┐
│              Phase 2 Complete (Foundation)            │
└───────────┬──────────────────────────────┬───────────┘
            │                              │
            ▼                              ▼
   Phase 3: US1 Core Load         Phase 11: US7 Schema
            │                      (independent)
            ▼
   Phase 4: US1 FileWatcher
            │
     ┌──────┼──────────────┬──────────────┐
     ▼      ▼              ▼              ▼
  Phase 5  Phase 7       Phase 10      Phase 12
  US2      US4 Wizard    US6 MCP       US8 Example
  Placeholder  │         (parallel)    (parallel)
     │         ├─────┐
     ▼         ▼     ▼
  Phase 6   Phase 8  Phase 9
  US3       US5 Edit  PIO Search
  Restore   Mode
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Foundational (T005-T011)
3. Complete Phase 3: US1 Core Load (T012-T020)
4. Complete Phase 4: US1 FileWatcher (T021-T025)
5. **STOP and VALIDATE**: Test US1 independently — JSON → 工具箱 → 拖曳 → 程式碼生成 → 即時更新
6. Deploy/demo if ready (MVP!)

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 Core + FileWatcher → **MVP 完成**（手動 JSON 建立 + 即時更新）
3. US2 Placeholder → 資料保護就位
4. US3 Restore → 完整錯誤恢復迴路
5. US4 Wizard + US5 Edit → 圖形化建立/編輯
6. US6 MCP → 聊天工具
7. US7 Schema + US8 Example → 使用者體驗優化
8. Polish → 最終驗證

### Each Increment Adds Value Without Breaking Previous Stories
