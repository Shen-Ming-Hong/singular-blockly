# Implementation Plan: 修正 CyberBrick OTA 與 RC 遙控的 Wi-Fi Channel 衝突

**Branch**: `feature/062-cyberbrick-ota-rc-channel-conflict` | **Date**: 2026-06-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/062-cyberbrick-ota-rc-channel-conflict/spec.md`

## Summary

修正 CyberBrick RC 積木在 OTA provisioned 裝置上的 Wi-Fi channel 判斷邏輯。根本原因：`_rc_should_keep_wifi_for_ota()` 只檢查設定檔是否存在（而非 AP 是否已連線），且 OTA agent 啟動的 10 秒 Wi-Fi 掃描（`C()` 函式）在 RC init 執行時仍在進行，造成 ESP-NOW 頻道不穩，RC 遙控失效。

**技術修正**：
1. `buildCyberBrickRcMainOtaBootstrap()` — 延長等待至最多 5 秒（雙重條件：`isconnected()` 提早退出 OR `Y[0] > 1`）；超時後執行 `disconnect()` + `reconnects=0` 停止掃描
2. `_buildOtaWifiGuard()` — 生成的 Python guard 改為同時確認設定檔存在 AND `isconnected()`；例外時回傳 `False`
3. 15 個 locale 更新 `RC_SLAVE_INIT_TOOLTIP`、`RC_MASTER_INIT_TOOLTIP`，新增 `CYBERBRICK_OTA_RC_CHANNEL_NOTE`（顯示於 OTA provisioning 完成後通知）

## Technical Context

**Language/Version**: TypeScript 5.9.3（Extension Host）、JavaScript ES2020（WebView / Blockly generators）、MicroPython（generated device code）

**Primary Dependencies**: Blockly 12.3.1、VS Code `^1.105.0`、Node.js 22.16.0+；CyberBrick device MicroPython `network` API

**Storage**: N/A — 不新增持久化狀態；現有 `ExtensionContext.secrets` 與 workspace settings 不變

**Testing**: Mocha + Sinon + `@vscode/test-electron`；`npm run validate:i18n`

**Target Platform**: VS Code desktop extension + CyberBrick MicroPython device

**Project Type**: VS Code Extension

**Performance Goals**: AP 不在線時，RC channel fallback 在裝置開機後約 5 秒內完成

**Constraints**:
- `buildCyberBrickOtaAgentSource()` body 不得修改
- `CYBERBRICK_OTA_AGENT_TARGET_VERSION` 不得變更
- `src/services/cyberbrickOtaUploader.ts` 不得修改
- 採取最小範圍變更

**Scale/Scope**: 3 個 source 檔案修改 + 15 個 locale 檔案更新

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity & Maintainability | ✅ PASS | 兩個函式局部修改，無新抽象層 |
| II. Modularity & Extensibility | ✅ PASS | 變更局限於 generator 和 bootstrap builder |
| III. Avoid Over-Development | ✅ PASS | 嚴格修正 bug，不新增功能 |
| Security（postMessage / secrets）| ✅ PASS | 不新增 postMessage 路徑，不觸碰 secrets |
| i18n Consistency | ✅ PASS | 15 個 locale 全部同步；`validate:i18n` 作為 gate |

**Post-design re-check**: Phase 1 設計無引入新違規。Complexity Tracking 不需填寫。

## Project Structure

### Documentation (this feature)

```text
specs/062-cyberbrick-ota-rc-channel-conflict/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── rc-ota-guard.md  ← Phase 1 output
└── tasks.md             ← Phase 2 (speckit-tasks, not created by speckit-plan)
```

### Source Code (repository root)

```text
src/services/
└── cyberbrickOtaAgentSource.ts   # [修改] buildCyberBrickRcMainOtaBootstrap()

media/blockly/generators/micropython/
└── rc.js                          # [修改] _buildOtaWifiGuard()（第 38–45 行）

