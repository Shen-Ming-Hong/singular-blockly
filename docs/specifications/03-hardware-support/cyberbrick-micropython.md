# CyberBrick MicroPython 支援

> 整合自 specs/021-cyberbrick-micropython 與 specs/022-micropython-custom-function

## 概述

**目標**：為 SingularBlockly 新增 CyberBrick (ESP32-C3) 主板支援，使用 MicroPython 語言與 mpremote 工具實現一鍵上傳

**狀態**：✅ 完成

---

## 主板規格

| 屬性     | 值                |
| -------- | ----------------- |
| 晶片     | ESP32-C3          |
| 語言     | MicroPython       |
| 上傳工具 | mpremote          |
| 程式入口 | `/app/rc_main.py` |
| 板載 LED | NeoPixel (GPIO 8) |

---

## 核心功能

### 1. 主板選擇與工具箱切換

選擇 CyberBrick 時，工具箱自動切換為 MicroPython 積木（隱藏 Arduino/C++ 積木）。

**相關檔案**：

- `media/toolbox/cyberbrick.json` - CyberBrick 專用工具箱
- `src/types/arduino.ts` - `getBoardLanguage()` 函數

### 2. 一鍵上傳流程

```
使用者點擊上傳 → mpremote reset → soft-reset → 上傳 rc_main.py → 重啟執行
```

**實作**：`src/services/micropythonUploader.ts`

### 2.0 Python／mpremote 執行環境

CyberBrick 不要求使用者另外安裝系統 Python。Singular Blockly 在 Extension `onStartupFinished` 啟用後即背景準備自有 CPython、PlatformIO Core 與固定版本 `mpremote`；每次開啟 Blockly 編輯器都會重查並冪等續裝，但不阻塞積木編輯。USB 上傳仍在執行前呼叫 `ensureReady()`，因此背景初始化曾因離線或 proxy 失敗時可以安全重試。

Python 工作負載以 Singular managed Core 為 primary，現有 PlatformIO／PIOArduino provider penv 為 compatibility fallback。只有 executable、Python import、權限或 managed store 損壞等本機 pre-start 錯誤可 fallback；裝置、serial、取消或上傳開始後錯誤不得改用另一 Core 重傳。

### 2.1 USB / OTA 上傳模式（059）

