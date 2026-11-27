# 研究：上傳進度提示加入進度條與下載／安裝進度

## R1 PlatformIO 安裝套件的實際流程

查 PlatformIO Core 6.1.18 原始碼（`platformio/package/manager/_download.py`、`_install.py`、`base.py`）：

1. 下載到 `<cache>/downloads/` 的暫存檔，完成後改名，檔案保留到過期清理。
2. 解壓縮到 `<cache>/tmp/pkg-installing-*`。
3. `_install_tmp_pkg` 一律用 `shutil.copytree` 把暫存資料夾**複製**到 packages（或 platforms），再刪掉暫存資料夾。

第 3 步在所有作業系統都是逐檔複製，不是改名，所以不是 Windows 特有的退回行為。在 Windows 上每個新檔案都會被即時防毒掃描，一萬多個小檔案複製兩次（解壓一次、複製一次），因此 Ray 的電腦上安裝花的時間比下載長很多。

**決定**：進度以三段寫入量的總和計算：下載檔大小＋暫存資料夾最大大小＋新套件資料夾大小。這三段的位元組比例與 Ray 實測的時間比例接近（下載約 15%、解壓 35%、複製 50%）。

**否決**：只算下載位元組（2 分鐘就停在 95%，之後 10 分鐘不動）；用 PlatformIO 每個套件自己的 `Downloading 0% 10% …`（只有單一套件，看不出整體）。

## R2 預估總量（雲端容器實測，PlatformIO 6.1.18，Linux x64）

| 開發板 | 下載 | 暫存最大 | 新套件 | 合計（取整） | 實際時間 |
| --- | --- | --- | --- | --- | --- |
| uno（atmelavr@5.3.0） | 54 MB | 213 MB | 240 MB | 550 MB | 14 秒 |
| esp32（espressif32@7.0.1） | 341 MB | 966 MB | 1,204 MB | 2,550 MB | 59 秒 |
| supermini（lolin_c3_mini） | 437 MB | 1,686 MB | 1,736 MB | 3,900 MB | 185 秒 |

暫存資料夾以 1 秒取樣，小套件可能沒取到，所以合計略大於量測值；誤差由 95% 上限吸收。Windows 的工具鏈較大，實機測試時會從輸出面板讀實際總量再校正。

## R3 量測成本

每次取樣只走訪這次新出現的頂層資料夾，不走訪既有套件；間隔 1 秒，前一次未結束時跳過。ESP32 的新套件約一萬多個檔案，走訪一次在雲端容器約 30 ms。

## R4 UI 參考

- VS Code UX Guidelines：Notifications（進度通知、能估算時顯示百分比、文字一句）。
- Apple HIG：Progress indicators；Windows：Progress bars（知道總量用確定進度條，不知道用不定進度；不能長時間不動）。
- Arduino IDE 2 開發板管理員：安裝核心時一條進度條加一句文字，細節在輸出面板。
- WCAG 2.2：4.1.3 Status Messages、1.4.11 Non-text Contrast（3:1）、2.3.3 Animation from Interactions（尊重減少動態效果）。
- MDN／WAI-ARIA `progressbar` 角色：不定進度省略 `aria-valuenow`。
