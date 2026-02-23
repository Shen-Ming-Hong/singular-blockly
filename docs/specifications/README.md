# Singular Blockly 整合規格書

> 本文件整合自 `specs/001-044` 的所有功能規格，按功能領域組織，追蹤專案從 2024 年 12 月至 2026 年 2 月的開發演進。

## 文件結構

```
docs/specifications/
├── README.md                      # 本文件 - 索引與導覽
├── EVOLUTION.md                   # 開發歷程與功能演進時間軸
├── 00-technical-foundation/       # 技術基礎 (Spec Kit 方法論)
│   ├── research.md                # 技術架構研究
│   ├── data-model.md              # 資料模型規格
│   └── quickstart.md              # 快速入門指南
├── 01-architecture/               # 架構與核心系統
│   └── architecture.md            # 001 架構重構
├── 02-internationalization/       # 國際化系統
│   └── i18n.md                    # 002/023/024 i18n 翻譯品質與審計優化
├── 03-hardware-support/           # 硬體支援與積木
│   ├── huskylens.md               # 003/013/020/035/036 HuskyLens 驗證 + tooltip + RX/TX + 動態 INDEX + ID 積木
│   ├── esp32-pwm.md               # 011 ESP32 PWM 設定
│   ├── esp32-pixetto.md           # 012 ESP32 Pixetto 修正
│   ├── esp32-wifi-mqtt.md         # 016 ESP32 WiFi/MQTT
│   ├── cyberbrick-micropython.md  # 021/022/032/033/034 CyberBrick MicroPython 支援
│   ├── cyberbrick-rc.md           # 029 ESP-NOW 自定義配對 RC 遙控
│   └── cyberbrick-expansion-boards.md # 027/028 X11/X12 擴展板積木
├── 04-quality-testing/            # 品質保證與測試
│   ├── test-coverage.md           # 004 測試覆蓋率提升
│   ├── project-safety.md          # 010 專案安全防護
│   └── workspace-safety.md        # 018/019/025 Workspace 安全防護
├── 05-dependencies/               # 依賴管理
│   └── dependency-upgrades.md     # 005-009 依賴升級系列
├── 06-features/                   # 功能開發與整合
│   ├── mcp-integration.md         # 015/040/041 MCP Server 整合、優雅降級、bundling 修復
│   ├── bug-fixes.md               # 014/031/039 序列化修復、1 月批次修復、print 換行修復
│   ├── language-selector.md       # 030 語言選擇器
│   ├── quick-backup.md            # 017 Ctrl+S 快速備份
│   ├── unified-upload-ui.md       # 026/042 統一上傳 UI、錯誤分類提示
│   ├── serial-monitor.md          # 037/038 CyberBrick / Arduino Serial Monitor
│   └── orphan-blocks.md           # 044 防止孤立積木
└── appendix/                      # 附錄
    └── glossary.md                # 術語對照表
```

## 快速導覽

### 技術基礎文件

| 文件                                                  | 說明                                   |
| ----------------------------------------------------- | -------------------------------------- |
| [技術架構研究](00-technical-foundation/research.md)   | 依據 Spec Kit 方法論分析的完整技術架構 |
| [資料模型規格](00-technical-foundation/data-model.md) | 核心資料結構、狀態管理、訊息協定定義   |

### 按優先級

| 優先級 | 領域   | 規格                                                                    | 狀態      |
| ------ | ------ | ----------------------------------------------------------------------- | --------- |
| P0     | 核心   | [架構重構](01-architecture/architecture.md)                             | ✅ 完成   |
| P0     | 核心   | [序列化修復](06-features/bug-fixes.md)                                  | ✅ 完成   |
| P1     | 品質   | [測試覆蓋率](04-quality-testing/test-coverage.md)                       | 🔄 進行中 |
| P1     | 品質   | [專案安全防護](04-quality-testing/project-safety.md)                    | ✅ 完成   |
| P1     | 品質   | [Workspace 安全防護](04-quality-testing/workspace-safety.md)            | ✅ 完成   |
| P1     | 硬體   | [HuskyLens](03-hardware-support/huskylens.md)                           | ✅ 完成   |
| P1     | 硬體   | [CyberBrick MicroPython](03-hardware-support/cyberbrick-micropython.md) | ✅ 完成   |
| P1     | 硬體   | [CyberBrick 擴展板](03-hardware-support/cyberbrick-expansion-boards.md) | ✅ 完成   |
| P1     | 硬體   | [CyberBrick RC 遙控](03-hardware-support/cyberbrick-rc.md)              | ✅ 完成   |
| P1     | 整合   | [MCP Server](06-features/mcp-integration.md)                            | ✅ 完成   |
| P1     | 功能   | [統一上傳 UI](06-features/unified-upload-ui.md)                         | ✅ 完成   |
| P1     | 功能   | [Serial Monitor](06-features/serial-monitor.md)                         | ✅ 完成   |
| P1     | 功能   | [防止孤立積木](06-features/orphan-blocks.md)                            | ✅ 完成   |
| P2     | 國際化 | [i18n 品質](02-internationalization/i18n.md)                            | ✅ 完成   |
| P2     | 功能   | [快速備份](06-features/quick-backup.md)                                 | ✅ 完成   |
| P2     | 功能   | [語言選擇器](06-features/language-selector.md)                          | ✅ 完成   |
| P2     | 硬體   | [ESP32 PWM](03-hardware-support/esp32-pwm.md)                           | 📝 草稿   |
| P2     | 硬體   | [ESP32 WiFi/MQTT](03-hardware-support/esp32-wifi-mqtt.md)               | 📝 草稿   |
| P2     | 依賴   | [依賴升級](05-dependencies/dependency-upgrades.md)                      | ✅ 完成   |

