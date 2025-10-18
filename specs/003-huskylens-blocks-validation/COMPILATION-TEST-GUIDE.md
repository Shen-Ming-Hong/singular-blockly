# HuskyLens 積木編譯測試指南

**目的**: 驗證 ESP32 HardwareSerial 修正 (T031) 和去重邏輯 (T042-T045) 在實際硬體編譯環境中正常運作

**測試範圍**: T050-T057 (8 個編譯測試任務)

---

## 📋 測試前置條件

### 環境需求

-   ✅ VSCode with Singular Blockly Extension
-   ✅ PlatformIO Core CLI installed
-   ✅ Arduino AVR platform: `pio pkg install -g -p atmelavr`
-   ✅ ESP32 platform: `pio pkg install -g -p espressif32`

### 驗證安裝

```powershell
# 檢查 PlatformIO 版本
pio --version

# 列出已安裝平台
pio platform list

# 如果缺少平台,安裝:
pio platform install atmelavr    # Arduino Uno/Nano/Mega
pio platform install espressif32 # ESP32
```

---

## 🧪 測試案例

### Test Case 1: Arduino Uno + I2C (T050-T051)

**目標**: 驗證 I2C 初始化程式碼在 Arduino Uno 上編譯成功

#### 步驟

1. **建立測試工作區**

    ```powershell
    mkdir -p test-workspaces/huskylens-uno-i2c
    cd test-workspaces/huskylens-uno-i2c
    ```

2. **建立 Blockly 工作區檔案**

    - 開啟 VSCode,建立新的 `.blockly` 檔案
    - 放置積木: `HuskyLens > 初始化 HuskyLens (I2C)`
    - 選擇板: Arduino Uno
    - 儲存為: `test-workspaces/huskylens-uno-i2c/main.blockly`

3. **生成 Arduino 程式碼**

    - Singular Blockly 會自動生成 `src/main.cpp` 和 `platformio.ini`

4. **編譯程式碼**

    ```powershell
    pio run -e uno
    ```

5. **驗證結果**
    - ✅ 編譯成功 (無錯誤)
    - ✅ 檢查生成的 `src/main.cpp`:
        ```cpp
        #include <HUSKYLENS.h>
        #include "Wire.h"
        HUSKYLENS huskylens;  // 只宣告一次
        ```

#### 預期輸出

```
Processing uno (platform: atmelavr; board: uno; framework: arduino)
...
Building .pio\build\uno\src\main.cpp.o
...
Linking .pio\build\uno\firmware.elf
Building .pio\build\uno\firmware.hex
========================= [SUCCESS] Took X.XX seconds =========================
```

---

### Test Case 2: Arduino Nano + UART (T052-T053)

**目標**: 驗證 UART 初始化程式碼使用 SoftwareSerial 在 Arduino Nano 上編譯成功

#### 步驟

1. **建立測試工作區**

    ```powershell
    mkdir -p test-workspaces/huskylens-nano-uart
    cd test-workspaces/huskylens-nano-uart
    ```

2. **建立 Blockly 工作區檔案**

    - 放置積木: `HuskyLens > 初始化 HuskyLens (UART)`
    - 設定腳位: RX=10, TX=11
    - 選擇板: Arduino Nano
    - 儲存為: `test-workspaces/huskylens-nano-uart/main.blockly`

3. **生成並編譯**

    ```powershell
    pio run -e nanoatmega328
    ```

4. **驗證結果**
    - ✅ 編譯成功
    - ✅ 檢查生成的 `src/main.cpp`:
        ```cpp
        #include <SoftwareSerial.h>
        #include <HUSKYLENS.h>
        SoftwareSerial huskySerial(10, 11);  // 使用 SoftwareSerial
        HUSKYLENS huskylens;
        ```

---

### Test Case 3: ESP32 + UART (T054-T055) 🔴 關鍵測試

**目標**: 驗證 T031 修正 - ESP32 使用 HardwareSerial 而非 SoftwareSerial

#### 步驟

1. **建立測試工作區**

    ```powershell
    mkdir -p test-workspaces/huskylens-esp32-uart
    cd test-workspaces/huskylens-esp32-uart
    ```

