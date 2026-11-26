# 資料模型：Singular Core 的 Windows 短路徑工作區

## PlatformioWorkRootRecord（`<managed root>\work-root.json`）

記錄目前選用的短工作位置。只存在於 Windows。

| 欄位 | 型別 | 規則 |
| --- | --- | --- |
| `schemaVersion` | `1` | 固定值，其他值視為沒有紀錄 |
| `kind` | `'custom' \| 'local-app-data' \| 'system-drive'` | 候選類別 |
| `path` | string | 絕對、本機、只含 ASCII 的 Windows 路徑；不可是 UNC 或磁碟根目錄本身 |
| `ownerId` | string | 32 個十六進位字元的隨機值，與工作位置內的標記一致 |
| `createdAt` | ISO 8601 字串 | 建立時間 |

## PlatformioWorkRootMarker（`<work root>\.singular-pio-work-root.json`）

| 欄位 | 型別 | 規則 |
| --- | --- | --- |
| `schemaVersion` | `1` | 固定值 |
| `owner` | `'singular-blockly-pio-work-root'` | 固定值 |
| `ownerId` | string | 必須等於紀錄中的 `ownerId` |

## 工作位置內容

| 相對路徑 | 用途 | 對應 PlatformIO 環境變數 |
| --- | --- | --- |
| `packages` | 工具鏈、框架 | `PLATFORMIO_PACKAGES_DIR` |
| `platforms` | 開發板平台 | `PLATFORMIO_PLATFORMS_DIR` |
| `cache` | 下載快取 | `PLATFORMIO_CACHE_DIR` |
| `w\<16 hex>` | 單一專案的工作資料夾（以專案 URI 雜湊命名） | `PLATFORMIO_WORKSPACE_DIR` |
| `w\<16 hex>\build` | 編譯輸出 | `PLATFORMIO_BUILD_DIR` |
| `w\<16 hex>\libdeps` | 專案函式庫 | `PLATFORMIO_LIBDEPS_DIR` |

`PLATFORMIO_CORE_DIR` 仍指向 `<managed root>\versions\<version>\core`，讓既有的 penv 與 Core 原地沿用。

## 狀態轉換

```text
(無紀錄) ──選擇候選──▶ 已建立且有標記 ──每次使用前驗證──▶ 使用中
     ▲                                          │
     └──── 紀錄無效、資料夾消失或標記不符 ◀──────┘
全部候選不符 ──▶ path-too-long（不建立任何資料夾）
```

## 路徑預算

| 檢查 | 公式 | 上限 |
| --- | --- | --- |
| 套件 | `len(<work root>\packages) + 160` | 小於 260 |
| 平台 | `len(<work root>\platforms) + 160` | 小於 260 |
| 專案 | `len(<work root>\w\<16 hex>\build) + 120` | 小於 260 |

只在 Windows 檢查；其他平台沿用目前的版面配置，不建立工作位置。
