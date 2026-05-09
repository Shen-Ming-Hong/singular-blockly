# 研究報告：fischertechnik TXT Controller 支援（多流程重評）

**功能分支**：`051-txt-controller-support`  
**研究日期**：2026-05-09  
**狀態**：完成（已納入多流程與直接重做策略評估）

---

## 研究議題一：ftrobopy 單一共享連線是否仍是正確前提？

**結論**：是。多流程擴充後仍應維持 **單一 `main.py` + 單一共享 `ftrobopy.ftrobopy('auto')` 連線**，不應改成多個獨立主程式或多個 ftrobopy owner。

**依據**：

- `ftrobopy.py` 內部本來就維護 background exchange thread、`threading.Event`、`threading.RLock` 與 socket/serial 通訊狀態
- `updateWait()` docstring 明確指出它是在等待下一個 exchange cycle，而不是鼓勵 busy loop
- FT/ROBOPro 的「平行」語意比較接近「單一應用內的多流程／多 procedures」，不是多個獨立下載程式同時搶同一套 I/O

**被拒絕的替代方案**：

- 多個獨立 `main.py` / 多個 SSH 程式同時執行
- 為每個流程建立獨立 `ftrobopy.ftrobopy(...)` 物件

---

## 研究議題二：ROBOPro 是否真的限制 4 個流程？

**結論**：沒有足夠證據支持「4 是產品層硬限制」。本次規格不應把 4 個流程寫成 UI 或 runtime 上限。

**依據**：

- 第三方 ROBOPro 平行流程文章指出，流程可以透過 subprogram/process 結構展開，重點在生命週期管理，不在於固定只有 4 個流程
- 同一篇資料亦指出需要在 Main Program 屬性中調整 **Minimum number of procedures**，顯示限制更接近 procedure 配置，而非「最多只能 4 個流程」
- 使用者已明確決定不把 4 個流程產品化

**設計含義**：

1. UI 不顯示「流程 1~4」固定槽位
2. 流程命名採可選文字欄位
3. 實務限制改以文件與教學引導說明，而不是產品硬限制

---

## 研究議題三：流程名稱與生命週期最佳實踐

**結論**：流程名稱應為 **可選**；內部識別應使用穩定 hidden ID，而不是要求學生輸入唯一名稱或手動編號。

**依據**：

- ROBOPro 多流程資料強調的是 process 所屬的 subprogram 與結束管理，而不是靠人工編號維持語意
- 學生視角中，「避障」、「閃燈」、「按鈕監聽」這種語意名稱比「流程 1 / 2 / 3」更容易理解

**決策**：

- 流程積木外觀採 `TXT 流程：＿＿＿＿` 類型，但名稱留白也能正常運作
- 相同顯示名稱允許存在；系統用 hidden ID 追蹤流程

---

## 研究議題四：`txt_wait` 在多流程模型中的語意

**結論**：`txt_wait` 必須只暫停 **當前流程**，不能阻塞整個程式。

**依據**：

- 這是多流程作者模型能否成立的核心差異；若 `txt_wait` 仍凍結整個程式，學生會感受到「其實只有一條主流程」
- 既有 TXT generator 已經把 `txt_wait` 生為 `time.sleep(...)`；若每個流程被包裝成受管理的獨立 flow runner，便能保留這個使用者熟悉的等待語意，而不必把所有等待改寫成新的 block

**補充**：

- `controls_duration` 與 `txt_wait` 的 pacing 語意應與目前 path-sensitive `txt.updateWait(0.01)` 自動節流機制並存
- 對緊密輪詢硬體的 loop，仍需保留自動 pacing 判斷，不因導入多流程而退化為 busy loop

---

## 研究議題五：純 scheduler/state-machine 與目前 codebase 的適配度

**結論**：純 scheduler/state-machine 仍是理論上很乾淨的模型，但以目前 codebase 而言，**第一版不宜直接全面改寫成此模式**。

**依據**：

- 目前 `media/blockly/generators/txt/txt.js` 與 `python_common.js` 直接輸出一般 Python statements
- `if / while / for / variables / functions` 都沿用傳統 statement generator 模式
- 若要全面改為 state-machine IR，會同時牽動 control blocks、function definitions、variables 與流程控制 block 的生成方式

**決策**：

- 規格層維持「多流程」語意
- 實作層第一版優先採 **單一 `main.py` + shared `txt` + managed flow runners**，以最小侵入方式達成可用的多流程效果

---

## 研究議題六：既有單主程式 codebase 是否需要保留 legacy 相容？

**結論**：不需要。由於 `txt_main` 從未對外發布，這次應直接把作者模型重做成 `txt_setup` + `txt_process`，而不是額外設計 migration layer。

**依據**：

- 外部 `master` 分支尚未對使用者公開 `txt_main`，不存在真實使用者或教學專案相容負擔
- 現有單主程式假設主要集中在少數檔案：`media/blockly/blocks/txt.js`、`media/blockly/generators/txt/index.js`、`media/blockly/generators/txt/txt.js`、`media/blockly/generators/txt/python_common.js`、`media/blockly/blocks/loops.js`、`media/toolbox/categories/txt.json`
- 若保留 migration / load-only 相容層，會額外增加 WebView 驗證、generator 分支、測試矩陣與 i18n 文案複雜度

**決策**：

- 正式產品面只保留 `txt_setup` + `txt_process`
- `txt_main`、`txt_init`、`txt_input_read` 不列入對外相容承諾
- 舊單主程式相關 fixture、範例與測試資料直接更新為新模型

---

## 研究議題七：共享硬體端點的競爭控制如何處理？

**結論**：本次規格不把「多流程同時控制同一個馬達/輸出」包裝成推薦用法；應以 **教學文件與 UX 警示** 為主。

**依據**：

- ROBOPro 平行流程範例重點在「拆分工作」與「結束管理」，不是鼓勵多個流程同時寫同一輸出
- 同一個 TXT 硬體端點被多個流程競爭控制時，學生很難建立穩定心理模型

**決策**：

- 規格中將此列為 edge case 與文件化限制
- 若後續可做靜態分析，可再補 non-blocking warning，但不作為此次擴充前置條件

---

## 研究議題八：既有 `updateWait()` 與 pacing 規則是否需要推翻？

**結論**：不需要。原先 path-sensitive `txt.updateWait(0.01)` 決策仍成立。

**依據**：

- ftrobopy `updateWait()` 是通用 exchange-cycle 同步 API，不是超音波特例
- 官方與社群資料都支持對緊密硬體輪詢迴圈做節流
- 多流程擴充後，單一流程內部若存在未節流硬體 loop，依然會造成 CPU 浪費與交換週期壓力

---

## 研究摘要表

| 議題 | 決策 | 信心度 |
|------|------|--------|
| 單一 shared `txt` | 維持單一 `main.py` + 單一 shared `ftrobopy` | 高 |
| 流程數量上限 | 不把 4 寫成產品限制 | 高 |
| 流程名稱 | 可選、不必唯一、不必編號 | 高 |
| `txt_wait` 語意 | 只暫停當前流程 | 高 |
| runtime 路徑 | 第一版採 managed flow runners，而非全面 state-machine rewrite | 中高 |
| 相容策略 | 直接重做未發布的單主程式模型，不建立 legacy migration layer | 高 |
| 競爭控制 | 列為不建議情境，文件與 UX 提示為主 | 中高 |
| pacing | 維持 path-sensitive `txt.updateWait(0.01)` 自動節流 | 高 |
