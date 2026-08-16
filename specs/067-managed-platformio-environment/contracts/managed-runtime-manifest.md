# 契約：Managed Runtime Manifest v1

封裝位置：`resources/managed-runtime/runtime-manifest.json`。使用專屬 basename 避免第三方 Extension 對通用 `manifest.json` 套用不相干 schema。Extension 只讀封裝資源，不能由網路內容覆寫。

```json
{
  "schemaVersion": 1,
  "runtimeVersion": "2026.08.1",
  "pythonVersion": "3.11.16",
  "installer": {
    "url": "https://raw.githubusercontent.com/platformio/platformio-core-installer/<commit>/get-platformio.py",
    "sha256": "<64 lowercase hex>",
    "size": 123,
    "source": "https://github.com/platformio/platformio-core-installer/tree/<commit>",
    "license": "Apache-2.0"
  },
  "platformio": { "channel": "stable", "testedVersionRange": ">=6.1.0 <7.0.0" },
  "mpremoteVersion": "<exact version>",
  "platformPackages": {
    "atmelavr": "platformio/atmelavr@<exact version>",
    "espressif32": "platformio/espressif32@<exact version>"
  },
  "artifacts": [{
    "id": "cpython-3.11-<release>-<platform>-<arch>",
    "platform": "win32|darwin|linux",
    "arch": "x64|arm64",
    "libc": "glibc|null",
    "support": "stable|release-candidate",
    "url": "https://github.com/astral-sh/python-build-standalone/releases/download/<release>/<asset>",
    "sha256": "<64 lowercase hex>",
    "size": 123,
    "archiveFormat": "tar.gz",
    "pythonRelativePath": "python/bin/python3.11|python/python.exe",
    "license": "MIT",
    "source": "https://github.com/astral-sh/python-build-standalone/releases/tag/<release>"
  }]
}
```

## 驗證

- URL 只能是 HTTPS allowlist host；每一跳 redirect 重新驗證。
- artifact `(platform, arch)` 唯一；Linux 必須是 glibc。
- id、相對路徑與版本不得包含 separator、`..` 或控制字元。
- SHA-256 為 64 位小寫十六進位；不符時刪除 partial，禁止解壓與執行。
- size 為正整數且 transport 有硬上限；有 `Content-Encoding` 時不以壓縮傳輸的 `Content-Length` 取代解碼後 artifact 大小，完成後仍須精確比對解碼後 size 與 SHA-256。installer 執行前再次驗證自身 SHA。
- v1 只接受 `tar.gz`。一般檔案與目錄可解壓；指向 archive 內一般檔案的相對 alias symlink 經 containment 驗證後略過，manifest 必須直接指向真實版本化檔案。absolute／逃逸 symlink、hardlink、device 與其他特殊 entry 一律拒絕。
- PlatformIO installer 由固定 commit artifact 啟動，並以 percent-encoded 本機 file URL 傳遞 `PIP_CONSTRAINT`，安全承載空白／Unicode／Windows separator 並限制在 `testedVersionRange`；安裝後回報版本仍須落在同一範圍，否則不得提交 ready。
- `release-candidate` artifact 只有在呼叫端明確啟用且發布矩陣要求對應平台通過時可選取；底層服務預設 fail closed。
- 新欄位可被 v1 reader 忽略；修改既有語意必須升 schema，未知 schema fail closed。
