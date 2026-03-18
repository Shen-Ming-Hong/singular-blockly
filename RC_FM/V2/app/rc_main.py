# === CyberBrick MicroPython ===
# Generated: 2026-03-18T07:51:15.293Z

# [1] Imports
from machine import Pin
from machine import Pin, ADC
from neopixel import NeoPixel
import espnow
import network
import struct
import time

# [2] Hardware Initialization
_rc_pair_id = 1
_rc_broadcast = b'\xff\xff\xff\xff\xff\xff'
_rc_led = NeoPixel(Pin(8), 1)
_rc_send_fail_count = 0
_wlan = network.WLAN(network.WLAN.IF_STA)
_wlan.active(True)
_wlan.disconnect()
_wlan.config(reconnects=0)  # 禁止自動重連避免頻道掃描干擾 ESP-NOW
time.sleep_ms(100)
_wlan.config(channel=1)
_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.config(rxbuf=1024)
_espnow.add_peer(_rc_broadcast)
# X12 驅動初始化 (直接硬體存取)
_x12_adc = {}
for _i, _p in enumerate([0, 1, 2, 3, 4, 5]):
    _x12_adc[_i] = ADC(Pin(_p))
    _x12_adc[_i].atten(ADC.ATTN_11DB)
_x12_btn = {6: Pin(6, Pin.IN, Pin.PULL_UP), 7: Pin(7, Pin.IN, Pin.PULL_UP), 8: Pin(21, Pin.IN, Pin.PULL_UP), 9: Pin(20, Pin.IN, Pin.PULL_UP)}
def _x12_read():
    return tuple(_x12_adc[i].read() for i in range(6)) + tuple(_x12_btn[i].value() for i in [6,7,8,9])

# [5] Main Program
def main():
    while True:
        global _rc_send_fail_count
        _data = _x12_read()
        try:
            if _espnow.send(_rc_broadcast, struct.pack('<B10h', _rc_pair_id, *_data)):
                _rc_led[0] = (0, 20, 0)
                _rc_send_fail_count = 0
            else:
                _rc_led[0] = (50, 20, 0)
                _rc_send_fail_count += 1
        except OSError:
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

# Entry point
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
