/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick RC 遙控通訊 MicroPython 程式碼生成器
 * 使用 ESP-NOW 協定與直接硬體存取（不依賴 rc_module）
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (rc.js)');
		return;
	}

	// === 發射端初始化 ===
	generator.forBlock['rc_master_init'] = function (block) {
		// 取得參數
		const pairId = Math.max(1, Math.min(255, Number(block.getFieldValue('PAIR_ID')) || 1));
		const channel = Math.max(1, Math.min(11, Number(block.getFieldValue('CHANNEL')) || 1));

		// 添加 import
		generator.addImport('import network');
		generator.addImport('import espnow');
		generator.addImport('import struct');
		generator.addImport('import time');
		generator.addImport('from machine import Pin');
		generator.addImport('from neopixel import NeoPixel');

		// 添加硬體初始化 (使用廣播模式，配對 ID 內嵌於資料封包)
		// 關鍵：必須先 disconnect() 再設定 channel
		// 最佳實踐：增加 rxbuf 大小以避免 NO_MEM 錯誤
		generator.addHardwareInit(
			'espnow_master',
			`_rc_pair_id = ${pairId}
_rc_broadcast = b'\\xff\\xff\\xff\\xff\\xff\\xff'
_rc_led = NeoPixel(Pin(8), 1)
_rc_send_fail_count = 0
_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.disconnect()
_wlan.config(reconnects=0)  # 禁止自動重連避免頻道掃描干擾 ESP-NOW
time.sleep_ms(100)
_wlan.config(channel=${channel})
_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.config(rxbuf=1024)
_espnow.add_peer(_rc_broadcast)`
		);

		return '';
	};

	// === 發送資料 ===
	generator.forBlock['rc_send'] = function (block) {
		// 使用 X12 直接硬體存取（不使用 rc_module，與 ESP-NOW 完全相容）
		generator.addImport('from machine import Pin, ADC');

		// 確保 X12 初始化 (使用與 x12.js 相同的 key 避免重複)
		generator.addHardwareInit(
			'x12_driver',
			`# X12 驅動初始化 (直接硬體存取)
_x12_adc = {}
for _i, _p in enumerate([0, 1, 2, 3, 4, 5]):
    _x12_adc[_i] = ADC(Pin(_p))
    _x12_adc[_i].atten(ADC.ATTN_11DB)
_x12_btn = {6: Pin(6, Pin.IN, Pin.PULL_UP), 7: Pin(7, Pin.IN, Pin.PULL_UP), 8: Pin(21, Pin.IN, Pin.PULL_UP), 9: Pin(20, Pin.IN, Pin.PULL_UP)}
def _x12_read():
    return tuple(_x12_adc[i].read() for i in range(6)) + tuple(_x12_btn[i].value() for i in [6,7,8,9])`
		);

		// 生成程式碼：讀取 X12 資料、打包（含配對 ID）、廣播發送
		// 最佳實踐：
		// 1. 發送失敗時延遲重試（ESP-NOW 緩衝區可能暫時滿）
		// 2. 連續失敗多次時重新初始化 ESP-NOW
		// 3. LED 回饋：綠色=發送成功，紅色=發送失敗
		const code = `global _rc_send_fail_count
_data = _x12_read()
try:
    if _espnow.send(_rc_broadcast, struct.pack('<B10h', _rc_pair_id, *_data)):
        _rc_led[0] = (0, 20, 0)
        _rc_send_fail_count = 0
    else:
        _rc_led[0] = (50, 20, 0)
        _rc_send_fail_count += 1
except OSError as e:
    _rc_led[0] = (50, 0, 0)
    _rc_send_fail_count += 1
    if _rc_send_fail_count > 10:
        _espnow.active(False)
        time.sleep_ms(50)
        _espnow.active(True)
        _espnow.add_peer(_rc_broadcast)
        _rc_send_fail_count = 0
    time.sleep_ms(5)
_rc_led.write()
time.sleep_ms(20)
_rc_led[0] = (0, 0, 0)
_rc_led.write()
`;
		return code;
	};

	// === 接收端初始化 ===
	generator.forBlock['rc_slave_init'] = function (block) {
		// 取得參數
		const pairId = Math.max(1, Math.min(255, Number(block.getFieldValue('PAIR_ID')) || 1));
		const channel = Math.max(1, Math.min(11, Number(block.getFieldValue('CHANNEL')) || 1));

		// 添加 import
		generator.addImport('import network');
		generator.addImport('import espnow');
		generator.addImport('import struct');
		generator.addImport('import time');
		generator.addImport('import gc');
		generator.addImport('from machine import Pin');
		generator.addImport('from neopixel import NeoPixel');

		// 添加硬體初始化 (使用廣播接收，過濾配對 ID)
		// 封包格式: 1 byte pair_id + 10 shorts (21 bytes total)
		// 關鍵：必須先 disconnect() 再設定 channel
		// 最佳實踐：
		// 1. 增加 rxbuf 大小以避免封包遺失
		// 2. irq callback 加入 try-except 防止異常導致系統卡死
		// 3. 定期垃圾回收避免記憶體耗盡
		// 4. 長時間斷線後自動重新初始化 ESP-NOW
		generator.addHardwareInit(
			'espnow_slave',
			`_rc_pair_id = ${pairId}
_rc_channel = ${channel}
_rc_data = (2048, 2048, 2048, 2048, 2048, 2048, 1, 1, 1, 1)
_rc_connected = False
_rc_last_recv = 0
_rc_recv_count = 0
_rc_last_gc = 0

def _rc_recv_cb(e):
    global _rc_data, _rc_connected, _rc_last_recv, _rc_recv_count
    try:
        while True:
            mac, msg = e.irecv(0)
            if mac is None:
                return
            # 檢查封包長度 (>= 21 bytes) 和配對 ID
            if len(msg) >= 21 and msg[0] == _rc_pair_id:
                _rc_data = struct.unpack('<10h', msg[1:21])
                _rc_connected = True
                _rc_last_recv = time.ticks_ms()
                _rc_recv_count += 1
    except Exception:
        pass  # 防止 irq 異常導致系統卡死

def _rc_maintenance():
    """定期維護：垃圾回收 + 斷線重連，回傳連線狀態"""
    global _rc_last_gc, _rc_connected, _espnow
    now = time.ticks_ms()
    # 每 30 秒執行一次垃圾回收
    if time.ticks_diff(now, _rc_last_gc) > 30000:
        gc.collect()
        _rc_last_gc = now
    # 斷線超過 5 秒，嘗試重新初始化 ESP-NOW
    if _rc_connected and time.ticks_diff(now, _rc_last_recv) > 5000:
        try:
            _espnow.active(False)
            time.sleep_ms(100)
            _espnow.active(True)
            _espnow.config(rxbuf=1024)
            _espnow.irq(_rc_recv_cb)
            _rc_connected = False
        except Exception:
            pass
    # 回傳連線狀態 (1000ms 內有收到資料，避免偶發延遲誤判)
    return _rc_connected and time.ticks_diff(now, _rc_last_recv) < 1000

_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.disconnect()
_wlan.config(reconnects=0)  # 禁止自動重連避免頻道掃描干擾 ESP-NOW
time.sleep_ms(100)
_wlan.config(channel=${channel})
_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.config(rxbuf=1024)
_espnow.irq(_rc_recv_cb)
_rc_last_gc = time.ticks_ms()`
		);

		return '';
	};

	// === 等待配對 ===
	generator.forBlock['rc_wait_connection'] = function (block) {
		// 取得參數
		const timeout = Math.max(1, Math.min(60, Number(block.getFieldValue('TIMEOUT')) || 30));
		const timeoutMs = timeout * 1000;

		// 生成程式碼：LED 閃爍等待
		const code = `_led_wait = NeoPixel(Pin(8), 1)
_wait_start = time.ticks_ms()
while not _rc_connected and time.ticks_diff(time.ticks_ms(), _wait_start) < ${timeoutMs}:
    _led_wait[0] = (0, 0, 50)
    _led_wait.write()
    time.sleep_ms(250)
    _led_wait[0] = (0, 0, 0)
    _led_wait.write()
    time.sleep_ms(250)
_led_wait[0] = (0, 0, 0)
_led_wait.write()
`;
		return code;
	};

	// === 是否已連線 ===
	generator.forBlock['rc_is_connected'] = function (block) {
		// 生成程式碼：檢查連線狀態 (500ms 超時)
		// _rc_maintenance() 會自動執行垃圾回收和斷線重連，並回傳連線狀態
		const code = '_rc_maintenance()';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	// === 讀取遠端搖桿值 ===
	generator.forBlock['rc_get_joystick'] = function (block) {
		// 取得參數
		const channel = block.getFieldValue('CHANNEL');

		// 生成程式碼 (含安全預設值 - 搖桿中點 2048)
		const code = `(_rc_data[${channel}] if _rc_connected else 2048)`;
		return [code, generator.ORDER_MEMBER];
	};

	// === 讀取並映射遠端搖桿值 ===
	generator.forBlock['rc_get_joystick_mapped'] = function (block) {
		// 取得參數
		const channel = block.getFieldValue('CHANNEL');
		const min = generator.valueToCode(block, 'MIN', generator.ORDER_NONE) || '-100';
		const max = generator.valueToCode(block, 'MAX', generator.ORDER_NONE) || '100';

		// 生成程式碼 (線性映射: 0-4095 → min-max)
		// 斷線時回傳映射後的中點值
		const code = `(int((${min}) + (_rc_data[${channel}] - 0) * ((${max}) - (${min})) / 4095) if _rc_connected else int(((${min}) + (${max})) / 2))`;
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	// === 檢查遠端按鈕是否按下 ===
	generator.forBlock['rc_is_button_pressed'] = function (block) {
		// 取得參數 (按鈕 index: 0-3 對應 K1-K4，資料 index 為 6-9)
		const buttonIndex = Number(block.getFieldValue('BUTTON'));
		const dataIndex = 6 + buttonIndex;

		// 生成程式碼 (0=按下 轉換為 True)
		const code = `(_rc_data[${dataIndex}] == 0 if _rc_connected else False)`;
		return [code, generator.ORDER_RELATIONAL];
	};

	// === 讀取遠端按鈕狀態 ===
	generator.forBlock['rc_get_button'] = function (block) {
		// 取得參數 (按鈕 index: 0-3 對應 K1-K4，資料 index 為 6-9)
		const buttonIndex = Number(block.getFieldValue('BUTTON'));
		const dataIndex = 6 + buttonIndex;

		// 生成程式碼 (原始狀態: 0=按下, 1=放開)
		const code = `(_rc_data[${dataIndex}] if _rc_connected else 1)`;
		return [code, generator.ORDER_MEMBER];
	};

	// 記錄載入訊息
	console.log('[blockly] RC MicroPython 生成器已載入');
})();
