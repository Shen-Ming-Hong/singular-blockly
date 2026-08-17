# Singular Blockly 整合規格書

> 本文件庫收錄已歸檔規格與已同步的現行架構文件，最高同步至進行中的 `specs/067`。保留窗口內的 SDD 仍以 `specs/` 原始文件為準，不代表已全部提煉或歸檔。

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
│   ├── i18n.md                    # 002/023/024 i18n 翻譯品質與審計優化
│   └── user-facing-localization.md # 047/049 安全警告與範例名稱在地化
├── 03-hardware-support/           # 硬體支援與積木
│   ├── huskylens.md               # 003/013/020/035/036 HuskyLens 驗證 + tooltip + RX/TX + 動態 INDEX + ID 積木
│   ├── esp32-pwm.md               # 011 ESP32 PWM 設定
│   ├── esp32-pixetto.md           # 012 ESP32 Pixetto 修正
│   ├── esp32-wifi-mqtt.md         # 016 ESP32 WiFi/MQTT
│   ├── cyberbrick-micropython.md  # 021/022/032/033/034 CyberBrick MicroPython 支援
│   ├── cyberbrick-rc.md           # 029 ESP-NOW 自定義配對 RC 遙控
│   ├── cyberbrick-expansion-boards.md # 027/028 X11/X12 擴展板積木
│   └── txt-controller.md          # 051/053-056 TXT Controller 與虛擬控制器
├── 04-quality-testing/            # 品質保證與測試
│   ├── test-coverage.md           # 004 測試覆蓋率提升
│   ├── managed-runtime-environment.md # 067 managed Core 跨平台驗證與發布閘門
│   ├── project-safety.md          # 010 專案安全防護
│   └── workspace-safety.md        # 018/019/025 Workspace 安全防護
├── 05-dependencies/               # 依賴管理
│   └── dependency-upgrades.md     # 005-009 依賴升級系列
├── 06-features/                   # 功能開發與整合
│   ├── agent-skills.md            # 066 專案 Skills、runtime 契約與安全工作區驗證
│   ├── bug-fixes.md               # 014/031/039 序列化修復、1 月批次修復、print 換行修復
│   ├── editor-theme-surfaces.md   # 057 編輯器主題表面
│   ├── function-block-locking.md  # 050 函式積木鎖定
│   ├── language-selector.md       # 030 語言選擇器
│   ├── platformio-diagnostics.md  # 052/058 PlatformIO 診斷與引導式修復
│   ├── quick-backup.md            # 017 Ctrl+S 快速備份
│   ├── unified-upload-ui.md       # 026/042 統一上傳 UI、錯誤分類提示
│   ├── serial-monitor.md          # 037/038 CyberBrick / Arduino Serial Monitor
│   ├── orphan-blocks.md           # 044 防止孤立積木
│   └── sample-browser.md          # 048 CyberBrick 範例瀏覽器
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
| P1     | 品質   | [Managed Core 跨平台驗證](04-quality-testing/managed-runtime-environment.md) | 🔄 進行中 |
| P1     | 品質   | [專案安全防護](04-quality-testing/project-safety.md)                    | ✅ 完成   |
| P1     | 品質   | [Workspace 安全防護](04-quality-testing/workspace-safety.md)            | ✅ 完成   |
| P1     | 硬體   | [HuskyLens](03-hardware-support/huskylens.md)                           | ✅ 完成   |
| P1     | 硬體   | [CyberBrick MicroPython](03-hardware-support/cyberbrick-micropython.md) | ✅ 完成   |
| P1     | 硬體   | [CyberBrick 擴展板](03-hardware-support/cyberbrick-expansion-boards.md) | ✅ 完成   |
| P1     | 硬體   | [CyberBrick RC 遙控](03-hardware-support/cyberbrick-rc.md)              | ✅ 完成   |
| P1     | 整合   | [Agent Skills](06-features/agent-skills.md)                             | ✅ 完成   |
| P1     | 硬體   | [TXT Controller](03-hardware-support/txt-controller.md)                 | ✅ 完成   |
| P1     | 功能   | [統一上傳 UI](06-features/unified-upload-ui.md)                         | ✅ 完成   |
| P1     | 功能   | [Serial Monitor](06-features/serial-monitor.md)                         | ✅ 完成   |
| P1     | 功能   | [防止孤立積木](06-features/orphan-blocks.md)                            | ✅ 完成   |
| P1     | 功能   | [CyberBrick 範例瀏覽器](06-features/sample-browser.md)                  | ✅ 完成   |
| P1     | 工具   | [PlatformIO 診斷](06-features/platformio-diagnostics.md)                | ✅ 完成   |
| P2     | 國際化 | [i18n 品質](02-internationalization/i18n.md)                            | ✅ 完成   |
| P2     | 國際化 | [使用者介面與範例名稱](02-internationalization/user-facing-localization.md) | ✅ 完成 |
| P2     | 功能   | [函式積木鎖定](06-features/function-block-locking.md)                   | ✅ 完成   |
| P2     | 功能   | [編輯器主題表面](06-features/editor-theme-surfaces.md)                  | ✅ 完成   |
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
11. **015** 舊 AI server 整合（已由 066 Agent Skills 取代）
12. **016** ESP32 WiFi/MQTT - IoT 功能

