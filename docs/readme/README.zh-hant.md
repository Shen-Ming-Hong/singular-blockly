# Singular Blockly

[English](../../README.md) · **繁體中文** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md) · [Español](README.es.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Polski](README.pl.md) · [Português (Brasil)](README.pt-br.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [Čeština](README.cs.md) · [Magyar](README.hu.md) · [Български](README.bg.md)

> 本文件為英文 [README](../../README.md) 的翻譯。內容不一致時，以英文版為準。

<p align="center">
  <img src="../../images/icon.png" width="112" alt="Singular Blockly 圖示">
</p>

**在 VS Code 裡用積木為 Arduino、CyberBrick 與 fischertechnik TXT Controller 寫程式。**

用 Blockly 拼出程式、立即看到產生的程式碼，再透過 PlatformIO、USB、區域網路 OTA 或 SSH 上傳。

[從 VS Code Marketplace 安裝](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) · [從 Open VSX 安裝](https://open-vsx.org/extension/Singular-Ray/singular-blockly) · [閱讀文件](../specifications/README.md)

## 操作示範

以下畫面是在真實的 VS Code 視窗中，以目前版本的擴充功能實際操作錄製。

**1. 開啟編輯器並選擇開發板。** 點選活動列上的 Singular Blockly 圖示，再從「選擇開發板」選單挑選你的開發板。

![從活動列開啟 Blockly 編輯器並選擇 Arduino Uno](../images/readme/open-editor-and-select-board.gif)

**2. 拖曳積木，同時看到程式碼更新。** 從工具箱把積木拖進「設定」與「重複」，用下拉選單修改數值；把 `src/main.cpp` 開在編輯器旁邊，就能看到產生的程式隨著操作即時變化。

![用拖曳的方式組出 LED 閃爍程式，src/main.cpp 同步更新](../images/readme/build-program-with-live-code.gif)

**3. 切換語言與主題。** 按箭頭按鈕展開工具列，用地球圖示選單立即切換編輯器語言，再用主題按鈕切換淺色與深色。

![把編輯器切換成繁體中文與深色主題](../images/readme/switch-language-and-theme.gif)

## 意見回饋、線上服務與資料使用

可以使用 Blockly 編輯器中標示清楚的「提供回饋」按鈕、在命令選擇區執行 **Singular Blockly: 提供回饋**，或使用 VS Code 的問題回報工具。不需要 GitHub 帳號。開啟或填寫表單時不會發出任何網路請求；送出前，表單會顯示完整的傳送內容並請你明確確認。

基本環境診斷預設開啟，可以關閉；近期結構化事件預設關閉。允許傳送的欄位清單排除了原始碼、Blockly 工作區內容、產生的程式碼、檔案與資料夾名稱、路徑、電腦與裝置識別碼、序列埠、Wi-Fi 與 IP 資訊、環境變數、憑證、原始錯誤與原始日誌。可附上一張截圖，截圖會在本機重新編碼、移除原始中繼資料、限制在 1920 像素與 3 MiB 以內，先讓你預覽，確認後才會送出。

回饋功能使用存放在 VS Code SecretStorage 的匿名密鑰，以及專用的 Cloudflare D1/R2 服務；維護者處理流程使用一個私有的 GitHub 儲存庫。這是由使用者主動發起的支援傳輸，不是遙測或使用分析。詳見[隱私權聲明](../../PRIVACY.md)、[支援政策](../../SUPPORT.md)、[回饋服務條款](../../TERMS.md)與[安全性政策](../../SECURITY.md)。

## 為什麼選擇 Singular Blockly？

- **一個視覺化編輯器，三種程式工作流程**：Arduino C++、CyberBrick MicroPython 與 TXT Controller Python。
- **直接上傳到硬體**：Arduino 使用 PlatformIO，CyberBrick 使用 USB 或已配對的區域網路 OTA，TXT Controller 使用 SSH。
- **適合課堂的工具**：在地化範例、TXT 虛擬控制項、I/O 測試、備份，以及清楚的硬體診斷。
- **現代化的 Blockly 體驗**：Blockly 13.4.0 搭配 `@blockly/theme-modern`，支援淺色與深色主題、積木搜尋、觸控、鍵盤操作與語意化控制項標籤，全部打包在擴充功能內，可離線使用。
- **安全的專案檔案**：自動儲存、備份還原、孤立積木防護，以及外部修改工作區時的即時驗證。
- **支援 AI 程式助理的專案**：專案內的 Agent Skills 讓程式助理取得目前的開發板、工作區格式與積木契約。

## 快速開始

1. 從 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Singular-Ray.singular-blockly) 或 [Open VSX](https://open-vsx.org/extension/Singular-Ray/singular-blockly) 安裝 Singular Blockly。
2. 在 VS Code 開啟一個可寫入的資料夾。
3. 點選活動列上的 Singular Blockly 圖示，或在命令選擇區執行 **Singular Blockly: 開啟 Blockly 編輯器**。
4. 選擇開發板，從工具箱拖曳積木組出程式。
5. 開啟產生的檔案（例如 `src/main.cpp`）檢查程式碼，再按編輯器工具列上的上傳按鈕。

VS Code 啟動後，Singular Blockly 會開始在擴充功能專屬的儲存空間準備經過驗證的 Python、經測試版本範圍內的 PlatformIO Core 與 `mpremote` 執行環境。開啟 Blockly 編輯器時會再檢查一次，但不會妨礙編輯。Arduino 仍優先使用既有的 PlatformIO 提供者：VS Code 使用 `platformio.platformio-ide`，VSCodium 等 Open VSX 環境可使用 `pioarduino.pioarduino-ide`；Singular Core 是備援。自訂的受管執行環境資料夾第一次使用時必須是空的，以免修復或清理時誤動到無關的檔案。

<details>
<summary><b>離線安裝 VSIX</b></summary>

1. 從 [GitHub Releases](https://github.com/Shen-Ming-Hong/singular-blockly/releases) 下載最新的 `.vsix`。
2. 在命令選擇區開啟 **Extensions: Install from VSIX...**（擴充功能：從 VSIX 安裝）。
3. 選擇下載的檔案。

```bash
code --install-extension singular-blockly-X.Y.Z.vsix
```

</details>

<details>
<summary><b>CyberBrick USB 疑難排解</b></summary>

`mpremote` 會自動安裝在 Singular 受管執行環境中，不需要系統 Python。開啟 **PlatformIO 診斷** 可以檢查或修復。PlatformIO 提供者的環境仍作為相容備援，Singular Blockly 不會移除或清理它。

</details>

## 支援的開發板

| 開發板                        | 產生的程式碼     | 選擇器 ID    | 上傳／執行方式                                       |
| ----------------------------- | ---------------- | ------------ | ---------------------------------------------------- |
| Arduino Uno                   | `src/main.cpp`   | `uno`        | PlatformIO                                           |
| Arduino Nano                  | `src/main.cpp`   | `nano`       | PlatformIO                                           |
| Arduino Mega                  | `src/main.cpp`   | `mega`       | PlatformIO                                           |
| ESP32 Dev Module              | `src/main.cpp`   | `esp32`      | PlatformIO                                           |
| ESP32-C3 Super Mini           | `src/main.cpp`   | `supermini`  | PlatformIO                                           |
| CyberBrick                    | `src/rc_main.py` | `cyberbrick` | USB `mpremote` 或已配對的區域網路 OTA → `/app/rc_main.py` |
| fischertechnik TXT Controller | `src/main.py`    | `txt`        | SSH + `python3` → `/tmp/singular_blockly/main.py`    |

Arduino 專案會保留 `platformio.ini`；CyberBrick 與 TXT 專案使用 Python 流程，不需要時會移除它。

## 主要功能

### Arduino 與 ESP32

- 產生 Arduino C++，並自動同步 `platformio.ini`。
- 透過 PlatformIO 編譯與上傳，依開發板偵測連接埠，並提供可據以處理的錯誤訊息。
- 在 VS Code 終端機監看序列埠輸出；ESP32 專案會自動啟用例外解碼。
- 提供 I/O、PWM、伺服馬達、編碼馬達、Wi-Fi/MQTT、Pixetto、HUSKYLENS 與一般程式積木。
- 使用實驗性的 RC 接收積木，讓 ESP32 DevKit 接收 CyberBrick ESP-NOW 遙控器的輸入。

### CyberBrick

- 為 ESP32-C3 產生 MicroPython，包含 GPIO、板載 LED、計時、Wi-Fi、X11/X12 與 ESP-NOW 遙控積木。
- 預設使用 USB；可在 CyberBrick 齒輪選單設定已配對的區域網路 OTA 目標。
- 第一次設定 OTA 需透過 USB 完成。OTA 上傳失敗時不會自動改用 USB，避免程式傳到教室裡錯誤的裝置。
- 透過網路上傳時，會保持相容的 OTA 代理程式為最新版本；代理程式更新的警告不會使主程式上傳被捨棄。
- 在 VS Code 終端機透過 `mpremote` 監看 MicroPython 的 `print()` 輸出。
- 瀏覽在地化的 CyberBrick 範例，沒有網路時使用內建的離線範例。
- Wi-Fi 密碼、OTA 權杖與配對密鑰存放在 VS Code SecretStorage。OTA 設定不會修改韌體、`/boot.py`、WebREPL 或其他無關的裝置檔案。

[CyberBrick 說明](../specifications/03-hardware-support/cyberbrick-micropython.md) · [擴充板](../specifications/03-hardware-support/cyberbrick-expansion-boards.md) · [遙控配對](../specifications/03-hardware-support/cyberbrick-rc.md)

### TXT Controller

- 撰寫一個設定流程與多個同時執行的 TXT 流程。
- 透過 SSH 上傳、執行與停止 Python 程式。
- 不離開 Blockly 編輯器就能設定並測試連線。
- 建立可拖曳、綁定穩定的虛擬按鈕。
- 在整合的 I/O 測試面板測試馬達、輸出與感測器。

TXT 密碼存放在 VS Code SecretStorage。預設目標為 `192.168.7.2`，使用者名稱為 `ftc`；產生的程式會上傳到 `/tmp/singular_blockly/main.py`。

[TXT Controller 說明](../specifications/03-hardware-support/txt-controller.md)

### AI 程式助理工作流程

專案內的 Agent Skills 讓 Codex 與 Claude Code 取得目前的開發板、工作區格式，以及由執行環境產生的積木契約。使用者不需要另外安裝 Node.js 伺服器。

外部對 `blockly/main.json` 的修改，會先經過一次性的 Blockly 執行環境驗證，才會套用到正在使用的工作區。無效的內容會被隔離，並還原到最後一個有效的工作區。

[Agent Skills 與工作區安全](../specifications/06-features/agent-skills.md)

## 專案檔案

| 路徑                    | 用途                                     |
| ----------------------- | ---------------------------------------- |
| `blockly/main.json`     | 積木、開發板選擇與介面狀態的唯一來源     |
| `blockly/main.json.bak` | 最後一個有效工作區的備份                 |
| `src/main.cpp`          | 產生的 Arduino／ESP32 程式               |
| `src/rc_main.py`        | 產生的 CyberBrick MicroPython 程式       |
| `src/main.py`           | 產生的 TXT Controller 程式               |
| `platformio.ini`        | 僅 Arduino 使用的 PlatformIO 環境設定    |

## 設定

可在 VS Code 的設定介面調整。以下預設值與擴充功能資訊清單一致。

| 設定                                          | 預設值                                        | 用途                                 |
| --------------------------------------------- | --------------------------------------------- | ------------------------------------ |
| `singularBlockly.managedRuntime.path`         | `""`                                          | 受管執行環境的自訂資料夾（選填）     |
| `singularBlockly.safetyGuard.suppressWarning` | `false`                                       | 隱藏非 Blockly 專案的安全警告        |
| `singular-blockly.txt.host`                   | `192.168.7.2`                                 | TXT Controller 主機                  |
| `singular-blockly.txt.username`               | `ftc`                                         | TXT SSH 使用者名稱                   |
| `singular-blockly.txt.remotePath`             | `/tmp/singular_blockly/main.py`               | TXT 上傳目的地                       |
| `singular-blockly.txt.runtimePort`            | `8080`                                        | TXT I/O 測試面板的基礎連接埠         |
| `singular-blockly.cyberbrick.uploadSettings`  | `{ "schemaVersion": 2, "pairedDevices": [] }` | CyberBrick USB／已配對 OTA 裝置清單  |

Wi-Fi 密碼、OTA 權杖、配對密鑰與 TXT 密碼都存放在 VS Code SecretStorage，不會寫進 `settings.json`。文件與日誌使用預留位置或遮蔽後的值；請不要把真實的帳密貼到專案檔案或問題回報中。

## 系統需求

- VS Code 1.126.0 以上，或 VSCodium 1.126.04524 以上。請先升級較舊的編輯器再安裝此版本。
- 一個可寫入的工作區資料夾。
- Arduino／ESP32：PlatformIO 提供者與 C/C++ 擴充功能（`ms-vscode.cpptools`）。
- CyberBrick：一般上傳與第一次 OTA 設定需要 USB；只有 OTA 需要共用的區域網路。擴充功能啟用後會在自己的受管 Python 環境中準備 `mpremote`，開啟 Blockly 編輯器時會再檢查一次。
- TXT Controller：能透過網路連到控制器，且裝置上已有 Python 3 與 `ftrobopy`。

一般使用者不需要安裝 Node.js。

## 文件與協助

介面提供 15 種語言：英文、繁體中文、日文、韓文、德文、西班牙文、法文、義大利文、波蘭文、葡萄牙文（巴西）、俄文、土耳其文、捷克文、匈牙利文與保加利亞文。「自動」模式會跟隨 VS Code 的顯示語言，也可以用編輯器的地球圖示選單立即切換。本 README 同樣提供這 15 種語言，請使用頁首的語言連結。

- [整合規格文件](../specifications/README.md)
- [PlatformIO 診斷與引導修復](../specifications/06-features/platformio-diagnostics.md)
- [序列埠監看](../specifications/06-features/serial-monitor.md)
- [國際化](../specifications/02-internationalization/i18n.md)
- [使用者介面在地化流程](../specifications/02-internationalization/user-facing-localization.md)
- [更新日誌](../../CHANGELOG.md)
- [問題追蹤](https://github.com/Shen-Ming-Hong/singular-blockly/issues)
- [安全性政策](../../SECURITY.md)

範例專案：[CyberBrick SoccerBot](https://github.com/Shen-Ming-Hong/Blockly_SoccerBot)，一台使用 ESP-NOW 遙控的機器人，附英文與繁體中文說明。

## 開發

開發與建置指令請見英文 [README](../../README.md#development) 的 Development 章節與 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

## 授權

採用 [Apache License 2.0](../../LICENSE) 授權。
