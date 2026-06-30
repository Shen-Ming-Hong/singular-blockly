# Quickstart: 驗證 RC + OTA Channel 修正

> Phase 1 output for `specs/062-cyberbrick-ota-rc-channel-conflict`

## 前置條件

- 兩台 CyberBrick 裝置
- VS Code + Singular Blockly extension（含本次修正）
- 至少一台裝置已透過 USB 完成 OTA provisioning

## 場景 A — 兩台 OTA + AP 在線（RC 與 OTA 同時正常）

**Setup**:
1. 兩台 CyberBrick 皆已 OTA provisioned，連同一個 Wi-Fi AP

**Steps**:
1. 在 Blockly 中為裝置 A 建立 RC slave 程式（含 `rc_slave_init`，channel 1），OTA 上傳
2. 在 Blockly 中為裝置 B 建立 RC master 程式（含 `rc_master_init`，channel 1），OTA 上傳
3. 兩台裝置重開機

**Expected**:
- 裝置 A 約 3 秒後 RC 連線 LED 亮綠燈
- 遙控動作（搖桿）回應正常
- 重新修改程式並 OTA 上傳至裝置 A → 上傳成功，**不需重置裝置**

---

## 場景 B — 兩台 OTA + AP 不在線（自動退回積木 channel）

**Setup**:
1. 兩台 CyberBrick 皆已 OTA provisioned
2. 關閉 Wi-Fi AP（或帶裝置離開 AP 覆蓋範圍）

**Steps**:
1. 兩台裝置重開機（均執行 RC slave / RC master 程式，channel 1）
2. 等待約 5 秒

**Expected**:
- 兩台裝置均在 ~5 秒後 RC 連線 LED 亮綠燈
- 遙控動作正常（使用積木設定的 channel 1）
- 此時 OTA 不可用（Wi-Fi 已斷開）

---

## 場景 C — 一台 OTA、一台無 OTA，AP 不在線

**Setup**:
- 裝置 A：有 OTA config；裝置 B：無 OTA config
- AP 不在線

**Steps**:
1. 兩台裝置重開機，均執行 channel 1 的 RC 程式

**Expected**:
- 裝置 A 等待 ~5 秒後退回 channel 1
- RC 連線正常

---

## 場景 D — 設計邊界（預期失敗，非 bug）

**Setup**:
- 裝置 A：有 OTA + AP 在線（AP channel 6）
- 裝置 B：無 OTA，未連 AP（設 channel 1）

**Expected**:
- RC 連線失敗（channel 6 vs channel 1 不符）
- 此結果符合設計邊界，**不應視為本次修正的失敗**

---

## 自動化驗證

```bash
# Regression gate（所有現有測試）
npm test

# i18n 完整性（15 個 locale 均已更新）
npm run validate:i18n
```

## Tooltip 驗證

1. 在 Blockly 中拉出 `rc_slave_init` 或 `rc_master_init` 積木
2. 懸停查看 tooltip
3. 確認文字包含「兩台裝置需要在相同 channel」以及 OTA + Wi-Fi channel 的說明

## OTA Note 驗證

1. 在 VS Code CyberBrick 面板中完成 OTA provisioning 流程
2. 確認 provisioning 成功後的通知或提示包含 `CYBERBRICK_OTA_RC_CHANNEL_NOTE` 的文案
