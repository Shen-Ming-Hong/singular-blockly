# Feature Specification: 編輯器主題 surface 一致性

**Feature Branch**: `057-editor-theme-surface-consistency`  
**Created**: 2026-05-23  
**Status**: Draft  
**Input**: User description: 「在 VS Code 深色模式下，即使 Blockly 編輯器切到淺色，編輯器內的主題也應保持一致，不受 VS Code host theme 干涉；這次先聚焦 editor-owned surfaces 的主題一致性，不把全面統一提示方法納入同一輪。」

## Clarifications

### Session 2026-05-23

- Q: 這一輪是否要全面統一所有提示方法？ → A: 不需要。本輪只修正 editor-owned 主題 surface 一致性，僅對本輪觸及到的提示補最小的一致性與可讀性守則，不建立全域提示框架。
- Q: 哪些區塊屬於本輪核心範圍？ → A: 至少包含 TXT 控制器連線設定視窗、Sample Browser，以及 TXT virtual controls 的 editor-owned chrome；次要編輯輔助覆層屬 smoke-check / opportunistic 範圍，若本輪剛好碰到可一起修，但不作為 057 完成門檻。
- Q: 是否要一併調整刻意跟隨 VS Code 主題的獨立頁面？ → A: 不需要。刻意 host-themed 的獨立頁面維持現狀，不納入本輪修正。
- Q: 次要編輯輔助覆層（例如 shadow suggestion hint）在 057 應算哪種 scope？ → A: 列為 smoke-check / opportunistic 範圍；若本輪剛好碰到可一起修，但不作為 057 完成門檻。
- Q: 當使用者在視窗已開啟時切換 Blockly editor 主題，057 應要求哪種更新行為？ → A: 所有本輪 touched surfaces 都必須立即更新；若次要覆層在本輪被觸及，也必須在主題切換時立即更新，而不是等到下次開啟。
- Q: 「立即更新」如何判定？ → A: 使用者觸發 editor theme switch 後，不得 reload WebView、不得關閉再開啟 surface；`updateTheme(theme)` 完成後，下一次瀏覽器 repaint 應呈現新 editor theme，且已輸入內容、scroll state 與使用者自訂控制顏色需保留。
- Q: 高對比 smoke check 的最低通過標準是什麼？ → A: 主要文字可讀、input/card/panel 邊界可辨識、focus ring 可見、主要操作按鈕可辨識、必要 status/hint 沒有消失，且使用者可完成核心操作。

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 主要編輯器視窗在交錯主題下仍保持一致 (Priority: P1)

教師或學生在 Blockly 編輯器中選擇了淺色或深色主題後，希望即使外層 VS Code 使用相反主題，像 TXT 控制器連線設定視窗與 Sample Browser 這些主要操作視窗仍看起來屬於同一個編輯器，而不是混入另一套配色與表單樣式。

**Why this priority**: 這直接對應目前最明顯的體驗問題。若主要操作視窗仍混入 host theme，使用者會立刻感覺介面破碎，並誤以為設定沒有正確套用。

**Independent Test**: 先把 VS Code 與 Blockly 編輯器切成相反主題，然後分別開啟 TXT 控制器連線設定視窗與 Sample Browser；若兩者都維持 editor theme 的一致外觀，此故事即可獨立驗證。

**Acceptance Scenarios**:

1. **Given** VS Code 為深色而 Blockly 編輯器為淺色，**When** 使用者開啟 TXT 控制器連線設定視窗，**Then** 視窗中的輸入欄、標籤、按鈕與說明文字都應與編輯器淺色主題一致，而不是混入深色 host 風格。
2. **Given** VS Code 為淺色而 Blockly 編輯器為深色，**When** 使用者開啟 Sample Browser，**Then** 其視窗表面、卡片、按鈕與狀態提示都應與編輯器深色主題一致且容易閱讀。
3. **Given** 使用者在主要視窗開啟期間切換 Blockly 編輯器主題，**When** 新主題生效，**Then** 已開啟的主要視窗也應立即更新為一致的新主題，而不需要關閉再重開。

---

### User Story 2 - 編輯器控制面與外框維持單一主題 owner (Priority: P1)

教師或學生在使用 TXT virtual controls 等編輯器控制面時，希望外框、面板、控制區與狀態性表面看起來都屬於同一套編輯器主題；即使使用者為控制元件挑選自己的顏色，周圍的編輯器外框也不應突然像另一個應用程式。

**Why this priority**: 這影響的是整體信任感與可讀性。即使功能可用，若同一畫面中有一部分像 editor、一部分像 host，使用者仍會感覺主題切換失效或系統不穩定。

**Independent Test**: 在交錯主題情境下開啟 TXT virtual controls，確認外框、面板與狀態性表面一致，同時控制元件自訂顏色仍保持清楚可辨識。

**Acceptance Scenarios**:

