# Feature Specification: CyberBrick OTA Agent 強化升級

**Feature Branch**: `061-cyberbrick-wifi-monitor-ota-upgrade`
**Created**: 2026-05-30
**Status**: Shipped（v0.82.0）
**Input**: User description: "透過 WiFi 即時輸出 print() 資訊到 terminal，前提是已配對的 OTA 裝置才可使用；並在每次上傳時自動偵測舊版 OTA agent 並自動更新成新版本"

> **⚠️ 實作範圍異動（2026-06-02）**
>
> User Story 1（WiFi 串流監控）在開發過程中完整實作後，評估穩定性與維護複雜度，最終決定自本 PR 移除（`cyberbrickWifiMonitorService.ts` 已刪除，所有 `WIFI_MONITOR_*` i18n key 已清除）。
>
> **本 PR 實際交付功能為 US2 + US3**：
> - OTA Agent 自動升級（US2）：上傳前自動偵測並無線升級舊版 agent
> - 舊版 Agent 優雅降級（US3）：過舊 agent 顯示重配對提示，不阻擋上傳
> - Monitor 按鈕路由優化：有 USB 連接時優先走 USB serial monitor
> - OTA Agent 版本升至 1.5.9（清除 log capture dead code）
>
> WiFi Monitor 功能將在後續獨立 spec 以更穩健的架構重新設計。

## Clarifications

### Session 2026-05-30

- Q: 多個已配對裝置時，Monitor 與 OTA 上傳如何選擇目標裝置？ → A: 沿用 spec-059 的選取裝置 UI，多裝置時顯示選擇清單（與 OTA 上傳行為一致）
- Q: 使用者直接關閉 VS Code Terminal 時，WiFi Monitor 應如何回應？ → A: 偵測 Terminal 關閉後自動停止 Monitor，按鈕狀態重設
- Q: Agent 升級失敗時，本次程式碼上傳應如何處理？ → A: 顯示升級失敗警告，仍繼續嘗試上傳程式碼（降低失敗影響範圍）
- Q: WiFi Monitor 啟動時 Terminal 應顯示哪些 log？ → A: 對支援 `/api/v1/reset` 的 agent（≥ 1.5.0）只顯示 reset 後新產生的輸出；legacy 1.4.x agent 則沿用目前可取得的 log polling 結果
- Q: OTA 配對流程（Provisioning）是否需同步安裝最新 agent？ → A: 配對流程安裝的 agent 同步為最新版（目前 1.5.8），新裝置開箱即支援 WiFi Monitor，且可使用 reset-capable 的 Monitor 啟動流程

## User Scenarios & Testing *(mandatory)*

### User Story 1 - WiFi 串流監控（Priority: P1）⚠️ **未在本 PR 交付**

> 此 User Story 在開發過程中完整實作後決定移除。`cyberbrickWifiMonitorService.ts` 已從 source tree 刪除，相關區塊亦已從 OTA agent source 移除。WiFi Monitor 將在後續獨立 spec 重新設計。

~~使用者已完成 CyberBrick OTA 配對，在 VS Code 中執行程式後，按下 Monitor 按鈕，即可透過 WiFi 即時看到裝置的 `print()` 輸出，不需要用 USB 線連接電腦。~~

**Why this priority**: 這是本 spec 的核心功能。OTA 上傳後裝置已斷開 USB，USB serial monitor 無法使用；使用者需要能在無線狀態下持續觀察程式輸出，才能進行 debug 與驗證。

**Independent Test**: 可獨立測試，只要配對一台 CyberBrick，按 Monitor 按鈕，先確認 UI 立即顯示「連線中」提示；若裝置 agentVersion ≥ 1.5.0，Terminal 應在裝置重啟完成後顯示 `Device ready.` 並開始輸出本次執行的 print()；若為 1.4.x legacy agent，則應沿用既有 log polling 模式並持續顯示可取得的輸出。

**Acceptance Scenarios**:

1. **Given** 使用者已完成 OTA 配對且裝置在線，**When** 使用者按下 Monitor 按鈕，**Then** WebView 先顯示明確的「連線中」提示；VS Code 開啟一個新 Terminal，並在裝置就緒後持續顯示裝置的 print() 輸出
2. **Given** WiFi Monitor 正在運行，**When** 使用者再次按下 Monitor 按鈕，**Then** WiFi Monitor 停止，Terminal 關閉
3. **Given** 使用者尚未完成 OTA 配對（無 WiFi 裝置），**When** 使用者按下 Monitor 按鈕，**Then** 切換回現有 USB serial 模式（行為與之前相同）
4. **Given** WiFi Monitor 運行中裝置斷線，**When** 裝置連線中斷，**Then** 系統自動重試連線，Terminal 顯示重試狀態；連續失敗 5 次後顯示錯誤訊息

