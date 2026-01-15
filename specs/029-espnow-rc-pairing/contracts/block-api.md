# API Contracts: ESP-NOW RC 積木生成器介面

**Version**: 1.0.0 | **Date**: 2026-01-15

## 積木定義契約 (Block Definitions)

### rc_espnow_master_init

```javascript
Blockly.Blocks['rc_espnow_master_init'] = {
	init: function () {
		// Statement block with no connections before/after
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);

		// Fields
		this.appendDummyInput().appendField(getMessage('RC_ESPNOW_MASTER_INIT')).appendField(getMessage('RC_ESPNOW_MASTER_INIT_PAIR_ID')).appendField(new Blockly.FieldNumber(1, 1, 255, 1), 'PAIR_ID').appendField(getMessage('RC_ESPNOW_MASTER_INIT_CHANNEL')).appendField(new Blockly.FieldNumber(1, 1, 11, 1), 'CHANNEL');
	},
};
```

**Required Fields**:
| Field | Type | Default | Min | Max |
|-------|------|---------|-----|-----|
| PAIR_ID | FieldNumber | 1 | 1 | 255 |
| CHANNEL | FieldNumber | 1 | 1 | 11 |

---

### rc_espnow_slave_init

```javascript
Blockly.Blocks['rc_espnow_slave_init'] = {
	init: function () {
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);

		this.appendDummyInput().appendField(getMessage('RC_ESPNOW_SLAVE_INIT')).appendField(getMessage('RC_ESPNOW_SLAVE_INIT_PAIR_ID')).appendField(new Blockly.FieldNumber(1, 1, 255, 1), 'PAIR_ID').appendField(getMessage('RC_ESPNOW_SLAVE_INIT_CHANNEL')).appendField(new Blockly.FieldNumber(1, 1, 11, 1), 'CHANNEL');
	},
};
```

---

### rc_espnow_send

```javascript
Blockly.Blocks['rc_espnow_send'] = {
	init: function () {
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);

		this.appendDummyInput().appendField(getMessage('RC_ESPNOW_SEND'));
	},
};
```

---

### rc_espnow_wait_connection

```javascript
Blockly.Blocks['rc_espnow_wait_connection'] = {
	init: function () {
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(160);

		this.appendDummyInput().appendField(getMessage('RC_ESPNOW_WAIT_CONNECTION')).appendField(getMessage('RC_ESPNOW_WAIT_TIMEOUT')).appendField(new Blockly.FieldNumber(30, 1, 60, 1), 'TIMEOUT').appendField(getMessage('RC_ESPNOW_WAIT_SECONDS'));
	},
};
```

**Required Fields**:
| Field | Type | Default | Min | Max |
|-------|------|---------|-----|-----|
| TIMEOUT | FieldNumber | 30 | 1 | 60 |

---

### rc_espnow_is_connected

```javascript
Blockly.Blocks['rc_espnow_is_connected'] = {
	init: function () {
		this.setOutput(true, 'Boolean');
		this.setColour(160);

		this.appendDummyInput().appendField(getMessage('RC_ESPNOW_IS_CONNECTED'));
	},
};
```

---

### rc_espnow_get_joystick

```javascript
Blockly.Blocks['rc_espnow_get_joystick'] = {
	init: function () {
		this.setOutput(true, 'Number');
		this.setColour(160);

		this.appendDummyInput().appendField(getMessage('RC_ESPNOW_GET_JOYSTICK_PREFIX')).appendField(new Blockly.FieldDropdown(JOYSTICK_CHANNELS), 'CHANNEL');
	},
};

const JOYSTICK_CHANNELS = [
	['L1', '0'],
	['L2', '1'],
	['L3', '2'],
	['R1', '3'],
	['R2', '4'],
	['R3', '5'],
];
```

---

## 程式碼生成器契約 (Code Generators)

### MicroPython Generator Interface

所有生成器必須遵循以下介面：

```typescript
interface MicroPythonGeneratorBlock {
	// Statement blocks return code string with newline
	(block: Blockly.Block): string;

	// Value blocks return [code, order] tuple
	(block: Blockly.Block): [string, number];
}

interface GeneratorHelpers {
	addImport(statement: string): void;
	addHardwareInit(key: string, code: string): void;
	valueToCode(block: Blockly.Block, name: string, order: number): string;
	ORDER_NONE: number;
	ORDER_MEMBER: number;
	ORDER_RELATIONAL: number;
}
```

### 生成程式碼規格

#### rc_espnow_master_init Generator

**Required Imports**:

```python
import network
import espnow
import struct
import time
import rc_module
```

**Required Hardware Init** (key: `espnow_master`):

