# TXT 積木 API 合約（多流程擴充）

**版本**：v2（在既有 TXT 支援上加入多流程頂層模型）  
**積木定義**：`media/blockly/blocks/txt.js`  
**Generator**：`media/blockly/generators/txt/txt.js` + `media/blockly/generators/txt/python_common.js`  
**目標語言**：Python 3（ftrobopy）

---

## 合約概述

本次擴充將 TXT 作者模型從目前分支內部尚未發布的單一 `txt_main` 容器，直接重做為：

1. **一個 `txt_setup`**（UI 顯示「TXT 初始化」）
2. **多個 `txt_process`**（UI 顯示「TXT 流程」）

正式公開 contract 只包含新模型；`txt_main`、`txt_init`、`txt_input_read` 不列入對外相容要求。

---

## 新可見頂層積木

### txt_setup — TXT 初始化

**功能**：作為單一頂層初始化容器，負責建立 shared `txt` 物件並執行一次性初始化邏輯。

**Blockly 介面**：

- 型別：Top-level container
- 欄位：無
- 輸入：`DO` statements

**Generator 摘要輸出**（示意）：

```python
import ftrobopy
import threading
import time

txt = ftrobopy.ftrobopy('auto')
_txt_threads = []
```

**補充**：

- 會統一建立 shared `txt`
- 會在需要時預建 `_m1`、`_m2`... 等馬達物件
- 僅允許一個 `txt_setup`

---

### txt_process — TXT 流程

**功能**：定義一個可獨立執行的流程。可選名稱欄位僅作為顯示與診斷用途。

**Blockly 介面**：

- 型別：Top-level container
- 欄位：`NAME`（可選文字）
- 輸入：`DO` statements

**Generator 摘要輸出**（示意）：

```python
def _txt_flow_ab12cd():
    global some_var
    _m1.setSpeed(200)
    time.sleep(1.0)
    _m1.setSpeed(0)

_txt_threads.append(threading.Thread(target=_txt_flow_ab12cd, name='馬達', daemon=True))
```

**補充**：

- 顯示名稱可以留空
- 顯示名稱不是唯一鍵
- 內部應使用穩定 ID 區分不同流程

---

## 既有 TXT 積木合約（延續）

### txt_motor_speed — 設定馬達速度

**功能**：設定 M1-M4 其中一個馬達的速度與方向。

**Generator 輸出**：

```python
_m1.setSpeed(200)
_m1.setSpeed(-200)
```

---

### txt_motor_stop — 停止馬達

**Generator 輸出**：

```python
_m1.setSpeed(0)
```

---

### txt_output — 設定輸出

**Generator 輸出**：

```python
txt.output(5).setLevel(512)
txt.output(5).setLevel(0)
```

---

### txt_input_sensor — 感測器輸入

**功能**：BUTTON / GATE / ULTRASONIC。

**Generator 輸出**：

```python
txt.input(1).state()
_read_ultrasonic(3)
```

**補充**：

- value block 本身不得注入 pacing
- loop pacing 仍由 `python_common.js` 管理

---

### txt_wait — 等待毫秒

**功能**：等待指定毫秒。

**Generator 輸出**：

```python
import time
time.sleep(2.0)
```

**多流程語意要求**：

- 在多流程模型下，`txt_wait` 只應暫停目前流程，不應凍結整個程式

---

### txt_stop_all — 全部停止

**Generator 輸出**：

```python
_m1.setSpeed(0)
_m2.setSpeed(0)
_m3.setSpeed(0)
_m4.setSpeed(0)
for i in range(1, 9):
    txt.output(i).setLevel(0)
```

---

## 頂層合法容器規則

對 TXT generator 而言，以下應視為合法上下文：

- `txt_setup`
- `txt_process`
- `procedures_defnoreturn`
- `procedures_defreturn`

`loops.js`、`txt/index.js`、`txt/python_common.js` 的合法容器與 orphan warning 規則需同步更新。

---

## 多流程下的 pacing 與輪詢規則

- `txt_wait` MUST 保持使用者可理解的「等待 N 毫秒」語意
- `controls_forever` / `controls_whileUntil` 對緊密 TXT 硬體輪詢 loop 的 path-sensitive `txt.updateWait(0.01)` 規則 MUST 保留
- 自動 pacing 仍屬 loop generator 的責任，MUST NOT 被塞進 `txt_input_sensor` 這類 value block

---

## 預發布舊模型清理原則

- `txt_main`、`txt_init`、`txt_input_read` 不屬於正式公開積木 contract
- 若 codebase 仍有殘留，重做時應同步清理 blocks、generator、toolbox、workspace 驗證與測試資料
- 正式工作區、工具箱、文件與範例 MUST NOT 暴露這些舊積木