2. **建立 Blockly 工作區檔案**

    - 放置積木: `HuskyLens > 初始化 HuskyLens (UART)`
    - 設定腳位: RX=16, TX=17
    - 選擇板: **ESP32 Dev Module**
    - 儲存為: `test-workspaces/huskylens-esp32-uart/main.blockly`

3. **生成並編譯**

    ```powershell
    pio run -e esp32dev
    ```

4. **驗證結果**
    - ✅ 編譯成功 (如果失敗,T031 修正無效)
    - ✅ 檢查生成的 `src/main.cpp`:

        ```cpp
        #include <HUSKYLENS.h>
        // 注意: 不應該有 #include <SoftwareSerial.h>
        HardwareSerial huskySerial(1);  // 使用 HardwareSerial(1)
        HUSKYLENS huskylens;

        void setup() {
          huskySerial.begin(9600, SERIAL_8N1, 16, 17);  // ESP32 語法
        }
        ```

#### 預期輸出

```
Processing esp32dev (platform: espressif32; board: esp32dev; framework: arduino)
...
Building .pio\build\esp32dev\src\main.cpp.o
...
Linking .pio\build\esp32dev\firmware.elf
Building .pio\build\esp32dev\firmware.bin
========================= [SUCCESS] Took X.XX seconds =========================
```

#### 如果失敗

如果看到錯誤: `fatal error: SoftwareSerial.h: No such file or directory`

-   ❌ T031 修正未正確套用
-   檢查 `window.currentBoard` 是否包含 'esp32'
-   檢查 generator 程式碼中的 `if (isESP32)` 條件

---

### Test Case 4: Arduino Mega + 所有積木 (T056)

**目標**: 驗證所有 11 個 HuskyLens 積木同時使用時編譯成功

#### 步驟

1. **建立測試工作區**

    ```powershell
    mkdir -p test-workspaces/huskylens-mega-all
    cd test-workspaces/huskylens-mega-all
    ```

2. **建立 Blockly 工作區檔案**

    - 放置所有 11 個 HuskyLens 積木:
        1. `初始化 HuskyLens (I2C)`
        2. `設定演算法`
        3. `發送請求`
        4. `是否已學習`
        5. `物件數量`
        6. `取得物件資訊`
        7. `箭頭數量`
        8. `取得箭頭資訊`
        9. `學習 ID`
        10. `忘記所有`
    - 選擇板: Arduino Mega 2560
    - 儲存為: `test-workspaces/huskylens-mega-all/main.blockly`

3. **生成並編譯**

    ```powershell
    pio run -e megaatmega2560
    ```

4. **驗證結果**
    - ✅ 編譯成功
    - ✅ 檢查去重邏輯:

        ```cpp
        // includes 只出現一次
        #pragma GCC diagnostic push
        #include <HUSKYLENS.h>
        #pragma GCC diagnostic pop
        #include "Wire.h"

        // 變數只宣告一次
        HUSKYLENS huskylens;

        // lib_deps 只包含一次 HuskyLens 庫
        ```

---

## 📊 測試結果記錄表

### 快速記錄範本

| 測試編號  | 開發板       | 積木類型      | 編譯狀態 | 驗證項目                      | 備註 |
| --------- | ------------ | ------------- | -------- | ----------------------------- | ---- |
| T050-T051 | Arduino Uno  | I2C Init      | ⏳       | Wire.h, HUSKYLENS huskylens   |      |
| T052-T053 | Arduino Nano | UART Init     | ⏳       | SoftwareSerial, RX=10, TX=11  |      |
| T054-T055 | ESP32        | UART Init     | ⏳       | HardwareSerial(1), SERIAL_8N1 | 關鍵 |
| T056      | Arduino Mega | All 11 blocks | ⏳       | 去重邏輯, 無重複宣告          |      |

### 詳細結果文件

測試完成後,將結果記錄到: `PLATFORMIO-TEST-RESULTS.md` (T057)

範本:

```markdown
# PlatformIO 編譯測試結果

## 測試環境

-   PlatformIO Core: X.X.X
-   Arduino AVR Platform: X.X.X
-   ESP32 Platform: X.X.X
-   測試日期: 2025-10-18

## 測試結果總覽

-   ✅ T050-T051: Arduino Uno + I2C - PASS
-   ✅ T052-T053: Arduino Nano + UART - PASS
-   ✅ T054-T055: ESP32 + UART - PASS (驗證 T031 修正)
-   ✅ T056: Arduino Mega + All Blocks - PASS

## 詳細測試記錄

### T050-T051: Arduino Uno + I2C

**編譯命令**: `pio run -e uno`
**編譯時間**: X.XX 秒
**ROM 使用**: XXXX bytes (XX%)
**RAM 使用**: XXX bytes (XX%)
**狀態**: ✅ SUCCESS

**生成程式碼驗證**:

-   ✅ #include <HUSKYLENS.h> 存在
-   ✅ #include "Wire.h" 存在
-   ✅ HUSKYLENS huskylens 只宣告一次
-   ✅ Wire.begin() 在 setup() 中

### T054-T055: ESP32 + UART (關鍵測試)

**編譯命令**: `pio run -e esp32dev`
**編譯時間**: X.XX 秒
**ROM 使用**: XXXX bytes (XX%)
**RAM 使用**: XXX bytes (XX%)
**狀態**: ✅ SUCCESS

**T031 修正驗證**:

-   ✅ 使用 HardwareSerial(1) 而非 SoftwareSerial
-   ✅ huskySerial.begin(9600, SERIAL_8N1, 16, 17) 語法正確
-   ✅ 無 #include <SoftwareSerial.h> (ESP32 不需要)
-   ✅ 編譯無錯誤

**編譯輸出**:
\`\`\`
[編譯輸出日誌貼上這裡]
\`\`\`
```

---

## 🚀 快速執行腳本

### PowerShell 自動化測試腳本

儲存為: `run-compilation-tests.ps1`

