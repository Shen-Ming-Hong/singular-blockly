# 實作計畫：CyberBrick OTA Agent 強化升級

**分支**: `feature/061-cyberbrick-wifi-monitor-ota-upgrade` | **日期**: 2026-05-30 | **規格**: [spec.md](./spec.md)
**輸入**: `/specs/061-cyberbrick-wifi-monitor-ota-upgrade/spec.md`

> **⚠️ 實作範圍異動（2026-06-02）**
>
> 原規格包含 WiFi Monitor（US1），開發過程中實作完整後決定移除。
> **本 PR 實際交付**：OTA Agent 自動升級（US2）+ 舊版限和降級（US3）+ Monitor 路由優化 + agent 1.5.9。

## 摘要

本 feature 實際交付兩項能力（WiFi Monitor 已移除）：

1. **OTA Agent 自動升級**：每次 OTA 無線上傳前，透過現有 health endpoint 取得裝置 `agentVersion`。若版本 ≥ `CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION`（= 1.4.0）且低於 `CYBERBRICK_OTA_AGENT_TARGET_VERSION`（**已更新至 1.5.9**），系統靜默以 `POST /api/v1/upload-agent` 無線升級 agent，等待裝置重啟後繼續上傳程式碼。若 < MIN（如 1.3.0）則顯示重新配對提示但不阻擋上傳。

2. **Monitor 按鈕路由優化**：Monitor 按鈕現在有 USB 連接時優先走 USB serial monitor，公高裝置連抗性。OTA WiFi Monitor 路由已移除。

3. **OTA Agent Source 清除**：移除 OTA agent MicroPython source 中的 `_LogCapture` dead code、`/api/v1/logs`、`/api/v1/reset` endpoints。裝置端保持精簡。agent 版本升至 **1.5.9**（已安裝 1.5.8 的裝置在下次 OTA 上傳時會自動接收 1.5.9）。

4. **OTA rc_main.py 啟動標記**：OTA 上傳的 rc_main.py 包含啟動 marker 與異常捕捉包裙，協助識別裝置重啟成功。

5. **IME 輸入法相容性修正**：修正 Blockly 文字輸入欄位與全域鍵盤快捷鍵衝突，讓 IME 輸入法正確輸入。

## 技術背景

**語言/版本**: TypeScript 5.9.3（Extension Host）、JavaScript ES2023（WebView）、MicroPython（裝置端）
**主要依賴**: VS Code 1.105.0+ PTY Terminal API (`vscode.Pseudoterminal`)、Node.js `crypto` 模組、Zod 4.1.13
**儲存**: VS Code `secretStorage`（OTA token）、workspace state JSON（`PairedCyberBrickDevice` 清單，含 `agentVersion`）
**測試框架**: Mocha + Sinon + `@vscode/test-electron`
**目標平台**: VS Code Extension（macOS / Windows / Linux）+ CyberBrick ESP32 MicroPython
**專案類型**: VS Code Extension（Extension Host + WebView 雙環境）
**效能目標**: 升級總耗時增加 ≤ 40s（SC-004）；舊版 agent 裝置 OTA 上傳成功率不受影響（SC-005）；無 OTA 配對裝置時 USB Monitor 行為與現有版本完全相同（SC-006）
**限制**: Extension Host 與 WebView 僅透過 postMessage 溝通；MicroPython threading 限制需用輪詢而非 Server-Sent Events

## Constitution Check

*GATE：Phase 0 研究前必須通過。Phase 1 設計後重新評估。*

