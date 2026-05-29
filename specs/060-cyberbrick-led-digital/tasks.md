# Tasks: CyberBrick LED Digital Control Blocks

**Input**: Design documents from `/specs/060-cyberbrick-led-digital/`  
**Prerequisites**: [plan.md](plan.md) ✅ | [spec.md](spec.md) ✅ | [research.md](research.md) ✅ | [data-model.md](data-model.md) ✅ | [contracts/block-output.md](contracts/block-output.md) ✅ | [quickstart.md](quickstart.md) ✅

**Tests**: No automated test tasks — per Constitution VII UI Testing Exception. Manual WebView scenarios are listed in the Polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Exact file paths included in each description

---

## Phase 1: Setup — i18n Keys

**Purpose**: Add all 5 new i18n keys to every locale file. This is a prerequisite for both user stories because `getMessage()` calls in block definitions depend on these keys.

- [X] T001 Add 5 new i18n keys to all 15 locale files in `media/locales/*/messages.js`: `CYBERBRICK_LED_DIGITAL_PREFIX`, `CYBERBRICK_LED_DIGITAL_TOOLTIP`, `CYBERBRICK_LED_DIGITAL_ON`, `CYBERBRICK_LED_DIGITAL_OFF` (after `CYBERBRICK_LED_OFF_TOOLTIP`), and `X11_LED_DIGITAL_TOOLTIP` (after `X11_LED_SET_COLOR_TOOLTIP`)
- [X] T002 Run `npm run validate:i18n` to confirm all 15 locales pass after T001

**Checkpoint**: All 5 keys present in all 15 locales — ready for block and generator work.

---

## Phase 2: User Story 1 — 板載 LED 數位開關控制 (Priority: P1) 🎯 MVP

**Goal**: Deliver the `cyberbrick_led_digital` block with correct MicroPython code generation and toolbox visibility.

**Independent Test**: Drag `cyberbrick_led_digital` into workspace, set R=ON/G=OFF/B=OFF → generated code contains `onboard_led[0] = (255, 0, 0)` and `onboard_led.write()` with correct imports.

### Implementation for User Story 1

- [X] T003 [P] [US1] Add `cyberbrick_led_digital` block definition to `media/blockly/blocks/cyberbrick.js` after the `cyberbrick_led_off` block: single `appendDummyInput` with prefix label + R/G/B FieldDropdown closures using `CYBERBRICK_LED_DIGITAL_*` keys, `setInputsInline(true)`, `setColour(160)`, `setPreviousStatement(true, null)`, `setNextStatement(true, null)`, default ON for all three channels
- [X] T004 [P] [US1] Add `cyberbrick_led_digital` MicroPython generator to `media/blockly/generators/micropython/cyberbrick.js` after `cyberbrick_led_set_color` generator: `addImport('from machine import Pin')`, `addImport('from neopixel import NeoPixel')`, `addHardwareInit('onboard_led', 'onboard_led = NeoPixel(Pin(8), 1)')`, map `getFieldValue('R_STATE') === 'ON' ? 255 : 0` for each channel, return `onboard_led[0] = (r, g, b)\nonboard_led.write()\n`
- [X] T005 [P] [US1] Add `cyberbrick_led_digital` toolbox entry to `media/toolbox/categories/cyberbrick_core.json` after the `cyberbrick_led_off` block entry: `{"kind": "block", "type": "cyberbrick_led_digital"}`

**Checkpoint**: US1 independently functional — `cyberbrick_led_digital` block generates correct ON=255/OFF=0 code, appears in toolbox under CyberBrick board only.

---

## Phase 3: User Story 2 — X11 燈條數位開關控制 (Priority: P2)

**Goal**: Deliver the `x11_led_digital` block supporting D1/D2 PORT selection, 0–3/All INDEX, and per-channel ON/OFF control with correct single-pixel and for-loop code paths.

**Independent Test**: Drag `x11_led_digital`, set PORT=D1/INDEX=0/R=OFF/G=ON/B=OFF → generated code contains `np_d1[0] = (0, 255, 0)` and `np_d1.write()`. Then set INDEX=All → code contains `for i in range(4):` loop.

### Implementation for User Story 2

- [X] T006 [US2] Add `getDigitalStateOptions()` helper function to `media/blockly/blocks/x11.js` following the same pattern as `getX11LedIndexOptions()`: returns `[[getMessage('CYBERBRICK_LED_DIGITAL_ON', 'ON'), 'ON'], [getMessage('CYBERBRICK_LED_DIGITAL_OFF', 'OFF'), 'OFF']]`
- [X] T007 [US2] Add `x11_led_digital` block definition to `media/blockly/blocks/x11.js` after `x11_led_set_color` block (depends on T006): single `appendDummyInput` reusing `X11_LED_PORT_OPTIONS` for PORT (default `'21'`), `getX11LedIndexOptions()` for INDEX (default `'0'`), `X11_LED_SET_COLOR_PREFIX` / `X11_LED_SET_COLOR_INDEX` / `X11_LED_SET_COLOR_INDEX_SUFFIX` labels, `getDigitalStateOptions()` for R_STATE/G_STATE/B_STATE, `setInputsInline(true)`, `setColour(180)`, `setPreviousStatement(true, null)`, `setNextStatement(true, null)`
- [X] T008 [P] [US2] Add `x11_led_digital` MicroPython generator to `media/blockly/generators/micropython/x11.js` after `x11_led_set_color` generator: read PORT/INDEX/R_STATE/G_STATE/B_STATE fields; `addImport` for Pin and NeoPixel; `addHardwareInit` for `np_d1` or `np_d2` based on PORT value; map state → `255`/`0`; emit `for i in range(4): np_<port>[i] = (r, g, b)` when INDEX=`'all'`, else `np_<port>[<index>] = (r, g, b)`; always emit `np_<port>.write()`
- [X] T009 [P] [US2] Add `x11_led_digital` toolbox entry to `media/toolbox/categories/cyberbrick_x11.json` after the `x11_led_set_color` block entry: `{"kind": "block", "type": "x11_led_digital"}`