### 按開發順序

**Phase 1 (001-016)**:

1. **001** 架構重構 - 清理空目錄、整合 FileService、動態模組載入
2. **002** i18n 審查 - 白名單機制、誤報過濾、CI 整合
3. **003** HuskyLens 驗證 - 11 種積木類型、程式碼生成驗證
4. **004** 測試覆蓋 - 目標 90%+、依賴注入模式
5. **005-009** 依賴升級 - TypeScript、Blockly、ESLint 等
6. **010** 安全防護 - 非 Blockly 專案偵測與警告
7. **011** ESP32 PWM - 高頻 PWM 設定
8. **012** ESP32 Pixetto - 移除 ESP32 不需要的 SoftwareSerial
9. **013** HuskyLens Tooltip - 動態腳位提示
10. **014** 序列化修復 - JSON 序列化 hooks
11. **015** MCP Server - AI 工具整合
12. **016** ESP32 WiFi/MQTT - IoT 功能

**Phase 2 (017-028)**: 13. **017** Ctrl+S 快速備份 - 鍵盤快捷鍵、Toast 通知 14. **018-019** Workspace 安全防護 - 三層防護機制 15. **020** HuskyLens RX/TX - 腳位標籤修正 16. **021-022** CyberBrick MicroPython - 主板支援、mpremote 上傳 17. **023-024** i18n 優化 - 白名單更新、硬編碼修復 18. **025** 拖曳競態修復 - FileWatcher 衝突解決 19. **026** 統一上傳 UI - Arduino/MicroPython 整合 20. **027-028** CyberBrick X11/X12 - 擴展板積木

**Phase 3 (029-044)**: 21. **029** CyberBrick RC 遙控 - ESP-NOW 自定義配對（Pair ID + 頻道） 22. **030** 語言選擇器 - 即時語言切換 UI 23. **031** 1 月批次修復 - 多主程式積木、備份預覽 URI、自動備份、i18n 鍵 24. **032-033** CyberBrick 計時積木 - `ticks_ms`/`ticks_diff` 移除實驗標記 25. **034** MicroPython 全域變數 - 函式內賦值自動注入 `global` 宣告 26. **035** HuskyLens 動態 INDEX - INDEX 欄位改為接受 Number 積木連接 27. **036** HuskyLens ID 導向積木 - 三個新積木按訓練 ID 存取辨識結果 28. **037** CyberBrick Output Monitor - mpremote REPL 即時輸出 29. **038** Arduino Serial Monitor - `pio device monitor` 整合 30. **039** MicroPython print 換行修復 - 讀取 `NEW_LINE` checkbox 31. **040** MCP 優雅降級 - Node.js 缺失偵測、啟動警告、自訂路徑 32. **041** MCP bundling 修復 - SDK 完整打包入 dist/mcp-server.js 33. **042** 上傳錯誤分類 - 三種錯誤類型明確提示 34. **044** 防止孤立積木 - 三層防護（過濾、guard、警告）

## 版本對照

| 版本 | Blockly | TypeScript | VSCode API | 主要變更                            |
| ---- | ------- | ---------- | ---------- | ----------------------------------- |
| v1.x | 11.2.2  | 5.7.2      | 1.96.0     | 初始版本                            |
| v2.0 | 12.3.1  | 5.9.3      | 1.105.0    | 架構重構、MCP 整合、CyberBrick 支援 |

## 相關資源

- [專案 README](../../README.md)
- [貢獻指南](../../CONTRIBUTING.md)
- [變更日誌](../../CHANGELOG.md)
- [Copilot 指引](../../.github/copilot-instructions.md)

## 技術棧概覽

| 技術        | 版本     | 用途                 |
| ----------- | -------- | -------------------- |
| Blockly     | 12.3.1   | 視覺化程式編輯核心   |
| TypeScript  | 5.9.3    | Extension Host 開發  |
| VS Code API | 1.105.0+ | 編輯器整合、MCP 支援 |
| Webpack     | 5.102.1  | 模組打包             |
| MCP SDK     | 1.24.3   | AI 工具整合          |
| PlatformIO  | -        | Arduino 編譯與上傳   |

詳細技術架構請參考 [技術架構研究](00-technical-foundation/research.md)。

---

_最後更新：2025-12-17_
