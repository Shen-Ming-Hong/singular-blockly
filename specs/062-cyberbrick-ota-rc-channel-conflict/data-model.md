# Data Model: 修正 CyberBrick OTA 與 RC 遙控的 Wi-Fi Channel 衝突

> Phase 1 output for `specs/062-cyberbrick-ota-rc-channel-conflict`

## 實體分析

本功能不新增持久化實體。所有變更均為執行期邏輯（generated code）與 i18n 文案。

### 受影響的執行期邏輯

| 實體 | 位置 | 變更類型 | 說明 |
|------|------|---------|------|
| `_rc_should_keep_wifi_for_ota()` | 由 `_buildOtaWifiGuard()` 生成，嵌入每份 RC MicroPython 輸出 | 邏輯修改 | 新增 `isconnected()` 判斷；例外時回傳 `False` |
| OTA bootstrap 等待序列 | 由 `buildCyberBrickRcMainOtaBootstrap()` 生成，嵌入 `/app/rc_main.py` | 邏輯延長 | 最多 5 秒雙重條件等待；超時後停止 Wi-Fi 掃描 |

### 受影響的 i18n 實體

| Key | 位置 | 變更類型 | 說明 |
|-----|------|---------|------|
| `RC_SLAVE_INIT_TOOLTIP` | `media/locales/*/messages.js` × 15 | 文案更新 | 加入 channel 配對說明 |
| `RC_MASTER_INIT_TOOLTIP` | `media/locales/*/messages.js` × 15 | 文案更新 | 加入 channel 配對說明 |
| `CYBERBRICK_OTA_RC_CHANNEL_NOTE` | `media/locales/*/messages.js` × 15 | 新增 | OTA provisioning 完成後通知文案 |

## 狀態轉移（Runtime）

```
[OTA bootstrap 啟動]
        │
        ▼
[等待最多 5 秒]
  ├── isconnected() == True  ──→ 提早結束等待
  └── Y[0] > 1（C() 完成） ──→ 提早結束等待
        │ 超時（5 秒）
        ▼
[isconnected() 仍為 False？]
  ├── Yes → disconnect() + reconnects=0
  └── No  → 已連線，保持
        │
        ▼
[main() 執行]
        │
        ▼
[_rc_should_keep_wifi_for_ota() 評估]
  ├── OTA config 存在 AND isconnected() == True  → True  → 保留 AP channel
  └── 其他所有情況 / exception                  → False → RC 設自己的 channel
```

## 驗證規則

- `_rc_should_keep_wifi_for_ota()` 必須是純函式（no side effects）
- `except Exception: return False` 覆蓋所有例外情境
- Bootstrap 的 Wi-Fi 清理程式碼必須以 try/except 包裹，避免例外中斷 `main()` 執行