> 來源：specs/059-cyberbrick-upload-modes（2026-05）；交付紀錄：[PR #82](https://github.com/Shen-Ming-Hong/singular-blockly/pull/82)

CyberBrick 支援固定的上傳模式設定，但 **OTA 是上傳工具功能，不是 Blockly 積木**。學生不需要拖曳 Wi‑Fi 或 OTA 積木；上傳工具會在 `/app/rc_main.py` 開頭加入一段很小的 OTA agent 啟動呼叫，內容只會 `import cyberbrick_ota_agent` 並呼叫背景啟動函式，不包含 Wi‑Fi 密碼、OTA token 或 provisioning 邏輯。

為維持官方出廠狀態與最高相容性，OTA provisioning 只允許新增/更新 Singular Blockly 自有檔案（`/cyberbrick_ota_agent.py`、`/cyberbrick_ota_config.py`）並修改 `/app/rc_main.py`；不得修改 `/boot.py`、WebREPL 設定、韌體/出廠設定或其他官方 runtime 檔案。

| 模式 | 行為 | 適用情境 |
| ---- | ---- | -------- |
| `USB` | 預設模式，沿用 `mpremote` 上傳到 `/app/rc_main.py` | 新專案、第一次設定、網路不穩時 |
| `OTA` | 透過同一區域網路上的已配對 CyberBrick OTA agent 寫入 `/app/rc_main.py` | 裝置已完成 USB-first provisioning 並連上 Wi-Fi |

右上角 CyberBrick 設定齒輪可保存上傳模式。按下既有上傳按鈕時會直接依保存模式執行，不會每次詢問小朋友要用 USB 還是 OTA。

#### USB-first provisioning

首次使用 OTA 前，必須先以 USB 連接 CyberBrick，由 Extension Host 透過 `mpremote` 完成：

1. 讀取或建立 `deviceId`。
2. 由 CyberBrick 裝置端掃描 Wi-Fi SSID（不是掃描電腦的 Wi-Fi）。
3. 部署最小 OTA agent 到 `/cyberbrick_ota_agent.py`。
4. 將 Wi‑Fi 與 OTA 驗證 token 的最小必要設定寫入 `/cyberbrick_ota_config.py`。
5. 在 `/app/rc_main.py` 安裝或更新帶標記的 OTA 啟動呼叫，確保 CyberBrick 自動進入 `rc_main.py` 時會啟動 agent。
6. 將 Wi-Fi 密碼、OTA token、pairing secret 存在 VS Code `SecretStorage`。
7. 將非敏感資料（例如 `deviceId`、顯示名稱、最後 IP、狀態）存在工作區設定。

之後不論 USB 或 OTA 寫入 `/app/rc_main.py`，Extension Host 都會重新包裝同一段啟動呼叫，避免後續上傳覆蓋掉 OTA 啟動點。這段 bootstrap 以 start/end marker 管理，重複上傳不會累積多份。

RC/ESP‑NOW 生成碼需要與 OTA agent 共存。RC 初始化只有在「`/cyberbrick_ota_config.py` 具備 SSID 與 OTA token」**且** STA Wi‑Fi 目前已連上 AP 時才保留 Wi‑Fi（不呼叫 `_wlan.disconnect()`、不停用 reconnects、不改 channel）；只有 OTA 設定但 AP 不在線時，仍照積木設定的 channel 初始化。詳細的 bootstrap 等待與 channel fallback 見 [CyberBrick RC：與 OTA 共存的 Wi‑Fi channel](cyberbrick-rc.md#與-ota-共存的-wi-fi-channel062)。

Provisioning 完成後仍維持 `USB` 模式，必須由使用者明確切換到 `OTA`。

> 來源：specs/064-cyberbrick-naming-ota-progress（2026-08）；交付紀錄：[PR #97](https://github.com/Shen-Ming-Hong/singular-blockly/pull/97)

OTA provisioning 與進階「清除 OTA」共用設定 modal 上方的同一張進度卡。Provisioning 依六個實際完成的里程碑呈現 determinate progress；清除流程沒有中間里程碑，因此執行中採 indeterminate sweep，不顯示或虛構百分比。兩個操作都會在送出 Extension Host request 前先顯示 running 狀態並鎖定衝突控制項，結果回來後在同一位置顯示成功或失敗。

進度卡使用 Singular Blockly 既有亮色／暗色 theme token，forced-colors 改用系統 Highlight；`prefers-reduced-motion` 會停用 sweep、pulse 與寬度 transition，但保留靜態填色與狀態邊框。輔助科技方面，provisioning 提供實際 `aria-valuenow`，清除 running 時省略該值並設定 busy，兩者都提供在地化 `aria-valuetext`。

#### OTA v1 protocol

OTA v1 使用區域網路 HTTP API：

- Base URL：`http://{lastKnownIp}:{otaPort}/api/v1`
- Health：`GET /api/v1/health`
- Upload：`POST /api/v1/upload`
- 固定遠端路徑：`/app/rc_main.py`
- 驗證 headers：
	- `Authorization: Bearer <ota-token>`
	- `X-CyberBrick-Device-Id: <deviceId>`
	- `X-CyberBrick-Protocol-Version: 2`

上傳前會檢查主要目標裝置、token、最後 IP、agent health、`deviceId` 是否相符與 protocol version。OTA 失敗時只提供下一步（例如重新掃描、重新 provisioning、手動切回 USB），**不會自動 fallback 到 USB**，避免程式被送到錯誤裝置或造成教室多裝置混淆。

#### OTA Agent 自動升級（061）

> 來源：specs/061-cyberbrick-wifi-monitor-ota-upgrade（2026-05）；交付紀錄：[PR #84](https://github.com/Shen-Ming-Hong/singular-blockly/pull/84)

OTA 上傳前會比較 `/api/v1/health` 回報的 agent 版本。現行目標版本是 `1.5.9`，支援無線自動升級的最低版本是 `1.4.0`：

- `1.4.0` 以上但低於目標版本：以 `POST /api/v1/upload-agent` 傳送新 agent，驗證 SHA-256，等待重啟及 health readiness 後再上傳學生程式。
- 等於或高於目標版本：直接上傳，不降級裝置上的較新 agent。
- 低於 `1.4.0`、版本缺失或格式無效：視為舊版並盡力嘗試同一升級 endpoint；舊 agent 不支援時升級會失敗，但仍繼續既有 OTA 程式上傳。
- 自動升級失敗：顯示警告並繼續程式上傳；不因維護 agent 版本而阻斷課堂工作。

此規格曾設計 Wi‑Fi print monitor，但在合併前明確移除，現行產品未交付 Wi‑Fi log endpoint 或 Wi‑Fi monitor service。Monitor 有 USB 硬體連線時仍優先使用既有 USB serial monitor；`POST /api/v1/reset` 則保留供 OTA 上傳後復原程式執行。

#### 完整清除 OTA / 回到 USB-only

CyberBrick 設定 modal 提供進階清除動作，讓老師或使用者可透過 USB 把 Singular Blockly OTA 安裝內容完整移除。這是有線、明確確認的動作，不會透過 OTA 刪除 OTA agent 本身。

清除流程會：

1. 要求選定 USB port；不要求該裝置已經是本機 paired device。
2. 若 UI 目前選定 paired CyberBrick，透過 USB 讀取裝置端 `deviceId` 並確認相符；若未選定 paired device，則以目前 USB 連線裝置為清除目標。
3. 刪除 `/cyberbrick_ota_agent.py`。
4. 刪除 `/cyberbrick_ota_config.py`。
5. 從 `/app/rc_main.py` 移除 Singular Blockly OTA bootstrap marker 區塊。
6. 若讀到的 `deviceId` 對應 Extension Host 本機 paired device 或 secrets，刪除該本機 pairing/secrets；若沒有對應，則不誤刪本機其他裝置資料。
7. 將專案上傳模式切回 `USB`。

清除流程不會修改 `/boot.py`、WebREPL 設定、韌體/出廠設定、官方 runtime 或其他非 Singular Blockly 管理的檔案。如果 UI 已指定 paired device，但 USB 連到不同 `deviceId` 的 CyberBrick，cleanup 會拒絕執行，避免把隔壁同學的裝置清掉；若沒有指定 paired device，則允許清除目前 USB 連線裝置上的 Singular Blockly OTA 殘留。小心，這把「清除 OTA」的小掃把只掃 Singular Blockly 自己留下的灰塵，不掃別人的房間。

### 3. 主板切換保護

從 Arduino 切換到 CyberBrick（或反向）時：

1. 使用 Ctrl+S 備份機制自動儲存當前工作區
2. 顯示確認對話框
3. 清空工作區並更新工具箱

---

## 積木類別

### Core 積木 (cyberbrick_core)

> `cyberbrick_led_digital` 來源：specs/060-cyberbrick-led-digital（2026-05）；交付紀錄：[PR #83](https://github.com/Shen-Ming-Hong/singular-blockly/pull/83)

| 積木                       | 用途                     | 生成程式碼                                        |
| -------------------------- | ------------------------ | ------------------------------------------------- |
| `cyberbrick_main`          | 主程式進入點             | `async def main(): ...`                           |
| `cyberbrick_led_set_color` | 設定板載 LED             | `onboard_led[0] = (r, g, b); onboard_led.write()` |
| `cyberbrick_led_digital`   | 以 ON/OFF 分別控制 R/G/B | ON 對應 255，OFF 對應 0，再寫入 GPIO 8 NeoPixel  |
| `cyberbrick_led_off`       | 關閉板載 LED             | `onboard_led[0] = (0, 0, 0); onboard_led.write()` |
| `cyberbrick_delay_ms`      | 毫秒延遲                 | `await asyncio.sleep_ms(ms)`                      |
| `cyberbrick_delay_s`       | 秒延遲                   | `await asyncio.sleep(s)`                          |
| `cyberbrick_ticks_ms`      | 取得目前毫秒數           | `time.ticks_ms()`                                 |
| `cyberbrick_ticks_diff`    | 計算時間差               | `time.ticks_diff(now, start)`                     |
| `cyberbrick_print`         | 序列埠輸出               | `print(msg)`                                      |

### WiFi 積木 (cyberbrick_wifi)

| 積木                      | 用途         |
| ------------------------- | ------------ |
| `cyberbrick_wifi_connect` | 連接 WiFi    |
| `cyberbrick_wifi_status`  | 查詢連線狀態 |
| `cyberbrick_wifi_ip`      | 取得 IP 位址 |

---

## MicroPython 自訂函數

### 問題背景

`arduino_function` 積木在 MicroPython 模式下無法生成程式碼。

### 解決方案

新增 `micropythonGenerator.forBlock['arduino_function']` 生成器：

```javascript
micropythonGenerator.forBlock['arduino_function'] = function (block) {
	const funcName = block.getFieldValue('FUNC_NAME');
	const params = getParams(block);
	const statements = generator.statementToCode(block, 'STACK');

	// 生成 async def 函數
	generator.definitions_[`func_${funcName}`] = `async def ${funcName}(${params}):\n${statements || '  pass\n'}`;
	return '';
};
```

**相關檔案**：`media/blockly/generators/micropython/functions.js`

---

## 計時積木穩定版（032、033）

> 來源：spec/032-cyberbrick-time-blocks（2025-12）、spec/033-remove-timer-experimental（2026-01）

### 新增積木

| 積木類型                | 生成碼                  | 說明                                       |
| ----------------------- | ----------------------- | ------------------------------------------ |
| `cyberbrick_ticks_ms`   | `time.ticks_ms()`       | 回傳毫秒級時間戳（由啟動時計起的累計毫秒） |
| `cyberbrick_ticks_diff` | `time.ticks_diff(a, b)` | 計算兩時間戳的差量（處理溢位回繞）         |

兩個積木均需 `import time`，已透過 `generator.addImport()` 自動注入。

### Experimental 標記移除

`cyberbrick_ticks_ms` 和 `cyberbrick_ticks_diff` 從實驗標記（黃色高亮）增为穩定特性：

- `media/css/experimentalBlocks.css` 不再對這兩積木進行樣式覆寫
- `experimentalBlockMarker.js` 不再將其標記為實驗
- 工具箱中顯示檣式渣設計（移除標記樣式）

---

## MicroPython 全域變數提升（034）

> 來源：spec/034-micropython-global-vars（2026-01）

### 問題背景

MicroPython 在函式內無法直接變更全域變數，必須加入 `global var_name` 宣告。Blockly 自動生成器從未微處理此區別。

### 設計導則

| 情境                                         | 處理                                  |
| -------------------------------------------- | ------------------------------------- |
| 在自訂函式內**賭値**全域變數                 | 加入 `global var_name`                |
| 在自訂函式內**只讀取**全域變數               | 不加 `global`（Python 對只讀不需要）  |
| `controls_for` / `controls_forEach` 迴圈變數 | 不加 `global`（迴圈變數不是全域變數） |
| 函式參數與全域變數同名                       | 參數陰藏全域，不加 `global`           |
| 反覆呼叫的函式（async def）                  | 同樣容對全域變數                      |

### 實現方式

```python
# 生成範例：在 my_func() 中賭値 counter
x = 0
counter = 0

async def my_func():
  global counter  # 自動注入，x 未賭値則不加
  counter = counter + 1
```

**源碼位置**：`media/blockly/generators/micropython/micropython.js` 中 `workspaceToCode` 後處理階段，掌變數使用图分析函式中的賭値操作。

---

## MicroPython 命名防呆（064）

> 來源：specs/064-cyberbrick-naming-ota-progress（2026-08）；交付紀錄：[PR #97](https://github.com/Shen-Ming-Hong/singular-blockly/pull/97)

只有目前板子為 CyberBrick 時，變數、函式與函式參數的建立／重新命名才套用 MicroPython 命名檢查；Arduino 與 TXT Controller 維持既有行為，切換離開 CyberBrick 時清除本功能專用警告，切回時重新掃描。純驗證邏輯位於 `media/js/cyberbrickNameValidation.js`，契約測試為 `src/test/webview/cyberbrickNaming.contract.test.ts`。

### 規則

- 只移除前後空白；不改內部空白、不轉換中文、不改大小寫。整理後為空字串即為錯誤。
- 合法字元：第一字元為 ASCII 英文字母、底線或 CJK（U+3400–4DBF、U+4E00–9FFF、U+F900–FAFF），後續字元另可包含 ASCII 數字。中文命名維持原樣。
- **阻擋錯誤**：數字開頭、內部空白、連字號與其他非法符號；Python hard keywords（`False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield`）；函式名稱與工作區內另一函式重複；同一函式內參數重複（不同函式可用相同參數名）。
- **警告但允許**：執行環境名稱 `machine`、`time`、`network`、`Pin`、`PWM`、`ADC`、`UART`、`I2C`、`SPI`、`Timer`、`NeoPixel`；內建名稱 `print`、`input`、`len`、`range`、`int`、`float`、`str`、`bool`、`list`、`dict`、`tuple`、`set`、`min`、`max`、`sum`、`abs`、`round`、`type`、`isinstance`、`enumerate`、`zip`、`map`、`filter`、`open`。`match`、`case`、`_` 不視為關鍵字。

### 互動與上傳

| 介面 | 錯誤 | 警告 |
| ---- | ---- | ---- |
| 變數（Extension Host InputBox） | 即時顯示原因，不能按 Enter 送出 | 顯示警告，可送出整理後名稱 |
| 函式／參數（Blockly 行內欄位） | validator 回傳 `null`，保留先前名稱並顯示錯誤 | 提交新值並保留警告 |

所有 `Blockly.serialization.workspaces.load()` 入口由共用 hydration scope 包住，反序列化期間行內 validator 原樣接受舊值，**不自動改名或刪除**；載入完成後才掃描並以專用 warning ID 標示問題積木，不覆蓋其他安全警告。每次按上傳都重新掃描：仍有任何錯誤就不送出上傳請求，顯示在地化摘要（`CYBERBRICK_NAME_UPLOAD_BLOCKED`）並引導到第一個問題積木；只有警告則照常上傳。程式碼預覽不因命名問題停用。本功能不改變工作區或使用者設定的持久化格式。

### OTA 設定進度的一致性

六個 provisioning 里程碑依序為：USB 已選擇、裝置身分已讀取或建立、OTA agent 已安裝、Wi‑Fi 已設定、OTA agent 已驗證、配對與機密已儲存（最後一項須秘密與配對設定都持久化後才完成）；Wi‑Fi 掃描是獨立前置操作，不計入里程碑。學生畫面不顯示分數或百分比，只顯示大型進度條、執行中圖示、目前階段文字與「請勿重複按下或拔除 USB」提示。

- 同一里程碑的多次狀態只更新文字，進度條只前進一次，不倒退、不超出範圍。
- 前後端都只允許一個進行中的設定；重複要求回覆專用的「設定進行中」結果，不再次操作裝置。每次請求帶識別碼，畫面忽略舊請求的延遲訊息；所有進度訊息先驗證結構與允許值。
- 關閉再開啟對話框會恢復目前請求的進度與鎖定狀態。成功時清除 Wi‑Fi 密碼；失敗時進度停在已到達位置、標示失敗階段並保留密碼供重試。成功、失敗或例外都會釋放執行中狀態。
- 進度、錯誤與日誌不得包含 Wi‑Fi 密碼、OTA token 或配對秘密。

---

## 相關文件

- [擴展板積木](cyberbrick-expansion-boards.md) - X11/X12 擴展板
- [CyberBrick RC](cyberbrick-rc.md) - ESP-NOW 遙控與 OTA channel 共存
- [統一上傳 UI](../06-features/unified-upload-ui.md) - Arduino/MicroPython 統一介面
