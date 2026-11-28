# 任務：上傳途中改積木時，快速重新上傳不再燒錯程式

**輸入**：[spec.md](./spec.md)、[plan.md](./plan.md)

## Phase 1：模型

- [x] T001 更新 `specs/tla/upload-build-cache/UploadBuildCache.tla`：上傳中延後寫入、`ExternalEdit`、`MarkBuilt` 前重算指紋（FR-005）
- [x] T002 `expected.txt` 改為 `holds`，TLC 驗證（SC-001）

## Phase 2：延後寫入（US1）

- [x] T003 [US1] 先寫測試：上傳中 `updateCode` 不寫檔、結束後寫最後一份、上傳失敗仍寫入、上傳等待進行中的寫入；確認在現況下失敗
- [x] T004 [US1] `messageHandler.ts`：`uploadInProgress`、`deferredCodeUpdate`、`codeWriteTail`（FR-001、FR-002）

## Phase 3：建置後重算指紋（US2）

- [x] T005 [US2] 先寫測試：編譯期間原始檔改變時不呼叫 `markBuilt`；確認在現況下失敗
- [x] T006 [US2] `arduinoUploader.ts`：`markBuilt` 前重算指紋（FR-003）

## Phase 4：收尾

- [x] T007 型別檢查、ESLint、受影響的測試、`npm run compile`
- [x] T008 `specs/tla/upload-build-cache/README.md` 改寫成修正後的現況
