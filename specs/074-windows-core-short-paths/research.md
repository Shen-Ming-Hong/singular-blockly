# 研究紀錄：Singular Core 的 Windows 短路徑工作區

**日期**：2026-11-26

## R1：實際路徑深度

**做法**：從 PlatformIO registry 下載 `espressif32@7.0.1` 實際使用的套件清單，量測各套件內最深的相對路徑（含套件資料夾名稱）。

| 套件 | 版本 | 最深相對路徑 | 長度 |
| --- | --- | --- | --- |
| `framework-arduinoespressif32` | `3.20017.241212+sha.dcc1105b` | `framework-arduinoespressif32\tools\sdk\esp32s3\include\libsodium\…\crypto_box_curve25519xchacha20poly1305.h` | 144 |
| `toolchain-xtensa-esp32`（windows_amd64） | `8.4.0+2021r2-patch5` | `toolchain-xtensa-esp32\xtensa-esp32-elf\include\c++\8.4.0\ext\pb_ds\detail\…_imps.hpp` | 142 |
| `platform espressif32` 本身 | `7.0.1` | `espressif32\examples\espidf-security-secureboot\keys\…` | 80 |

以預設位置、3 字元的使用者名稱推算目前的最深路徑：`runtime-v1`（94）＋`\versions\<36 字元 UUID>\core\packages\`（61）＋144 ≈ 299 字元，超過 260。

PlatformIO 解壓套件時，會先放在套件資料夾內的暫存資料夾（`_tmp_installing-<隨機>`），長度與正式資料夾名稱相近。

**決定**：套件資料夾的後代保留長度設為 160（144 再加約 10% 餘裕）；平台資料夾同樣適用。

## R2：編譯輸出深度

PlatformIO 的編譯輸出形如 `<build_dir>\<env>\lib<3 hex>\<函式庫名稱>\src\<檔名>.cpp.o`、`<build_dir>\<env>\FrameworkArduino\…`，函式庫原始碼則在 `<libdeps_dir>\<env>\<函式庫名稱>\src\…`。函式庫名稱與檔名通常各在 40 字元以內。

**決定**：專案工作資料夾的後代保留長度設為 120。專案識別碼由 64 字元 SHA-256 縮成 16 個十六進位字元：64 位元的空間對單一使用者的專案數量足夠，碰撞機率可以忽略。

## R3：業界做法

| 來源 | 做法 | 對本功能的意義 |
| --- | --- | --- |
| PlatformIO IDE（`platformio-node-helpers` 11.3.0 的 `getCoreDir`） | Windows 上若 `<磁碟>:\.platformio` 已存在，或使用者資料夾含非 ASCII 字元，就改用 `<磁碟>:\.platformio` | 同類工具的直接先例，非 ASCII 時改用磁碟根目錄 |
| PlatformIO 文件 [`core_dir`](https://docs.platformio.org/en/latest/projectconf/sections/platformio/options/directory/core_dir.html)、[`packages_dir`／`platforms_dir`](https://docs.platformio.org/en/latest/projectconf/sections/platformio/options/directory/index.html)、[環境變數](https://docs.platformio.org/en/latest/envvars.html) | 可用 `PLATFORMIO_PACKAGES_DIR`、`PLATFORMIO_PLATFORMS_DIR`、`PLATFORMIO_CACHE_DIR` 個別指定位置 | 只搬重型資料夾，不搬 Core 本身 |
| PlatformIO 社群：[core_dir 太長無法下載 IDF](https://community.platformio.org/t/cant-download-idf-if-core-dir-path-is-too-long/25769)、[File Path Length Issue](https://community.platformio.org/t/file-path-length-issue/54192) | 常見解法是改用短的 `core_dir` | 證實 ESP32 是高風險套件 |
| ESP-IDF [Windows setup](https://docs.espressif.com/projects/esp-idf/en/v5.2.2/esp32/get-started/windows-setup.html) | 預設安裝在 `C:\Espressif`，並提醒路徑長度限制 | 工具鏈廠商同樣選擇短路徑 |
| NXP [MCUXpresso for VS Code](https://docs.mcuxpresso.nxp.com/mcux-vscode/26.08/Windows-Long-Path-Support.html) | 要求使用者自行開啟 Windows long paths | 需要管理員權限，不適合學校電腦，只作為診斷資訊 |
| Microsoft [Maximum Path Length Limitation](https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation) | 除非系統開啟 long paths 且應用程式宣告 longPathAware，否則路徑上限是 260 | GCC、SCons 等工具不保證支援，因此不能依賴 |

## R4：候選位置與安全性

**決定**：

1. 使用者自訂 managed runtime 資料夾時，只用 `<自訂資料夾>\pio`。
2. 否則先用 `%LOCALAPPDATA%\SingularBlockly\pio`：這是每位使用者私有的位置（ACL 只授權本人、SYSTEM 與 Administrators），而且不會漫遊。以 `C:\Users\<名稱>\AppData\Local\` 計算，平台資料夾長度為 53 加上名稱長度，加上分隔字元與 160 的保留後，名稱可長達 45 字元。
3. 再用 `%SystemDrive%\SingularBlockly-<8 個隨機十六進位字元>`：直接放在磁碟根目錄下，不使用多人共用的上層資料夾。

**理由**：磁碟根目錄的預設 ACL 會讓 Authenticated Users 對新建資料夾的子項目擁有修改權限（繼承自 `C:\`）。因此必須移除繼承，並只授權目前使用者的 SID、SYSTEM 與 Administrators。

不使用共用的上層資料夾（例如 `C:\SingularBlockly\<使用者>`），是因為上層資料夾的建立者（可能是另一個帳號）是擁有者，可以重新取得刪除子項目的權限，進而替換我們的資料夾。直接放在 `C:\` 下時，上層資料夾的擁有者是系統帳號，一般使用者沒有刪除子項目的權限。

名稱加上隨機字尾並記錄在 Extension 自己的儲存中，讓其他帳號無法預先佔用我們的位置。被佔用的情況只會導致改試下一個候選（阻斷服務），不會讓我們採用對方的檔案。

在 `mkdir` 與 `icacls` 之間，其他帳號仍可依繼承的權限修改新資料夾。因此設定權限後會再檢查一次：資料夾的識別碼（`ino`）與建立時相同、不是 reparse point，而且是空的；任一項不符就放棄這個候選，不刪除也不使用裡面的內容。剩下的風險是對方在 `mkdir` 與第一次 `lstat` 之間（微秒等級）猜中隨機名稱並替換整個資料夾，這需要即時監看 `C:\` 並搶在 Extension 之前完成，風險可以接受。

**考慮過但不採用**：

- 開啟 `LongPathsEnabled`：需要管理員權限，而且 GCC、SCons 等工具不保證支援。
- `subst`：重新開機後消失，而且每個登入工作階段各自獨立。
- junction：Python、SCons 會用 `realpath` 把路徑解析回原本的長路徑。
- 8.3 短檔名：可能被系統關閉，也無法預測。
- `\\?\` 前綴：Node 本身會處理，但子行程的工具鏈不支援。
- git `core.longpaths`：只影響 git checkout，與 PlatformIO 套件解壓無關。
- 把整個 Core 搬到短位置：所有既有使用者都必須重新下載，而問題只出在之後才下載的 PlatformIO 套件。

## R5：權限設定方式

**決定**：

- 用 Windows 內建的 `whoami /user /fo csv /nh` 取得目前使用者的 SID。
- 用 `icacls <dir> /inheritance:r /grant:r *<SID>:(OI)(CI)F *S-1-5-18:(OI)(CI)F *S-1-5-32-544:(OI)(CI)F` 設定權限，以 SID 授權，避免本地化帳號名稱的問題。
- 兩個指令都以 `execFile`／`spawn` 的引數陣列呼叫，不經過 shell。
- 任一步失敗就刪除剛建立的空資料夾，並跳過這個候選。

`local-app-data` 與 `custom` 候選不需要額外設定權限：前者繼承使用者資料夾的私有 ACL，後者是使用者明確選擇的位置，沿用 067 對自訂資料夾的既有處理。

## R6：路徑過長的錯誤特徵

**決定**：新增 `path-too-long` 失敗類別。以下兩種情況擇一成立即歸入此類，判斷順序排在 `compile` 與 `missing-executable` 之前：

1. 輸出包含明確的長路徑訊息：`filename or extension is too long`、`path too long`、`long path support`、`exceeds max_path`、`The filename, directory name, or volume label syntax is incorrect`（Windows `ERROR_INVALID_NAME`，常在超長路徑時出現），以及 PlatformIO 與 pip 的對應訊息。
2. 輸出中出現長度達到 248 字元以上的 Windows 絕對路徑（`<磁碟>:\…`），而且同一行有 `No such file or directory`、`cannot open` 或 `cannot find`。

**理由**：只看 `No such file or directory` 會把一般的 `#include` 打錯也誤判為路徑過長；加上路徑長度條件後，只有真正接近上限的路徑才會被歸入此類。248 取自 Win32 `CreateDirectory` 的上限（260 減去 8.3 檔名的 12 字元）。
