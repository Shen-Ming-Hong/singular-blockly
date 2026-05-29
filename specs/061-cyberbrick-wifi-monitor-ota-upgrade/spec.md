# Feature Specification: CyberBrick WiFi Monitor + OTA Agent 自動升級

**Feature Branch**: `061-cyberbrick-wifi-monitor-ota-upgrade`
**Created**: 2026-05-30
**Status**: Draft
**Input**: User description: "透過 WiFi 即時輸出 print() 資訊到 terminal，前提是已配對的 OTA 裝置才可使用；並在每次上傳時自動偵測舊版 OTA agent 並自動更新成新版本"

## Clarifications

### Session 2026-05-30

- Q: 多個已配對裝置時，Monitor 與 OTA 上傳如何選擇目標裝置？ → A: 沿用 spec-059 的選取裝置 UI，多裝置時顯示選擇清單（與 OTA 上傳行為一致）
- Q: 使用者直接關閉 VS Code Terminal 時，WiFi Monitor 應如何回應？ → A: 偵測 Terminal 關閉後自動停止 Monitor，按鈕狀態重設
- Q: Agent 升級失敗時，本次程式碼上傳應如何處理？ → A: 顯示升級失敗警告，仍繼續嘗試上傳程式碼（降低失敗影響範圍）
- Q: WiFi Monitor 啟動時 Terminal 應顯示哪些 log？ → A: 只顯示 Monitor 啟動後新產生的輸出，不顯示裝置 buffer 中的歷史 log
- Q: OTA 配對流程（Provisioning）是否需同步安裝最新 agent？ → A: 配對流程安裝的 agent 同步為最新版（1.4.0），新裝置開笱即支援 WiFi Monitor

## User Scenarios & Testing *(mandatory)*

### User Story 1 - WiFi 串流監控（Priority: P1）

使用者已完成 CyberBrick OTA 配對，在 VS Code 中執行程式後，按下 Monitor 按鈕，即可透過 WiFi 即時看到裝置的 `print()` 輸出，不需要用 USB 線連接電腦。

**Why this priority**: 這是本 spec 的核心功能。OTA 上傳後裝置已斷開 USB，USB serial monitor 無法使用；使用者需要能在無線狀態下持續觀察程式輸出，才能進行 debug 與驗證。

**Independent Test**: 可獨立測試，只要配對一台 CyberBrick，按 Monitor 按鈕，觀察 print() 輸出能否在 terminal 中即時顯示。

**Acceptance Scenarios**:

1. **Given** 使用者已完成 OTA 配對且裝置在線，**When** 使用者按下 Monitor 按鈕，**Then** VS Code 開啟一個新 Terminal，並持續顯示裝置的 print() 輸出
2. **Given** WiFi Monitor 正在運行，**When** 使用者再次按下 Monitor 按鈕，**Then** WiFi Monitor 停止，Terminal 關閉
3. **Given** 使用者尚未完成 OTA 配對（無 WiFi 裝置），**When** 使用者按下 Monitor 按鈕，**Then** 切換回現有 USB serial 模式（行為與之前相同）
4. **Given** WiFi Monitor 運行中裝置斷線，**When** 裝置連線中斷，**Then** 系統自動重試連線，Terminal 顯示重試狀態；連續失敗 5 次後顯示錯誤訊息

---

### User Story 2 - OTA 上傳自動升級 Agent（Priority: P2）

使用者透過 OTA 上傳程式碼時，系統自動偵測裝置上的 OTA agent 版本，若版本較舊且支援無線升級，則在上傳程式碼之前靜默更新 agent，整個過程使用者無需任何額外操作。

**Why this priority**: 沒有自動升級機制，每次 agent 更新都需要使用者手動重新配對，嚴重影響使用體驗。自動升級確保使用者總是使用最新功能。

**Independent Test**: 可獨立測試：準備一台安裝舊版 agent（1.4.0 以上但非最新）的裝置，執行 OTA 上傳，確認 agent 自動升級後上傳繼續完成。

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