media/locales/
├── bg/messages.js
├── cs/messages.js
├── de/messages.js
├── en/messages.js
├── es/messages.js
├── fr/messages.js
├── hu/messages.js
├── it/messages.js
├── ja/messages.js
├── ko/messages.js
├── pl/messages.js
├── pt-br/messages.js
├── ru/messages.js
├── tr/messages.js
└── zh-hant/messages.js            # [修改] × 15：RC tooltip 更新 + CYBERBRICK_OTA_RC_CHANNEL_NOTE 新增

src/test/suite/
└── cyberbrick-rc-ota-generation.test.ts  # [檢查] 現有測試是否需更新
```

**Structure Decision**: Single project layout。所有變更在現有 extension source tree 內；不新增頂層目錄。

## Phase 0: Research

> **Status: DONE** — 詳見 [research.md](research.md)

**關鍵決策摘要**：
- Bootstrap 延長至最多 5 秒雙重條件等待（`isconnected()` 提早退出 OR `Y[0] > 1`）
- `_rc_should_keep_wifi_for_ota()` 改為同時確認設定檔 AND `isconnected()`
- 例外時回傳 `False`（安全降級）
- OTA agent body 不動，version 不 bump

## Phase 1: Design

> **Status: DONE** — 詳見 [data-model.md](data-model.md)、[contracts/rc-ota-guard.md](contracts/rc-ota-guard.md)、[quickstart.md](quickstart.md)

### 核心實作細節

**`_buildOtaWifiGuard()` 新生成程式碼**（`media/blockly/generators/micropython/rc.js`）：

```python
def _rc_should_keep_wifi_for_ota():
    try:
        import cyberbrick_ota_config as _ota_cfg
        if not (getattr(_ota_cfg, 'SSID', '') and getattr(_ota_cfg, 'OTA_TOKEN', '')):
            return False
        import network as _ota_net
        return _ota_net.WLAN(_ota_net.WLAN.IF_STA).isconnected()
    except Exception:
        return False
```

**`buildCyberBrickRcMainOtaBootstrap()` 追加段落**（`src/services/cyberbrickOtaAgentSource.ts`，置於現有 Y > 1 等待迴圈之後）：

```python
# Wait up to 5s for Wi-Fi state to stabilize
for _singular_blockly_ota_wait_idx in range(50):
    try:
        import network as _singular_blockly_ota_net
        if _singular_blockly_ota_net.WLAN(_singular_blockly_ota_net.STA_IF).isconnected():
            break
    except Exception:
        pass
    if getattr(_singular_blockly_ota_agent, 'Y', [0])[0] > 1:
        break
    _singular_blockly_ota_yield(100)
# Stop Wi-Fi scanning if not connected
try:
    import network as _singular_blockly_ota_net2
    _ota_wlan_cleanup = _singular_blockly_ota_net2.WLAN(_singular_blockly_ota_net2.STA_IF)
    if not _ota_wlan_cleanup.isconnected():
        _ota_wlan_cleanup.disconnect()
        _ota_wlan_cleanup.config(reconnects=0)
except Exception:
    pass
```

### 四個驗收情境

| 情境 | 預期行為 |
|------|---------|
| 兩台 OTA + AP 在線 | RC 用 AP channel；OTA 可直接上傳 ✅ |
| 兩台 OTA + AP 不在線 | ~5 秒後退回積木 channel 1；RC 正常 ✅ |
| 一台 OTA + 一台無 OTA + AP 不在線 | 同上 ✅ |
| 一台 OTA 有 AP + 一台無 OTA 無 AP | RC channel 不符，失敗（設計邊界）⚠️ |

### i18n 更新規格

- `RC_SLAVE_INIT_TOOLTIP`：在現有說明後加入「兩台裝置需使用相同 channel（有 Wi-Fi 時以 AP channel 為準，無 Wi-Fi 時以積木設定值為準）」
- `RC_MASTER_INIT_TOOLTIP`：同上
- `CYBERBRICK_OTA_RC_CHANNEL_NOTE`（新增）：說明三種情境，顯示於 OTA provisioning 成功後通知
