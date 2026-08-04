# 任務：CyberBrick 命名防呆與 OTA 設定進度

**輸入**：`specs/064-cyberbrick-naming-ota-progress/` 的 spec、plan、research、data-model、contracts 與 quickstart
**測試策略**：本規格明確要求自動化測試；各故事先建立會失敗的測試，再進行實作。
**組織方式**：依五個使用者故事分 phase，讓命名與 OTA 兩條切片可獨立驗收。

## 格式：`[ID] [P?] [Story] 說明`

- **[P]**：可與同 phase 的其他標記任務平行執行，因檔案不同且不依賴未完成工作。
- **[Story]**：對應 spec.md 的使用者故事。
- 每個任務都列出實際檔案路徑。

## Phase 1：Setup（基準確認）

**目的**：在修改前建立可比較的專案品質基準。

- [X] T001 執行既有 `npm run compile`、`npm run lint`、`npm run validate:i18n`、`npm test` 並把基準結果記錄於 `specs/064-cyberbrick-naming-ota-progress/quickstart.md`

---

## Phase 2：Foundational（跨故事前置）

**目的**：先建立兩個 WebView 純 helper 的載入邊界、共用訊息代碼與全部語系 key；完成前不得進入故事整合。

- [X] T002 [P] 先建立僅公開空 namespace／factory 的 `media/js/cyberbrickNameValidation.js`、`media/js/cyberbrickOtaProvisioningState.js` UMD 骨架，再於 `src/webview/webviewManager.ts` 與 `media/html/blocklyEdit.html` 註冊安全 WebView URI，並保證名稱 helper 早於 `media/blockly/blocks/functions.js`、OTA helper 早於 `media/js/blocklyEdit.js` 載入；功能邏輯留待各故事的測試先建立後實作
- [X] T003 [P] 先只在 `src/test/safetyGuardI18n.test.ts` 加入命名 error／warning、上傳阻擋、OTA running／目前階段／避免重複操作與拔除 USB／success／failed／retry／in-progress 必要 key 契約並確認失敗，再於全部 `media/locales/*/messages.js` 補齊文字使契約通過
- [X] T004 [P] 在 `src/types/cyberbrickUpload.ts` 與 `src/services/cyberbrickUploadErrors.ts` 定義 request-scoped OTA 訊息所需型別及 `provisioning-in-progress` 分類錯誤，不改變 settings schema version

**Checkpoint**：WebView 資源邊界、訊息代碼與在地化字典已可供兩條功能切片使用。

---

## Phase 3：User Story 1－在命名當下阻止無效名稱（Priority：P1）🎯 MVP

**目標**：CyberBrick 變數、函式與參數在輸入當下拒絕空白、非法字元、數字開頭、hard keyword 與指定重複名稱，並保留舊值。

**獨立測試**：在 CyberBrick 工作區依序輸入 `1motor`、`motor speed`、`motor-speed`、`for`、重複函式與同函式重複參數，確認錯誤即時出現且名稱未提交。

### 測試（先撰寫並確認失敗）

- [X] T005 [P] [US1] 在 `src/test/services/cyberbrickNameValidation.test.ts` 建立 Extension Host 名稱正規化、合法文法、hard keywords 與錯誤優先順序測試
- [X] T006 [P] [US1] 在 `src/test/webview/cyberbrickNameValidation.test.ts` 以 Node 載入 UMD helper，建立與 T005 相同的 WebView 測試向量及函式／參數 duplicate context 測試
- [X] T007 [P] [US1] 在 `src/test/messageHandler.test.ts` 增加 CyberBrick 變數 InputBox 的 trim、Error 阻擋與非 CyberBrick 沿用既有行為測試
- [X] T008 [P] [US1] 在 `src/test/webview/cyberbrickNaming.contract.test.ts` 建立函式／參數 FieldTextInput validator、helper 載入順序、使用者輸入保留舊值與 hydration scope 內原樣接受反序列化值的 contract 測試

### 實作

