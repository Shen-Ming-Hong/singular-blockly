# 實作計畫：CyberBrick 命名防呆與 OTA 設定進度

**分支**：`064-cyberbrick-naming-ota-progress` | **日期**：2026-08-04 | **規格**：[spec.md](spec.md)

**輸入**：`specs/064-cyberbrick-naming-ota-progress/spec.md` 的功能規格

## 摘要

本功能分成兩條可獨立驗收的垂直切片。命名切片在 CyberBrick 工作區加入一致的 MicroPython 名稱驗證結果（有效、警告、阻擋），分別接入 VS Code 變數輸入框、Blockly 函式／參數欄位、舊工作區問題標示與上傳前置檢查；保留現有中文 CJK 範圍，不影響 Arduino/TXT。OTA 切片把既有逐步訊息提升為可恢復的六階段狀態機，以請求識別、完成步驟集合與 Extension Host 單一執行鎖防止重複計數、舊訊息污染與並行設定；學生端使用大型水平進度條、執行中圖示與簡單階段文字，不顯示分數或百分比，並提供控制項鎖定及成功／失敗恢復。

## 技術背景

**語言／版本**：TypeScript 5.9.3（Extension Host、測試）；WebView JavaScript（既有非模組腳本）；CyberBrick 產碼目標為 MicroPython
**主要相依套件**：VS Code API `^1.105.0`、Blockly 12.3.1、Node.js 22.16.0+、既有 `mpremote`／CyberBrick OTA 服務
**儲存**：不新增持久化格式；沿用既有工作區 Blockly serialization、CyberBrick upload settings schema v2 與 VS Code SecretStorage；OTA 執行狀態僅存於本次 WebView／Extension Host 記憶體
**測試**：Mocha、Sinon、`@vscode/test-electron`；不依賴 DOM／Blockly 的 WebView UMD 純 helper 可由 Node 測試載入，DOM／訊息與載入順序使用 contract-style 測試
**目標平台**：VS Code／VSCodium 桌面擴充功能 WebView；CyberBrick USB-first OTA 設定
**專案類型**：桌面 IDE 擴充功能，Extension Host 與 WebView 雙執行環境
**效能目標**：單次名稱驗證為常數時間；全工作區命名掃描對一般課堂工作區不造成可感知延遲；OTA 進度在收到訊息後的下一次畫面更新呈現
**限制**：Extension Host 與 WebView 只透過 `postMessage` 溝通；含 DOM／Blockly 副作用的 WebView 程式不可直接匯入 Node 測試，只有明確採 UMD 且不依賴瀏覽器副作用的純 helper 可由 Node 載入；不得洩漏 Wi-Fi 密碼或配對機密；不得自動改名；不得改變設定 schema
**規模／範圍**：3 種名稱類型、2 種嚴重度、6 個 OTA 里程碑、15 個語系；維持單一 CyberBrick 設定流程

## 憲章檢查

*GATE：Phase 0 前檢查，Phase 1 設計後重新檢查。*

| 原則 | 檢查結果 | 設計回應 |
|------|----------|----------|
| I. 簡潔與可維護性 | 通過 | 名稱規則集中在純驗證模組；OTA 以單一狀態模型取代散落布林值與陣列追加。 |
| II. 模組化與可擴充性 | 通過 | 驗證規則、Blockly 套用、上傳前置檢查與 OTA 訊息契約分離；不改動既有 settings schema。 |
| III. 避免過度開發 | 通過 | 僅處理 CyberBrick、指定名稱類型與現有 OTA 設定，不導入通用語法解析器或新框架。 |
| IV. 彈性與適應性 | 通過 | 名稱結果使用穩定的錯誤代碼／嚴重度；OTA 里程碑採有序常數與集合，可安全處理重複訊息。 |
| V. 研究驅動 | 通過 | 已查核 Blockly、VS Code、Python 與 WAI-ARIA 官方文件，決策記錄於 [research.md](research.md)。 |
| VI. 結構化記錄 | 通過 | Extension Host 僅使用既有 `log()`；記錄請求結果代碼，不記錄秘密或完整 payload。 |
| VII. 完整測試 | 通過 | 純函式單元測試、訊息處理測試、WebView contract 測試、服務並行測試與回歸指令皆已規劃。 |
| VIII. 純函式與模組化架構 | 通過 | 名稱判定與 OTA 步驟歸約設計為無 DOM／I/O 的純函式；副作用留在既有邊界。 |
| IX. 繁體中文文件 | 通過 | 規格、計畫、研究、資料模型、契約、quickstart 與 tasks 全部使用繁體中文。 |
| X. 專業發布管理 | 不適用於本階段 | 本功能不在 plan 階段變更版本或發布；後續若發布，沿用既有流程。 |
| XI. Agent Skills 架構 | 通過 | 依專案指定順序執行 Spec Kit skills，並於程式修改時套用 security-checker。 |

