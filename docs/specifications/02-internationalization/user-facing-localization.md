# 使用者介面與範例名稱在地化

本文件整理安全警告與 CyberBrick 範例工作區的在地化契約。兩者都以繁體中文為原始內容，並保留英文後援；其餘語系不得因缺少翻譯而阻斷主要功能。

## 專案安全警告

> 來源：`specs/047-warning-i18n-kid-friendly`（2025-07）

非 Blockly 專案的安全警告面向 8–14 歲使用者，文案應描述「將建立 Blockly 資料夾和檔案」等具體結果，避免只使用「workspace」或「project」等抽象詞。Node.js、Python 等可辨識的技術名稱可以保留。

所有 15 個語系必須提供以下訊息鍵：

- `SAFETY_WARNING_BODY_NO_TYPE`
- `SAFETY_WARNING_BODY_WITH_TYPE`
- `BUTTON_CONTINUE`
- `BUTTON_CANCEL`
- `BUTTON_SUPPRESS`
- `SAFETY_GUARD_CANCELLED`
- `SAFETY_GUARD_SUPPRESSED`

`SAFETY_WARNING_BODY_WITH_TYPE` 必須恰好含一個 `{0}`，無類型版本不得含替換參數。建議限制為警告本文 200 字、按鈕 15 字、結果回饋 100 字以內。`workspaceValidator.ts` 與 `webviewManager.ts` 的英文後援文字要與英文語系檔一致；既有「不再提醒」工作區偏好則保持相容。

## CyberBrick 範例名稱翻譯

> 來源：`specs/049-sample-name-i18n`（2026-04）

範例 JSON 可在頂層加入選用的 `nameTranslations`：

```json
{
  "nameTranslations": {
    "variables": {
      "原始變數": { "en": "sensor_value" }
    },
    "functions": {
      "原始函式": { "en": "read_sensor" }
    }
  }
}
```

翻譯涵蓋工作區變數、函式定義名稱與參數，以及對應呼叫積木的名稱與參數。轉換必須在深層複本上進行，不得修改記憶體中的原始範例資料；沒有 `nameTranslations` 的舊範例仍照原樣載入。

名稱解析順序為目標語系、英文、原始繁體中文。翻譯值必須符合目前實作的 ASCII 識別名稱規則 `[A-Za-z_][A-Za-z0-9_]*`；無效值要記錄警告並繼續嘗試下一層後援。此規則以已完成規格與現行 `sampleBrowserService.ts` 為準，取代早期研究稿曾考慮的 Unicode 識別名稱方案。

函式定義與呼叫之間必須使用同一翻譯結果，並同步處理 mutation／extra state 與巢狀的 input、shadow、next 結構，避免只改畫面文字卻破壞程式關聯。