- [X] T009 [US1] 實作 Extension Host 純驗證器、hard keyword 集合與穩定結果代碼於 `src/services/cyberbrickNameValidation.ts`，使 T005 通過
- [X] T010 [US1] 實作可供瀏覽器與 Node 共用的 UMD 名稱驗證 API 於 `media/js/cyberbrickNameValidation.js`，使 T006 通過
- [X] T011 [US1] 在 `media/blockly/blocks/functions.js` 將共用 validator 接到函式與 mutator 參數欄位，阻擋使用者輸入的非法／重複值並以專用 warning ID 保留原因；hydration scope 期間原樣接受反序列化值
- [X] T012 [US1] 在 `src/webview/messageHandler.ts` 的變數輸入流程只對 `board === 'cyberbrick'` 使用 T009，送回整理後名稱並維持 Arduino／TXT 舊行為

**Checkpoint**：US1 可獨立展示，三種名稱入口都在提交前阻止會破壞 MicroPython 的名稱。

---

## Phase 4：User Story 2－保留中文命名並區分警告（Priority：P1）

**目標**：既有 CJK 三區段與中英數混合名稱正常使用；指定 runtime／builtin 名稱顯示 warning 但可提交與上傳。

**獨立測試**：建立 `馬達速度`、`馬達2`、`_計數` 及三個 CJK 區段邊界字元，再逐一測試所有 warning 名稱，確認只有 warning 且可接受。

### 測試（先撰寫並確認失敗）

- [X] T013 [P] [US2] 擴充 `src/test/services/cyberbrickNameValidation.test.ts`，覆蓋 CJK U+3400／U+4DBF／U+4E00／U+9FFF／U+F900／U+FAFF 邊界與完整 runtime／builtin warning 清單
- [X] T014 [P] [US2] 擴充 `src/test/webview/cyberbrickNameValidation.test.ts`，使用相同 CJK 與 warning 向量驗證兩個執行環境結果一致
- [X] T015 [P] [US2] 在 `src/test/messageHandler.test.ts` 驗證 VS Code `InputBoxValidationSeverity.Warning` 不阻擋接受，Error 仍阻擋

### 實作

- [X] T016 [US2] 在 `src/services/cyberbrickNameValidation.ts` 加入既有 CJK 三區段、runtime names、builtin names 與 warning severity
- [X] T017 [US2] 在 `media/js/cyberbrickNameValidation.js` 同步 CJK 與 warning 規則，並讓完整向量測試防止規則漂移
- [X] T018 [US2] 在 `src/webview/messageHandler.ts` 與 `media/blockly/blocks/functions.js` 分別呈現可接受的在地化 Warning，確認提交值仍保持中文原文

**Checkpoint**：US2 可獨立展示；中文體驗不退化，警告與阻擋明確分流。

---

## Phase 5：User Story 3－安全開啟舊工作區（Priority：P1）

**目標**：舊非法名稱不被自動改寫，積木清楚標示；CyberBrick 上傳在 error 修正前被阻擋，warning 不阻擋，其他板子不受影響。

**獨立測試**：載入含非法變數、函式與參數的 fixture，確認 serialized 名稱不變、相關積木有問題提示、預覽仍可用且上傳未送出；修正 error 後可上傳。

### 測試（先撰寫並確認失敗）

- [X] T019 [P] [US3] 在 `src/test/webview/cyberbrickNameValidation.test.ts` 加入假 workspace 的 variable／function／parameter issue collector、blockIds、severity 與 canUpload 測試
- [X] T020 [P] [US3] 在 `src/test/webview/cyberbrickNaming.contract.test.ts` 加入一般載入、FileWatcher 與語言切換三種 `Blockly.serialization.workspaces.load()` 都由 `try/finally` hydration scope 包住、deserialize 不自動改名、載入後掃描、專用 warning ID、workspace change refresh 與 CyberBrick 上傳 preflight contract
- [X] T021 [P] [US3] 在 `src/test/suite/orphan-block-guard.test.ts` 增加命名 warning 與既有 orphan 三層 guard 可並存、不互相清除的回歸測試

### 實作

