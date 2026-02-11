## 摘要 Summary

防止孤立（orphan）控制/流程類積木（`while`/`for`/`if`/`break`/`continue`）在未放入合法容器（`setup()`/`loop()`/函式）時產生無效的 C++ 或 MicroPython 程式碼。採用三層防護機制確保程式碼品質。

Prevent orphan control/flow blocks from generating invalid code when placed outside allowed containers. Implements a three-layer protection mechanism.

## 相關 Spec Related Spec

- Spec: `specs/044-prevent-orphan-blocks/spec.md`
- Tasks: `specs/044-prevent-orphan-blocks/tasks.md`

## 變更類型 Type of Change

- [x] ✨ 新功能 (non-breaking change which adds functionality)

## 三層防護架構 Three-Layer Protection

### Layer 1: `workspaceToCode` 過濾
- Arduino generator: 覆寫 `workspaceToCode()`，跳過非允許頂層積木並加入 `// [Skipped] ...` 註解
- MicroPython generator: 同上，使用 `# [Skipped] ...` 註解格式

### Layer 2: `forBlock` Guard
- 對列舉的控制/流程積木（`controls_whileUntil`、`controls_for`、`controls_forEach`、`controls_repeat_ext`、`controls_if`、`singular_flow_statements`）加入 `isInAllowedContext()` 檢查
- Arduino 與 MicroPython 各有獨立的容器清單

### Layer 3: `onchange` 視覺警告
- 孤立積木顯示 `setWarningText()` 警告
- 移入合法容器後警告自動消失
- Generator-specific i18n 訊息（Arduino 提及 `setup()/loop()`，MicroPython 提及 `main()`）

## 變更檔案 Changes

### 核心實作 (7 files)
- `media/blockly/blocks/loops.js` — 全域 `isInAllowedContext()` helper + `onchange` 警告
- `media/blockly/generators/arduino/index.js` — `allowedTopLevelBlocks_` + `workspaceToCode()` 覆寫 + `isInAllowedContext()`
- `media/blockly/generators/arduino/loops.js` — Arduino 迴圈積木 guard
- `media/blockly/generators/arduino/logic.js` — Arduino `controls_if` guard
- `media/blockly/generators/micropython/index.js` — MicroPython `workspaceToCode()` + `isInAllowedContext()`
- `media/blockly/generators/micropython/loops.js` — MicroPython 迴圈積木 guard
- `media/blockly/generators/micropython/logic.js` — MicroPython `controls_if` guard

### i18n (15 locales)
- 所有 15 個語系新增 `ORPHAN_BLOCK_WARNING_ARDUINO` 和 `ORPHAN_BLOCK_WARNING_MICROPYTHON` 鍵值

### 測試 (1 file)
- `src/test/suite/orphan-block-guard.test.ts` — 492 測試全數通過

## 測試計畫 Test Plan

- [x] `npm run test` 通過（492 tests passing）
- [x] `npm run lint` 通過
- [x] `npm run compile` 通過
- [x] 手動測試：孤立積木不產生程式碼
- [x] 手動測試：孤立積木顯示警告
- [x] 手動測試：移入容器後警告消失