**Phase 1 後重檢**：設計產物沒有新增憲章違規或需要 Complexity Tracking 的例外；所有 gate 維持通過。

## 專案結構

### 本功能文件

```text
specs/064-cyberbrick-naming-ota-progress/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── naming-validation.md
│   └── ota-provisioning-messages.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### 原始碼（repository root）

```text
src/
├── services/
│   ├── cyberbrickNameValidation.ts          # Extension Host 純名稱驗證
│   ├── cyberbrickOtaProvisioningService.ts  # OTA 單一執行鎖與步驟回報
│   └── cyberbrickUploadErrors.ts            # provisioning-in-progress 錯誤
├── types/
│   └── cyberbrickUpload.ts                  # 請求、結果與步驟型別契約
├── webview/
│   ├── messageHandler.ts                    # 變數輸入與 OTA 訊息邊界
│   └── webviewManager.ts                    # WebView helper 安全 URI 與載入順序
└── test/
    ├── services/
    │   ├── cyberbrickNameValidation.test.ts
    │   └── cyberbrickOtaProvisioningService.test.ts
    ├── webview/
    │   ├── cyberbrickNaming.contract.test.ts
    │   └── cyberbrickUploadSettings.contract.test.ts
    └── messageHandler.test.ts

media/
├── js/
│   ├── cyberbrickNameValidation.js          # WebView UMD 純驗證與 workspace issue 收集
│   ├── cyberbrickOtaProvisioningState.js    # WebView UMD 純訊息 parser 與 OTA state reducer
│   └── blocklyEdit.js                       # 變數問題標示、上傳 guard、OTA DOM 整合
├── blockly/blocks/
│   └── functions.js                         # 函式／參數 FieldTextInput validators
├── html/
│   └── blocklyEdit.html                     # 內部 0–6、學生端不顯示數字的可存取進度元件
├── css/
│   └── blocklyEdit.css                      # 執行、成功、失敗與禁用樣式
└── locales/*/messages.js                    # 15 語系錯誤、警告、階段與狀態文字
```

**結構決策**：延伸現有 Extension Host／WebView 分層。兩個執行環境各保留一個純名稱驗證入口，並以同一組完整測試向量防止規則漂移；OTA allowlist parser 與 state reducer 也使用專案既有 UMD 純 helper 模式，讓 Node 測試可直接驗證。Blockly 與 DOM 副作用仍留在 `media/`，裝置並行鎖與 WebView→Host 訊息輸入驗證留在 Extension Host。OTA settings schema 與 SecretStorage 不變。

## Phase 0：研究結論

完整決策、理由、替代方案與權威來源見 [research.md](research.md)。重點如下：

1. 名稱文法固定為既有 ASCII／CJK 子集合，並額外拒絕 Python hard keywords；soft keyword `type` 依既定需求列為警告名稱。
2. VS Code 變數輸入使用 `InputBoxValidationMessage` 區分 Error 與 Warning；Blockly 函式／參數使用 local validator，以整理後字串或 `null` 控制提交。
3. 舊資料不經 migration；以工作區 issue collector 標示並在 CyberBrick 上傳前重新掃描。
4. OTA 畫面狀態以純 reducer 管理 `activeRequestId`、狀態、完成步驟集合及失敗步驟；集合只驅動大型進度條填滿程度，不把數字比例呈現給學生；Wi-Fi 掃描使用獨立狀態。
5. Extension Host 在服務邊界使用 `try/finally` 單一執行鎖，重複要求回覆專用錯誤碼且不觸碰裝置。

## Phase 1：設計與契約

- [data-model.md](data-model.md)：名稱驗證結果、命名問題、OTA 請求與進度狀態、轉移與不變條件。
- [contracts/naming-validation.md](contracts/naming-validation.md)：三種名稱入口、嚴重度、錯誤代碼、舊工作區與上傳 guard 契約。
- [contracts/ota-provisioning-messages.md](contracts/ota-provisioning-messages.md)：request ID、六步驟、進度／結果訊息、重複執行與敏感資料規則。
- [quickstart.md](quickstart.md)：可執行的自動化與手動驗收流程。

## 實作策略

### A. CyberBrick 名稱驗證

1. 建立可測試的純驗證 API，輸入名稱及選用的重複名稱集合，輸出整理後名稱、`valid|warning|error`、穩定代碼與訊息 key。
2. Extension Host 的變數輸入只在 `board === 'cyberbrick'` 時套用新規則；Error 阻止確認，Warning 顯示但允許確認，最後送回整理後名稱。
3. WebView UMD helper 在函式積木載入前註冊，讓函式及 mutator 參數欄位可同步阻止學生新輸入的非法值並保留舊值。
4. 建立共用 hydration scope 包住每個 `Blockly.serialization.workspaces.load()` 入口；行內 validator 在 scope 內原樣接受反序列化值，scope 以 `finally` 結束。工作區 issue collector 在載入完成及建立、刪除、改名、板子切換後更新命名 warning；使用獨立 warning ID，避免覆蓋 orphan block 等既有警告。
5. `handleUploadClick()` 在 CyberBrick 產碼前執行命名 preflight；有 error 時聚焦第一個相關積木、顯示在地化摘要並返回。Warning 只保留標示，不阻擋。

### B. OTA 六階段進度

1. 以固定順序常數定義六個可計數步驟，明確排除 `scan-wifi`；重複的 `read-device-id` 只替換該步驟的最新文字。
2. 啟動時先產生 request ID 並將 reducer 轉為 `running` 與空進度條，再送出訊息；同步顯示執行中圖示、「正在設定無線上傳」及避免重複操作／拔除 USB 的提示，所有衝突控制項依 `status === 'running'` 統一禁用。
3. UMD 純 helper 匯出的 parser 先以 allowlist 驗證 progress／result 的外層物件、command、request ID、步驟代碼、布林 success、錯誤物件及安全 metadata；格式錯誤與非目前請求不得送入 reducer，parser 與 reducer 共用同一套 Node 測試。
4. 成功轉為 `succeeded`、顯示完整進度條與勾勾並清密碼；失敗讓進度條停在目前位置、顯示失敗圖示／階段／重試提示並保留密碼。關閉對話框只隱藏 DOM，不清 reducer。
5. Extension Host 驗證 requestId 與 payload 的必要欄位，在 provisioning service 入口取得鎖；鎖定中回覆 `provisioning-in-progress`，所有結束路徑在 `finally` 釋放。最後的 `store-secrets` 成功進度只能在秘密、配對裝置設定與 panel state 都完成後發出，之後不再執行可能失敗的 awaited persistence 操作。

### C. 安全、語系與驗證

1. WebView 訊息不信任任意 payload；只接受已知 command、目前 request ID、已知步驟及布林成功狀態。
2. 密碼僅存在輸入欄位、要求 payload 與既有 SecretStorage 寫入路徑；回應、進度與 `log()` 不含密碼、token、pairing secret。
3. 所有新增 message keys 同步到 15 語系，並更新 i18n／safety contract 測試。
4. 進度元件使用 `role="progressbar"`、`aria-valuemin="0"`、`aria-valuemax="6"`、動態 `aria-valuenow`，並以目前階段的在地化文字設定 `aria-valuetext`；學生可見畫面不顯示分數或百分比，另以文字／圖示表達狀態而非只靠顏色。

## Complexity Tracking

無憲章違規，不需要複雜度例外。