- [X] T022 [US3] 在 `media/js/cyberbrickNameValidation.js` 實作可處理 Blockly workspace 或輕量測試物件的 issue collector，回傳相關 block IDs 與 `canUpload`
- [X] T023 [US3] 在 `media/js/blocklyEdit.js` 建立共用 hydration scope 並以 `try/finally` 包住一般載入、FileWatcher 與語言切換的所有 `Blockly.serialization.workspaces.load()`；scope 結束及建立、刪除、欄位變更、板子切換後套用／清除本功能專用 warning，且不改寫 serialization
- [X] T024 [US3] 在 `media/js/blocklyEdit.js` 的 `handleUploadClick()` 產碼前加入 CyberBrick naming preflight；error 顯示在地化摘要並導引第一個積木，warning 與非 CyberBrick 直接放行

**Checkpoint**：US3 可獨立展示；舊作品不被破壞且不會把已知非法程式送上 CyberBrick。

---

## Phase 6：User Story 4－看見明顯的 OTA 設定進度（Priority：P1）

**目標**：按下設定立即顯示空的大型水平進度條、執行中圖示與簡單提示；六個內部里程碑去重推進進度條，學生畫面不顯示分數或百分比，modal 重開保留進度，執行期間所有衝突控制項鎖定。

**獨立測試**：模擬六個 progress，其中 `read-device-id` 重複兩次；確認大型進度條只前進六次且不重複，畫面沒有數字比例，關閉再開狀態不變，相關欄位與 actions 全程 disabled。

### 測試（先撰寫並確認失敗）

- [X] T025 [P] [US4] 在 `src/test/webview/cyberbrickOtaProvisioningState.test.ts` 建立 start=空進度條、固定順序、重複步驟去重、read-device-id 建立中文字更新與 scan-wifi 排除的 reducer 測試
- [X] T026 [P] [US4] 擴充 `src/test/webview/cyberbrickUploadSettings.contract.test.ts`，驗證 progressbar 內部 ARIA 0–6、學生畫面無分數／百分比、大型進度條、執行中圖示與文字、非純顏色狀態及 running controls 清單
- [X] T027 [P] [US4] 在 `src/test/messageHandler.test.ts` 驗證每個 progress 都保留原 request ID、只傳安全步驟資料且六個 service step 均可轉送

### 實作

- [X] T028 [US4] 在 `media/js/cyberbrickOtaProvisioningState.js` 實作 UMD 純 allowlist parser 與 reducer、六步驟順序、completed Set 去重及 request ID 過濾，讓 Host→WebView 訊息在進入 reducer 前即可測試地拒絕錯型資料
- [X] T029 [US4] 在 `media/html/blocklyEdit.html` 與 `media/css/blocklyEdit.css` 建立醒目的大型 determinate progressbar、執行中／成功／失敗圖示、live stage status 與非純顏色樣式，學生可見區域不得顯示分數或百分比
- [X] T030 [US4] 在 `media/js/blocklyEdit.js` 啟動 provisioning 時先建立 request ID 並 dispatch start，使畫面在 postMessage 前顯示空進度條、執行中圖示、「正在設定無線上傳」與避免重複操作／拔除 USB 的提示
- [X] T031 [US4] 在 `media/js/blocklyEdit.js` 以 reducer 處理 progress，重複步驟只更新文字，並讓 modal 關閉／重開不清除 state
- [X] T032 [US4] 在 `media/js/blocklyEdit.js` 統一依 running 狀態禁用 USB、refresh、名稱、SSID、rescan、密碼與顯示切換、provision、cleanup、Use／Delete actions，結束後重新開放

**Checkpoint**：US4 可獨立展示；學生始終知道目前進度且無法從 UI 重複啟動或衝突操作。

---

## Phase 7：User Story 5－從成功或失敗狀態安全恢復（Priority：P1）

**目標**：成功顯示完整進度條、勾勾與完成文字並清密碼；失敗讓進度條停在目前位置並保留失敗階段與密碼；Host 保證單一執行，舊請求與無效訊息不污染目前狀態。