---

### User Story 2 - OTA 上傳自動升級 Agent（Priority: P2）

使用者透過 OTA 上傳程式碼時，系統自動偵測裝置上的 OTA agent 版本，若版本較舊且支援無線升級，則在上傳程式碼之前靜默更新 agent，整個過程使用者無需任何額外操作。

**Why this priority**: 沒有自動升級機制，每次 agent 更新都需要使用者手動重新配對，嚴重影響使用體驗。自動升級確保使用者總是使用最新功能。

**Independent Test**: 可獨立測試：準備一台安裝版本 ≥ MIN（= 1.4.0）但 < TARGET（目前 1.5.8）的 agent 的裝置，執行 OTA 上傳，確認 agent 自動升級後上傳繼續完成。

**Acceptance Scenarios**:

1. **Given** 裝置 agent 版本低於目前最新版本且支援無線升級，**When** 使用者執行 OTA 上傳，**Then** 系統先顯示「正在更新 OTA Agent」提示，完成後繼續上傳程式碼
2. **Given** 裝置 agent 已是最新版本，**When** 使用者執行 OTA 上傳，**Then** 跳過升級，直接上傳程式碼（使用者感知不到版本檢查）
3. **Given** agent 升級完成，**When** 裝置重新啟動就緒，**Then** 系統繼續正常上傳程式碼，顯示「Agent 更新完成」提示

---

### User Story 3 - 舊版 Agent 優雅降級（Priority: P3）

裝置上安裝的 OTA agent 版本過舊，不支援無線升級（例如首次從 1.3.0 升級到 1.4.0 的使用者），系統顯示清楚的提示說明需要重新配對，但不阻擋本次程式碼上傳。

**Why this priority**: 確保過渡期使用者仍能正常使用上傳功能，同時獲得操作指引。

**Independent Test**: 可獨立測試：準備安裝 1.3.0 agent 的裝置，執行 OTA 上傳，確認上傳成功且顯示重新配對提示；按 Monitor 按鈕確認顯示升級提示。

**Acceptance Scenarios**:

1. **Given** 裝置 agent 版本過舊（不支援無線升級），**When** 使用者執行 OTA 上傳，**Then** 上傳正常完成，並顯示「Agent 版本過舊，請重新配對裝置以啟用自動更新」提示
2. **Given** 裝置 agent 版本過舊，**When** 使用者按 Monitor 按鈕，**Then** 顯示「需要更新 OTA Agent 才能使用 WiFi Monitor，請重新配對裝置」提示，Monitor 不啟動

---

### Edge Cases

- 裝置 IP 因 DHCP 重新分配而改變時（`lastKnownIp` 過期），WiFi Monitor 重試失敗，錯誤訊息應建議使用者重新配對以更新 IP
- 使用者直接關閉 VS Code Terminal 面板（而非按按鈕）時，系統偵測關閉事件，自動停止 WiFi Monitor 並重設按鈕狀態
- 裝置的 `print()` 輸出速率過快（例如無限迴圈），Terminal 持續接收不會卡頓
- WiFi Monitor 運行中執行 OTA 上傳，Monitor 應自動暫停讓出 WiFi 連線，上傳完成後可重新啟動
- Agent 升級過程中裝置意外斷電，下次上傳時應重新偵測版本並再次嘗試升級
- Agent 升級失敗（例如裝置重啟後逾時未回應），系統顯示升級失敗警告後仍繼續執行本次程式碼上傳，不中止整個流程
- agentVersion 欄位遺失或格式非法時，視為舊版本處理（不升級、不啟動 WiFi Monitor）

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001** ⚠️ *未在本 PR 交付*: 系統 MUST 在按下 Monitor 按鈕時，自動判斷是否存在已配對的 OTA 裝置；若有多台裝置則顯示選擇清單（沿用 spec-059 的選取裝置 UI），選定後若裝置在線則優先使用 WiFi 模式，否則使用現有 USB 模式；WiFi Monitor 與 USB serial Monitor 同一時間只能有一個在運行（互斥），啟動前須確認另一個已停止。**本 PR 簡化為：Monitor 按鈕有 USB 連接時優先走 USB serial monitor，無 OTA WiFi Monitor 路由。**
- **FR-002** ⚠️ *未在本 PR 交付*: WiFi Monitor MUST 持續接收裝置 `print()` 輸出並即時顯示在 VS Code Terminal 中（WiFi Monitor 服務已移除）
- **FR-002b** ⚠️ *未在本 PR 交付*: WiFi Monitor 連線中提示（服務已移除）
- **FR-002a** ⚠️ *未在本 PR 交付*: Terminal 關閉事件自動停止 WiFi Monitor（服務已移除）
- **FR-003** ⚠️ *未在本 PR 交付*: WiFi Monitor 自動重試（服務已移除）
- **FR-004**: 系統 MUST 在每次 OTA 上傳前檢查裝置 agent 版本
- **FR-005**: 系統 MUST 在裝置 agent 版本支援無線升級時，自動執行 agent 升級，不需要使用者手動操作
- **FR-006**: Agent 升級期間 MUST 顯示升級進度提示（包含升級前版本（舊版）→ 目標版本（新版））
- **FR-007**: Agent 升級成功後 MUST 等待裝置重啟就緒，再繼續上傳程式碼
- **FR-007a**: Agent 升級失敗時，系統 MUST 顯示升級失敗警告，並繼續嘗試執行本次程式碼上傳（不中止整個上傳流程）
- **FR-008**: 裝置 agent 版本過舊（不支援無線升級）時，系統 MUST 繼續完成 OTA 上傳，並顯示提示說明如何升級 agent
- **FR-009**: WiFi Monitor 版本相容性判斷 MUST 基於 health endpoint 回傳的 agentVersion，優雅降級而非報錯
- **FR-010**: 所有新增的使用者提示訊息 MUST 支援 15 種語系
- **FR-011**: OTA 配對流程（Provisioning）安裝到裝置的 OTA agent MUST 為本 spec 最新 TARGET 版本（**已更新至 1.5.9**），新配對的裝置開箱即取得乾淨的 agent（log capture dead code 已移除）
- **FR-012** ⚠️ *未在本 PR 交付*: WiFi Monitor 與 OTA 上傳互斥連線管理（WiFi Monitor 服務已移除，此需求隨之取消）

