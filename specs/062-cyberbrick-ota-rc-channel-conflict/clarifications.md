# Clarifications

## 已詢問問題

1. `CYBERBRICK_OTA_RC_CHANNEL_NOTE` 應顯示於哪個既有 UI surface？
2. `_rc_should_keep_wifi_for_ota()` 在 try/except 捕捉到例外時應回傳什麼值？

## 使用者答案

1. **OTA provisioning 成功完成後的通知或提示訊息**（Option A）。已更新 FR-014。
2. **`False`（安全降級）**：例外時讓 RC 正常設定 channel，OTA 暫時不可用。已更新 FR-011。

## 剩餘模糊點

無。

## 是否阻塞 plan

無阻塞釐清。