```python
_rc_pair_mac = b'\x02\x00\x00\x00\x00\x{PAIR_ID:02x}'
_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.config(channel={CHANNEL})
_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.add_peer(_rc_pair_mac, channel={CHANNEL})
rc_module.rc_master_init()
```

**Generated Statement**: (empty, all code in hardware init)

---

#### rc_espnow_send Generator

**Generated Statement**:

```python
_data = rc_module.rc_master_data() or (2048,)*6 + (1,)*4
_espnow.send(_rc_pair_mac, struct.pack('10h', *_data))
time.sleep_ms(20)
```

---

#### rc_espnow_slave_init Generator

**Required Imports**:

```python
import network
import espnow
import struct
import time
from machine import Pin
from neopixel import NeoPixel
```

**Required Hardware Init** (key: `espnow_slave`):

```python
_rc_pair_mac = b'\x02\x00\x00\x00\x00\x{PAIR_ID:02x}'
_rc_data = (2048, 2048, 2048, 2048, 2048, 2048, 1, 1, 1, 1)
_rc_connected = False
_rc_last_recv = 0

def _rc_recv_cb(e):
    global _rc_data, _rc_connected, _rc_last_recv
    while True:
        mac, msg = e.irecv(0)
        if mac is None:
            return
        if mac == _rc_pair_mac and len(msg) == 20:
            _rc_data = struct.unpack('10h', msg)
            _rc_connected = True
            _rc_last_recv = time.ticks_ms()

_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.config(channel={CHANNEL})
_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.add_peer(_rc_pair_mac, channel={CHANNEL})
_espnow.irq(_rc_recv_cb)
```

---

#### rc_espnow_wait_connection Generator

**Generated Statement**:

```python
_led_wait = NeoPixel(Pin(8), 1)
_wait_start = time.ticks_ms()
while not _rc_connected and time.ticks_diff(time.ticks_ms(), _wait_start) < {TIMEOUT * 1000}:
    _led_wait[0] = (0, 0, 50)
    _led_wait.write()
    time.sleep_ms(250)
    _led_wait[0] = (0, 0, 0)
    _led_wait.write()
    time.sleep_ms(250)
_led_wait[0] = (0, 0, 0)
_led_wait.write()
```

---

#### rc_espnow_is_connected Generator

**Generated Expression**:

```python
(time.ticks_diff(time.ticks_ms(), _rc_last_recv) < 500 if _rc_connected else False)
```

**Return Order**: `ORDER_RELATIONAL`

---

#### rc_espnow_get_joystick Generator

**Generated Expression**:

```python
(_rc_data[{CHANNEL}] if _rc_connected else 2048)
```

**Return Order**: `ORDER_MEMBER`

---

## Toolbox Category Contract

**File**: `media/toolbox/categories/cyberbrick_rc_espnow.json`

```json
{
	"kind": "category",
	"name": "%{CATEGORY_RC_ESPNOW}",
	"colour": "160",
	"contents": [
		{
			"kind": "label",
			"text": "%{RC_ESPNOW_LABEL_MASTER}"
		},
		{
			"kind": "block",
			"type": "rc_espnow_master_init",
			"fields": {
				"PAIR_ID": 1,
				"CHANNEL": 1
			}
		},
		{
			"kind": "block",
			"type": "rc_espnow_send"
		},
		{
			"kind": "label",
			"text": "%{RC_ESPNOW_LABEL_SLAVE}"
		},
		{
			"kind": "block",
			"type": "rc_espnow_slave_init",
			"fields": {
				"PAIR_ID": 1,
				"CHANNEL": 1
			}
		},
		{
			"kind": "block",
			"type": "rc_espnow_wait_connection",
			"fields": {
				"TIMEOUT": 30
			}
		},
		{
			"kind": "label",
			"text": "%{RC_ESPNOW_LABEL_DATA}"
		},
		{
			"kind": "block",
			"type": "rc_espnow_get_joystick"
		},
		{
			"kind": "block",
			"type": "rc_espnow_get_joystick_mapped",
			"inputs": {
				"MIN": {
					"shadow": {
						"type": "math_number",
						"fields": { "NUM": -100 }
					}
				},
				"MAX": {
					"shadow": {
						"type": "math_number",
						"fields": { "NUM": 100 }
					}
				}
			}
		},
		{
			"kind": "block",
			"type": "rc_espnow_is_button_pressed"
		},
		{
			"kind": "label",
			"text": "%{RC_ESPNOW_LABEL_STATUS}"
		},
		{
			"kind": "block",
			"type": "rc_espnow_is_connected"
		}
	]
}
```
