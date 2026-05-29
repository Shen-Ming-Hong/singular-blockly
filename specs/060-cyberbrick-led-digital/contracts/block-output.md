# Block Output Contract: CyberBrick LED Digital Control Blocks

**Feature**: 060-cyberbrick-led-digital  
**Date**: 2026-05-29

---

## cyberbrick_led_digital

### Required Imports

```python
from machine import Pin
from neopixel import NeoPixel
```

Registered via `generator.addImport(...)`. Deduplicated automatically by the generator runtime.

### Required Hardware Init

```python
onboard_led = NeoPixel(Pin(8), 1)
```

Registered via `generator.addHardwareInit('onboard_led', 'onboard_led = NeoPixel(Pin(8), 1)')`.  
Emitted once before the main loop body, even if the block appears multiple times.

### Generated Code Per Invocation

```
onboard_led[0] = (<R>, <G>, <B>)
onboard_led.write()
```

Where `<R>`, `<G>`, `<B>` are integer literals — always exactly `255` (ON) or `0` (OFF).

### Concrete Examples

| R_STATE | G_STATE | B_STATE | Output |
|---------|---------|---------|--------|
| ON      | ON      | ON      | `onboard_led[0] = (255, 255, 255)\nonboard_led.write()` |
| ON      | OFF     | OFF     | `onboard_led[0] = (255, 0, 0)\nonboard_led.write()` |
| OFF     | OFF     | OFF     | `onboard_led[0] = (0, 0, 0)\nonboard_led.write()` |

---

## x11_led_digital

### Required Imports

```python
from machine import Pin
from neopixel import NeoPixel
```

### Required Hardware Init (PORT-dependent)

| PORT | Init code |
|------|-----------|
| D1 (`'21'`) | `np_d1 = NeoPixel(Pin(21), 4)` |
| D2 (`'20'`) | `np_d2 = NeoPixel(Pin(20), 4)` |

Key: `'np_d1'` or `'np_d2'` (matches the init variable name).

### Generated Code — Single Index (INDEX ≠ `'all'`)

```
np_<portName>[<index>] = (<R>, <G>, <B>)
np_<portName>.write()
```

**Example** — PORT=D1, INDEX=2, R=ON, G=ON, B=OFF:
```python
np_d1[2] = (255, 255, 0)
np_d1.write()
```

### Generated Code — All Index (INDEX = `'all'`)

```
for i in range(4):
    np_<portName>[i] = (<R>, <G>, <B>)
np_<portName>.write()
```

**Example** — PORT=D2, INDEX=All, R=OFF, G=ON, B=OFF:
```python
for i in range(4):
    np_d2[i] = (0, 255, 0)
np_d2.write()
```

---

## Invariants

1. `<R>`, `<G>`, `<B>` are always integer literals `255` or `0` — never expressions or variables.
2. No `max()`/`min()` clamping is emitted (values are statically known).
3. `write()` is always emitted after pixel assignment(s).
4. Hardware init is always registered before the main code body executes.
5. Only `from machine import Pin` and `from neopixel import NeoPixel` are imported — no additional imports.
6. For `x11_led_digital`, the `portName` is always `d1` (PORT=21) or `d2` (PORT=20) — no other values.