```powershell
# HuskyLens 編譯測試自動化腳本
$ErrorActionPreference = "Stop"

Write-Host "=== HuskyLens 積木編譯測試 ===" -ForegroundColor Cyan

# 測試工作區基礎路徑
$testBase = "test-workspaces"
New-Item -ItemType Directory -Force -Path $testBase | Out-Null

# 測試案例定義
$tests = @(
    @{
        Name = "T050-T051: Arduino Uno + I2C"
        Path = "$testBase/huskylens-uno-i2c"
        Env = "uno"
    },
    @{
        Name = "T052-T053: Arduino Nano + UART"
        Path = "$testBase/huskylens-nano-uart"
        Env = "nanoatmega328"
    },
    @{
        Name = "T054-T055: ESP32 + UART"
        Path = "$testBase/huskylens-esp32-uart"
        Env = "esp32dev"
        Critical = $true
    },
    @{
        Name = "T056: Arduino Mega + All Blocks"
        Path = "$testBase/huskylens-mega-all"
        Env = "megaatmega2560"
    }
)

$results = @()

foreach ($test in $tests) {
    Write-Host "`n>>> 測試: $($test.Name)" -ForegroundColor Yellow

    if (Test-Path $test.Path) {
        Push-Location $test.Path

        try {
            # 編譯
            $output = pio run -e $test.Env 2>&1
            $exitCode = $LASTEXITCODE

            if ($exitCode -eq 0) {
                Write-Host "✅ 編譯成功" -ForegroundColor Green
                $results += @{
                    Test = $test.Name
                    Status = "PASS"
                    Critical = $test.Critical
                }
            } else {
                Write-Host "❌ 編譯失敗" -ForegroundColor Red
                Write-Host $output
                $results += @{
                    Test = $test.Name
                    Status = "FAIL"
                    Critical = $test.Critical
                    Error = $output
                }
            }
        } catch {
            Write-Host "❌ 執行錯誤: $_" -ForegroundColor Red
            $results += @{
                Test = $test.Name
                Status = "ERROR"
                Critical = $test.Critical
                Error = $_.Exception.Message
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "⚠️ 測試工作區不存在,請先建立: $($test.Path)" -ForegroundColor Yellow
        $results += @{
            Test = $test.Name
            Status = "SKIP"
            Reason = "Workspace not found"
        }
    }
}

# 輸出測試總結
Write-Host "`n=== 測試總結 ===" -ForegroundColor Cyan
foreach ($result in $results) {
    $icon = switch ($result.Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "ERROR" { "⚠️" }
        "SKIP" { "⏭️" }
    }
    $critical = if ($result.Critical) { " [CRITICAL]" } else { "" }
    Write-Host "$icon $($result.Test)$critical - $($result.Status)"
}

# 檢查關鍵測試
$criticalTest = $results | Where-Object { $_.Critical -eq $true }
if ($criticalTest.Status -eq "FAIL") {
    Write-Host "`n❌ 關鍵測試失敗: T031 ESP32 修正無效" -ForegroundColor Red
    exit 1
}

$failCount = ($results | Where-Object { $_.Status -eq "FAIL" }).Count
if ($failCount -gt 0) {
    Write-Host "`n⚠️ $failCount 個測試失敗" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n🎉 所有測試通過!" -ForegroundColor Green
    exit 0
}
```

### 執行方式

```powershell
# 給予執行權限
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 執行測試
.\run-compilation-tests.ps1
```

---

## 📝 測試檢查清單

### 測試前

-   [ ] PlatformIO 已安裝並可執行
-   [ ] Arduino AVR platform 已安裝
-   [ ] ESP32 platform 已安裝
-   [ ] Singular Blockly Extension 已啟動

### 執行測試

-   [ ] T050: 建立 Arduino Uno + I2C 測試工作區
-   [ ] T051: 編譯 Arduino Uno (pio run -e uno)
-   [ ] T052: 建立 Arduino Nano + UART 測試工作區
-   [ ] T053: 編譯 Arduino Nano (pio run -e nanoatmega328)
-   [ ] T054: 建立 ESP32 + UART 測試工作區
-   [ ] T055: 編譯 ESP32 (pio run -e esp32dev) ⭐ 關鍵
-   [ ] T056: 建立 Arduino Mega + 所有積木測試工作區
-   [ ] T056: 編譯 Arduino Mega (pio run -e megaatmega2560)

### 測試後

-   [ ] T057: 記錄所有測試結果到 PLATFORMIO-TEST-RESULTS.md
-   [ ] 驗證 ESP32 使用 HardwareSerial(1)
-   [ ] 驗證 Arduino AVR 使用 SoftwareSerial
-   [ ] 驗證去重邏輯 (無重複宣告)
-   [ ] 更新 tasks.md 標記 T050-T057 完成

---

## 🎯 成功標準

### 必須通過 (MUST)

-   ✅ T054-T055: ESP32 編譯成功 (驗證 T031 修正)
-   ✅ 所有板編譯無錯誤
-   ✅ 生成的程式碼使用正確的串列埠實作

### 應該通過 (SHOULD)

-   ✅ 去重邏輯正常運作 (無重複宣告)
-   ✅ ROM/RAM 使用量合理
-   ✅ lib_deps 只包含一次 HuskyLens 庫

### 可以跳過 (MAY)

-   實際硬體上傳測試 (不在本次範圍)
-   執行時功能測試 (不在本次範圍)

---

## 🔍 故障排除

### 問題 1: PlatformIO 找不到

```powershell
# 安裝 PlatformIO Core
pip install platformio

# 或使用 VSCode Extension 自動安裝
```

### 問題 2: ESP32 platform 缺失

```powershell
pio platform install espressif32
```

### 問題 3: 編譯錯誤 "SoftwareSerial.h not found" (ESP32)

**原因**: T031 修正未正確套用  
**解決**: 檢查 `media/blockly/generators/arduino/huskylens.js` 中的板檢測邏輯

### 問題 4: 重複宣告錯誤

**原因**: 去重邏輯 (T042-T043) 未正確實作  
**解決**: 檢查所有 `if (!obj[key])` 條件是否存在

---

**預估測試時間**: 1-2 小時 (包含建立工作區 + 編譯 + 記錄)  
**關鍵里程碑**: T054-T055 ESP32 編譯成功 = T031 修正驗證通過 ✅
