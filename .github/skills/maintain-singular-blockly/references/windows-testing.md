# Windows 實機測試

雲端容器是 Linux，Ray 的主機是 Mac。只在 Windows 出現的問題（路徑長度、命令列長度、PlatformIO 與 Defender 的效能、COM 埠與驅動）要在 Windows 上量，不能用 Linux 的結果推算：2026-11-27 同樣的 PlatformIO 無變更掃描，容器約 1 秒，Ray 的 Windows 要 25–30 秒。

## 兩條路

| 要驗的事                                         | 做法                                                                                                                                                                                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 下載、安裝、編譯、路徑與命令列長度、不同帳號名稱 | Windows CI 的 runtime e2e job（`windows-2025`、`windows-11-arm`）。這個 job 會實際下載套件，需要 PR 上有 `runtime-e2e-approved` 標籤；這是維護者核准下載的開關，Ray 說可以繼續（或明確要求）後工作階段才自己加，約 30–60 分鐘。 |
| USB 上傳、COM 埠、實際秒數、編輯器內的畫面與提示 | Ray 的 Windows 測試機 Singular08-NB，經 Remote Control 跑命令，畫面上的點擊由 Ray 做。                                                                                                                                          |

兩者互補：#293 的 45 字元帳號名稱情境只有 CI 抓到（ESP32 編譯命令列超過 Windows 約 32,767 字元上限），逾時與半套套件的問題只有實機抓到。

## 連上 Windows 測試機

- 已核准的資料夾是 `C:\Users\Singular8\Desktop\python`（一個 ESP32 PlatformIO 專案，板子常接在 COM35）。`start_remote_control` 帶這個 `list_devices` 列出的路徑；卡片或回報的 `machine_name` 不是 `Singular08-NB` 時（例如連到 Mac 的「奇點3D列印機器人」），立刻停止那個工作階段，不在 Mac 上執行任何東西。
- 那台沒有 git 與 Node.js，不能在本機打包；也不要自行安裝，除非 Ray 同意。
- **電腦操作（computer use）的連線卡片目前固定連到 Ray 的 Mac**，在 Windows 按允許也一樣（2026-11-27 試了兩次）。所以無法替 Ray 點 Windows 上的 VS Code：命令層面的量測用 Remote Control 跑，需要點擊的步驟直接請 Ray 自己按，並請他回報秒數或畫面上的文字。不要反覆發連線卡片。
- 給 Remote Control 的指令寫明只讀或可寫的範圍：不改系統設定、不動 Defender、不刪使用者資料；要寫入或刪除的資料夾逐一列出，刪除前先問 Ray。

## 把 PR 版 VSIX 裝到 Windows

1. 在雲端打包（`npx @vscode/vsce package`），不必等 CI。檔名帶 commit，例如 `singular-blockly-pr303-05898ef.vsix`。
2. 改副檔名為 `.zip`，寫進 `/mnt/project-files/<任務>/`，用 `attached_outputs` 附上。Claude App 不讓下載 `.vsix` 附件，`.zip` 可以；Google Drive 連接器上傳 5.7 MB 會失敗；GitHub Actions artifact 要登入、而且外面再包一層 zip。
3. 請 Ray 在 Windows 把 zip 存到「下載」，不用解壓縮。
4. Remote Control：複製成 `$env:TEMP\<名稱>.vsix`，核對大小，`code --install-extension <路徑> --force`。
5. PR 版的版號通常和已安裝的正式版相同，所以不能用版號判斷有沒有裝到新版：在安裝後的擴充資料夾 `dist\extension.js` 搜尋這次改動才有的字串。
6. 請 Ray **關掉所有 VS Code 視窗再重開**，然後才測。正式版發布後直接更新即可，不必先換回舊版。

## 量測與診斷

- 先確認實際跑的是哪一套 Core。Arduino 預設先用 PlatformIO IDE 的 Core，改名或移除 `.platformio` 會被 PlatformIO IDE 立刻裝回；要測 Singular Core，照 `docs/specifications/04-quality-testing/managed-runtime-environment.md` 設 `SINGULAR_BLOCKLY_ARDUINO_CORE=managed` 後重開 VS Code。診斷面板顯示 managed 不代表那次編譯真的用了它：#293 中 Singular Core 準備套件失敗後默默退回 PlatformIO IDE，最後用 Remote Control 每秒記錄 `Win32_Process` 的命令列才看出來。
- 拆時間時分段量：`pio` 啟動、`pkg install`、SCons 掃描（`pio run -t nobuild` 對照 `pio run`）、燒錄，各記秒數。2026-11-27 的基準：完整上傳約 44–51 秒，其中套件確認約 5 秒、無變更掃描約 25 秒、燒錄約 10 秒；跳過確認與掃描的快速重燒在編輯器內約 14 秒。改到任何影響建置的設定（board、flags、LDF 模式）會整個重建約 3 分鐘，所以上傳流程不可每次改寫這些設定。
- 第一次安裝 ESP32 工具鏈約 13–18 分鐘，大部分是解壓縮與逐檔複製，網路下載只占 1–2 分鐘；量測或改逾時時以這個數字為準。
- 測首次下載前要先清掉 Singular Core 的套件資料夾（`%LOCALAPPDATA%\SingularBlockly\pio` 下的 `packages`、`platforms`、`cache`、`w`），先問 Ray；PlatformIO IDE 的 `~/.platformio` 不動。
- Windows Defender 即時保護是掃描慢的可疑原因，但排除清單需要系統管理員權限，要不要設由 Ray 決定，不代為修改，也不把它當成修法。

## 回報

PR 描述記下測試機、板子與連接埠、每一步的秒數、成功與否與錯誤原文，作為「發布門檻」的硬體測試證據。只量了命令層面、沒在編輯器裡測到的部分，寫成「沒驗到」。
