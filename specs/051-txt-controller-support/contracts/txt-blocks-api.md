# TXT 積木 API 合約

**版本**：v1（第一版，TXT Controller 支援）  
**積木定義**：`media/blockly/blocks/txt.js`  
**Generator**：`media/blockly/generators/txt/txt.js`  
**目標語言**：Python 3.6+（ftrobopy API）

---

## 合約概述

本合約定義 7 個 TXT 積木的：
1. **積木介面**（Blockly 欄位、輸入型別、輸出型別）
2. **Generator 輸出**（生成的 Python 程式碼）
3. **孤立積木保護規則**

---

## 積木合約

### txt_init — TXT 初始化

**功能**：連線至 TXT Controller，建立 `txt` 全域物件。**必須放在主程式最前面**。

**Blockly 介面**：
- 型別：Statement（連線頭部）
- 欄位：無（host 從 VS Code 設定讀取，在 generator 階段注入）
- 外觀：TXT 類別顏色（HSV 200）

**Generator 輸出**：

```python
import ftrobopy
txt = ftrobopy.ftrobopy('192.168.0.100', 65000)
```

**限制**：
- 每個程式只允許一個 `txt_init`（重複使用會覆蓋 `txt` 變數）
- host 值由 Generator 從 Extension 設定讀取（`txtGenerator.connectionHost_`）

---

### txt_motor_speed — 設定馬達速度

**功能**：設定 M1-M4 其中一個馬達的速度與方向。

**Blockly 介面**：
- 型別：Statement
- 欄位：
  - `MOTOR`：下拉選單（`M1`/`M2`/`M3`/`M4`，對應值 `1`/`2`/`3`/`4`）
  - `SPEED`：數字輸入（0-512，預設 0）
  - `DIRECTION`：下拉選單（`FORWARD`/`BACKWARD`，對應 i18n 標籤）

**Generator 輸出**（正轉範例，M2 速度 300）：

```python
txt.motor(2).setSpeed(300)
```

**Generator 輸出**（反轉範例，M2 速度 300）：

```python
txt.motor(2).setSpeed(-300)
```

**Generator 邏輯**：

```javascript
const motor = block.getFieldValue('MOTOR');         // '1' ~ '4'
const speed = block.getFieldValue('SPEED');         // '0' ~ '512'
const dir = block.getFieldValue('DIRECTION');       // 'FORWARD' | 'BACKWARD'
const speedValue = dir === 'BACKWARD' ? `-${speed}` : speed;
return `txt.motor(${motor}).setSpeed(${speedValue})\n`;
```

---

### txt_motor_stop — 停止馬達

**功能**：停止 M1-M4 其中一個馬達（speed=0）。

**Blockly 介面**：
- 型別：Statement
- 欄位：
  - `MOTOR`：下拉選單（`M1`-`M4`，對應值 `1`-`4`）

**Generator 輸出**（停止 M3）：

```python
txt.motor(3).setSpeed(0)
```

---

### txt_output — 設定輸出

**功能**：控制 O1-O8 其中一個輸出（燈、繼電器等）的開關狀態。

**Blockly 介面**：
- 型別：Statement
- 欄位：
  - `OUTPUT`：下拉選單（`O1`-`O8`，對應值 `1`-`8`）
  - `STATE`：下拉選單（`ON`=512 / `OFF`=0，對應 i18n 標籤）

**Generator 輸出**（O5 開啟）：

```python
txt.output(5).setLevel(512)
```

**Generator 輸出**（O5 關閉）：

```python
txt.output(5).setLevel(0)
```

---

### txt_input_read — 讀取輸入

**功能**：讀取 I1-I8 其中一個數位輸入的值（0=接地/閉路，1=開路）。

**Blockly 介面**：
- 型別：Value（回傳數值）
- 欄位：
  - `INPUT`：下拉選單（`I1`-`I8`，對應值 `1`-`8`）

**Generator 輸出**（讀取 I1，嵌入表達式）：

```python
txt.input(1).state()
```

**典型用法**（與 if 積木組合）：

```python
if txt.input(1).state() == 0:
    txt.motor(1).setSpeed(200)
```

---

### txt_wait — 等待毫秒

**功能**：程式暫停指定毫秒數。

**Blockly 介面**：
- 型別：Statement
- 欄位：
  - `MS`：數字輸入（正整數，毫秒，預設 1000）

**Generator 輸出**（等待 2000ms）：

```python
import time
time.sleep(2.0)
```

**Generator 邏輯**：

```javascript
const ms = block.getFieldValue('MS');
return `import time\ntime.sleep(${ms}/1000)\n`;
```

> `import time` 由 Generator 的 `addImport()` 機制確保只出現一次。

---

### txt_stop_all — 全部停止

**功能**：立即停止所有馬達（M1-M4 speed=0）並關閉所有輸出（O1-O8 level=0）。教學場景的安全保護積木。

**Blockly 介面**：
- 型別：Statement
- 欄位：無

**Generator 輸出**：

```python
for i in range(1, 5):
    txt.motor(i).setSpeed(0)
for i in range(1, 9):
    txt.output(i).setLevel(0)
```

---

## 孤立積木保護規則

所有 TXT 積木若放在允許容器（`micropython_main` 或 TXT 主程式容器）**以外**，Generator 需：

1. `workspaceToCode` 層：跳過並輸出 `# [Skipped]` 註解
2. `forBlock` 層：呼叫 `isInAllowedContext()` 檢查，若孤立則回傳空字串
3. `onchange` 層：呼叫 `setWarningText()` 顯示警告

---

## Generator 全域狀態

```javascript
// Generator 在執行前由 Extension postMessage 注入
txtGenerator.connectionHost_ = '192.168.0.100';  // 從 VS Code 設定讀取

// import 去重機制（與 micropythonGenerator 相同模式）
txtGenerator.imports_ = {};  // { 'time': 'import time' }
txtGenerator.addImport = function(key, code) { ... };
```
