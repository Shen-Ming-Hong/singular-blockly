# 研究紀錄：TXT M 系列輸出重設計

## 決策 1：沿用既有 `txt_motor_speed` / `txt_motor_stop` block type，不新增燈泡專用積木

**決策**：延伸既有 `txt_motor_speed` 與 `txt_motor_stop`，而不是新增 `txt_lamp_*` 或其他燈泡專用 block type。`txt_motor_speed` 轉型為 M 系列元件選擇式設定積木；`txt_motor_stop` 則轉型為固定文案「停止輸出」的通用 M 停止積木。

**理由**：規格已明確要求首版不得新增獨立燈泡設定積木或燈泡關閉積木，且不為少量早期工作區建立大型 migration。沿用 block type 可把相容性成本降到最低，也能維持工具箱與教材的簡潔度。

**曾考慮的替代方案**：

- 新增 `txt_lamp_output` / `txt_lamp_stop`：會把作者體驗拆成兩套，與規格衝突。
- 保留現有馬達 block，再新增一組通用 M block：工具箱重複且 migration 更複雜。
- 直接以新 block type 取代舊 block type：會增加 load-time migration 風險，不符合本次範圍控制。

## 決策 2：元件選擇使用 `field_dropdown` 欄位，序列化為語言中立鍵，缺值時預設 `MOTOR`

**決策**：在 `txt_motor_speed` 上新增 `COMPONENT` 下拉欄位，使用語言中立鍵值（建議 `MOTOR` / `LAMP`）序列化為標準 Blockly field，而不是存在 `extraState` 或其他 workspace-level 自訂資料。舊工作區若缺少 `COMPONENT` 欄位，一律視為 `MOTOR`。

**理由**：官方 Blockly dropdown 文件指出，下拉欄位會把「顯示文字」與「語言中立值」分離，JSON 也會直接把欄位值儲存在 `fields.FIELDNAME`。這正符合 15 語系需求，也讓舊工作區只需補預設值即可繼續使用。Blockly 官方 serialization 文件亦指出：若區塊的輸入僅依賴某個欄位值切換，通常可在欄位反序列化後透過 validator 或 shape update 補齊，不必額外為此建立複雜的 `extraState`。

**曾考慮的替代方案**：

- 使用 `saveExtraState()` / `loadExtraState()` 儲存 component：對首版來說過重，且會增加 legacy 相容成本。
- 以本地化文字當作欄位值：切換語言會失去穩定鍵值，不可行。
- 在 toolbox JSON 強制寫死 `COMPONENT`：無法保證所有舊工作區、自訂 toolbox 或程式化建立積木都安全，應由 block 自身保底。

## 決策 3：用 dropdown validator + 動態重建輸入列處理方向欄位顯示

**決策**：當 `COMPONENT` 從 `MOTOR` 切到 `LAMP` 時，透過 Blockly validator / onchange 重新建立該 block 的輸入列，隱藏方向欄位並改用亮度語意；切回 `MOTOR` 時再恢復方向欄位。

**理由**：Blockly 官方 validator 文件明確支援「根據下拉選單修改方塊形狀」，而 repo 內也已有 `encoder_setup` 這種「移除並重建輸入、保留既有欄位值」的現成 pattern。這條路徑可以讓 UI 行為和序列化保持單純，不必引入 mutator UI。

**曾考慮的替代方案**：

- 永遠顯示方向欄位、但在燈泡模式忽略：會造成誤導，違反規格。
- 為 MOTOR / LAMP 各做一個不同 shape 的 block type：重複作者模型，拒絕。
- 引入 Blockly mutator：功能過剩，不符合避免過度開發原則。

## 決策 4：停止積木維持通用斷電模型，只選 M 埠，固定文案「停止輸出」

**決策**：`txt_motor_stop` 不新增 `COMPONENT` 欄位，也不得依賴同埠其他積木去推論元件類型。它是單純的「把該 M 埠輸出歸零」的通用操作，固定文案為「停止輸出」。

**理由**：規格澄清已明確指出停止積木的本質是通用斷電，而不是依元件語意分流。若要求再次選元件或偷偷掃描其他 block 來變更文案，反而會引入額外操作與隱性耦合。

**曾考慮的替代方案**：

- 停止積木也帶 `COMPONENT`：增加多餘操作，與使用者決策衝突。
- 僅選 M 埠但依 workspace 其他 block 推論馬達/燈泡：文案與行為會受外部積木牽動，不穩定。
- 固定使用「停止」或「關閉」：都偏向某一類元件語意，不如「停止輸出」中性。

## 決策 5：衝突判定採「實際共腳位 / 同埠不同元件」的工作區級掃描，並在上傳／執行流程與匯出／程式碼輸出前阻擋

**決策**：衝突檢測只處理兩類 blocking conflict：

