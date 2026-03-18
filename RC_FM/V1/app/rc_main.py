# === CyberBrick MicroPython ===
# Generated: 2026-02-11T00:25:05.522Z

# [1] Imports
from bbl.motors import MotorsController
from bbl.servos import ServosController
from machine import Pin
from neopixel import NeoPixel
import espnow
import gc
import network
import struct
import time

# [2] Hardware Initialization
_rc_pair_id = 1
_rc_channel = 1
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
_wlan.config(channel=1)
_espnow = espnow.ESPNow()
_espnow.active(True)
_espnow.config(rxbuf=1024)
_espnow.irq(_rc_recv_cb)
_rc_last_gc = time.ticks_ms()
motors = MotorsController()
np_d2 = NeoPixel(Pin(20), 4)
onboard_led = NeoPixel(Pin(8), 1)
servos = ServosController()

# [3] Global Variables
fw_bw = None
L_R = None
kick_ball = None

# [4] User Functions
def mainloop():
    global fw_bw, L_R, kick_ball
    if (_rc_data[6] == 0 if _rc_connected else False):
        LED(255, 255, 0)
        time.sleep_ms(200)
        LED(0, 0, 0)
        time.sleep_ms(200)
        LED(255, 255, 0)
        time.sleep_ms(200)
        LED(0, 0, 0)
        time.sleep_ms(200)
    fw_bw = -(int((-2048) + (_rc_data[2] - 0) * ((2048) - (-2048)) / 4095) if _rc_connected else int(((-2048) + (2048)) / 2))
    L_R = (int((-2048) + (_rc_data[1] - 0) * ((2048) - (-2048)) / 4095) if _rc_connected else int(((-2048) + (2048)) / 2))
    kick_ball = (int((100) + (_rc_data[3] - 0) * ((-100) - (100)) / 4095) if _rc_connected else int(((100) + (-100)) / 2))
    if (fw_bw <= 200 and fw_bw >= -200) and (L_R <= 200 and L_R >= -200):
        LED(0, 0, 0)
        motors.set_speed(1, max(-2048, min(2048, 0)))
        motors.set_speed(2, max(-2048, min(2048, 0)))
    else:
        LED(255, 255, 255)
        motors.set_speed(1, max(-2048, min(2048, fw_bw + L_R)))
        motors.set_speed(2, max(-2048, min(2048, -fw_bw + L_R)))
    if kick_ball <= 20 and kick_ball >= -20:
        servos.set_speed(1, max(-100, min(100, 0)))
    else:
        servos.set_speed(1, max(-100, min(100, kick_ball)))
        LED(255, 0, 255)
        time.sleep_ms(200)
        LED(0, 0, 0)
        time.sleep_ms(200)

def LED(R, G, B):
    np_d2[0] = (max(0, min(255, R)), max(0, min(255, G)), max(0, min(255, B)))
    np_d2.write()
    np_d2[1] = (max(0, min(255, R)), max(0, min(255, G)), max(0, min(255, B)))
    np_d2.write()

# [5] Main Program
def main():
    _led_wait = NeoPixel(Pin(8), 1)
    _wait_start = time.ticks_ms()
    while not _rc_connected and time.ticks_diff(time.ticks_ms(), _wait_start) < 30000:
        _led_wait[0] = (0, 0, 50)
        _led_wait.write()
        time.sleep_ms(250)
        _led_wait[0] = (0, 0, 0)
        _led_wait.write()
        time.sleep_ms(250)
    _led_wait[0] = (0, 0, 0)
    _led_wait.write()
    while True:
        if _rc_maintenance():
            onboard_led[0] = (0, 100, 100)
            onboard_led.write()
            mainloop()
        else:
            onboard_led[0] = (100, 0, 0)
            onboard_led.write()
            motors.set_speed(1, max(-2048, min(2048, 0)))
            motors.set_speed(2, max(-2048, min(2048, 0)))
        time.sleep_ms(10)  # 確保可中斷

# Entry point
if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
