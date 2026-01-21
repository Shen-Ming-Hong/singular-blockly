# 快速驗證：移除 CyberBrick Timer 實驗標記

## 目標

驗證 `cyberbrick_ticks_ms` 與 `cyberbrick_ticks_diff` 不再觸發實驗提示與視覺標記，同時其他實驗積木提示行為維持正常。

## 前置條件

- Node.js 22.16.0+、VS Code 1.105.0+
- 已完成 `npm install`

## 驗證步驟

1. 啟動專案並進入擴充功能開發模式（Extension Host）。
2. 開啟 CyberBrick 的工具箱分類。
3. 檢查 `cyberbrick_ticks_ms`、`cyberbrick_ticks_diff` 積木外觀：不應有黃色虛線或實驗提示。
4. 工作區尚未加入任何積木時，不應出現實驗提示或指示器。
5. 在空白工作區拖入任一 Timer 積木：不應出現實驗提示或指示器。
6. 在同一工作區再加入另一個 Timer 積木：仍不應出現實驗提示或指示器。
7. 再加入一個既有實驗積木（例如 HUSKYLENS 相關）：應出現實驗提示或指示器。
8. 載入包含 Timer 積木的既有專案：不應出現實驗提示或指示器。

## 補充（如需同步 MCP 字典）

- 執行 `npm run generate:dictionary` 重新生成字典後，確認 `src/mcp/block-dictionary.json` 內的 Timer 積木未標記為「實驗」。
