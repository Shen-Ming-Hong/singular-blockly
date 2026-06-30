# ChatGPT Transcript: Specify

- Stage: specify
- Timestamp: 2026-06-29T19:03:04+0800
- Feature root: `specs/062-cyberbrick-ota-rc-channel-conflict`
- Prompt summary: Asked ChatGPT to produce only a bounded `spec.md` artifact in Traditional Chinese from the specify context slice, focusing on user stories, requirements, acceptance criteria, assumptions, and clarification markers when needed. Explicitly prohibited invented frameworks, databases, endpoints, file structures, commands, or APIs beyond supplied context.
- Pasted context files:
  - `.specify/context/slices/specify.md`
- Extraction status: Success. The copied raw response contained `BEGIN_SDD_OUTPUT`, one safe relative `FILE: spec.md` entry, a separator line, `END_FILE`, and `END_SDD_OUTPUT`. Path validation passed; no nested markers were present in artifact content.
- Saved artifact files:
  - `spec.md`

## Raw ChatGPT Output

```text
BEGIN_SDD_OUTPUT
FILE: spec.md
-------------

# 功能規格書：修正 CyberBrick OTA 與 RC 遙控的 Wi-Fi Channel 衝突

## 摘要

修正 CyberBrick 裝置同時使用 OTA 與 RC 遙控時的 Wi-Fi channel 判斷問題，避免裝置只因存在 OTA config 就跳過 RC channel 設定，導致 AP 未連線時 RC 遙控失效。此功能的目標是在 OTA 可用時保留 AP channel，在 OTA 不可用或 AP 不在線時，讓 RC 能於約 5 秒後退回積木設定的 channel，使學生與教師在課堂中能穩定使用 RC 遙控，同時維持已連上 AP 裝置的 OTA 上傳能力。

## 目標

* 讓兩台皆有 OTA 且 AP 在線的 CyberBrick 裝置可同時維持 OTA 與 RC 遙控功能。
* 讓兩台皆有 OTA 但 AP 不在線的 CyberBrick 裝置，於約 5 秒後退回積木設定的 channel，恢復 RC 遙控。
* 讓一台有 OTA、一台無 OTA 且 AP 不在線時，RC 遙控仍可正常運作。
* 避免 OTA agent 啟動期間的 Wi-Fi scanning 長時間干擾 ESP-NOW。
* 以學生容易理解的方式，在所有 locale 中補充 RC channel 配對與 OTA/RC channel 行為說明。

## 非目標

* 不處理「一台有 OTA 且 AP 在線、另一台無 OTA 且 AP 不在線」時 RC 可能失敗的情境；此為可接受設計邊界。
* 不變更 `buildCyberBrickOtaAgentSource()` body。
* 不變更 `CYBERBRICK_OTA_AGENT_TARGET_VERSION`。
* 不變更 `src/services/cyberbrickOtaUploader.ts`。
* 不新增未提供的 framework、database、endpoint、file structure、command 或 API。

## 使用者與情境

### 主要使用者

* 使用 CyberBrick、Blockly 與 MicroPython 上傳流程進行課堂教學的教師。
* 使用 CyberBrick RC 遙控與 OTA 功能的學生。
* 維護 CyberBrick Blockly / OTA / RC 產生程式碼的開發者。

### 使用者情境

1. **兩台 OTA 裝置且 AP 在線**：Given 兩台 CyberBrick 裝置皆已設定 OTA，且兩台都能連上同一 AP，when 裝置開機並啟動 RC 遙控，then 裝置使用 AP channel，RC 正常運作，OTA 也可直接上傳。
2. **兩台 OTA 裝置但 AP 不在線**：Given 兩台 CyberBrick 裝置皆已設定 OTA，但 AP 已關閉或不可連線，when 裝置開機並啟動 RC 遙控，then 約 5 秒後裝置退回積木設定的 channel，RC 可連線並正常運作。
3. **一台 OTA、一台無 OTA，且 AP 不在線**：Given 一台 CyberBrick 裝置有 OTA 設定、另一台沒有 OTA 設定，且 AP 不在線，when 兩台裝置開機並啟動 RC 遙控，then RC 依積木設定 channel 正常運作。
4. **一台 OTA 且 AP 在線、另一台無 OTA 且 AP 不在線**：Given 一台 CyberBrick 裝置有 OTA 設定且 AP 在線，另一台沒有 OTA 設定且未使用 AP channel，when 兩台裝置開機並啟動 RC 遙控，then RC 可能失敗，且此結果屬於本功能接受的設計邊界。
5. **學生閱讀 RC 積木提示**：Given 使用者查看 RC master 或 RC slave 初始化積木提示，when 使用者閱讀 tooltip，then 文字應以學生能理解的方式說明兩台裝置需要使用相同 channel，並補充 OTA 與 RC channel 的關係。

## 功能需求

* **FR-001**：系統必須在 RC 初始化判斷是否保留 Wi-Fi 給 OTA 時，同時確認「存在 OTA config」與「STA Wi-Fi 已連上 AP」，不得只因存在 OTA config 就保留 Wi-Fi。
* **FR-002**：系統必須在 CyberBrick RC 主程式的 OTA bootstrap 階段，允許最多約 5 秒等待 OTA / Wi-Fi 狀態穩定。
* **FR-003**：系統必須在等待期間每約 100ms 檢查 `_wlan.isconnected()`，若已連線則提早結束等待。
* **FR-004**：系統必須在等待期間於 OTA agent 狀態 `Y[0] > 1` 時結束等待。
* **FR-005**：系統必須在等待後若 `_wlan.isconnected()` 仍為 false，停止 STA Wi-Fi 背景連線或掃描行為，使 RC 可退回積木設定 channel。
* **FR-006**：系統必須在等待後若 `_wlan.isconnected()` 仍為 false，允許 RC master / slave 使用積木設定的 channel 進行初始化。
* **FR-007**：系統必須在兩台皆有 OTA 且 AP 在線時，讓 RC 使用 AP channel，並維持 OTA 可直接上傳。
* **FR-008**：系統必須在兩台皆有 OTA 且 AP 不在線時，讓 RC 於約 5 秒後退回積木設定 channel；當積木設定為 channel 1 時，應退回 channel 1。
* **FR-009**：系統必須在一台有 OTA、一台無 OTA 且 AP 不在線時，讓 RC 正常連線。
* **FR-010**：系統必須保留「一台有 OTA 且 AP 在線、另一台無 OTA 且 AP 不在線時 RC 可能失敗」作為已知設計邊界，不將其視為本功能缺陷。
* **FR-011**：系統必須以 try/except 保護 `network` import 相關行為，避免缺少或初始化失敗時造成 RC 主流程不可預期中斷。
* **FR-012**：所有 15 個 locale files 必須更新 `RC_SLAVE_INIT_TOOLTIP`，加入學生可理解的 channel 配對說明。
* **FR-013**：所有 15 個 locale files 必須更新 `RC_MASTER_INIT_TOOLTIP`，加入學生可理解的 channel 配對說明。
* **FR-014**：所有 15 個 locale files 必須新增 `CYBERBRICK_OTA_RC_CHANNEL_NOTE`，說明 OTA 與 RC channel 的關係與限制。
* **FR-015**：既有 RC master / slave channel setup 不得在「只有 OTA config 但 AP 未連線」時被跳過。
* **FR-016**：既有 OTA target version 必須維持目前版本值，不得因本修正而變更。

## 非功能需求

* **NFR-001**：RC fallback 行為必須可被人工觀察與驗收，兩台 OTA 裝置在 AP 不在線時應於約 5 秒後恢復 RC 連線。
* **NFR-002**：本修正不得造成既有測試退化，`npm test` 必須通過。
* **NFR-003**：本修正不得造成 i18n 驗證失敗，`npm run validate:i18n` 必須通過。
* **NFR-004**：新增或更新的 tooltip / note 文案必須以學生能理解的語氣描述 channel 配對，不應只面向工程師。
* **NFR-005**：本修正應採取最小範圍變更，不觸碰明確列為非目標的 OTA agent body、OTA target version 與 uploader 服務。

## 資料與實體

| 實體           | 主要欄位 / 狀態                                                                         | 備註                                          |
| ------------ | --------------------------------------------------------------------------------- | ------------------------------------------- |
| OTA config   | 是否存在 OTA 設定                                                                       | 不能單獨作為保留 Wi-Fi channel 的充分條件                |
| STA Wi-Fi 狀態 | `isconnected()` true / false                                                      | 必須與 OTA config 一起決定是否保留 AP channel          |
| OTA agent 狀態 | `Y[0]`                                                                            | 等待期間可作為結束等待條件之一                             |
| RC channel   | 積木設定 channel、AP channel                                                           | AP 在線時可使用 AP channel；AP 不在線時需退回積木設定 channel |
| Locale 文案    | `RC_SLAVE_INIT_TOOLTIP`、`RC_MASTER_INIT_TOOLTIP`、`CYBERBRICK_OTA_RC_CHANNEL_NOTE` | 需同步更新 15 個 locale files                     |

## 邊界情境

* 兩台裝置皆有 OTA config，但 AP 不在線：不得因 OTA config 存在而長時間保留 Wi-Fi；約 5 秒後必須退回積木設定 channel。
* 兩台裝置皆有 OTA config，且 AP 在線：不得強制斷開 Wi-Fi；應保留 AP channel，使 OTA 與 RC 同時可用。
* 一台有 OTA config、一台無 OTA config，且 AP 不在線：有 OTA 的裝置不得因未連線 OTA config 阻止 RC channel 設定；RC 應正常運作。
* 一台有 OTA config 且 AP 在線、另一台無 OTA config 且 AP 不在線：RC 可能因 channel 不一致而失敗，屬於接受的設計邊界。
* `network` import 或 Wi-Fi 狀態讀取遇到例外：不得使 RC 主流程因未保護的例外而中斷。
* 積木設定 channel 為 1，且 AP 不在線：fallback 後應使用 channel 1。

## 驗收標準

* [ ] 兩台 CyberBrick 裝置皆有 OTA 且 AP 在線時，RC 正常運作，OTA 可直接上傳。
* [ ] 兩台 CyberBrick 裝置皆有 OTA，關掉 AP 後重新啟動或進入初始化流程，約 5 秒後 RC 可連線。
* [ ] 兩台 CyberBrick 裝置皆有 OTA，關掉 AP，且積木設定使用 channel 1 時，RC 約 5 秒後退回 channel 1。
* [ ] 一台 CyberBrick 裝置有 OTA、另一台無 OTA，且 AP 不在線時，RC 正常運作。
* [ ] 一台 CyberBrick 裝置有 OTA 且 AP 在線、另一台無 OTA 且 AP 不在線時，RC 可能失敗，且不被視為本功能驗收失敗。
* [ ] `_buildOtaWifiGuard()` 的判斷結果必須同時依賴 OTA config 存在與 STA Wi-Fi 已連線。
* [ ] RC master / slave 初始化不得在「OTA config 存在但 STA Wi-Fi 未連線」時跳過 channel setup。
* [ ] 所有 15 個 locale files 均已更新 `RC_SLAVE_INIT_TOOLTIP`。
* [ ] 所有 15 個 locale files 均已更新 `RC_MASTER_INIT_TOOLTIP`。
* [ ] 所有 15 個 locale files 均已新增 `CYBERBRICK_OTA_RC_CHANNEL_NOTE`。
* [ ] `npm run validate:i18n` 通過。
* [ ] `npm test` 通過。
* [ ] `buildCyberBrickOtaAgentSource()` body 未被修改。
* [ ] `CYBERBRICK_OTA_AGENT_TARGET_VERSION` 未被修改。
* [ ] `src/services/cyberbrickOtaUploader.ts` 未被修改。

## 假設

* CyberBrick RC 使用 ESP-NOW，其可用性受 Wi-Fi channel 是否一致影響。
* OTA config 存在只代表裝置有 OTA 設定，不代表目前已成功連上 AP。
* AP 在線且 STA Wi-Fi 已連線時，使用 AP channel 是可接受且預期的行為。
* AP 不在線時，停止 STA Wi-Fi 背景連線或掃描可降低對 ESP-NOW / RC 初始化的干擾。
* 15 個 locale files 是既有專案中需要同步維護的完整 locale 範圍。
* 既有測試與 i18n 驗證足以作為本 slice 的基本 regression gate。

## Codex Boundary

ChatGPT 已完成 specify 階段的產品意圖、使用者情境、功能需求、非功能需求、邊界情境、驗收標準與假設。Codex 接手後應以本 `spec.md` 為唯一需求來源，在 repository 內依 Spec Kit 流程建立或同步 feature spec，建議 feature root 為 `specs/062-cyberbrick-ota-rc-channel-conflict`，除非 repository 現況需要選擇另一個安全編號或 slug。Codex 不應在實作前擴大需求範圍，也不應修改本 spec 明確列為非目標的檔案或版本值。
END_FILE
END_SDD_OUTPUT
```
