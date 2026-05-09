# 實作計劃：fischertechnik TXT Controller 支援（多流程擴充）

**分支**：`051-txt-controller-support` | **日期**：2026-05-09 | **規格**：[spec.md](./spec.md)  
**輸入**：[specs/051-txt-controller-support/spec.md](./spec.md)

## 摘要

目前分支已完成 TXT Controller 的基礎版支援：單一 `txt_main` 容器、SSH 上傳、Test Panel 與基本積木集。本次擴充將作者模型改為 **一個「TXT 初始化」頂層容器 + 多個「TXT 流程」頂層容器**，讓學生以接近 ROBO Pro 多流程的方式設計程式，同時仍維持 **單一 `main.py`、單一共享 `ftrobopy.ftrobopy('auto')` 連線**。

在重新檢視 FT API、ftrobopy 原始碼與現有 codebase 後，最可行的第一版實作路徑是：

1. 保留單一 `main.py` 與單一 shared `txt` 物件
2. 讓 `TXT 初始化` 負責一次性設定與硬體預備
3. 把每個 `TXT 流程` 產生成受管理的流程 runner（由主程式統一啟動）
4. 直接重做尚未發布的 `txt_main` 作者模型與相關內部程式路徑，不額外建立 migration layer

此方案避免了「多個獨立主程式／多個 ftrobopy owner 爭用硬體」的風險，也比全面重寫成 AST/state-machine 轉譯更適合目前直接輸出 Python statement 的 generator 架構。

---

## 技術背景 (Technical Context)

| 項目 | 細節 |
|------|------|
| **語言/版本** | TypeScript 5.9.3（Extension Host）；JavaScript ES2020（WebView）；Python 3（TXT 端） |
| **主要依賴（現有）** | Blockly 12.3.1、VS Code API 1.105.0+、node-ssh |
| **TXT 端依賴** | ftrobopy、Python 標準函式庫 `threading` / `time` / `http.server` |
| **儲存** | 連線設定：workspace settings；密碼：SecretStorage；工作區：`blockly/main.json` |
| **測試** | Mocha + Sinon + `@vscode/test-electron`；WebView 部分以整合/契約驗證與手動測試補足 |
| **目標平台** | VS Code 1.105.0+（macOS/Windows/Linux）；TXT 端 Linux ARMv7 |
| **專案類型** | VS Code Extension（Extension Host + WebView 雙 context） |
| **效能目標** | Test Panel polling ≤ 500ms；上傳到執行 ≤ 30 秒；等待中的流程不阻塞其他流程 |
| **限制** | Host 與 WebView 嚴格隔離；不產生多個獨立 `main.py`；不新增「4 個流程」硬限制 |

---

## Constitution Check

*閘門（GATE）：本次為既有功能擴充，需再次確認是否仍符合專案憲法。*

| 憲法原則 | 評估 | 狀態 |
|---------|------|------|
| I. 簡單性與可維護性 | 保留單一 `main.py` 與既有 SSH/Test Panel 架構；多流程僅擴充 Blockly 與 generator 層 | ✅ 通過 |
| II. 模組化與可擴展性 | 新增 `txt_setup` / `txt_process` 可獨立演進；不引入額外 migration layer，維持結構單純 | ✅ 通過 |
| III. 避免過度開發 | 不做多檔案部署、不做多個 ftrobopy owner、不把「4 個流程」產品化 | ✅ 通過 |
| IV. 彈性與適應性 | 保留流程名稱可選、數量不硬限制；未來仍可再演進更精細的 scheduler/診斷 | ✅ 通過 |
| V. 研究驅動開發 | 已重新比對 ftrobopy 原始碼、ftCommunity 教學、ROBOPro 平行流程資料與現有 codebase | ✅ 通過 |
| VI. 結構化日誌 | 仍遵循 Host 端 `log()`、WebView 端既有 logging 模式 | ✅ 通過 |
| VII. 完整測試覆蓋率 | 需補齊 migration / codegen / multi-flow regression 驗證，作為本次擴充重點 | ✅ 通過（待實作） |
| VIII. 純函式與模組化 | migration 與 codegen 聚焦在集中式 helper / generator 狀態，不擴散至 uploader service | ✅ 通過 |
| IX. 繁體中文文件標準 | 本 plan.md 以繁體中文撰寫 | ✅ 通過 |

---

## 專案結構

### 文件（本功能）

```text
specs/051-txt-controller-support/
├── spec.md              # 功能規格（已更新為多流程模型）
├── plan.md              # 本計劃
├── research.md          # 研究與可行性重評
├── data-model.md        # 資料模型
├── quickstart.md        # 開發 / 驗證流程
├── contracts/
│   ├── txt-blocks-api.md
│   └── io-server-api.md
└── tasks.md             # 任務清單（T054+ 為多流程擴充待辦）
```

### 主要原始碼影響面

