# 契約：TXT 主題有效樣式

## 用途

主題有效樣式用來確保 TXT virtual button 在亮色、暗色與高對比主題中都能取得可讀的基礎配色，同時保留學生或教師在特定主題下手動調整過的顏色。

## 概念性資料結構

```typescript
type TxtThemeStyleName = 'light' | 'dark';

interface TxtThemeStyleEntry {
  backgroundColor: string;
  textColor: string;
  customized: true;
}

interface TxtThemeAwareButtonStyle {
  backgroundColor?: string;
  textColor?: string;
  themeStyles?: Partial<Record<TxtThemeStyleName, TxtThemeStyleEntry>>;
}

interface TxtEffectiveButtonStyle {
  backgroundColor: string;
  textColor: string;
  source: 'theme-default' | 'theme-manual' | 'legacy';
  theme: TxtThemeStyleName;
}
```

> 注意：這是行為契約，不要求一定新增同名 TypeScript interface；若實作選擇 WebView-local object，也必須滿足欄位語意。

## 主題初始色契約

- 當目前主題沒有 `themeStyles.light` 或 `themeStyles.dark` 手動記錄時，系統必須使用該主題的可讀初始色。
- 亮色與暗色的初始色必須不同，讓主題切換時視覺上能立即反映目前主題。
- 初始文字色必須依背景色選擇可讀的黑或白，或使用經驗證的等效可讀色。
- 初始色是呈現用基礎值；除非使用者實際在該主題手動調整，否則不得把初始色寫成該主題的 `customized` 記錄。

## 手動記錄契約

- 使用者在亮色主題調整背景或文字色時，只能建立或更新 `themeStyles.light`。
- 使用者在暗色主題調整背景或文字色時，只能建立或更新 `themeStyles.dark`。
- 切換主題不得把其中一個主題的手動記錄複製到另一個主題。
- 同一顆按鈕若亮色與暗色都已手動調整，來回切換與重新載入後都必須分別保留兩組數值。
- 手動記錄中的顏色是使用者內容；系統不得因主題切換或可讀性補強而自動改寫。

## 舊資料相容契約

- 舊版 `style.backgroundColor` 與 `style.textColor` 必須可被直接載入。
- 舊版單一配色不得導致資料遺失；若舊版欄位與系統亮色預設不同且缺少 `themeStyles`，WebView 可將它視為「載入時目前主題」的手動記錄來源，但不得自動複製到另一個主題。
- 若舊版欄位等同系統預設或無法解析，且目前主題缺少手動記錄，render 應回到目前主題的可讀初始色。
- 儲存時可以保留舊版欄位供舊邏輯相容，但不得因此抹除已存在的 `themeStyles.light` 或 `themeStyles.dark`。
- 無法解析的顏色應安全 fallback 到目前主題初始色，不得阻擋 panel、preview 或專案載入。

## 重新解析觸發條件

主題有效樣式必須在以下情況重新解析並重新 render：

- TXT virtual controls 首次 render。
- 使用者切換 VS Code/WebView 主題。
- 使用者在目前主題修改按鈕背景或文字色。
- 使用者新增、選取、重新命名或刪除 TXT virtual button。
- Preview 載入 TXT 備份或既有專案資料。
- 語言切換導致 readonly / state label 需要重繪。

## Edit / Preview 一致性契約

- Edit 與 preview 對同一份資料、同一個目前主題，必須解析出相同的有效背景色與文字色。
- Preview 只能呈現有效樣式與唯讀提示，不得建立、修改或儲存任何 `themeStyles`。
- Preview button 不得送出 `saveWorkspace`、`txtUpload`、`txtVirtualControlStateChanged` 或 runtime mutation messages。
- 非 TXT edit/preview 不得載入或顯示 TXT 專屬 panel、button style 或 keyboard guard。

## 安全契約

- 使用者提供的 `displayName`、`identifier` 與顏色字串不得作為原始 HTML 插入。
- 主題有效樣式解析不得執行或評估使用者提供的字串。
- 顏色解析與 fallback 不得發送網路請求，也不得依賴外部服務。