1. **Given** Blockly 編輯器與 VS Code 使用不同主題，**When** 使用者檢視 TXT virtual controls 的外框、面板與操作區，**Then** 這些 editor-owned 表面應保持單一主題 owner，而非同時混入兩套主題風格。
2. **Given** 使用者已自訂某些控制元件顏色，**When** 檢視 virtual controls 的整體畫面，**Then** 編輯器外框與狀態性表面仍應清楚可辨，且不會因自訂顏色而失去可讀性。
3. **Given** 本輪順手碰到某個次要編輯輔助覆層出現在畫面中，**When** 使用者查看其背景、文字與邊界，**Then** 其外觀應與目前編輯器主題相容，或被明確視為刻意例外。
4. **Given** 本輪順手碰到的次要編輯輔助覆層正顯示在畫面上，**When** 使用者切換 Blockly 編輯器主題，**Then** 該覆層也應立即更新為新主題，而不是保留舊主題直到下次開啟。

---

### User Story 3 - 本輪觸及到的提示維持原意且更容易看懂 (Priority: P2)

教師或學生在本輪會碰到的說明文字、離線提醒或輔助提示中，希望看到的仍是熟悉的提示方式，而不是突然變成另一種互動模式；同時這些提示必須在不同主題下仍清楚可讀，不需要把滑鼠移上去才知道重要資訊。

**Why this priority**: 使用者這次要的是主題一致性，不是重新學一套提示系統。保留既有提示角色、只補最小可用性守則，能避免範圍膨脹又能提升體驗。

**Independent Test**: 在本輪觸及的視窗中依序觸發既有說明文字或狀態提示，確認它們仍保留原本角色，且在兩種 editor 主題下都清楚可見。

**Acceptance Scenarios**:

1. **Given** 本輪觸及到的某個說明文字、離線提醒或輔助提示已存在，**When** 此功能調整其外觀，**Then** 它仍應保留原本的提示角色，而不是被改造成另一種全新互動方式。
2. **Given** 某個本輪觸及的提示承擔重要指引功能，**When** 使用者以鍵盤、觸控板或一般點擊方式操作，**Then** 他不需要依賴滑鼠懸停才看得到關鍵資訊。
3. **Given** 本輪改動到任何可見文字，**When** 使用者切換到任一支援語言，**Then** 這些文字都應保持完整、本地化且語意一致。

---

### User Story 4 - 在高對比與交錯主題情境下仍可完成核心操作 (Priority: P3)

對需要較高可視對比的使用者來說，即使這次主要修的是 editor light/dark 一致性，至少也希望本輪觸及到的表面在高對比情境下不會出現明顯看不清、找不到按鈕或無法辨認提示的問題。

**Why this priority**: 高對比不是這次的主軸，但若修完主題一致性卻讓某些表面更難看清，會抵銷本次改善的價值。

**Independent Test**: 對本輪觸及的主要視窗做一次高對比 smoke check，確認仍能辨識主要操作、邊界與提示。

**Acceptance Scenarios**:

1. **Given** 使用者以高對比偏好的方式檢視本輪觸及的主要視窗，**When** 他查看主要按鈕、欄位與提示，**Then** 這些元素仍應可辨識，不會因主題調整而消失在背景中。
2. **Given** 使用者在交錯主題情境下執行 TXT 連線設定、打開 Sample Browser 或檢視 virtual controls，**When** 他完成核心操作，**Then** 不需要透過切回相同主題或使用變通方式才能看懂介面。

### Edge Cases