1. 同一個 M 埠在同一工作區被指定為不同元件類型。
2. M 埠與其實際共用腳位的 O 埠同時被使用，映射固定為：
   - `M1 ↔ O1 / O2`
   - `M2 ↔ O3 / O4`
   - `M3 ↔ O5 / O6`
   - `M4 ↔ O7 / O8`

只有真正命中這兩類條件時才警告，並阻擋 TXT 上傳／執行流程與匯出／程式碼輸出入口；單純出現 M 與不相關 O 積木不得誤判。

**理由**：規格已澄清「不是只要兩種積木同時存在就警告」。repo 現況已有 workspace warning、block warning 合併與 upload preflight/blocking 的實作模式，可沿用相同節奏：編輯時即時提示、真正要執行時硬性攔下。

**曾考慮的替代方案**：

- 只要 workspace 內同時有 M 與 O block 就警告：誤判率過高，與規格衝突。
- 做 runtime flow / branch 互斥分析後才決定衝突：成本過高，不符合首版範圍。
- 只在 codegen 輸出註解、不阻擋上傳／執行流程與匯出／程式碼輸出入口：無法滿足安全與驗收要求。

## 決策 6：用輕量 component metadata 支撐未來擴充，而不是一次做完整通用框架

**決策**：首版只正式支援 `MOTOR` / `LAMP`，但在 block/generator 層使用輕量 metadata（例如 `requiresDirection`、`valueRange`、`generatorMode`、`displayMessageKey`）描述元件能力，讓未來新增有極性或方向性的 M 元件時能沿用同一個句型與欄位切換原則。

**理由**：規格要求「未來新增 M 元件時不必重學基本句型」，但同時也要求首版不要過度開發。輕量 metadata 可以兼顧可擴充性與當前範圍控制，不必在第一版就引入一整套大型 registry / schema framework。

**曾考慮的替代方案**：

- 完全只寫 `if component === 'LAMP'` 特例：短期可行，但會讓下一種元件又得重構一次。
- 立即打造完整 capability registry 與全域 serializer：超出首版需求。

## 決策 7：Generator usage tracking 必須遵守既有 TXT 多流程排序，避免 setup 遺漏硬體使用資訊

**決策**：M 埠使用情況、元件類型與 shared-pin 衝突追蹤，必須在既有 TXT generator ordering 內收集完成：先經過 functions / `txt_process` 內容、再組裝 `txt_setup` 與 pre-creations，不能等 setup code 生完後才回頭補資料。

**理由**：repo memory 已記錄 TXT generator 需先收集流程內硬體使用，再生成 setup，否則 `buildPreCreations()` / `buildSetConfig()` 會漏掉流程內資源。這次若新增 M 元件 usage tracking，必須延續同樣順序。

**曾考慮的替代方案**：

- 在 `txt_setup` 生成完後再掃描一次輸出 block：容易與既有 pre-creation ordering 打架。
- 把所有檢測都放到 host 端：host 不掌握 Blockly block shape 與 warning 呈現節奏，也會增加 context 耦合。

## 決策 8：測試、i18n、contract docs 必須同步更新，避免功能正確但 repo 契約失真

**決策**：本功能的最小完整交付必須同時涵蓋：

- TXT 生成/驗證相關自動化測試
- legacy fixture 相容驗證
- 15 語系 i18n key 補齊
- 056 spec 下的 contracts 與 quickstart

**理由**：這個功能同時改動 block UI、generator、warning、上傳／執行 blocking 與公開文案；若只改程式碼不更新 tests / locale / contracts，很容易在下一輪重構時失去規格邊界。

**曾考慮的替代方案**：

- 先只做 zh-hant：違反專案 i18n 規範。
- 只靠手動測試：不足以覆蓋 generator 與 legacy fixture。
- 不寫 contract docs：會讓 `/speckit.tasks` 缺乏可依附的設計接口。

## 參考依據

- Blockly 官方文件：
  - Dropdown fields（更新於 2026-05-13）
  - Serialization（更新於 2025-09-20）
  - Validators（更新於 2025-10-02）
- 現有 repo 實作：`media/blockly/blocks/txt.js`、`media/blockly/generators/txt/{index,txt,python_common}.js`、`media/js/blocklyEdit.js`、`src/webview/messageHandler.ts`
- 現有 repo memory：`/memories/repo/txt-generator-ordering.md`
- 既有規格參考：`specs/051-txt-controller-support/`、`specs/055-txt-virtual-controls-theming/`

## 結論

Phase 0 所需的技術未知項已足夠收斂：

- Blockly 欄位/序列化策略已有官方依據
- TXT generator ordering 風險已有既有經驗可避開
- 上傳／執行 blocking 有現成 preflight 模式可沿用
- 首版範圍可透過「既有 block type + 新欄位 + workspace 級衝突掃描」實現，無需大型 migration 或新增燈泡專用指令

本功能可進入 Phase 1 設計與契約定義。