/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

(function () {
	const generator = window.arduinoGenerator;
	const supported = block => window.getCurrentBoard() === 'esp32' && generator.isInAllowedContext(block);

	function addReceiverCode() {
		if (generator.definitions_.esp32RcReceiver) return;
		generator.includes_.esp32RcWifi = '#include <WiFi.h>';
		generator.includes_.esp32RcNow = '#include <esp_now.h>';
		generator.includes_.esp32RcChannel = '#include <esp_wifi.h>';
		generator.definitions_.esp32RcReceiver = `
static portMUX_TYPE _sbRcMux = portMUX_INITIALIZER_UNLOCKED;
static bool _sbRcReady = false;
static bool _sbRcNowInitialized = false;
static uint8_t _sbRcPairId = 1;
static int16_t _sbRcValues[10] = {2048, 2048, 2048, 2048, 2048, 2048, 1, 1, 1, 1};
static uint32_t _sbRcLastReceived = 0;
static bool _sbRcHasPacket = false;

static void _sbRcOnReceive(const uint8_t *mac, const uint8_t *data, int len) {
  (void)mac;
  if (!data || len != 21) return;
  int16_t values[10];
  for (int i = 0; i < 10; ++i) {
    const uint16_t raw = (uint16_t)data[1 + 2 * i] | ((uint16_t)data[2 + 2 * i] << 8);
    values[i] = (int16_t)raw;
    if (i < 6 && (values[i] < 0 || values[i] > 4095)) return;
    if (i >= 6 && values[i] != 0 && values[i] != 1) return;
  }
  portENTER_CRITICAL(&_sbRcMux);
  if (_sbRcReady && data[0] == _sbRcPairId) {
    for (int i = 0; i < 10; ++i) _sbRcValues[i] = values[i];
    _sbRcLastReceived = millis();
    _sbRcHasPacket = true;
  }
  portEXIT_CRITICAL(&_sbRcMux);
}

static bool _sbRcBegin(uint8_t pairId, uint8_t channel) {
  portENTER_CRITICAL(&_sbRcMux);
  _sbRcReady = false;
  _sbRcHasPacket = false;
  _sbRcPairId = pairId;
  portEXIT_CRITICAL(&_sbRcMux);
  if (_sbRcNowInitialized) {
    esp_now_unregister_recv_cb();
    esp_now_deinit();
    _sbRcNowInitialized = false;
  }
  if (!WiFi.mode(WIFI_STA)) return false;
  WiFi.setAutoReconnect(false);
  WiFi.disconnect();
  if (esp_wifi_set_channel(channel, WIFI_SECOND_CHAN_NONE) != ESP_OK) return false;
  if (esp_now_init() != ESP_OK) return false;
  _sbRcNowInitialized = true;
  if (esp_now_register_recv_cb(_sbRcOnReceive) != ESP_OK) {
    esp_now_deinit();
    _sbRcNowInitialized = false;
    return false;
  }
  portENTER_CRITICAL(&_sbRcMux);
  _sbRcReady = true;
  portEXIT_CRITICAL(&_sbRcMux);
  return true;
}

static bool _sbRcSnapshot(int16_t values[10]) {
  portENTER_CRITICAL(&_sbRcMux);
  const bool ready = _sbRcReady;
  const bool hasPacket = _sbRcHasPacket;
  const uint32_t lastReceived = _sbRcLastReceived;
  for (int i = 0; i < 10; ++i) values[i] = _sbRcValues[i];
  portEXIT_CRITICAL(&_sbRcMux);
  return ready && hasPacket && (uint32_t)(millis() - lastReceived) <= 1500;
}

static bool _sbRcConnected() {
  int16_t values[10];
  return _sbRcSnapshot(values);
}

static int _sbRcJoystick(uint8_t channel) {
  int16_t values[10];
  return channel < 6 && _sbRcSnapshot(values) ? values[channel] : 2048;
}

static bool _sbRcButtonPressed(uint8_t button) {
  int16_t values[10];
  return button < 4 && _sbRcSnapshot(values) && values[6 + button] == 0;
}

static long _sbRcJoystickMapped(uint8_t channel, long minimum, long maximum) {
  return minimum + (long)((double)_sbRcJoystick(channel) * (maximum - minimum) / 4095.0);
}
`;
	}

	function valueCode(block, fallback) {
		return generator.valueToCode(block, 'PAIR_ID', generator.ORDER_NONE) || fallback;
	}

	generator.forBlock['esp32_rc_receiver_init'] = function (block) {
		if (!supported(block)) return '// [Skipped] ESP32 RC requires an ESP32 setup/loop context\n';
		addReceiverCode();
		const pairId = valueCode(block, '1');
		const fieldChannel = Number(block.getFieldValue('CHANNEL'));
		const channel = Math.max(1, Math.min(11, Number.isFinite(fieldChannel) ? fieldChannel : 1));
		return `_sbRcBegin((uint8_t)constrain((int)(${pairId}), 1, 255), ${channel});\n`;
	};

	generator.forBlock['esp32_rc_wait_connection'] = function (block) {
		if (!supported(block)) return '// [Skipped] ESP32 RC requires an ESP32 setup/loop context\n';
		addReceiverCode();
		const fieldTimeout = Number(block.getFieldValue('TIMEOUT'));
		const timeout = Math.max(1, Math.min(60, Number.isFinite(fieldTimeout) ? fieldTimeout : 30));
		return `{ const uint32_t _sbRcWaitStart = millis(); while (!_sbRcConnected() && (uint32_t)(millis() - _sbRcWaitStart) < ${timeout * 1000}UL) delay(10); }\n`;
	};

	generator.forBlock['esp32_rc_is_connected'] = function (block) {
		if (!supported(block)) return ['false', generator.ORDER_ATOMIC];
		addReceiverCode();
		return ['_sbRcConnected()', generator.ORDER_FUNCTION_CALL];
	};

	generator.forBlock['esp32_rc_get_joystick'] = function (block) {
		if (!supported(block)) return ['2048', generator.ORDER_ATOMIC];
		addReceiverCode();
		const channel = Number(block.getFieldValue('CHANNEL'));
		return [`_sbRcJoystick(${Number.isInteger(channel) && channel >= 0 && channel < 6 ? channel : 0})`, generator.ORDER_FUNCTION_CALL];
	};

	generator.forBlock['esp32_rc_get_joystick_mapped'] = function (block) {
		if (!supported(block)) return ['0', generator.ORDER_ATOMIC];
		addReceiverCode();
		const channel = Number(block.getFieldValue('CHANNEL'));
		const index = Number.isInteger(channel) && channel >= 0 && channel < 6 ? channel : 0;
		const minimum = generator.valueToCode(block, 'MIN', generator.ORDER_NONE) || '-100';
		const maximum = generator.valueToCode(block, 'MAX', generator.ORDER_NONE) || '100';
		return [`_sbRcJoystickMapped(${index}, (long)(${minimum}), (long)(${maximum}))`, generator.ORDER_FUNCTION_CALL];
	};

	generator.forBlock['esp32_rc_is_button_pressed'] = function (block) {
		if (!supported(block)) return ['false', generator.ORDER_ATOMIC];
		addReceiverCode();
		const button = Number(block.getFieldValue('BUTTON'));
		return [`_sbRcButtonPressed(${Number.isInteger(button) && button >= 0 && button < 4 ? button : 0})`, generator.ORDER_FUNCTION_CALL];
	};
})();
