# Research: CyberBrick LED Digital Control Blocks

**Feature**: 060-cyberbrick-led-digital  
**Date**: 2026-05-29  
**Status**: Complete — all clarifications resolved before planning phase

---

## R1: Block Layout for cyberbrick_led_digital

**Decision**: Single `appendDummyInput()` with all fields in one row — prefix label + `'R'` label + `R_STATE` FieldDropdown + `'G'` label + `G_STATE` FieldDropdown + `'B'` label + `B_STATE` FieldDropdown; `setInputsInline(true)`.

**Rationale**: Q1 clarification confirmed inline single-row layout. Mirrors `cyberbrick_led_set_color` inline style but replaces three `appendValueInput` with FieldDropdown widgets. Keeps the block compact and consistent with existing CyberBrick board aesthetics.

**Alternatives considered**: Multi-row with three separate `appendDummyInput` rows (one per channel) — rejected (breaks inline style; inconsistent with other CyberBrick blocks).

---

## R2: i18n Keys for x11_led_digital

**Decision**: Reuse `X11_LED_SET_COLOR_PREFIX`, `X11_LED_SET_COLOR_INDEX`, `X11_LED_SET_COLOR_INDEX_SUFFIX` for PORT/INDEX navigation labels in `x11_led_digital`. Only `X11_LED_DIGITAL_TOOLTIP` is a new X11-specific key.

**Rationale**: Q2 clarification confirmed reuse. The navigation context ("LED strip [port] index [n]…") is semantically identical for both analog-value and digital ON/OFF variants. Reuse avoids translation overhead for 15 locales with no UX gain.

**Alternatives considered**: New `X11_LED_DIGITAL_PREFIX` key — rejected (unnecessary duplication; existing keys are semantically correct for this block as well).

---

## R3: ON/OFF Value Mapping

**Decision**: FieldDropdown stores string values `'ON'` / `'OFF'`. Generator maps `'ON'` → `255`, `'OFF'` → `0`.

**Rationale**: Storing human-readable identifiers decouples display labels from numeric values. Allows full i18n of the `ON`/`OFF` display text via `CYBERBRICK_LED_DIGITAL_ON` / `CYBERBRICK_LED_DIGITAL_OFF` keys, while keeping generator logic simple and stable across locales.

**Alternatives considered**: Store `255`/`0` directly as field values — rejected (display label cannot be i18n'd if value equals label; `'ON'`/`'OFF'` as value is the Blockly convention for boolean-style dropdowns).

---

## R4: No Clamp Needed in Generators

**Decision**: Digital generators do **not** use `max(0, min(255, ...))` clamping.

**Rationale**: `x11_led_set_color` uses clamp because any Number expression can be connected. Digital blocks use FieldDropdown with two fixed values (255 or 0 only) — clamping is dead code that would never execute. Omitting it follows Principle III (Avoid Over-Development).

**Alternatives considered**: Add clamp for defensive coding — rejected (YAGNI; values are always statically known to be exactly 255 or 0).

---

## R5: Default Dropdown Value

**Decision**: Default `R_STATE` = `G_STATE` = `B_STATE` = `'ON'` (all channels ON = white light).

**Rationale**: FR-006 specifies default R=G=B=ON. The first option in the FieldDropdown array is automatically selected as default; placing `'ON'` first achieves this without any extra initialisation code.

---

## R6: Shared ON/OFF Options Pattern

**Decision**: Define `getDigitalStateOptions()` helper in `x11.js` (following `getX11LedIndexOptions()` pattern). In `cyberbrick.js`, use an inline closure — consistent with minimal, self-contained block definitions in that file.

**Rationale**: `getX11LedIndexOptions()` in `x11.js` is the established pattern for dynamic i18n dropdown options. `cyberbrick.js` does not currently have such a helper, so a local closure keeps the file self-contained.

**Alternatives considered**: Shared `getDigitalStateOptions()` in a common utility module — rejected (no such utility module exists; adding one would be over-engineering for two blocks).

---

## R7: Existing Patterns Verified

| Pattern | Source file | Applied to |
|---------|-------------|------------|
| `addImport` + `addHardwareInit` | `micropython/cyberbrick.js` (`cyberbrick_led_set_color`) | Both digital generators |
| `getX11LedIndexOptions()` dynamic dropdown | `x11.js` block definition | `x11_led_digital` INDEX field |
| `X11_LED_PORT_OPTIONS` global | `x11.js` | `x11_led_digital` PORT field |
| `portName` derivation (`np_d1`/`np_d2`) | `micropython/x11.js` | `x11_led_digital` generator |
| `for i in range(4):` for all-index | `micropython/x11.js` (`x11_led_set_color`) | `x11_led_digital` INDEX=`'all'` |
| `window.languageManager.getMessage` | All existing blocks | i18n display text |
| `setColour(160)` | `cyberbrick_led_set_color` | `cyberbrick_led_digital` |
| `setColour(180)` | `x11_led_set_color` | `x11_led_digital` |
