# Quickstart: Implementing LED Digital Blocks

**Feature**: 060-cyberbrick-led-digital  
**Date**: 2026-05-29

---

## Files to Modify

| File | Action |
|------|--------|
| `media/blockly/blocks/cyberbrick.js` | Add `cyberbrick_led_digital` block definition |
| `media/blockly/blocks/x11.js` | Add `getDigitalStateOptions()` helper + `x11_led_digital` block |
| `media/blockly/generators/micropython/cyberbrick.js` | Add `cyberbrick_led_digital` generator |
| `media/blockly/generators/micropython/x11.js` | Add `x11_led_digital` generator |
| `media/toolbox/categories/cyberbrick_core.json` | Add `cyberbrick_led_digital` toolbox entry |
| `media/toolbox/categories/cyberbrick_x11.json` | Add `x11_led_digital` toolbox entry |
| `media/locales/*/messages.js` × 15 | Add 5 new i18n keys to each locale |

---

## Reference Implementations

| New artifact | Copy pattern from |
|---|---|
| `cyberbrick_led_digital` block | `cyberbrick_led_set_color` in `blocks/cyberbrick.js` |
| `x11_led_digital` block | `x11_led_set_color` in `blocks/x11.js` |
| `getDigitalStateOptions()` | `getX11LedIndexOptions()` in `blocks/x11.js` |
| `cyberbrick_led_digital` generator | `cyberbrick_led_set_color` in `generators/micropython/cyberbrick.js` |
| `x11_led_digital` generator | `x11_led_set_color` in `generators/micropython/x11.js` |
| Toolbox entries | existing LED entries in `cyberbrick_core.json` / `cyberbrick_x11.json` |

---

## Key Implementation Notes

### Block definitions

- Use `FieldDropdown` with a closure that calls `getDigitalStateOptions()` for all three state fields.
- `getDigitalStateOptions()` returns:
  ```js
  [
    [window.languageManager.getMessage('CYBERBRICK_LED_DIGITAL_ON', 'ON'), 'ON'],
    [window.languageManager.getMessage('CYBERBRICK_LED_DIGITAL_OFF', 'OFF'), 'OFF'],
  ]
  ```
- `x11_led_digital` reuses `X11_LED_PORT_OPTIONS` (global) for PORT and `getX11LedIndexOptions()` for INDEX.
- All labels wrapped in `window.languageManager.getMessage('KEY', 'fallback')`.

### Generators

- Map field value to integer: `const r = block.getFieldValue('R_STATE') === 'ON' ? 255 : 0;`
- No `valueToCode` calls — all inputs are FieldDropdown, not ValueInput.
- No `max()`/`min()` clamping.

### Toolbox entries

- No `inputs` / shadow blocks needed (FieldDropdown has built-in defaults).
- Insert `cyberbrick_led_digital` after `cyberbrick_led_off` in `cyberbrick_core.json`.
- Insert `x11_led_digital` after `x11_led_set_color` in `cyberbrick_x11.json`.

### i18n order

Add keys immediately after the existing LED block keys for each locale:

In `cyberbrick.js` locale section (after `CYBERBRICK_LED_OFF_TOOLTIP`):
```js
CYBERBRICK_LED_DIGITAL_PREFIX: '...',
CYBERBRICK_LED_DIGITAL_TOOLTIP: '...',
CYBERBRICK_LED_DIGITAL_ON: '...',
CYBERBRICK_LED_DIGITAL_OFF: '...',
```

In `x11.js` locale section (after `X11_LED_SET_COLOR_TOOLTIP`):
```js
X11_LED_DIGITAL_TOOLTIP: '...',
```

---

## Validation Commands

```bash
npm run validate:i18n   # All 15 locales must pass
```

---

## Manual Test Checklist

1. Open VS Code with CyberBrick board selected.
2. Verify `cyberbrick_led_digital` appears in toolbox under LED category.
3. Drag block → default code: `onboard_led[0] = (255, 255, 255)\nonboard_led.write()`.
4. Set B to OFF → code: `onboard_led[0] = (255, 255, 0)\nonboard_led.write()`.
5. Set R=ON, G=OFF, B=OFF → code: `onboard_led[0] = (255, 0, 0)\nonboard_led.write()`. *(US1 AC1 — red)*
6. Set R=OFF, G=OFF, B=OFF → code: `onboard_led[0] = (0, 0, 0)\nonboard_led.write()`. *(US1 AC3 — all off)*
7. Verify `x11_led_digital` appears in toolbox under X11 LED category.
8. Drag block (D1, index 1, all ON) → code: `np_d1[0] = (255, 255, 255)\nnp_d1.write()`.
9. Change INDEX to All → code uses `for i in range(4):` loop.
10. Change PORT to D2 → code uses `np_d2` variable.
11. Set all channels OFF → code emits `(0, 0, 0)`.
12. Switch board to Arduino → both blocks should not appear (MicroPython-only).
