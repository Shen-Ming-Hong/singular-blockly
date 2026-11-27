# 任務：沒改程式時加速重複上傳

**輸入**：[spec.md](./spec.md)、[plan.md](./plan.md)

## Phase 1：快取模組

- [x] T001 新增 `src/services/arduinoBuildCache.ts`：準備鍵、建置鍵、預設 env、平台名稱、buildRoot、韌體記錄、板子記錄、`reuseModeFor`、`parseEsptoolMac`
- [x] T002 [P] 新增 `src/test/services/arduinoBuildCache.test.ts`

## Phase 2：上傳流程（US1、US3）

- [x] T003 `saveCode` 內容相同不重寫（FR-005）
- [x] T004 準備階段依快取跳過 `pio pkg install`，成功後記錄（FR-001）
- [x] T005 `compileAndUploadWithProgress` 支援 `nobuild`、固定埠、回傳 `reachedUpload`、`uploadPort`、`chipMac`
- [x] T006 `upload()`：捷徑、燒錄前失敗退回完整建置、完整建置前清記錄、編譯成功才記錄（FR-002、FR-004）

## Phase 3：換板保護（US2）

- [x] T007 ESP32 只用上次完整燒錄的埠，MAC 不同或缺少時立刻完整上傳（FR-003）
- [x] T008 [P] 上傳流程測試：換板、無 MAC、AVR 自動埠、燒錄失敗後重試

## Phase 4：收尾

- [x] T009 CHANGELOG 雙語條目
- [x] T010 容器實測 PlatformIO nobuild 行為與耗時
- [x] T011 Ray 的 Windows 與 ESP32 實測（SC-001）：編輯器內第一次完整上傳約 51 秒、沒改程式第二次約 14 秒（2026-11-27）；指令實測完整 48.0 秒、nobuild 18.6／19.0 秒，MAC 一致、開機正常
- [x] T012 ESP32 固定埠燒錄失敗時改走完整流程並自動偵測連接埠（本地 review 發現）
- [ ] T013 換另一塊 ESP32 的實機測試（SC-003；單元測試已覆蓋，待有第二塊板子時補測）
