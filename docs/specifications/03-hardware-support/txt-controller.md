# fischertechnik TXT Controller 支援

本文件說明 TXT Controller 的工作區模型、連線與執行流程、虛擬控制器、備份預覽及 M 輸出規則。

## 程式結構與執行模型

> 來源：`specs/051-txt-controller-support`（2026-05）

TXT 工作區必須包含一個頂層 `txt_setup`，以及至少一個 `txt_process`。流程名稱供使用者辨識，但執行與參照應依靠穩定 ID；規格不限制最多四個流程。較早的預發佈積木 `txt_main`、`txt_init`、`txt_input_read` 已移除，且不提供遷移。

產生器輸出單一 `main.py`，全程共用一個 `ftrobopy.ftrobopy('auto')` 連線。每個流程由受管理的執行緒執行；`txt_wait` 只以 `time.sleep` 暫停目前流程，而迴圈仍以 `txt.updateWait(0.01)` 節流。主程式保留 join／keepalive，避免啟動流程後立刻退出。

執行前必須檢查 setup 缺少或重複、沒有 process，以及其他結構錯誤。程式透過 SSH／SCP 傳送與啟動，執行進度及輸出寫入專用 Output Channel，並提供停止功能。

連線設定屬於工作區範圍：主機與帳號可保存，密碼只存於 VS Code SecretStorage；預設主機為 `192.168.7.2`。測試與執行共用同一套連線表單和驗證規則。

Test Panel 支援 M1–M4、O1–O8 與 I1–I8，輸入狀態更新目標為 500 ms 內。關閉面板或按下全部停止時必須關閉所有輸出；正式程式執行期間測試會自動暫停。主要狀態為 Idle、Testing、Running、Stopping、Disconnected、Error。

## 虛擬控制器

> 來源：`specs/053-txt-virtual-controls`（2026-05）

工作區在 `workspace` 與 `board` 之外保存頂層 `txtVirtualControls`，內容含 schema 版本、畫布及控制項。第一版控制項為按鈕；每個按鈕包含不可變的 `stableId`、可編輯的 `displayName`、安全且唯一的 `identifier`，以及位置、尺寸與樣式。

編輯模式允許選取、拖曳及修改控制項，但按下按鈕不會產生執行狀態；執行模式禁止編輯，按鈕以按下／放開的瞬時狀態運作。`txt_virtual_button_state` 積木以 `stableId` 綁定控制項。若被參照的按鈕遭刪除，該積木必須標記無效，並在執行前阻擋程式。

程式模式使用獨立 companion runtime，而不是 Test Panel 的 `io_server`。Host 將狀態快照寫至 `/tmp/singular_blockly/virtual_controls_state.json`，預設使用執行服務連接埠加一；產生的 helper 依 `stableId` 讀取狀態。工作區只保存控制項定義，不保存執行中的按壓狀態，重新開啟時一律回到編輯模式。WebView 與 Extension Host 之間的變更只能經由 `postMessage`。

## 備份預覽

> 來源：`specs/054-preview-txt-controls`（2026-05）

備份預覽透過既有 preview panel 先設定板子，再載入工作區與 `txtVirtualControls`。預覽使用專用唯讀 presenter，不得重用可編輯控制器；允許捲動與調整本次預覽的分割比例，但禁止拖曳、重新命名、改色、新增、刪除、按壓、儲存或傳送 runtime 訊息。

舊備份或缺少虛擬控制器資料時顯示唯讀空狀態。資料局部損壞時，應顯示仍可復原的控制項和非阻斷警告／placeholder；無效參照在預覽中不應阻擋其他內容。預覽關閉後不保存分割比例，非 TXT 工作區行為不受影響。

## 亮色、深色與高對比樣式

> 來源：`specs/055-txt-virtual-controls-theming`（2026-05）

控制項可選擇保存 `themeStyles.light` 與 `themeStyles.dark`，並相容舊有 `style.backgroundColor`／`style.textColor`。某主題沒有自訂紀錄時，使用該主題具可讀性的預設值；只允許編輯目前主題的紀錄，不得把亮色設定自動複製到深色，或反向覆寫。

編輯器與預覽必須使用相同的有效樣式解析邏輯，但預覽永遠不寫回資料。高對比模式需保留邊框、外框、焦點等非色彩提示，並支援 forced-colors。TXT 樣式變數應限制在自己的作用域，避免 VS Code host token 汙染 Blockly 編輯器表面。

## M 輸出：馬達與燈光

> 來源：`specs/056-txt-m-output-redesign`（2026-05）

既有 `txt_motor_speed` 與 `txt_motor_stop` 積木繼續使用，不新增獨立燈光積木。速度積木以語言中立的 `COMPONENT` 欄位區分 `MOTOR`／`LAMP`；舊資料缺少欄位時預設為 `MOTOR`。馬達有方向及 0–512 的數值，燈光只有 0–512 的亮度；停止積木只指定連接埠，顯示為通用「停止輸出」。

以下衝突在編輯時要警告，在上傳、執行及程式碼匯出前則必須阻擋：

- 同一 M 埠同時被宣告為馬達與燈光。
- M1 與 O1／O2、M2 與 O3／O4、M3 與 O5／O6、M4 與 O7／O8 同時使用。

不相關的 M/O 埠不得誤報。衝突掃描必須在 setup 與輸出預建立之前完成；「全部停止」要同時關閉所有 M 與 O 輸出。
