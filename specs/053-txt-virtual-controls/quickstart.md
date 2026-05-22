# Quickstart：TXT 虛擬控制畫布

**功能分支**：`053-add-txt-virtual-controls`  
**適用對象**：開發者、測試者、reviewer

---

## 前置條件

- 使用 VS Code 1.105.0+
- 工作區已開啟 `singular-blockly`
- 已安裝 npm 依賴
- 若要驗證 TXT 執行期互動：
  - 需有可連線的 fischertechnik TXT Controller
  - TXT 端需可透過既有 SSH 設定上傳與執行 Python 程式

---

## 本機開發啟動

在 repo root 執行：

```text
npm run watch
```

若只需要一次性建置：

```text
npm run compile
```

若有新增/修改 i18n key，額外驗證：

```text
npm run validate:i18n
```

若有新增 TXT 積木或 MCP 查詢能力，建議同步重建字典：

```text
npm run generate:dictionary
```

---

## 本次自動化驗證紀錄

> 執行日期：2026-05-21（macOS, 本工作區）

- ✅ `npm run compile`
  - 2026-05-22 PR 前複驗，exit code 0
- ✅ `npm run lint`
  - 2026-05-22 PR 前複驗，exit code 0
- ✅ `npm run validate:i18n`
  - 14/14 locale bundles 通過
- ✅ `npm run generate:dictionary`
  - `src/mcp/block-dictionary.json` 已重建，包含最新 TXT 積木索引
- ✅ `npm test`
  - 2026-05-22 PR 前複驗：687 passing, 1 pending
- ✅ 2026-05-22 目標回歸測試
  - `txtVirtualControlsIdentity.test.ts`
  - `txtVirtualControlsPersistence.test.ts`
  - `messageHandler.test.ts`
  - `txtVirtualControlRuntimeService.test.ts`
  - `code-generation.test.ts`
  - `txtWorkspaceFixtures.test.ts`
  - 結果：30 passing, 0 failed

### 手動 / 真機驗證紀錄

> 驗證日期：2026-05-22（依使用者手動測試回報整理）

- ✅ 建立 4 顆按鈕、拖曳重排、名稱變更後尺寸自適應正常
- ✅ 編輯模式點擊不會送出 pressed state，僅保留選取 / 編輯用途
- ✅ 執行模式可觀察 press / release，停止後可回到 `editing` 模式
- ✅ Companion runtime 健康檢查、啟動流程與既有 I/O Test Panel 流程可分離運作
- ✅ 已引用按鈕 rename 後，block 綁定維持 `stableId`，下拉選單與積木標籤會同步更新最新顯示名稱
- ✅ 名稱轉換、識別字顯示、重名處理與顏色即時預覽已完成手動確認
- ✅ 專案重新開啟後可還原虛擬控制版面，並維持 TXT 虛擬控制資料封裝

---

## 最小功能驗證流程

### 1. 開啟 TXT 專案並切換到 TXT 板

1. 啟動 extension 開發宿主
2. 開啟 Blockly 編輯器
3. 將板子切換到 `txt`
4. 確認 TXT 專用工具列按鈕與虛擬控制入口出現

**預期結果**：

- 不會新增第二個 VS Code panel
- TXT 專案仍在原本 Blockly WebView 內操作

---

### 2. 建立與編輯虛擬按鈕

1. 開啟 TXT 虛擬控制畫布
2. 新增 4 個按鈕
3. 分別輸入：中文名稱、含空格名稱、重名名稱、只有符號的名稱
4. 拖曳到不同位置
5. 修改背景色與文字色

**預期結果**：

- 畫布可自由拖曳排列
- 名稱越長，按鈕尺寸會即時調整
- 顏色變更會立即反映在畫面上
- 系統能產生唯一且安全的 `identifier`

---

### 3. 儲存與重新載入

1. 儲存工作區
2. 關閉並重新開啟 Blockly 編輯器
3. 再次進入 TXT 虛擬控制畫布

**預期結果**：

- 按鈕數量、名稱、位置、尺寸、顏色都完整還原
- 畫布回到 `editing` 模式
- 所有按鈕執行狀態一律重設為未按下

---

### 4. 建立程式引用

1. 在 TXT toolbox 中拖出「讀取虛擬按鈕狀態」類型的積木
2. 選取其中一顆已建立按鈕
3. 將該 value block 放進 `if` 或其他流程邏輯中
4. 再回到虛擬控制畫布修改按鈕名稱

**預期結果**：

- block 顯示名稱更新為最新按鈕名稱
- block 綁定不因 rename 而失效
- generator 仍使用目前有效的 `identifier`

---

### 5. 刪除已引用按鈕

1. 刪除一顆已被 block 引用的按鈕
2. 回到 Blockly workspace

**預期結果**：

- 相關 block 保留，不被自動刪除
- block 出現清楚的 invalid reference 警告
- 上傳 / 開始執行會被阻止

---

### 6. 執行模式互動

1. 修正所有 invalid reference
2. 點擊 TXT 執行按鈕
3. 在虛擬控制畫布按住/放開按鈕
4. 停止程式

**預期結果**：

- 進入執行後，畫布切換成 `running` 模式
- 按鈕位置被鎖定，不能拖曳
- 滑鼠按下時程式可觀察到 pressed=true
- 滑鼠放開時程式可觀察到 pressed=false
- 停止後回到 `editing` 模式
- companion runtime 使用 `singular-blockly.txt.runtimePort + 1`，不應干擾 I/O Test Panel 使用的 `io_server.py`

---

## 建議的自動化驗證範圍

### 單元 / 契約測試

應優先覆蓋：

- `identifier` 正規化與唯一化
- `stableId` 綁定不受 rename 影響
- `blockly/main.json` 的 `txtVirtualControls` save/load
- invalid reference preflight 檢查
- runtime state snapshot 的轉換與重置

### 手動驗證

應保留手動測試的情境：

- 畫布拖曳手感與碰撞/邊界行為
- 名稱改變導致的尺寸即時調整
- 顏色調色盤即時預覽
- 執行模式下的 press / release 回饋
- TXT 真機 runtime lifecycle

---

## 建議的回歸清單

在 feature 完成前，至少確認以下路徑沒有回歸：

1. 一般 Blockly save/load 仍正常
2. TXT 既有 `txt_setup` / `txt_process` codegen 不被破壞
3. TXT Test Panel 仍可獨立啟動與關閉
4. `txtUpload` 與 `txtStopExecution` 行為仍正常
5. `npm run validate:i18n` 通過
6. 既有 Arduino / CyberBrick workflow 不受 TXT 虛擬控制功能影響

---

## 驗收順序建議

```text
Persistence → Reference Binding → Invalid Reference Blocking → Runtime Session → UI Polish → i18n / Regression
```

這個順序可以先把最容易造成 hidden bug 的資料一致性與執行前保護做好，再處理互動體驗與文案細節。