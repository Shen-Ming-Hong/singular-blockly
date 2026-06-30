# Research: 修正 CyberBrick OTA 與 RC 遙控的 Wi-Fi Channel 衝突

> Phase 0 output for `specs/062-cyberbrick-ota-rc-channel-conflict`

## R-001 — Root cause: Bootstrap 提早退出，RC 在 OTA agent 掃描中啟動

**Decision**: 延長 bootstrap 等待至最多 5 秒（50 × 100ms），允許 Wi-Fi 狀態在 `main()` 執行前穩定。

**Rationale**:

目前 bootstrap 只等 500ms（50 × 10ms）偵測 `Y[0] > 1`。但 OTA agent 的 `C()` 函式設計如下：

```python
def C():
    w.connect(N, W)          # 觸發 Wi-Fi 連線（開始掃描）
    for _ in range(40):      # 40 × 0.25s = 最多 10 秒
        if w.isconnected(): return w.ifconfig()[0]
        time.sleep(.25)
    return ''
```

`S()` 裡 `Y[0] = 2` 在 `C()` 完成（連上或超時）後才設定。因此 bootstrap 的 `Y > 1` 等待幾乎必定在 `C()` 還在跑時超時。  
結果：RC init 在 t≈800ms 執行，`C()` 掃描持續到 t≈10s，ESP-NOW 在不穩定頻道上初始化。

**Alternatives considered**:

| 方案 | 拒絕原因 |
|------|---------|
| 等待 `Y[0] > 1`（即等 `C()` 完整跑完，最多 10s）| 每次開機延遲 10s，不可接受 |
| 不等待，只修改 guard 邏輯 | `C()` 掃描仍在 RC init 同時進行，channel 不穩 |
| 縮短 OTA agent `C()` 超時 | 需改 OTA agent body + version bump，超出範圍 |

---

## R-002 — `isconnected()` 雙重確認是充分且正確的修正

**Decision**: `_rc_should_keep_wifi_for_ota()` 改為同時確認 OTA config 存在 AND `_wlan.isconnected()`。

**Rationale**:

當 bootstrap 呼叫 `_wlan.disconnect()` 後：
- `C()` 的剩餘迴圈只剩 `time.sleep(0.25)` + `isconnected()` 檢查（返回 False）
- WiFi driver 停止主動掃描（channel 穩定下來）
- `_wlan.config(reconnects=0)` 防止 ESP-IDF driver 自動重連

因此在 `main()` 執行時，`isconnected()` 的值是可靠的：
- AP 在線 + 連上 → True → RC 用 AP channel
- AP 不在線 / 超時 → False → RC 用積木設定 channel

**Alternatives considered**:

| 方案 | 拒絕原因 |
|------|---------|
| 只在 bootstrap 中 disconnect，不改 guard | RC init 仍用舊 guard（只看 config 檔）→ 可能跳過 channel 設定 |
| 在 `_reinit_espnow()` 動態重查 | 需同步修改 REMOTE master 端，超出最小修正範圍 |

---

## R-003 — ESP-NOW channel 的硬體限制

**Decision**: 接受「STA 連上 AP 時，ESP-NOW channel 由 AP 決定」的硬體事實。

**Rationale**:

ESP32/ESP-IDF 文件明確規定：當 STA 連上 AP 時，ESP-NOW 使用的 RF channel 由 AP 決定，無法獨立設定。因此：
- 兩台裝置都連同一 AP → 同一 channel → ESP-NOW 可通訊 ✅
- 一台連 AP（ch 6），另一台設 ch 1 → channel 不符 → 無法通訊 ❌（設計邊界）

---

## R-004 — Exception fallback: `False` 是安全降級預設值

**Decision**: `_rc_should_keep_wifi_for_ota()` 的 `except Exception` block 回傳 `False`。

**Rationale**:

當 `network` 模組無法 import 或 `isconnected()` 拋出例外時：
- 回傳 `True` → RC 跳過 channel 設定 → RC 可能在未知 channel 失效
- 回傳 `False` → RC 正常設定自己的 channel → 最壞情況是 OTA 暫時不可用

`False` 是安全降級，符合 Constitution Principle I（Simplicity）。

---

## R-005 — OTA agent 版本無需 bump

**Decision**: 不修改 `buildCyberBrickOtaAgentSource()` body，不 bump `CYBERBRICK_OTA_AGENT_TARGET_VERSION`。

**Rationale**:

本修正完全在 host side（bootstrap template + Blockly generator）。OTA agent source 寫入裝置後不受 host-side generator 變更影響。已確認：
- `buildCyberBrickOtaAgentSource()` → 不動
- `CYBERBRICK_OTA_AGENT_TARGET_VERSION` → 不動
- `src/services/cyberbrickOtaUploader.ts` → 不動
