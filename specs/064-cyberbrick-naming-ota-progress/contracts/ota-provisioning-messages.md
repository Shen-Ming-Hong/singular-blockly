# 契約：CyberBrick OTA 設定訊息與進度

## 1. WebView → Extension Host

```text
{
  command: "cyberbrickOtaProvisionRequest",
  requestId: non-empty string,
  payload: {
    usbPort: non-empty string,
    friendlyName: string,
    ssid: non-empty string,
    wifiPassword: string
  }
}
```

### 邊界驗證

- `message`、`payload` 必須為一般物件，command 必須完全相符。
- `requestId`、`usbPort`、`friendlyName`、`ssid`、`wifiPassword` 必須為字串；必要字串 trim 後不得為空。
- 不接受陣列、函式、未知步驟或以物件冒充字串的值。
- 驗證失敗不得呼叫 provisioning service；回覆分類後的 `invalid-settings` 或既有必要欄位錯誤。
- 任何回覆不得複製原始 payload。

## 2. Extension Host → WebView progress

```text
{
  command: "cyberbrickOtaProvisionProgress",
  requestId: same requestId,
  success: true,
  payload: {
    step: "detect-usb" | "read-device-id" | "install-agent" |
          "configure-wifi" | "verify-agent" | "store-secrets",
    success: boolean,
    deviceId?: string,
    ipAddress?: string,
    error?: sanitized classified error
  }
}
```

`message` 可以省略；WebView 只依 step code、success 與安全 metadata 取得在地化文字，不直接呈現 Host 的英文訊息。

### 六階段計數

| 順序 | step | 完成條件 |
|------|------|----------|
| 1 | `detect-usb` | `success === true` |
| 2 | `read-device-id` | `success === true`；建立中的 false 狀態只更新文字 |
| 3 | `install-agent` | `success === true` |
| 4 | `configure-wifi` | `success === true` |
| 5 | `verify-agent` | `success === true` |
| 6 | `store-secrets` | `success === true` |

- 每個 step 最多貢獻 1。
- `scan-wifi` 不得出現在此 progress contract；即使收到也忽略。
- 未知 step、非布林 success、requestId 不符都忽略。
- WebView 必須把 progress 視為不可信輸入：外層訊息與 payload 皆須為非陣列的一般物件，command 必須完全相符，requestId 必須為目前非空字串，step 必須在 allowlist，success 必須為 boolean，選用 metadata 必須符合預期型別；任一條件不符時 reducer 與 DOM 完全不變。
- `store-secrets` 的 success 只有在秘密、配對裝置設定及回傳用 panel state 都建立成功後才可發出；發出後不得再等待可能失敗的持久化操作。

## 3. Extension Host → WebView result

### 成功

```text
{
  command: "cyberbrickOtaProvisionResult",
  requestId: same requestId,
  success: true,
  payload: {
    status: "succeeded",
    steps: sanitized steps,
    panelState: existing sanitized panel state,
    ...existing non-secret result fields
  }
}
```

WebView 轉為 `succeeded`、顯示完整進度條、醒目勾勾與在地化「設定完成」摘要，清空並隱藏密碼、解除控制項。學生畫面不顯示數字比例。

### 失敗

```text
{
  command: "cyberbrickOtaProvisionResult",
  requestId: same requestId,
  success: false,
  payload?: sanitized partial result,
  error: {
    code: known error code,
    message: sanitized string,
    nextActions: sanitized string[]
  }
}
```

WebView 轉為 `failed`、讓進度條停在 completed steps 對應的位置、保留密碼、記錄失敗 step、解除控制項，並顯示失敗圖示、在地化失敗階段與重試摘要。

### Result 邊界驗證

- 外層 result 必須為非陣列的一般物件，command 必須完全相符，requestId 必須是目前請求，success 必須為 boolean。
- success result 的 payload 必須含允許的 succeeded 狀態與安全 panel state；failure result 的 error 必須符合已知錯誤代碼及安全字串／字串陣列型別。
- 未知 command、缺漏或錯型欄位、未知狀態、stale request、含非 allowlist 結構的 progress／result 都必須忽略，且不得清密碼、解除目前請求的鎖定或改變 reducer／DOM。

## 4. 單一執行契約

當 provisioning 已在執行：

```text
{
  command: "cyberbrickOtaProvisionResult",
  requestId: second requestId,
  success: false,
  error: {
    code: "provisioning-in-progress",
    ...sanitized localized mapping
  }
}
```

- 第二個請求不得呼叫任何 USB、身分、代理、Wi-Fi 或秘密保存操作。
- 第二個請求不取代第一個請求的 WebView `activeRequestId`；正常 UI 不會送出第二個請求，此契約保護異常／重複訊息。
- 第一個請求成功、回傳失敗或 throw 後都釋放鎖；下一個新請求可執行。

## 5. WebView 控制項鎖定

`status === 'running'` 時至少禁用：

- USB port select
- refresh USB ports
- friendly name input
- Wi-Fi SSID select
- rescan Wi-Fi
- Wi-Fi password input與顯示切換
- provision button
- OTA cleanup button
- 配對裝置的 Use／Delete actions

modal 關閉按鈕可維持可用；關閉不取消請求、不清除 state。重新開啟後依 state 重新禁用控制項。

## 6. Progressbar DOM 契約

```text
role="progressbar"
aria-valuemin="0"
aria-valuemax="6"
aria-valuenow="0..6"
aria-valuetext="localized current stage or final status"
aria-labelledby="cyberbrickProvisioningProgressLabel"
```

- 學生可見區域使用醒目的大型水平進度條，不顯示 `n/6`、百分比或其他數字比例。
- running 顯示執行中圖示、「正在設定無線上傳」、目前階段及「請勿重複按下或拔除 USB」提示。
- live status 與 `aria-valuetext` 以簡單階段文字宣告變更，不要求使用者解讀數字比例。
- success 顯示完整進度條、勾勾與完成文字；failed 讓進度條停在目前位置並顯示失敗圖示、階段與重試提示。
- success、failed、running 使用文字、圖示與 class 的組合，不可只用綠／紅顏色表達。

## 7. 敏感資料禁止項目

下列資料不得出現在 progress、result、toast、ARIA text 或 log：

- `wifiPassword` 的值
- `otaToken` 的值
- `pairingSecret` 的值
- 完整原始 provisioning payload

允許回傳布林 presence（例如某秘密是否已保存）、分類錯誤碼、deviceId 與 IP address，沿用現有 sanitized panel state 契約。
