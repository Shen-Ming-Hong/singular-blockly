# Blockly 12.3.1 升級前基線

**記錄日期**：2026-08-09  
**平台**：macOS arm64  
**Node.js**：v25.9.0（符合專案 Node.js 22.16.0+ 基準）  
**npm**：11.12.1  
**Blockly**：12.3.1  
**V8**：14.1.146.11-node.25

## 相容性 fixtures

執行命令：

```bash
node scripts/validate-blockly-v13-fixtures.js --baseline-only
```

結果：4/4 通過。JSON fixtures 均完成 Blockly serialization load/save round-trip；legacy XML 完成 `domToWorkspace`／`workspaceToDom` round-trip。所有樣本的變數、shadow、不可刪除／不可移動／不可編輯旗標與 dynamic extra state 數量均保持一致，golden output 檔案存在且非空。

| Fixture | 格式 | 板別 | 積木 | Shadow | Locked | Extra state | 變數 |
|---|---|---|---:|---:|---:|---:|---:|
| `arduino-v12-json` | JSON | Arduino Uno | 7 | 2 | 2 | 1 | 1 |
| `cyberbrick-v12-json` | JSON | CyberBrick | 8 | 3 | 2 | 1 | 1 |
| `txt-v12-json` | JSON | TXT | 7 | 2 | 2 | 1 | 1 |
| `legacy-v12-xml` | XML | Arduino Uno | 5 | 1 | 2 | 1 | 1 |

Blockly 12.3.1 在 round-trip 時輸出 `Workspace.getAllVariables` 與 `Workspace.getVariableById` 的 deprecated 警告；這是 v12 本身的序列化路徑，升級後比較時不視為 fixture 失敗。

## Fixture SHA-256

```text
5334e2d081a1704cc457e8790c38412eaedce897628aa46990bcc641506617d8  arduino.json
d7a5cc66fd8a930c991b8b151fbc25b021962aa2f4a09ea23f8416ed00ccf2ba  cyberbrick.json
e45808f6a94f97e0f9e3fbd324a526b6f6afd699faa19c19f0c924564718a57d  txt.json
7fb1ec9a3b653cc2c4142b592778b997163f34b1b6fa73e5d9d4e429b22432f8  legacy.xml
12e2187da4dff27b19c61bff5a8407852b957248fd5b08a59ed2e3ff05ecf148  expected/arduino.cpp
ffa743a89829d83851570990ac21c0c8aa92a338dd3f5aaf5b2dd8619a0c8231  expected/cyberbrick.py
e9b4351009506f67100f8e53e402bbb6e9e23d63d64d875fd78ce1a43ae0c923  expected/txt.py
136c4592ee04686485dfa9097fad073fc1fe8f79ba9e0a5e1f5e1a3bb3c6d4b9  expected/legacy.cpp
```

## 500-block 效能基線

執行命令：

```bash
node scripts/benchmark-blockly-workspace.js --iterations 12
```

固定建立 500 個 `math_number` 積木，暖機 3 次後執行 12 次 Blockly JSON 載入與儲存；序列化大小為 41,933 bytes。

| 操作 | 最小值 | 中位數 | 平均值 | 最大值 |
|---|---:|---:|---:|---:|
| Load | 11.886 ms | 32.093 ms | 35.377 ms | 77.550 ms |
| Save | 0.516 ms | 0.885 ms | 6.633 ms | 36.020 ms |

最終 T051 應在相同機器、Node.js 與 iterations 下重跑，主要以中位數比較；允許上限為 v12 中位數的 110%：Load 35.302 ms、Save 0.974 ms。
