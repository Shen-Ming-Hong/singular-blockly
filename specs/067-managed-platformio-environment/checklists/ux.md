# UX 需求品質檢查清單：同意邊界與 OTA 共用進度

**目的**：供 F5 驗收與 PR reviewer 檢查一般資料夾同意流程及 CyberBrick OTA 進度需求是否清楚、可觀察且符合可及性

**建立日期**：2026-08-16

**功能規格**：[spec.md](../spec.md)

**Note**：本清單檢查需求文字品質，不取代 WebView 自動測試或人工視覺驗收。

## 一般資料夾同意流程

- [x] UX001 安全詢問是否在任何 Project Skill、Blockly 專案檔或 workspace setting 寫入前出現？[Sequence, Spec §US7, FR-032]
- [x] UX002 取消、Escape 與關閉詢問是否具有相同、無副作用且可驗證的結果？[Consistency, Spec §US7.1, FR-033]
- [x] UX003 「不再提醒」是否清楚定義為本次繼續加上未來偏好，而不是背景隱式同意？[Clarity, Spec §US7.3]
- [x] UX004 既有 Blockly 專案是否保留低干擾的靜默維護，避免每次開啟重複詢問？[Continuity, Spec §US7.4, FR-034]
- [x] UX005 取消後不變更資料夾的承諾是否具體列出所有可能受影響的目錄，而非只描述「不建立專案」？[Measurability, Spec §SC-012]

## 共用進度與操作回饋

- [x] UX006 OTA 設定與清除是否使用同一個固定位置的進度 surface，避免使用者在不同 accordion 尋找狀態？[Consistency, Spec §FR-035]
- [x] UX007 每個操作是否在 Host request 送出前進入 running state，讓慢速或失敗的裝置連線也有立即回饋？[Responsiveness, Spec §US8.1, SC-013]
- [x] UX008 執行中是否明確要求鎖定所有衝突控制項，避免重複提交或同時設定／清除？[Error Prevention, Spec §US8.1]
- [x] UX009 OTA 設定是否只依實際完成里程碑前進，且不向學生顯示分數或百分比？[Truthfulness, Spec §US8.2, FR-037]
- [x] UX010 OTA 清除缺少中間事件時是否採 indeterminate，而非假設時間或虛構完成率？[Truthfulness, Spec §US8.3, FR-037]
- [x] UX011 成功與失敗是否都有圖示、文字、色彩／邊框及控制項解鎖，避免只靠單一視覺線索？[Feedback, Spec §US8.4]
- [x] UX012 modal 關閉再開或 panel state 更新時，需求是否要求保留目前 operation 與 terminal state，不被不相關 render 清除？[State Continuity, Spec §US8]

## 可及性、主題與文案

- [x] UX013 determinate 與 indeterminate progress 是否分別定義 `aria-valuenow` 的存在規則、`aria-valuetext` 與 live status？[Accessibility, Spec §FR-037]
- [x] UX014 亮色、暗色與 forced-colors 是否使用既有 theme token 並具有可辨識的 running／success／failure 對比？[Accessibility, Spec §FR-036, SC-014]
- [x] UX015 reduced-motion 是否停止非必要動畫，同時保留靜態 running 提示而不讓進度看似消失？[Accessibility, Spec §US8.5, FR-036]
- [x] UX016 所有使用者可見進度文案是否沿用 15 語系契約，且不直接呈現 Host 傳入的 HTML 或未在地化 step message？[Localization/Security, Spec §FR-026, FR-035–FR-037]

## 備註

- 自動化契約負責 DOM 位置、操作前 render、ARIA 狀態、theme token 與安全文字渲染；人工 F5 仍需確認實際視覺層級、對比與 reduced-motion 體感。
- 若人工驗收發現 running state 不明顯，應先修訂 FR-036／SC-014 的可量測門檻，再調整樣式，避免以未記錄的主觀樣式變更取代需求決策。