**Checkpoint**: US2 independently functional — `x11_led_digital` generates correct single-pixel and for-loop code for both D1 and D2.

---

## Note: User Story 3 — 教學對比體驗 (Priority: P3)

**No additional implementation tasks.** US3 acceptance criteria are fully satisfied when US1 and US2 are complete:

- AC1 (digital vs analogue coexistence): Both blocks output 0/255 vs arbitrary values — verified by placing both blocks in the same workspace after US1+US2 complete.
- AC2 (no number input possible): FieldDropdown prevents arbitrary number entry by design — inherent to the block type chosen in US1/US2 implementation.

US3 manual verification is included in the Polish phase (T012/T013).

---

## Phase 4: Polish & Validation

**Purpose**: Final validation across all acceptance scenarios and toolbox filtering.

- [X] T010 Run `npm run validate:i18n` (final confirmation — all 15 locales × 5 new keys pass)
- [X] T011 [P] Manual WebView test — `cyberbrick_led_digital` scenarios per [quickstart.md](quickstart.md) checklist items 1–6: toolbox visibility, R=ON/G=OFF/B=OFF → `(255, 0, 0)`, all ON → `(255, 255, 255)`, all OFF → `(0, 0, 0)` (spec SC-001, SC-003)
- [X] T012 [P] Manual WebView test — `x11_led_digital` scenarios per [quickstart.md](quickstart.md) checklist items 7–11: D1/INDEX=0 (displayed as "1")/all ON → single-pixel code `np_d1[0] = (255, 255, 255)`; INDEX=All → for-loop; D2 → np_d2 variable; toolbox visibility under X11 board (spec SC-001, SC-003, SC-004)
- [X] T013 Manual WebView test — teaching contrast and board switching per [quickstart.md](quickstart.md) item 12: both blocks coexist in workspace with correct 0/255 vs analogue values; switch to Arduino board → both blocks disappear from toolbox (spec SC-003, SC-005, US3)

---

## Dependency Graph

```
T001 (i18n keys)
  └─ T002 (validate:i18n)
  ├─ T003 [P] (cyberbrick_led_digital block def)  ─┐
  ├─ T004 [P] (cyberbrick_led_digital generator)   ├─ [US1 checkpoint] ─ T011
  ├─ T005 [P] (cyberbrick_core.json toolbox)      ─┘
  ├─ T006 (getDigitalStateOptions helper)
  │    └─ T007 (x11_led_digital block def)        ─┐
  ├─ T008 [P] (x11_led_digital generator)          ├─ [US2 checkpoint] ─ T012
  └─ T009 [P] (cyberbrick_x11.json toolbox)       ─┘
                                                        T013 (sequential: after T011+T012)
T010 (validate:i18n final) — can run any time after T001
```

**Story completion order**: US1 (T003–T005) is independent of US2 (T006–T009). Both depend on Phase 1 i18n only.

---

## Parallel Execution Examples

### After T001 completes — all of the following can start simultaneously:

```
Agent A: T003 → edit media/blockly/blocks/cyberbrick.js
Agent B: T004 → edit media/blockly/generators/micropython/cyberbrick.js
Agent C: T005 → edit media/toolbox/categories/cyberbrick_core.json
Agent D: T006 → edit media/blockly/blocks/x11.js (then T007 sequentially)
Agent E: T008 → edit media/blockly/generators/micropython/x11.js
Agent F: T009 → edit media/toolbox/categories/cyberbrick_x11.json
```

### After US1 and US2 checkpoints — Polish phase parallelizes:

```
Agent A: T011 → manual test cyberbrick_led_digital
Agent B: T012 → manual test x11_led_digital
Agent C: T013 → manual test board switching + contrast (sequential: after T011 and T012 both complete)
```

---

## Implementation Strategy

**MVP Scope** (Phase 1 + Phase 2 only):  
Complete T001–T005 → `cyberbrick_led_digital` is fully functional for P1 teaching scenarios. This satisfies User Story 1 end-to-end independently.

**Incremental Delivery**:
1. Phase 1 (T001–T002): i18n foundation — no visible user impact but required for correctness
2. Phase 2 (T003–T005): US1 complete — board LED digital control ready
3. Phase 3 (T006–T009): US2 complete — X11 strip digital control ready
4. Phase 4 (T010–T013): Validated and shippable

**Total tasks**: 13  
**Tasks by story**: Setup=2, US1=3, US2=4, Polish=4  
**Parallel opportunities**: 6 tasks can execute concurrently after T001
