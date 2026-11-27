# 任務：上傳進度提示加入進度條與下載／安裝進度

**輸入**：[spec.md](spec.md)、[plan.md](plan.md)、[research.md](research.md)

## 格式：`[ID] [P?] [Story] 說明`

## Phase 1：基礎

- [ ] T001 [US1] 新增 `src/services/packageInstallProgress.ts`：預估表、資料夾解析、tracker（FR-001～FR-003）
- [ ] T002 [P] [US1] `src/test/services/packageInstallProgress.test.ts`：階段、單調、95 上限、不定、只量新項目、讀取失敗略過

## Phase 2：使用者故事 1－首次準備套件看得到進度（P1）

- [ ] T003 [US1] `src/types/arduino.ts`、`src/services/micropythonUploader.ts` 的進度型別加 `packages?`（FR-004）
- [ ] T004 [US1] `ArduinoUploader.prepareProjectPackages` 接上 tracker，每秒回報；取代 PR #293 把原始訊息塞進提示的做法
- [ ] T005 [US1] `messageHandler` 轉送 `packages`
- [ ] T006 [P] [US1] 更新 `arduinoUploader.test.ts` 與 `messageHandler` 測試

## Phase 3：使用者故事 2、3－短標籤與進度條（P1／P2）

- [ ] T007 [US2] `media/js/blocklyEdit.js`：`toast.showProgress` 加進度條、`formatUploadProgress`、移除 `uploadProgressFilter`、OTA 不定進度
- [ ] T008 [US2] `media/css/blocklyEdit.css`：進度條樣式、深色、減少動態效果
- [ ] T009 [US2] 2 個新字串加到 15 語系（FR-008），跑 `validate:i18n`、`test:i18n`
- [ ] T010 [P] [US3] 更新 `uploadProgressToast.contract.test.ts`

## Phase 4：使用者故事 4－輸出面板（P3）

- [ ] T011 [US4] PlatformIO 安裝行與實際總量寫到輸出面板（FR-007）

## Phase 5：收尾

- [ ] T012 lint、型別、單元測試、建置
- [ ] T013 視覺驗證：亮色、深色、窄視窗，下載／安裝／編譯三種狀態
- [ ] T014 打包 VSIX 給 Ray 在 Windows 實機測試首次安裝