```text
media/
├── blockly/
│   ├── blocks/
│   │   ├── txt.js                  # 新增/調整 txt_setup、txt_process，並淘汰單主程式公開入口
│   │   └── loops.js                # 合法容器 / orphan guard 需納入新 TXT 頂層模型
│   └── generators/
│       └── txt/
│           ├── index.js            # allowedTopLevelBlocks_、workspace root 聚合邏輯
│           ├── txt.js              # txt_setup / txt_process 生成器與單主程式舊路徑清理
│           └── python_common.js    # 流程內容的共通 generator 與 auto pacing
├── toolbox/
│   └── categories/
│       └── txt.json                # 由 txt_main 改為 txt_setup + txt_process
├── js/
│   └── blocklyEdit.js              # TXT workspace 驗證、初始模型與 UI 警告
└── locales/
    └── {15語系}/messages.js        # 新增 TXT_SETUP / TXT_PROCESS / migration 文案

scripts/
└── generate-block-dictionary.js    # 新 block 類型需同步字典

src/
├── mcp/block-dictionary.json       # 新可見積木需同步字典
└── webview/messageHandler.ts       # 既有 load/save 機制沿用，主變更預期極小
```

---

## 複雜度追蹤

| 議題 | 必要原因 | 被拒絕的簡單替代方案 |
|------|---------|-------------------|
| 將 `txt_main` 換成 `txt_setup` + 多個 `txt_process` | 需要符合使用者期待的多流程教學模型，並提供比單主流程更接近 ROBO Pro 的作者體驗 | 繼續沿用單一 `txt_main`，只要求學生自己在內部手刻大型 `while` / `if` 結構 |
| 直接重做未發布的 `txt_main` | `txt_main` 尚未對外發布，沒有真實使用者相容負擔；應避免多維護一層未來無價值的 legacy surface | 繼續保留 `txt_main` / migration 分支，讓產品面同時存在兩套模型 |
| 維持單一 `main.py` / 單一 shared `txt` | ftrobopy 原始碼與 FT 社群做法都不支持多個獨立 owner 在同一控制器上並行爭用硬體 | 多個獨立 `main.py` / 多個 SSH 程式 / 多個 ftrobopy owner |
| 採用 managed flow runners 而非一開始就全面 AST/state-machine 轉譯 | 現有 TXT generator 已直接輸出 Python statements；先選 codebase 侵入性較低的做法更能落地 | 一開始就全面改寫所有 control / function / variable generator 成 scheduler IR |

---

## Phase 0：研究與重評摘要

*完整內容詳見 [research.md](./research.md)*

| 議題 | 決策 | 信心度 |
|------|------|--------|
| FT/ROBOPro 平行語意 | 採「單一程式中的多流程」模型，不做多個獨立主程式 | 高 |
| 流程數量上限 | 不把 4 當產品限制；只遵守安全使用最佳實踐 | 高 |
| 流程名稱 | 可選，不強制編號或唯一 | 高 |
| codebase 收斂策略 | 直接重做 `txt_main` 路徑，將舊假設從 blocks / generator / workspace 驗證 / fixture 一次清掉 | 高 |
| runtime 選型 | 第一版以單一 `main.py` + shared `txt` + managed flow runners 為主 | 中高 |
| pacing | 保留現有 `txt.updateWait(0.01)` path-sensitive 自動節流規則 | 高 |
| 公開模型策略 | 正式產品面只保留 `txt_setup` + `txt_process`，不維護未發布 legacy surface | 高 |

---

## Phase 1：設計與合約摘要

*完整設計詳見 [data-model.md](./data-model.md) 與 [contracts/](./contracts/)*

### 核心實體摘要

| 實體 | 位置 | 說明 |
|------|------|------|
| `TxtConnectionConfig` | `src/types/txt.ts` | host, username, remotePath, runtimePort |
| `TxtDeviceState` | `src/types/txt.ts` | Idle / Testing / Running / Stopping / Disconnected / Error |
| `TxtIoSnapshot` | `src/types/txt.ts` | Test Panel I/O 快照 |
| `TxtFlowDescriptor` | `specs/.../data-model.md`（待對應實作） | 流程 ID、可選名稱、啟動順序 |
| `TxtWorkspaceTopology` | `specs/.../data-model.md`（待對應實作） | 工作區頂層摘要，供缺少/重複初始化與流程驗證使用 |

### 積木型別摘要

- **新可見積木**：`txt_setup`（UI 顯示「TXT 初始化」）、`txt_process`（UI 顯示「TXT 流程」）、`txt_motor_speed`、`txt_motor_stop`、`txt_output`、`txt_input_sensor`、`txt_wait`、`txt_stop_all`
- **公開作者模型**：`txt_setup`、`txt_process`、既有 TXT 控制積木

---

## 實作階段規劃

### Phase A：工作區模型與 UX 重構

**目標**：讓 Blockly 作者模型直接重做為 `txt_setup` + 多個 `txt_process`。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| A-1 | `media/blockly/blocks/txt.js` | 新增 `txt_setup`、`txt_process`；以新模型取代 `txt_main` 作為正式 TXT 作者入口 |
| A-2 | `media/toolbox/categories/txt.json` | 新工具箱只顯示 `txt_setup` / `txt_process` |
| A-3 | `media/locales/{15語系}/messages.js` | 新增多流程 UI 文案與 workspace validation warning 訊息 |
| A-4 | `media/js/blocklyEdit.js` | 多頂層 TXT 驗證（缺初始化、重複初始化、沒有流程）與 UI 提示 |
| A-5 | `media/blockly/blocks/loops.js` | 合法容器清單改為支援 `txt_setup` / `txt_process` |

