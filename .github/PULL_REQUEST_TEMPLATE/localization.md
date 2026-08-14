## 🌍 Localization Changes

**Locales / surfaces**: [例如 `ja`, `package-nls`, `sample-index`]
**Fixes Issue**: #[issue-number]
**i18n-maintenance result**: [PASS / PASS_WITH_ADVISORIES / NEEDS_USER_DECISION / BLOCKED]

## Changes Summary

- 變更的 key／範例數量：
- 使用者可見行為或語意：
- 使用的 policy version：
- 是否觸發／恢復 full audit：

## Important Before/After Examples

只列有語意、術語或 UI 影響的代表性項目；不要求湊滿數量。

| Surface / key | Before | After | Rule ID / rationale |
| --- | --- | --- | --- |
| | | | |

## Automated Validation

- [ ] `npm run validate:i18n`
- [ ] `npm run test:i18n`
- [ ] `npm run lint:i18n`
- [ ] `npm run ci:static`（發布前）
- [ ] 所有 finding 都包含 rule ID、severity、evidence 與具體情境
- [ ] 沒有未結案的 deterministic error、Blocker 或本次明確 Major

## User Decisions and Waivers

若有 `ambiguous` Major，記錄產品負責人的明確決定；沒有則填「無」。

| Finding ID | Literal back-translation | Options / risk | Decision and rationale |
| --- | --- | --- | --- |
| | | | |

## Manual and UI Validation

- [ ] 按鈕／選單動作與實際效果一致
- [ ] 警告、錯誤與復原步驟可理解
- [ ] 8–14 歲使用者能理解發生什麼、要做什麼、結果是什麼
- [ ] 必要技術名稱、數值、單位與識別字保持正確
- [ ] ARIA 說明用途／狀態，不只描述顏色或位置
- [ ] 受影響 UI 無截斷或溢出，已測試適用的亮／暗主題
- [ ] 語言切換與 fallback 正常

## Screenshots

如翻譯影響按鈕、對話框、工具箱、tooltip 或範例卡片版面，附上前後截圖；否則說明不適用。

## Residual Risk

- 未提供 optional sample locale：
- Full-audit 既有 Major backlog：
- 其他無法由非母語 reviewer 排除的風險：