- VS Code 與 Blockly 編輯器使用相反主題時，本輪納入的主要視窗不應出現一半像 editor、一半像 host 的混合外觀。
- 使用者在主要視窗開啟期間切換 editor 主題時，畫面不應停留在舊主題的殘留狀態。
- 若本輪觸及到的次要編輯輔助覆層正在顯示，切換 editor 主題後也不應殘留舊主題外觀直到下次開啟。
- 使用者為 TXT virtual controls 選擇非常接近背景的自訂顏色時，外框、狀態性表面與主要操作仍應可辨識。
- 離線提示、說明文字或輔助提示在較長翻譯字串下，仍應完整顯示並保持可讀。
- 刻意 host-themed 的獨立頁面不應因本次修正而被意外改成 editor-themed。

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系統 MUST 讓 Blockly 編輯器維持獨立選定的淺色或深色主題，不受外層 VS Code 主題改變而被覆蓋。
- **FR-002**: 所有列入本輪範圍的 editor-owned 表面 MUST 跟隨目前的 Blockly 編輯器主題，而不是跟隨外層 VS Code 主題。
- **FR-003**: 本輪主要範圍 MUST 至少包含 TXT 控制器連線設定視窗與 Sample Browser 這兩個主要操作視窗。
- **FR-004**: 在 TXT 控制器連線設定視窗中，輸入欄、標籤、按鈕與說明文字 MUST 與目前的編輯器主題保持一致且可讀。
- **FR-005**: 在 Sample Browser 中，視窗表面、卡片、主要操作按鈕與狀態提示 MUST 與目前的編輯器主題保持一致且可讀。
- **FR-006**: 在 TXT virtual controls 中，外框、面板、操作區與狀態性表面 MUST 與目前的編輯器主題保持一致，同時保留使用者自訂控制元件顏色的可辨識性。
- **FR-007**: 本輪觸及到的說明文字、離線提醒與輔助提示 MUST 在淺色與深色 editor 主題下都保持可讀。
- **FR-008**: 當本輪功能調整既有提示的外觀時，系統 MUST 保留該提示原本的角色與使用情境，除非為了維持可讀性或可用性而需要最小必要調整。
- **FR-009**: 本輪觸及到的重要指引 MUST 在一般操作情境下可直接看見，MUST NOT 僅依賴滑鼠懸停才能取得。
- **FR-010**: 本輪改動到的所有可見文字 MUST 在所有支援語言中維持完整且一致的本地化內容。
- **FR-011**: 本輪納入的表面 MUST 在 Blockly 編輯器主題與 VS Code 主題相反時仍保持可用與可讀。
- **FR-012**: 系統 MUST 明確區分 editor-owned 表面與刻意 host-themed 的例外頁面，且 MUST NOT 將刻意 host-themed 的獨立頁面納入本輪主題修正。
- **FR-013**: TXT 連線設定、Sample Browser 與 TXT virtual controls 的既有核心操作 MUST 在本次主題一致性調整後保持可完成。
- **FR-014**: 本輪觸及到的表面 MUST 讓使用者在不依賴單一顏色的情況下辨認主要操作、邊界與重要訊息。
- **FR-015**: 若本輪順手碰到任何次要編輯輔助覆層，其外觀 MUST 與目前 editor 主題相容，或在發布前被明確記錄為刻意例外；但這些覆層本身 MUST NOT 成為 057 的完成門檻。
- **FR-016**: 當使用者在本輪任一 touched surface 顯示期間切換 editor 主題，系統 MUST 在不 reload WebView、不關閉再開啟 surface 的前提下，於 `updateTheme(theme)` 完成後的下一次瀏覽器 repaint 讓該 surface 呈現新主題，並保留已輸入內容、scroll state 與使用者自訂控制顏色。

### Key Entities *(include if feature involves data)*

- **Editor-Owned Surface**: Blockly 編輯器內應跟隨 editor 主題的可見表面，例如主要操作視窗、面板、外框與說明區。
- **Touched Feedback Element**: 本輪會被外觀調整的既有提示元素，例如說明文字、離線提醒或輔助提示；其角色應保持穩定，不重新定義成全新提示系統。
- **Theme Ownership Exception**: 經過明確界定、刻意保留為 host-themed 的頁面或表面，不屬於本輪 editor theme 一致性修正範圍。
- **Core Editor Workflow**: 使用者在本輪範圍內必須能持續完成的主要流程，包括設定 TXT 連線、瀏覽範例與檢視 TXT virtual controls。

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 在至少四組 light/dark 驗證組合（包含相同與相反主題組合）的檢查矩陣中，100% 的 P1 範圍表面都不再出現混合主題造成的明顯錯配、不可讀文字或不協調表單外觀。
- **SC-002**: 驗證人員能在每個必要主題組合中完成一次 TXT 連線設定檢視、一次 Sample Browser 開啟，以及一次 TXT virtual controls 檢視，而不需要切換回相同主題作為變通方式。
- **SC-003**: 本輪改動到的所有可見文字在支援語言驗證樣本中皆保持完整本地化，且不出現硬編碼或遺漏翻譯。
- **SC-004**: 本輪觸及到的重要說明文字與提示在兩種 editor 主題下都可直接看見，不需要依賴滑鼠懸停才理解核心操作。
- **SC-005**: 在本輪觸及表面的高對比 smoke check 中，主要文字可讀、input/card/panel 邊界可辨識、focus ring 可見、主要操作按鈕可辨識、必要 status/hint 沒有消失，且不出現阻礙使用者完成核心流程的可讀性問題。

## Out of Scope

- 全域 toast、warning、dialog、status message 的全面統一重構。
- 重新設計整個 extension 的提示命名、提示層級或回饋框架。
- 刻意跟隨 VS Code host theme 的獨立頁面改版。
- 將所有次要編輯輔助覆層列為本輪必修修正目標。
- 與本輪主題一致性無關的全面視覺重設計。

## Assumptions

- 本次功能只聚焦於已確認的 editor-owned 主題 surface 一致性問題，不擴張成完整的提示系統治理專案。
- 本輪若碰到既有提示元素，預設沿用原本提示角色，只做最小必要的可讀性與一致性調整。
- 驗證主軸為 Blockly 編輯器的淺色與深色主題；高對比需求以 smoke-check 等級驗收為主。
- 使用者在 TXT virtual controls 中設定的自訂顏色仍應被保留；本輪主要修正的是其周圍 editor-owned chrome。
- 刻意 host-themed 的獨立頁面將維持現有設計，以避免把不同 owner 的介面混為同一輪變更。