**驗收標準**：新工作區可拖出初始化與多個流程；正式產品面不再暴露 `txt_main`。

---

### Phase B：TXT Generator 與流程執行模型

**目標**：在單一 `main.py` 中正確建立共享 `txt`，並讓多個流程同時運作。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| B-1 | `media/blockly/generators/txt/index.js` | 調整 `allowedTopLevelBlocks_` 與 workspace root 聚合邏輯 |
| B-2 | `media/blockly/generators/txt/txt.js` | 實作 `txt_setup` / `txt_process` 的生成器，並移除對公開 `txt_main` 的依賴 |
| B-3 | `media/blockly/generators/txt/python_common.js` | 確保流程包裝後 loops / variables / functions 仍能正確生成 |
| B-4 | `media/blockly/generators/txt/txt.js` | 生成 shared `txt`、shared motor pre-creation、流程 runner 啟動程式碼 |
| B-5 | `media/blockly/generators/txt/txt.js` | 流程名稱僅用於人類可讀 diagnostics，不作為強制語意鍵 |

**驗收標準**：單一 `main.py` 能同時執行多個流程；`txt_wait` 在某流程中等待時，其餘流程不被整體阻塞。

---

### Phase C：單主程式舊路徑清理與收斂

**目標**：把未發布的單主程式舊路徑從正式產品面、workspace bootstrap 與 fixture 一次清乾淨。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| C-1 | `media/js/blocklyEdit.js` | 清理任何 TXT workspace bootstrap、驗證或預設載入仍引用 `txt_main` 的假設 |
| C-2 | `media/blockly/blocks/txt.js`、`media/blockly/generators/txt/txt.js` | 移除 `txt_main`、`txt_init`、`txt_input_read` 的公開 code path 與不再需要的舊模型邏輯 |
| C-3 | `extension_test/blockly/`、相關測試資料 | 將 fixture / 範例 / regression 資料全面更新為新模型 |

**驗收標準**：正式產品面、fixture 與驗證資料都只依賴新模型。

---

### Phase D：驗證、回歸與文件同步

**目標**：確保多流程擴充不破壞既有 TXT / Arduino / CyberBrick 行為。

| 子任務 | 檔案 | 說明 |
|--------|------|------|
| D-1 | `src/test/`、`extension_test/` | 補多流程 / workspace 一致性 / codegen regression 驗證 |
| D-2 | `scripts/generate-block-dictionary.js`、`src/mcp/block-dictionary.json` | 同步新 block dictionary |
| D-3 | `spec.md`、`plan.md`、`research.md`、`data-model.md`、`quickstart.md`、`contracts/` | 文件同步 |
| D-4 | `npm run compile`、`npm run lint`、`npm run validate:i18n`、相關測試 | 完整驗證 |

**驗收標準**：規格、契約、i18n、字典與測試全數同步；既有板子功能無回歸。

---

## 建議實作順序

```text
Phase A（作者模型 / UX）
    ↓
Phase B（generator / flow runners）
    ↓
Phase C（舊路徑清理）
    ↓
Phase D（tests / docs / validation）
```

---

## 主要風險與緩解

| 風險 | 可能性 | 緩解策略 |
|------|--------|---------|
| 內部殘留 `txt_main` 參照導致產品面混入兩套模型 | 中 | 以搜尋與 regression 驗證清點 blocks / generator / toolbox / fixture / docs 的所有舊入口，統一移除 |
| 現有 generator 對單一根容器假設過深 | 高 | 集中在 `txt/index.js`、`txt/txt.js`、`python_common.js` 三個檔案重構，避免分散修改 |
| 多流程同時控制同一硬體端點造成競爭 | 中 | 在規格與 UX 明確標示不建議；必要時補非阻斷警告 |
| WebView 的 main block 管理只認識 Arduino/MicroPython | 高 | 將 `blocklyEdit.js` 的 TXT 驗證從單一 main block 模式抽離為多頂層模型 |
| WebView generator 缺少現成單元測試 | 高 | 補契約/整合回歸案例，並以 workspace fixture 驗證 migration 與 codegen |

---

## 完成標準（對齊 Success Criteria）

| SC | 驗證方式 |
|----|---------|
| SC-001：上傳到執行 ≤ 30 秒 | 手動計時測試 |
| SC-002：5 分鐘完成多流程活動 | 使用者情境測試 |
| SC-003：一流程等待不凍結其他流程 | 多流程硬體或模擬驗證 |
| SC-004：首發工作區一致性 | 從空白工作區建立、儲存、重新開啟的 regression 驗證 |
| SC-005：無 4 流程硬限制 | UI / contract / generator 驗證 |
| SC-006：Test Panel 更新 ≤ 500ms | 現有 Test Panel 驗證 |
| SC-007：15 語系 100% 覆蓋 | `npm run validate:i18n` |
| SC-008：既有功能不回歸 | 現有測試套件與 smoke test |
