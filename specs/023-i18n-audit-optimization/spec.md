# Feature Specification: i18n 審計機制優化

**Feature Branch**: `023-i18n-audit-optimization`  
**Created**: 2025-12-31  
**Status**: Draft  
**Input**: User description: "i18n 白名單更新與審計機制優化：解決 Issue #29 的翻譯誤報問題，將技術專有名詞加入白名單，調整不適用於 AI 翻譯工作流程的自動檢測規則，修復俄語變數名稱錯誤"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - 消除技術專有名詞誤報 (Priority: P1)

作為一名開發者，當我提交包含 CyberBrick、LED、GPIO、WiFi 等技術專有名詞的翻譯時，我希望審計系統不要將這些保留英文的術語標記為「缺少翻譯」或「直接翻譯」錯誤，這樣我就不會被無意義的警告干擾開發流程。

**Why this priority**: 這是 Issue #29 報告的 31 個高嚴重度問題的根本原因，直接影響 PR 審核流程和開發效率。

**Independent Test**: 可透過執行 `npm run validate:i18n` 驗證，確認 CyberBrick 相關的 key 不再產生誤報。

**Acceptance Scenarios**:

1. **Given** 翻譯檔案中 `CATEGORY_CYBERBRICK_CORE` 的值為 "CyberBrick", **When** 執行翻譯審計, **Then** 該 key 不被標記為任何錯誤類型
2. **Given** 翻譯檔案中 `CATEGORY_CYBERBRICK_LED` 的值為 "LED", **When** 執行翻譯審計, **Then** 該 key 不被標記為 `missingTranslation`
3. **Given** 翻譯檔案中包含 `*_HELPURL` 結尾的 key 且值為英文 URL, **When** 執行翻譯審計, **Then** 所有 HELPURL key 不被標記為任何錯誤

---

### User Story 2 - 修復俄語變數名稱錯誤 (Priority: P1)

作為一名使用俄語介面的使用者，我希望 `CONTROLS_IF_ELSE_TITLE_ELSE` 的翻譯能正確顯示，而不是因為變數名稱中混用西里爾字母導致找不到翻譯。

**Why this priority**: 這是實際的功能缺陷，會導致俄語使用者看到英文 fallback 而非俄語翻譯。

**Independent Test**: 可透過在俄語環境中開啟 Blockly 編輯器，確認 if-else 積木顯示「иначе」而非「else」。

**Acceptance Scenarios**:

1. **Given** 俄語翻譯檔案中 `CONTROLS_IF_ELSE_TITLE_ELSE` 使用正確的拉丁字母 E, **When** 使用者以俄語介面開啟編輯器, **Then** if-else 積木的「else」部分顯示為「иначе」
2. **Given** 執行翻譯變數一致性檢查, **When** 比較俄語與繁體中文的變數名稱, **Then** 兩者的 key 數量和名稱完全一致

---

### User Story 3 - 減少 CJK 語言誤報 (Priority: P2)

作為一名維護日文、韓文、繁體中文翻譯的開發者，我希望審計系統能理解 CJK 語言的字元效率較高（用較少字元表達相同意思），不要因為翻譯長度與英文相近就標記為「直接翻譯」或「長度過短」。

**Why this priority**: CJK 語言佔審計問題的 51%（ja 312 + ko 299 + zh-hant 390 = 1001/1986），放寬閾值可大幅減少誤報。

**Independent Test**: 可透過對比修改前後的審計報告，確認 CJK 語言的 `directTranslation` 和 `lengthOverflow` 問題數量減少 50% 以上。

**Acceptance Scenarios**:

1. **Given** 日文翻譯的字元數為英文的 70%, **When** 執行翻譯審計, **Then** 不被標記為 `directTranslation`（因在 ±40% 容許範圍內）
2. **Given** 繁體中文翻譯的長度為英文的 35%, **When** 執行翻譯審計, **Then** 不被標記為 `lengthOverflow`（因 CJK 下限已放寬至 30%）

---

### User Story 4 - 降級無母語者可確認的檢測 (Priority: P2)

作為一名使用 AI 輔助翻譯的維護者，我希望「文化適切性」（culturalMismatch）檢測只產生警告而非錯誤，因為我沒有母語者可以確認韓文敬體或德文正式語氣是否真的不適當。

**Why this priority**: culturalMismatch 檢測需要母語者判斷，在 AI 翻譯工作流程中產生阻擋性錯誤是不合理的。

**Independent Test**: 可透過檢查 PR 是否因 culturalMismatch 而失敗來驗證。

**Acceptance Scenarios**:

1. **Given** 韓文翻譯使用 `습니다` 敬體結尾, **When** 執行翻譯審計, **Then** 問題嚴重性為 `low` 而非 `high` 或 `medium`
2. **Given** GitHub Actions 執行 i18n-audit 工作流程, **When** 僅存在 culturalMismatch 問題, **Then** PR 不會被標記為失敗

---

### Edge Cases

-   當白名單規則的 pattern 使用萬用字元（如 `*_HELPURL`）時，系統使用 glob 模式匹配
-   當某個 key 同時符合多個白名單規則時，匹配第一個規則即停止，避免重複計算
-   當新增的 CyberBrick key 不在白名單中時，正常執行審計檢測

## Requirements _(mandatory)_

### Functional Requirements

-   **FR-001**: 系統 MUST 在白名單中支援 `cyberbrick-brand-terms` 規則，涵蓋 `BOARD_CYBERBRICK`、`CATEGORY_CYBERBRICK_CORE`、`CATEGORY_CYBERBRICK_LED`、`CATEGORY_CYBERBRICK_GPIO`、`CATEGORY_CYBERBRICK_WIFI` 等品牌名稱
-   **FR-002**: 系統 MUST 在白名單中支援 `technical-acronyms-global` 規則，涵蓋 LED、GPIO、WiFi、PWM、I2C、LCD、UART 等國際技術縮寫
-   **FR-003**: 系統 MUST 在白名單中支援 `helpurl-exclusion` 規則，使用 `*_HELPURL` 模式排除所有技術文件 URL
-   **FR-004**: `checkDirectTranslation()` MUST 對 CJK 語言（ja、ko、zh-hant）使用 ±40% 的長度比對閾值（原為 ±20%）
-   **FR-005**: `checkLengthOverflow()` MUST 對 CJK 語言使用 30% 的最小長度下限（原為 50%）
-   **FR-006**: `checkCulturalMismatch()` MUST 將所有檢測結果的嚴重性設為 `low`
-   **FR-007**: GitHub Actions i18n-audit 工作流程 MUST 在 PR 失敗條件中排除 `culturalMismatch` 類型
-   **FR-008**: 俄語翻譯檔案 MUST 將 `CONTROLS_IF_ELSE_TITLE_ELСЕ`（西里爾字母 Е）修正為 `CONTROLS_IF_ELSE_TITLE_ELSE`（拉丁字母 E）
-   **FR-009**: 白名單版本 MUST 更新為 `1.2.0`，`lastUpdated` MUST 更新為 `2025-12-31T00:00:00Z`

### Key Entities

-   **Whitelist Rule（白名單規則）**: 定義哪些翻譯 key 應被排除在特定檢測類型之外，包含 ruleId、description、languages、patterns、rationale
-   **Issue Type（問題類型）**: 審計檢測的分類，包含 missingTranslation、directTranslation、culturalMismatch、lengthOverflow
-   **Severity Level（嚴重性等級）**: 問題的優先級，包含 high、medium、low

## Success Criteria _(mandatory)_

### Measurable Outcomes

-   **SC-001**: 執行翻譯審計後，高嚴重度問題數量從 31 降至 5 以下
-   **SC-002**: CyberBrick 相關的 key（BOARD*CYBERBRICK、CATEGORY_CYBERBRICK*\*）不產生任何審計問題
-   **SC-003**: 所有 `*_HELPURL` 結尾的 key 不產生任何審計問題
-   **SC-004**: CJK 語言（ja、ko、zh-hant）的 `directTranslation` 問題減少 50% 以上
-   **SC-005**: CJK 語言的 `lengthOverflow`（過短）問題減少 40% 以上
-   **SC-006**: PR 不會因為 `culturalMismatch` 類型的問題而自動失敗
-   **SC-007**: 俄語翻譯檔案的變數數量從 452 恢復為 453，與繁體中文一致
-   **SC-008**: 俄語介面正確顯示 if-else 積木的「иначе」翻譯

## Assumptions

-   品牌名稱（CyberBrick）和國際技術縮寫（LED、GPIO、WiFi）保留英文是業界標準做法
-   AI 輔助翻譯的品質已通過網路搜尋當地文章驗證，符合在地化用詞習慣
-   culturalMismatch 檢測在沒有母語者審核的情況下，其結果不具備足夠的可信度作為阻擋條件
-   CJK 語言的字元效率約為英文的 0.3-0.7 倍，±40% 的容許範圍是合理的

## Dependencies

-   Issue #29: 本功能完成後應關閉該 issue
-   `scripts/i18n/audit-whitelist.json`: 白名單設定檔
-   `scripts/i18n/audit-translations.js`: 審計檢測邏輯
-   `.github/workflows/i18n-audit.yml`: GitHub Actions 工作流程
-   `media/locales/ru/messages.js`: 俄語翻譯檔案