| 原則 | 評估 | 結果 |
|------|------|------|
| **I. 簡潔可維護** | 新服務單一職責；`compareAgentVersion()` 設計為純函式；輪詢邏輯集中在一個檔案 | ✅ 通過 |
| **II. 模組化** | 新增獨立 `cyberbrickWifiMonitorService.ts`；不修改現有 OTA 上傳核心流程 | ✅ 通過 |
| **III. 避免過度開發** | 嚴格對應 FR-001 ~ FR-012，無 spec 外功能；採輪詢而非 WebSocket 等過度設計 | ✅ 通過 |
| **IV. 彈性可配置** | `CYBERBRICK_OTA_AGENT_TARGET_VERSION` 與 `CYBERBRICK_OTA_UPLOAD_AGENT_MIN_VERSION` 設計為可獨立更新的常數；輪詢間隔（500ms）集中定義於 service | ✅ 通過 |
| **V. 研究驅動** | VS Code PTY API 形狀、MicroPython sys.stdout redirect 已在 research.md 確認 | ✅ 通過（Phase 1）|
| **VI. 結構化 Logging** | Extension Host 全用 `log()`；WebView 用 `console.log()`；裝置端不輸出 secrets | ✅ 通過 |
| **VII. 測試覆蓋率** | `CyberBrickWifiMonitorService` 可完整 mock（注入 fetch/timer/pty）；100% 覆蓋目標 | ✅ 通過 |
| **VIII. 純函式架構** | version 比對、log 合併邏輯為純函式；副作用（Timer、PTY write）封裝在 service | ✅ 通過 |
| **IX. 繁體中文文件** | 所有規格 / 計畫 / 研究文件用繁體中文 | ✅ 通過 |

**Phase 1 後 Gate 結論**：✅ 無 Constitution 違反，無需複雜度追蹤。

## 專案結構

### 規格文件（本 feature）

```text
specs/061-cyberbrick-wifi-monitor-ota-upgrade/
├── spec.md              # 需求規格（已完成）
├── plan.md              # 本檔案（/speckit.plan 輸出）
├── research.md          # Phase 0 研究成果（/speckit.plan 輸出）
├── data-model.md        # Phase 1 資料模型（/speckit.plan 輸出）
├── quickstart.md        # Phase 1 開發指引（/speckit.plan 輸出）
├── contracts/
│   ├── api-v1-logs.md            # GET /api/v1/logs HTTP 契約
│   ├── api-v1-reset.md           # POST /api/v1/reset HTTP 契約
│   └── api-v1-upload-agent.md    # POST /api/v1/upload-agent HTTP 契約
└── tasks.md             # Phase 2 任務清單（/speckit.tasks 輸出 — 本指令不建立）
```

### 原始碼（倉儲根目錄）

```text
src/
├── services/
│   ├── cyberbrickOtaAgentSource.ts           # [修改] 移除 `_LogCapture`、`/api/v1/logs`、`/api/v1/reset`；新增 rc_main bootstrap marker；版本 → 1.5.9
│   ├── cyberbrickOtaUploader.ts              # [修改] compareAgentVersion()、upgradeAgentOverWifi()、Monitor 路由優先 USB
│   └── cyberbrickOtaProvisioningService.ts   # [修改] 配對流程安裝 1.5.9 agent
└── types/
    └── cyberbrickUpload.ts                   # [修改] 新增 upload stage 值（upgrading_agent、agent_upgraded、agent_upgrade_needed）；TARGET 版本 1.5.9

media/
├── js/
│   └── blocklyEdit.js                        # [修改] OTA progress stage UI + IME 相容性修正
└── locales/
    └── {15 語系}/messages.js                 # [修改] OTA stage i18n key（UPLOADING_AGENT、AGENT_UPGRADED、AGENT_UPGRADE_NEEDED）
```

> **已移除**（原規劃中，未在本 PR 交付）：
> - `src/services/cyberbrickWifiMonitorService.ts` — WiFi Monitor 服務已整支刪除
> - `src/test/suite/cyberbrickWifiMonitorService.test.ts` — 連同測試一併刪除
> - `WIFI_MONITOR_*` i18n keys — 已從全部 15 個語系 locale 檔案移除

**架構決策**：沿用現有 VS Code Extension 單專案結構；OTA 自動升級邏輯集中在 `cyberbrickOtaUploader.ts`，與現有 upload pipeline 模式一致。
