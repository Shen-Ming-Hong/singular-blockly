# 資料模型：CyberBrick 命名防呆與 OTA 設定進度

**日期**：2026-08-04
**功能**：`064-cyberbrick-naming-ota-progress`

本功能不新增持久化 schema；以下模型皆為驗證結果、工作區衍生資料或單次 OTA 執行狀態。

## 1. 名稱驗證結果（NameValidationResult）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `rawName` | string | 使用者輸入或舊工作區保存的原始名稱。 |
| `normalizedName` | string | 只移除前後空白後的名稱。 |
| `severity` | `valid \| warning \| error` | 是否接受、提醒或阻擋。 |
| `code` | NameValidationCode | 穩定、可測試且可對應語系 key 的結果代碼。 |
| `messageKey` | string | WebView／Extension Host 用來取得在地化訊息的 key。 |

### NameValidationCode

| 代碼 | 嚴重度 | 條件 |
|------|--------|------|
| `valid` | valid | 符合文法、非關鍵字、非指定重複與警告名稱。 |
| `empty` | error | `trim()` 後為空。 |
| `starts-with-number` | error | 第一字元為 ASCII 數字。 |
| `contains-whitespace` | error | 整理後名稱仍含任何空白。 |
| `contains-hyphen` | error | 名稱含 `-`。 |
| `invalid-character` | error | 名稱含合法集合以外的字元。 |
| `python-keyword` | error | 名稱等於 Python hard keyword。 |
| `duplicate-function` | error | 與另一個函式定義同名。 |
| `duplicate-parameter` | error | 與同一函式中的另一個參數同名。 |
| `shadows-runtime-name` | warning | 等於指定 MicroPython module／class 名稱。 |
| `shadows-builtin-name` | warning | 等於指定 Python builtin 名稱。 |

### 驗證優先順序

`empty` → `starts-with-number` → `contains-whitespace` → `contains-hyphen` → `invalid-character` → `python-keyword` → duplicate → runtime warning → builtin warning → valid。

優先順序確保一次只顯示最直接可修正的原因；修正後才顯示下一個問題。

## 2. 命名問題（CyberBrickNamingIssue）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `kind` | `variable \| function \| parameter` | 問題名稱所屬類型。 |
| `name` | string | 保留的原名稱，不自動修改。 |
| `severity` | `warning \| error` | 是否阻擋 CyberBrick 上傳。 |
| `code` | NameValidationCode | 問題原因。 |
| `blockIds` | string[] | 需套用或清除獨立 warning 的相關積木。 |
| `functionBlockId` | string? | 參數問題所屬的函式定義。 |
| `parameterIndex` | number? | 參數在函式中的位置。 |

### 衍生規則

- 變數模型有問題時，所有引用該變數的 `variables_get`／`variables_set` 都列入 `blockIds`。
- 函式名稱有問題時，函式定義及其呼叫積木可被標示；上傳摘要以定義積木為主要導引。
- 參數問題附著於函式定義；mutator 開啟時再於參數積木顯示即時結果。
- `error` 集合非空時 `canUpload = false`；只有 `warning` 時 `canUpload = true`。
- 只在目前板子為 CyberBrick 時套用 issue；切換到其他板子時清除本功能專用 warning ID。

## 3. OTA 可計數步驟（OtaCountedStep）

固定順序如下：

1. `detect-usb`
2. `read-device-id`
3. `install-agent`
4. `configure-wifi`
5. `verify-agent`
6. `store-secrets`

`scan-wifi` 是獨立工作，不屬於 `OtaCountedStep`。

## 4. OTA 步驟狀態（OtaStepState）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `step` | OtaCountedStep | 步驟代碼。 |
| `status` | `pending \| running \| succeeded \| failed` | 最新顯示狀態。 |
| `messageKey` | string | 在地化階段說明。 |
| `deviceId` | string? | 非敏感裝置識別，只有合法字串才保留。 |
| `ipAddress` | string? | 非敏感結果資訊，只有合法字串才保留。 |
| `errorCode` | string? | 已分類錯誤代碼，不包含秘密或原始 payload。 |

### 完成規則

- 只有 `success === true` 的可計數步驟會進入 `completedSteps`。
- 同一步驟再次成功不增加完成數，只替換該步驟最新狀態。
- `read-device-id` 的「正在建立」是 running，不加入完成集合；「找到」或「建立完成」才加入。
- failed 步驟不加入完成集合，並成為 `failedStep`。
- `store-secrets` 只有在秘密、配對裝置設定與回傳用 panel state 全部成功後才可標為 succeeded；若配對設定或 panel state 建立失敗，此步驟維持未完成並回報 failure result。

## 5. OTA 設定畫面狀態（OtaProvisioningUiState）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `status` | `idle \| running \| succeeded \| failed` | 整體生命週期。 |
| `activeRequestId` | string? | 目前唯一可更新畫面的請求。 |
| `completedSteps` | Set<OtaCountedStep> | 已成功步驟集合；其 size 只用來計算進度條填滿程度，不直接顯示給學生。 |
| `steps` | Map<OtaCountedStep, OtaStepState> | 每一步最新狀態。 |
| `failedStep` | OtaCountedStep? | 最終失敗階段。 |
| `summaryKey` | string? | 成功或失敗摘要語系 key。 |

### 不變條件

- `completedSteps.size` 永遠介於 0 與 6。
- 進度條填滿程度由 `completedSteps.size / 6` 推導，但學生可見 DOM 不呈現該分數或百分比。
- `running` 必須有 `activeRequestId`。
- progress／result 的 request ID 不等於 `activeRequestId` 時，state 完全不變。
- `succeeded` 必須有六個 completed steps；`failed` 保留失敗前的 completed steps。
- modal 顯示／隱藏不改變 state。
- Wi-Fi 密碼不屬於此模型。

### 狀態轉移

```text
idle ── start(requestId) ──> running（空進度條）
failed ── start(newId) ───> running（空進度條）
succeeded ─ start(newId) ─> running（空進度條）

running ─ valid progress ─> running（進度條向前）
running ─ success result ─> succeeded（完整進度條）
running ─ failure result ─> failed（停在目前位置）
running ─ stale message ──> running（不變）
```

## 6. OTA Extension Host 執行狀態（OtaProvisioningExecution）

| 欄位 | 型別 | 說明 |
|------|------|------|
| `inFlight` | boolean | 是否已有設定流程操作裝置。 |
| `requestId` | string? | 目前請求識別，只供關聯與診斷，不記錄秘密。 |

### 不變條件

- `inFlight === true` 時第二次 `provision()` 不呼叫任何 uploader 方法。
- 第二次要求回覆 `provisioning-in-progress`。
- 第一個流程的所有 return／throw 路徑都在 `finally` 將 `inFlight` 還原為 false。
- 執行狀態不寫入 workspace、settings 或 SecretStorage。

## 7. 與既有持久資料的關係

- `CyberBrickUploadSettings` schema version 維持 2。
- `PairedCyberBrickDevice`、SecretStorage 的 `wifiPassword`／`otaToken`／`pairingSecret` 內容與保存時機維持現有契約。
- 工作區 serialization 不增加 naming issue 欄位；問題每次由名稱重新推導。
- OTA UI state 不跨 VS Code reload 保存；僅需在 modal 關閉／重開時保留。