**獨立測試**：分別模擬成功、每階段失敗、兩次並行要求、第一輪 throw 後重試及舊 request 延遲回報，確認 result、密碼、鎖釋放與 request isolation。

### 測試（先撰寫並確認失敗）

- [X] T033 [P] [US5] 擴充 `src/test/services/cyberbrickOtaProvisioningService.test.ts`，以 deferred promise 驗證並行第二請求不呼叫 uploader、回覆 `provisioning-in-progress`、success／failure／throw 後鎖都釋放，並驗證 `store-secrets` 只在秘密、paired-device 與 panel state 成功後發出且設定保存失敗時不會先完成進度條
- [X] T034 [P] [US5] 在 `src/test/messageHandler.test.ts` 增加非物件 payload、缺 requestId、非字串欄位、重複請求與 response request correlation 的邊界測試
- [X] T035 [P] [US5] 擴充 `src/test/webview/cyberbrickOtaProvisioningState.test.ts`，直接測試 UMD allowlist parser 與 reducer，覆蓋 success=完整進度條、各步驟 failure 停在正確位置、新 request 重設、stale 訊息，以及 progress／result 的 null、array、缺漏欄位、錯型 success、未知 step／status／error code 都完全忽略
- [X] T036 [P] [US5] 擴充 `src/test/webview/cyberbrickUploadSettings.contract.test.ts`，驗證成功才清密碼、失敗保留密碼、失敗階段文字、結果後 controls 解鎖及 modal 重開最終狀態

### 實作

- [X] T037 [US5] 在 `src/services/cyberbrickOtaProvisioningService.ts` 於任何裝置 I/O 前加入單一 in-flight guard，重複請求立即分類失敗，以 `try/finally` 保證所有結束路徑釋放，並將 `store-secrets` 成功進度移到秘密、paired-device 與 panel state 完成之後且不再接續可失敗的 awaited persistence 操作
- [X] T038 [US5] 在 `src/webview/messageHandler.ts` 驗證 provisioning message、requestId 與 payload 型別，拒絕無效輸入且只回傳 sanitized progress／result
- [X] T039 [US5] 在 `media/js/blocklyEdit.js` 呼叫 T028 的 allowlist parser 驗證 Host→WebView progress／result，無效訊息不 dispatch；有效成功顯示完整進度條、勾勾與完成文字並清密碼，有效失敗讓進度條停在目前位置並保留密碼與失敗步驟，兩者都解除控制項且不顯示數字比例
- [X] T040 [US5] 在 `src/test/messageHandler.test.ts` 與 `src/test/webview/cyberbrickUploadSettings.contract.test.ts` 加強秘密回歸斷言，確保 progress、result、toast、ARIA 及 log 不含密碼、OTA token、pairing secret 或完整 payload

**Checkpoint**：US5 可獨立展示；成功與失敗都可理解、可恢復，且裝置端不會同時執行兩個設定流程。

---

## Phase 8：Polish & Cross-Cutting Concerns

**目的**：完成語系、安全、回歸與端到端驗收，不擴張功能範圍。

