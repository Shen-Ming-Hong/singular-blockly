# 合規與隱私需求品質檢查清單：使用者回報功能

**Purpose**: 以正式發布審查者視角，檢查上架合規、資料保護與非 GitHub 使用者流程的需求是否完整、明確、一致且可衡量
**Created**: 2026-08-20
**Feature**: [spec.md](../spec.md)

**Note**: 本清單由 `$speckit-checklist` 依功能規格產生；檢查的是需求文字品質，不是程式實作結果。

## 需求完整性

- [x] CHK001 是否明確定義所有會自動蒐集、預設開啟、預設關閉與永不蒐集的資料欄位？[Completeness, Spec §資料最小化與同意]
- [x] CHK002 是否涵蓋回報建立、預覽、明確確認、查詢、補充、刪除單筆與刪除全部的完整生命週期？[Completeness, Spec §使用者情境]
- [x] CHK003 是否記載所有資料處理者、儲存位置、私人 GitHub 同步與公開揭露條件？[Completeness, Spec §隱私與資料處理]
- [x] CHK004 是否定義不用 GitHub 帳號、電子郵件或登入的身分恢復與遺失憑證情境？[Coverage, Spec §身分與復原]
- [x] CHK005 是否區分產品回報、資安弱點回報與支援聯絡管道，避免錯誤揭露？[Completeness, Spec §範圍與限制]

## 需求明確性

- [x] CHK006 「基本環境資訊」是否以允許清單逐欄定義，而不是使用可擴張的概括名稱？[Clarity, Spec §診斷資料契約]
- [x] CHK007 「近期事件」是否定義為結構化、有限筆數、排除原始記錄與錯誤文字的資料？[Clarity, Spec §診斷資料契約]
- [x] CHK008 截圖的格式、像素上限、檔案大小、重新編碼與中繼資料移除要求是否可客觀判定？[Measurability, Spec §截圖]
- [x] CHK009 刪除語意是否明確區分立即不可存取、非同步外部清除、無內容墓碑與備份限制？[Clarity, Spec §刪除]
- [x] CHK010 公開 issue 的「匿名摘要」與維護者核准權限是否有明確邊界？[Clarity, Spec §公開揭露]

## 一致性與追溯性

- [x] CHK011 規格中的預設同意、預覽內容與隱私政策描述是否使用同一組資料分類？[Consistency, Spec §資料最小化與同意]
- [x] CHK012 狀態與處理決定是否在使用者介面、後端狀態機與 GitHub 指令需求中保持分離？[Consistency, Spec §狀態與決定]
- [x] CHK013 私人 GitHub、公開 GitHub 與使用者入口的可見性規則是否彼此一致？[Consistency, Spec §可見性]
- [x] CHK014 成功準則是否能追溯到主要情境、例外情境、復原情境與非功能需求？[Traceability, Spec §成功準則]

## 情境與邊界涵蓋

- [x] CHK015 是否涵蓋離線、逾時、限流、重試、重複送出與部分成功等例外需求？[Coverage, Spec §邊界案例]
- [x] CHK016 是否涵蓋密鑰遺失、復原連結失效、工作階段逾時與跨裝置復原？[Coverage, Spec §邊界案例]
- [x] CHK017 是否涵蓋截圖超限、格式偽裝、中繼資料殘留與附件刪除失敗？[Coverage, Spec §邊界案例]
- [x] CHK018 是否涵蓋 GitHub webhook 重播、亂序、權限不足、同步延遲與永久失敗？[Coverage, Spec §邊界案例]
- [x] CHK019 是否定義惡意回報文字與提示注入不得影響維護者決策或觸發外部動作？[Security, Spec §維護者分流]

## 非功能與發布依賴

- [x] CHK020 是否明確要求鍵盤操作、ARIA、焦點、主題與高對比相容性？[Accessibility, Spec §無障礙]
- [x] CHK021 是否量化一般回報送出、500 筆分頁與分流建議的效能門檻？[Measurability, Spec §成功準則]
- [x] CHK022 是否把 HTTPS 服務、D1、私有 R2、GitHub App、Cloudflare Access 與正式網域列為外部依賴？[Dependency, Plan §部署拓樸]
- [x] CHK023 是否把有效政策網址、支援聯絡資訊、資料處理者揭露與備份說明列為上架前置條件？[Compliance, Spec §發布閘門]
- [x] CHK024 是否明確區分已可由程式驗證的要求與必須人工／法律審閱的發布閘門？[Clarity, Spec §發布閘門]

## Notes

- 24 項需求品質問題均可由現有 `spec.md`、`plan.md`、`research.md` 與契約文件得到明確答案。
- 實作驗證、正式部署與法律意見不屬於本清單；它們保留在 `tasks.md` 與發布檢查清單中。
