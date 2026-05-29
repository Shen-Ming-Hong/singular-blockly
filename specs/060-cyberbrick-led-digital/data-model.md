# Data Model: CyberBrick LED Digital Control Blocks

**Feature**: 060-cyberbrick-led-digital  
**Date**: 2026-05-29

---

## Block: `cyberbrick_led_digital`

### Fields

| Field ID  | Type          | Stored Values     | Display (EN)  | Default |
|-----------|---------------|-------------------|---------------|---------|
| `R_STATE` | FieldDropdown | `'ON'` / `'OFF'`  | ON / OFF      | `'ON'`  |
| `G_STATE` | FieldDropdown | `'ON'` / `'OFF'`  | ON / OFF      | `'ON'`  |
| `B_STATE` | FieldDropdown | `'ON'` / `'OFF'`  | ON / OFF      | `'ON'`  |

### Block Properties

| Property              | Value                                       |
|-----------------------|---------------------------------------------|
| `setColour`           | `160`                                       |
| `setInputsInline`     | `true`                                      |
| `setPreviousStatement`| `true, null`                                |
| `setNextStatement`    | `true, null`                                |
| Input layout          | Single `appendDummyInput` with all fields   |

### Visual Layout (inline)

```
[ Set onboard LED (digital)  R [ON▾]  G [ON▾]  B [ON▾] ]
```

### Hardware Mapping

| Resource        | Value                               |
|-----------------|-------------------------------------|
| GPIO            | 8                                   |
| NeoPixel count  | 1                                   |
| Init variable   | `onboard_led`                       |
| Init code       | `onboard_led = NeoPixel(Pin(8), 1)` |

---

## Block: `x11_led_digital`

### Fields

| Field ID  | Type          | Stored Values              | Display (EN)                            | Default  |
|-----------|---------------|----------------------------|-----------------------------------------|----------|
| `PORT`    | FieldDropdown | `'21'` (D1) / `'20'` (D2) | D1 / D2                                 | `'21'`   |
| `INDEX`   | FieldDropdown | `'0'`–`'3'` / `'all'`     | 1 / 2 / 3 / 4 / All                    | `'0'`    |
| `R_STATE` | FieldDropdown | `'ON'` / `'OFF'`           | ON / OFF                                | `'ON'`   |
| `G_STATE` | FieldDropdown | `'ON'` / `'OFF'`           | ON / OFF                                | `'ON'`   |
| `B_STATE` | FieldDropdown | `'ON'` / `'OFF'`           | ON / OFF                                | `'ON'`   |

### Block Properties

| Property               | Value                                      |
|------------------------|--------------------------------------------|
| `setColour`            | `180`                                      |
| `setInputsInline`      | `true`                                     |
| `setPreviousStatement` | `true, null`                               |
| `setNextStatement`     | `true, null`                               |
| Input layout           | Single `appendDummyInput` with all fields  |

### Visual Layout (inline)

```
[ LED strip [D1▾]  index [1▾]  set color R  R [ON▾]  G [ON▾]  B [ON▾] ]
```

> Note: "set color R" is the value of `X11_LED_SET_COLOR_INDEX_SUFFIX` in English locale.

### Hardware Mapping

| PORT value | GPIO | NeoPixel count | Init variable | Init code                        |
|------------|------|----------------|---------------|----------------------------------|
| `'21'`     | 21   | 4              | `np_d1`       | `np_d1 = NeoPixel(Pin(21), 4)`   |
| `'20'`     | 20   | 4              | `np_d2`       | `np_d2 = NeoPixel(Pin(20), 4)`   |

---

## State Value Mapping

| Field value | Generator output |
|-------------|-----------------|
| `'ON'`      | `255`           |
| `'OFF'`     | `0`             |

Mapping performed once per field read in the generator function. No intermediate computation or clamping.

---

## i18n Keys

### New Keys (5 total — must be added to all 15 locales)

| Key                          | EN reference value                                    | Used by                    |
|------------------------------|-------------------------------------------------------|----------------------------|
| `CYBERBRICK_LED_DIGITAL_PREFIX`  | `'Set onboard LED (digital)'`                     | `cyberbrick_led_digital`   |
| `CYBERBRICK_LED_DIGITAL_TOOLTIP` | `'Set the onboard LED channels ON or OFF'`        | `cyberbrick_led_digital`   |
| `X11_LED_DIGITAL_TOOLTIP`        | `'Set X11 LED strip channel states ON or OFF'`    | `x11_led_digital`          |
| `CYBERBRICK_LED_DIGITAL_ON`      | `'ON'`                                            | Both blocks (dropdown)     |
| `CYBERBRICK_LED_DIGITAL_OFF`     | `'OFF'`                                           | Both blocks (dropdown)     |

### Reused Keys (no changes to existing locale files for these)

| Key                            | Source block         | Used in `x11_led_digital` as |
|--------------------------------|----------------------|------------------------------|
| `X11_LED_SET_COLOR_PREFIX`     | `x11_led_set_color`  | PORT label prefix            |
| `X11_LED_SET_COLOR_INDEX`      | `x11_led_set_color`  | INDEX label                  |
| `X11_LED_SET_COLOR_INDEX_SUFFIX` | `x11_led_set_color` | Suffix after INDEX dropdown  |
| `X11_LED_INDEX_ALL`            | `x11_led_set_color`  | "All" option in INDEX dropdown |

---

## Entities Summary

```
cyberbrick_led_digital
  ├── field: R_STATE (FieldDropdown, ON/OFF)
  ├── field: G_STATE (FieldDropdown, ON/OFF)
  └── field: B_STATE (FieldDropdown, ON/OFF)

x11_led_digital
  ├── field: PORT   (FieldDropdown, D1=21 / D2=20)
  ├── field: INDEX  (FieldDropdown, 0-3 / all)
  ├── field: R_STATE (FieldDropdown, ON/OFF)
  ├── field: G_STATE (FieldDropdown, ON/OFF)
  └── field: B_STATE (FieldDropdown, ON/OFF)
```