- [x] T041 [P] 更新 `src/test/webviewManager.test.ts`，驗證兩個新增 WebView helper 使用 `webview.asWebviewUri()` 且載入順序符合 `specs/064-cyberbrick-naming-ota-progress/plan.md`
- [x] T042 [P] 更新 `src/test/safetyGuardI18n.test.ts` 與所有 `media/locales/*/messages.js` 的一致性測試，執行 `npm run validate:i18n` 確認 15 語系無缺鍵或格式錯誤
- [x] T043 依 `security-checker` 檢查 `src/webview/messageHandler.ts`、`src/services/cyberbrickOtaProvisioningService.ts`、`media/js/blocklyEdit.js` 的 message validation、秘密處理、log 與 DOM 輸出，修正所有高風險問題
- [x] T044 執行 `npm run compile`、`npm run lint`、`npm run validate:i18n`、`npm test`，將最終結果與任何環境限制記錄於 `specs/064-cyberbrick-naming-ota-progress/quickstart.md`
- [x] T045 依 `specs/064-cyberbrick-naming-ota-progress/quickstart.md` 完成繁中／英文、鍵盤／ARIA、舊工作區與 CyberBrick OTA 實機或等效 stub 驗收，並更新該檔完成條件
- [x] T046 依本地 Codex Code Review 核准結果補強 terminal request 失效、success panel state 必填、六階段失敗文案與完成／失敗進度保持展開的回歸測試及修正，並完成 re-review

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 Setup**：無依賴。
- **Phase 2 Foundational**：依賴 T001；完成後才能整合任何故事。
- **US1**：依賴 Phase 2，是命名切片的 MVP。
- **US2**：依賴 US1 的兩個純驗證入口，但可在 US1 完成後獨立驗收。
- **US3**：依賴 US1／US2 的完整 severity 結果，新增舊資料與上傳邊界。
- **US4**：只依賴 Phase 2，可與 US1–US3 命名切片平行進行。
- **US5**：依賴 US4 reducer／DOM 整合，並新增 Host 單一執行與恢復行為。
- **Polish**：依賴所有欲交付故事完成。

### User story dependency graph

```text
Setup → Foundation ─┬→ US1 → US2 → US3 ─┐
                    └→ US4 → US5 ───────┴→ Polish
```

### Story 內部順序

1. 先寫標示「測試」的任務並確認在缺少功能時失敗。
2. 先完成純模型／reducer，再接 Extension Host、Blockly 或 DOM 副作用。
3. 完成故事 checkpoint 的獨立測試後，再進下一個依賴故事。

## Parallel Opportunities

### US1

```text
T005（Host validator tests）
T006（WebView validator tests）
T007（InputBox tests）
T008（Blockly contract tests）
```

四個測試檔不同，可平行建立；T009／T010 可在各自測試完成後平行實作，最後由 T011／T012 整合。

### US2

```text
T013（Host CJK/warning vectors）
T014（WebView CJK/warning vectors）
T015（InputBox Warning severity）
```

三組測試可平行；T016 與 T017 分屬不同執行環境，可平行完成。

### US3

```text
T019（issue collector unit tests）
T020（WebView contracts）
T021（orphan guard regression）
```

測試可平行；T022 完成後，T023 與 T024 都修改 `blocklyEdit.js`，應依序進行。

### US4

```text
T025（reducer tests）
T026（DOM/accessibility contract）
T027（Host progress correlation）
```

三組測試可平行；T028 與 T029 分屬 helper 及 HTML/CSS，可平行，T030–T032 再依序整合。

### US5

```text
T033（service concurrency tests）
T034（message boundary tests）
T035（reducer result tests）
T036（WebView result contracts）
```

四組測試可平行；T037／T038／T039 分屬 service、handler、WebView，但 T038 依賴 T037 的錯誤結果，T039 依賴 T035，應按依賴合併。

## Implementation Strategy

### MVP first

1. 完成 T001–T004。
2. 完成 US1（T005–T012）。
3. 停下並用 US1 independent test 驗證三種命名入口。

### Incremental delivery

1. US1：阻止立即會使 MicroPython 失敗的名稱。
2. US2：恢復完整中文體驗與 warning 分流。
3. US3：保護舊工作區與上傳邊界，完成命名切片。
4. US4：交付可見、不可重複點擊的六階段進度。
5. US5：補齊失敗恢復、stale message 與 Host concurrency，完成 OTA 切片。
6. Polish：全語系、安全、回歸與端到端驗收。

## Notes

- `[P]` 只表示檔案與依賴允許平行，不代表必須使用多位開發者。
- WebView 純 helper 採 UMD 以符合現有測試模式；DOM／Blockly 行為仍以 contract tests 驗證。
- 所有 Blockly warning 使用本功能專用 ID，不得清除 orphan 或其他安全 guard。
- 不新增設定 schema、不持久化 OTA UI state、不在訊息或 log 中回傳秘密。
- 建議每個故事 checkpoint 完成後，以 Conventional Commit（繁體中文描述）提交一個邏輯單位。
