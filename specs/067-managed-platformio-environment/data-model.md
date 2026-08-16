# 資料模型：受管理的 PlatformIO 雙 Core 環境

## RuntimeManifest

正式、唯讀且隨 VSIX 發布的供應鏈契約：`schemaVersion`、`runtimeVersion`、`pythonVersion`、固定雜湊的 installer、PlatformIO 相容範圍、精確 `mpremoteVersion`、受測 `platformPackages` 與 `RuntimeArtifact[]`。未知 schema、非 allowlisted HTTPS URL、重複 platform／arch、無 checksum 或授權一律拒絕。

## RuntimeArtifact

| 欄位 | 型別 | 規則 |
|------|------|------|
| `id` | string | 唯一，不含路徑 separator。 |
| `platform` | `win32` \| `darwin` \| `linux` | Node platform。 |
| `arch` | `x64` \| `arm64` | Node arch。 |
| `libc` | `glibc` \| null | Linux 第一版只能是 glibc。 |
| `url` | string | 固定 release asset HTTPS URL。 |
| `sha256` | string | 解壓前驗證。 |
| `size` | integer | 預期大小與 transport 上限依據。 |
| `archiveFormat` | `tar.gz` | v1 唯一允許格式。 |
| `pythonRelativePath` | string | archive 根下 Python 執行檔。 |
| `support` | `stable` \| `release-candidate` | stable 預設可選；release-candidate 需產品政策明確啟用且受發布矩陣約束。 |
| `license`／`source` | string | 授權與上游證據。 |

## RootOwnershipMarker

固定檔名 `.singular-managed-runtime-root.json`，包含 `schemaVersion: 1` 與固定 owner id。新目錄只有在為空時才能建立 marker；既有非空且沒有有效 marker 的自訂路徑必須拒絕，不得建立子目錄或刪除內容。所有 repair／cleanup 都必須先通過此根目錄所有權驗證。

## InstallRecord

只有完成健康檢查的版本才可建立；`current.json` 以它作為唯一 ready 訊號。包含 schema、runtime／artifact id、manifest SHA、安裝時間、`versions/` 下的相對目錄、工具相對路徑／版本及 probes。

```text
missing -> staging -> verified -> committed
                 \-> failed -> rollback/cleanup
committed -> staging-update -> committed(new)
                           \-> failed -> committed(old)
```

每個 `staging/<transaction-id>/transaction.json` 記錄 schema、候選 `versionDirectory` 與建立時間。cleanup 只有在取得同一把 install lock 後，才可刪除具有有效 transaction marker 的 staging 與它指向的非 current 候選；未知資料夾保持不動。

## InitializationCoordinator

接受 `activation|editor-open` trigger，先讀取本機狀態，再將同視窗同時發生的初始化合併為單一 in-flight Promise。`ready` 不安裝、`unsupported` 不下載、`missing|invalid` 進入同一 `ensureReady()` 交易；完成或失敗後釋放 in-flight 狀態，允許後續 editor-open 或上傳安全重試。

## CoreEnvironment

提供給工作負載的不可變執行描述：`provider|managed` id、來源、`CoreInvocation`、Python／mpremote 路徑、storage root 與 `CoreHealth`。

`CoreHealth.status` 為 `healthy|degraded|unavailable|unknown`；未執行真實 probe 不得為 healthy。package status 另分 `ready|failed|unknown`。

## WorkloadSelection

記錄 `arduino|python`、primary、fallback、目前選擇、是否已 fallback 與 sticky failure。每次 operation 最多 fallback 一次；重測、修復或重開視窗清除 sticky。

## FailureClass

`spawn`、`missing-executable`、`python-import`、`permission`、`local-store-corruption` 可在 project process 前 fallback。

`compile`、`project-config`、`dns`、`proxy`、`tls`、`registry`、`device`、`serial`、`cancelled`、`unknown-after-start` 禁止 fallback。分類輸入包含 phase、是否 spawn、exit code、signal 與遮蔽後 stderr pattern；未知採禁止 fallback。

## InstallLock

包含 schema、隨機 ownerId、pid、createdAt 與 leaseUntil。安裝、修復與 cleanup 共用 `locks/install.lock`：以獨占建立取得 lock，安裝期間定期續租；有效 lease 存在時其他操作不得修改 managed store，過期 lease 才可回收。時鐘可注入測試。

## ReleaseGateEvidence

包含 repository、PR、event、head SHA、tree SHA、候選 VSIX SHA、runtime manifest SHA、時間，以及每個 OS／arch 真實 E2E 回報的 artifact id／SHA-256、runner、路徑案例與離線重啟結果。任何 identity 與 manifest 不符、重複或缺少矩陣、非 success 或未知 schema 都使 gate 失敗；不得以 branch 或可變 tag 代替 SHA。
