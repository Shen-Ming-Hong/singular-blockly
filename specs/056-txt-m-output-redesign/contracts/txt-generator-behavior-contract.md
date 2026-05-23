# 契約：TXT M 系列 Generator 行為

## 適用範圍

本契約定義 TXT generator 在 `MOTOR` / `LAMP` 模式下的輸出語意、硬體使用追蹤與阻擋時機。它不是公開 API，但作為 implementation 與測試的內部契約。

## 通用要求

- generator 必須維持既有 TXT 多流程排序：先收集流程、函式與硬體使用，再組裝 setup/pre-creations。
- generator 必須能追蹤每個 M 埠被哪些元件類型使用。
- generator 必須能追蹤 O 埠使用情況，以支援 shared-pin conflict。
- 若 workspace 已被判定有 blocking conflict，不得產出會被誤認為安全可執行的最終程式。

## `txt_motor_speed` 行為

### `COMPONENT = MOTOR`

- 使用 M 埠。
- 記錄 `MPortUsageRecord(port, MOTOR)`。
- 使用 0..512 的值與方向欄位生成正負速度語意。
- 必須保留既有馬達方向行為。

### `COMPONENT = LAMP`

- 使用 M 埠。
- 記錄 `MPortUsageRecord(port, LAMP)`。
- 使用 0..512 的值生成非方向性亮度/輸出語意。
- 不得讀取或依賴方向欄位。

### Legacy fallback

- 若 `COMPONENT` 缺失、空字串或未知，首版應以 `MOTOR` 作為保守預設，並避免壞積木或 generator crash。
- 若值超出 0..512，應沿用既有數值 clamp / safe handling 策略。

## `txt_motor_stop` 行為

- 使用 M 埠。
- 不記錄任何元件類型。
- 生成該 M 埠輸出歸零的程式碼。
- 不得依 workspace 中其他 M 設定積木推論文案或 generator 分支。

## `txt_output` 行為

- 保留現有公開作者模型與 generator 行為。
- 需要記錄 O 埠使用，以供 shared-pin conflict 檢測。
- 不因本功能改名或下架。

## `txt_stop_all` 行為

- 保留既有語意。
- 必須繼續同時停止所有 M 與 O 輸出。
- 不依賴 individual M component type。

## 衝突與輸出

### Blocking conflict 存在時

- UI / preflight 層必須阻擋 TXT 上傳／執行流程與匯出／程式碼輸出入口。
- generator 可選擇：
  - 回傳空字串加明確註解，或
  - 在 codegen 前被呼叫方阻擋而不進入最終輸出流程。
- 不得在未提示使用者的情況下靜默產生可執行程式。

### 無衝突時

- M 與非對應 O 可以正常共存。
- 同一 M 埠同一元件類型可重複使用，不應因重複 block 自動判為衝突。

## 測試契約

至少應驗證：

- MOTOR 仍產生既有馬達速度語意。
- LAMP 產生非方向性輸出語意。
- `txt_motor_stop` 永遠只對 M 埠歸零。
- `txt_stop_all` 未退化。
- M1+O1 / M1+O2 會衝突；M1+O3 不衝突。
- 舊 block 缺 `COMPONENT` 時以 MOTOR 生成。