**Phase 2 (017-028)**: 13. **017** Ctrl+S 快速備份 - 鍵盤快捷鍵、Toast 通知 14. **018-019** Workspace 安全防護 - 三層防護機制 15. **020** HuskyLens RX/TX - 腳位標籤修正 16. **021-022** CyberBrick MicroPython - 主板支援、mpremote 上傳 17. **023-024** i18n 優化 - 白名單更新、硬編碼修復 18. **025** 拖曳競態修復 - FileWatcher 衝突解決 19. **026** 統一上傳 UI - Arduino/MicroPython 整合 20. **027-028** CyberBrick X11/X12 - 擴展板積木

**Phase 3 (029-045)**: 21. **029** CyberBrick RC 遙控 - ESP-NOW 自定義配對（Pair ID + 頻道） 22. **030** 語言選擇器 - 即時語言切換 UI 23. **031** 1 月批次修復 - 多主程式積木、備份預覽 URI、自動備份、i18n 鍵 24. **032-033** CyberBrick 計時積木 25. **034** MicroPython 全域變數 26. **035-036** HuskyLens 動態／ID 導向積木 27. **037-038** Serial Monitor 28. **039** MicroPython print 換行修復 29. **040-041** 舊 AI server 維護（已由 066 移除） 30. **042** 上傳錯誤分類 31. **044** 防止孤立積木 32. **045** RC 工具箱移除舊數值按鈕積木並保留工作區相容性。

**Phase 4 (047-050)**：安全警告在地化、CyberBrick 範例瀏覽器、範例名稱在地化與函式積木鎖定。

**Phase 5 (051-058)**：TXT Controller、多流程、虛擬控制器、唯讀備份預覽、主題與 M 輸出支援；PlatformIO 狀態診斷與安全的引導式修復。

**Phase 6 (059-061)**：CyberBrick USB／OTA 上傳模式、主板與 X11 數位 LED 教學積木，以及 OTA agent 自動升級。

**Phase 7 (062-066)**：目前的 SDD 保留窗口；詳細設計以 `specs/` 原始文件為準，其中 065 完成 Blockly 13 現代化，066 完成專案內 Agent Skills、runtime 契約、外部工作區驗證及舊使用者端 AI server 退役。

**Phase 8 (067)**：Singular 自有 Python／PlatformIO／mpremote managed Core、provider 相容 fallback、無 shell monitor、跨平台路徑矩陣及合併／發布 evidence gate。

## SDD 保留與歸檔狀態

截至 2026-08-13，`specs/` 保留所有未完成 SDD，以及依規格編號排序後最近五個已完成 SDD：

| 類別 | 保留編號 | 原因 |
| ---- | -------- | ---- |
| 未完成 | 無 | 現存 SDD 對應的 feature PR 都已有合併紀錄 |
| 最近五個已完成 | 062、063、064、065、066 | 保留近期設計上下文，供維護與回溯 |

完成狀態以 feature PR 的 `MERGED` 與 `mergedAt` 為優先證據；因此 PR 已合併時，過時的 `Draft` 標記、缺少 `tasks.md` 或未勾選的人工驗證項目不再誤判為未完成。本次完成內容提煉並自 `specs/` 歸檔的編號為 045、048、059–061；同一輪稍早已歸檔 047、049–058，更早的 001–044 已於先前批次整合。所有歸檔內容均可透過 Git 歷史回復。

## 版本對照

| 版本 | Blockly | TypeScript | VSCode API | 主要變更                            |
| ---- | ------- | ---------- | ---------- | ----------------------------------- |
| v1.x | 11.2.2  | 5.7.2      | 1.96.0     | 初始版本                            |
| v2.0 | 13.2.1  | 5.9.3      | 1.109.0    | Agent Skills、runtime 驗證、CyberBrick/TXT 支援 |

## 相關資源

- [專案 README](../../README.md)
- [貢獻指南](../../CONTRIBUTING.md)
- [變更日誌](../../CHANGELOG.md)
- [Copilot 指引](../../.github/copilot-instructions.md)

## 技術棧概覽

| 技術        | 版本     | 用途                 |
| ----------- | -------- | -------------------- |
| Blockly     | 13.2.1   | 視覺化程式編輯核心   |
| TypeScript  | 5.9.3    | Extension Host 開發  |
| VS Code API | 1.109.0+ | 編輯器整合、Project Skills 支援 |
| Webpack     | 5.102.1  | 模組打包             |
| PlatformIO  | -        | Arduino 編譯與上傳   |

詳細技術架構請參考 [技術架構研究](00-technical-foundation/research.md)。

---

_最後更新：2026-08-16_