- **FR-001**: 系統 MUST 在按下 Monitor 按鈕時，自動判斷是否存在已配對的 OTA 裝置；若有多台裝置則顯示選擇清單（沿用 spec-059 的選取裝置 UI），選定後若裝置在線則優先使用 WiFi 模式，否則使用現有 USB 模式
- **FR-002**: WiFi Monitor MUST 持續接收裝置 `print()` 輸出並即時顯示在 VS Code Terminal 中；Terminal 啟動時僅顯示連線後新產生的輸出，不顯示裝置 buffer 中的歷史 log
- **FR-002a**: 當 VS Code Terminal 被使用者直接關閉時，系統 MUST 自動停止 WiFi Monitor polling 並釋放資源，且 Monitor 按鈕狀態 MUST 重設為「未監控」
- **FR-003**: WiFi Monitor MUST 在連線中斷時自動重試，至少重試 5 次，每次間隔 2 秒，超過上限後顯示錯誤
- **FR-004**: 系統 MUST 在每次 OTA 上傳前檢查裝置 agent 版本
- **FR-005**: 系統 MUST 在裝置 agent 版本支援無線升級時，自動執行 agent 升級，不需要使用者手動操作
- **FR-006**: Agent 升級期間 MUST 顯示升級進度提示（包含版本號）
- **FR-007**: Agent 升級成功後 MUST 等待裝置重啟就緒，再繼續上傳程式碼
- **FR-007a**: Agent 升級失敗時，系統 MUST 顯示升級失敗警告，並繼續嘗試執行本次程式碼上傳（不中止整個上傳流程）
- **FR-008**: 裝置 agent 版本過舊（不支援無線升級）時，系統 MUST 繼續完成 OTA 上傳，並顯示提示說明如何升級 agent
- **FR-009**: WiFi Monitor 版本相容性判斷 MUST 基於 health endpoint 回傳的 agentVersion，優雅降級而非報錯
- **FR-010**: 所有新增的使用者提示訊息 MUST 支援 15 種語系
- **FR-011**: OTA 配對流程（Provisioning）安裝到裝置的 OTA agent MUST 為本 spec 最新版本，新配對的裝置開笱即支援 WiFi Monitor，不需再次升級

### Key Entities

- **已配對裝置（Paired CyberBrick Device）**：已完成 OTA 配對的裝置，包含裝置 ID、最後已知 IP、OTA Port、最後連線時間
- **OTA Token**：驗證裝置身份的 Bearer token，儲存在 VS Code secretStorage
- **Agent 版本（Agent Version）**：裝置上執行的 OTA agent 語意版本號，由 health endpoint 回傳
- **Log Entry**：裝置捕捉到的一筆 `print()` 輸出，包含序號（seq）與文字內容（text）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 按下 Monitor 按鈕後，WiFi Terminal 在 3 秒內開始顯示第一筆輸出
- **SC-002**: 裝置 `print()` 輸出從產生到顯示在 Terminal 的延遲不超過 1 秒
- **SC-003**: WiFi Monitor 連線中斷後，在使用者不做任何操作的情況下自動重試，直到成功或超過重試上限
- **SC-004**: OTA 上傳時 agent 升級流程全自動，使用者無需額外操作，整體上傳時間增加不超過 40 秒（含裝置重啟等待）
- **SC-005**: 舊版 agent 裝置執行 OTA 上傳時，上傳成功率不受影響（降級提示不阻擋上傳）
- **SC-006**: 無 OTA 配對裝置時，USB Monitor 行為與現有版本完全相同（零退化）

## Assumptions

- 使用者已完成 OTA 配對流程（spec-059），裝置已儲存 `lastKnownIp` 與 OTA token
- 裝置與電腦在同一個 WiFi 網路中，IP 可直接互連
- 裝置的 `print()` 輸出由 OTA agent 在 WiFi server 啟動後開始捕捉（啟動前的輸出不在範圍內）
- WiFi Monitor 啟動時以當前最新序號為起點，僅接收後續新增輸出，不顯示裝置 buffer 中的歷史 log
- Agent 升級需要裝置重新啟動（約 5-10 秒），在此期間無法上傳或監控
- 1.3.0 → 1.4.0 是唯一需要手動重新配對的版本轉換；1.4.0 起所有後續版本均可無線升級
- 全新執行 OTA 配對流程的裝置會直接安裝 1.4.0，不會經歷 1.3.0 階段
- 行動裝置（手機/平板）支援不在本 spec 範圍
- WiFi Monitor 與 USB serial Monitor 在同一時間只能有一個在運行