### Key Entities

- **已配對裝置（Paired CyberBrick Device）**：已完成 OTA 配對的裝置，包含裝置 ID、最後已知 IP、OTA Port、最後連線時間
- **OTA Token**：驗證裝置身份的 Bearer token，儲存在 VS Code secretStorage
- **Agent 版本（Agent Version）**：裝置上執行的 OTA agent 語意版本號，由 health endpoint 回傳
- **Log Entry**：裝置捕捉到的一筆 `print()` 輸出，包含序號（seq）與文字內容（text）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001** ⚠️ *未在本 PR 交付*: WiFi Monitor 連線提示（服務已移除）
- **SC-002** ⚠️ *未在本 PR 交付*: WiFi Monitor print() 延遲 ≤ 1s（服務已移除）
- **SC-003** ⚠️ *未在本 PR 交付*: WiFi Monitor 自動重試（服務已移除）
- **SC-004**: OTA 上傳時 agent 升級流程全自動，使用者無需額外操作，整體上傳時間增加不超過 40 秒（含裝置重啟等待）
- **SC-005**: 舊版 agent 裝置執行 OTA 上傳時，上傳成功率不受影響（降級提示不阻擋上傳）
- **SC-006**: 無 OTA 配對裝置時，USB Monitor 行為與現有版本完全相同（零退化）

## Assumptions

- 使用者已完成 OTA 配對流程（spec-059），裝置已儲存 `lastKnownIp` 與 OTA token
- 裝置與電腦在同一個 WiFi 網路中，IP 可直接互連
- 裝置的 `print()` 輸出由 OTA agent 在 WiFi server 啟動後開始捕捉（啟動前的輸出不在範圍內）
- 對於 agentVersion ≥ 1.5.0 的裝置，WiFi Monitor 啟動時會以 reset 前 cursor 為基準，待 reboot signal 成立後只顯示 reset 後新產生的輸出；對於 1.4.x legacy agent，則沿用目前可取得的 log polling 結果
- Agent 升級需要裝置重新啟動（約 5-10 秒），在此期間無法上傳或監控
- 1.3.0 → 1.4.0 是唯一需要手動重新配對的版本轉換；1.4.0 起所有後續版本均可無線升級
- 全新執行 OTA 配對流程的裝置會直接安裝目前 TARGET 版本（1.5.9），不會經歷 1.3.0 階段
- 對於 agentVersion ≥ 1.5.0 的裝置，WiFi Monitor 啟動時會主動呼叫 `/api/v1/reset` 清空舊 log 並等待裝置重啟；`Device ready.` 出現前的等待時間主要來自 reset / reboot / Wi-Fi reconnect / agent restart
- 行動裝置（手機/平板）支援不在本 spec 範圍
- WiFi Monitor 與 USB serial Monitor 在同一時間只能有一個在運行
