# Implementation Plan: CyberBrick ESP-NOW RC 自定義配對積木

**Branch**: `029-espnow-rc-pairing` | **Date**: 2026-01-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/029-espnow-rc-pairing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

實現 CyberBrick ESP-NOW 自定義配對機制，透過配對 ID (1-255) 和 WiFi 頻道 (1-11) 隔離不同組別的遙控通訊，解決教室多組同時使用時的訊號干擾問題。採用 MicroPython `espnow` 模組的 `irq(callback)` 非同步接收架構，配對 ID 轉換為虛擬 MAC 地址 `b'\x02\x00\x00\x00\x00\x{ID}'`。

## Technical Context

**Language/Version**: TypeScript 5.9.3 (Extension) / JavaScript ES6 (Blockly) / MicroPython (Generated)  
**Primary Dependencies**: Blockly 12.3.1, VSCode API 1.105.0+, MicroPython espnow module  
**Storage**: JSON (blockly/main.json workspace state)  
**Testing**: VSCode Test CLI (Unit), Manual Hardware Test (Integration)  
**Target Platform**: VSCode Extension + CyberBrick Core (ESP32-C3)  
**Project Type**: VSCode Extension with WebView  
**Performance Goals**: RC data latency <100ms, 發送頻率 50Hz (20ms)  
**Constraints**: 斷線偵測 500ms, ESP-NOW 最大 payload 250 bytes  
**Scale/Scope**: 支援 255 組配對 × 11 頻道 = 2805 組隔離組合

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                     | Status          | Notes                                                    |
| --------------------------------------------- | --------------- | -------------------------------------------------------- |
| I. Simplicity and Maintainability             | ✅ PASS         | 積木設計簡潔，使用者只需設定配對 ID 和頻道               |
| II. Modularity and Extensibility              | ✅ PASS         | 新增獨立的 `rc_espnow_*` 積木系列，不破壞現有 RC 積木    |
| III. Avoid Over-Development                   | ✅ PASS         | 只實作核心配對和資料傳輸功能                             |
| IV. Flexibility and Adaptability              | ✅ PASS         | 配對 ID 1-255 + 頻道 1-11 提供充足的配置彈性             |
| V. Research-Driven Development                | ✅ PASS         | 已研究 MicroPython espnow API，見 research.md            |
| VI. Structured Logging                        | ✅ PASS         | 積木定義使用 `console.log` (WebView)，生成器使用標準模式 |
| VII. Comprehensive Test Coverage              | ⚠️ UI Exception | WebView 積木需手動測試，生成程式碼可單元測試             |
| VIII. Pure Functions and Modular Architecture | ✅ PASS         | 生成器為純函數，無副作用                                 |
| IX. Traditional Chinese Documentation         | ✅ PASS         | 所有規格文件使用繁體中文                                 |
| X. Professional Release Management            | N/A             | 等待功能完成後統一發布                                   |
| XI. Agent Skills Architecture                 | N/A             | 非技能開發任務                                           |

## Project Structure

### Documentation (this feature)

```text
specs/029-espnow-rc-pairing/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output - ESP-NOW API 研究
├── data-model.md        # Phase 1 output - 實體與積木定義
├── quickstart.md        # Phase 1 output - 使用指南
├── contracts/           # Phase 1 output - API 契約
│   └── block-api.md     # 積木定義與生成器介面規格
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
media/blockly/blocks/
├── rc.js                    # 現有 RC 積木定義 (保留)
└── rc-espnow.js             # 新增 ESP-NOW RC 積木定義

media/blockly/generators/micropython/
├── rc.js                    # 現有 RC 生成器 (保留)
└── rc-espnow.js             # 新增 ESP-NOW RC 生成器

media/toolbox/categories/
├── cyberbrick_rc.json       # 現有 RC toolbox (保留)
└── cyberbrick_rc_espnow.json # 新增 ESP-NOW RC toolbox

media/toolbox/
└── cyberbrick.json          # 更新：新增 rc_espnow 類別引用

media/locales/
├── en/messages.js           # 新增 RC_ESPNOW_* 翻譯鍵
├── zh-hant/messages.js      # 新增 RC_ESPNOW_* 翻譯鍵
└── [其他13種語言]/messages.js  # 新增 RC_ESPNOW_* 翻譯鍵
```

**Structure Decision**: 採用「新增獨立檔案」策略而非修改現有檔案，保持與現有 RC 系統的隔離，便於維護和回滾。

## Complexity Tracking

> 本功能無需違反 Constitution 原則，此區塊為空。

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| (無)      | -          | -                                    |

---

## Phase 0 研究總結

研究成果已記錄於 [research.md](research.md)：

1. **ESP-NOW MicroPython API**: 確認 `espnow.irq(callback)` 非同步接收可行
2. **配對機制設計**: 採用配對 ID → 虛擬 MAC 地址轉換
3. **資料格式**: 沿用官方 10 元素 tuple，20 bytes 打包
4. **連線狀態**: 500ms 超時判定斷線

---

## Phase 1 設計總結

設計成果已記錄於：

-   [data-model.md](data-model.md): 實體定義、積木規格、i18n 鍵清單
-   [quickstart.md](quickstart.md): 使用範例與疑難排解
-   [contracts/block-api.md](contracts/block-api.md): 積木定義與生成器介面

### 關鍵設計決策

1. **獨立積木系列**: 新增 `rc_espnow_*` 前綴積木，不修改現有 `rc_*` 積木
2. **非同步接收**: 使用 `espnow.irq(callback)` 自動更新全域 `_rc_data`
3. **安全預設值**: 斷線時搖桿回歸 2048 (中點)、按鈕回歸 1 (放開)
4. **視覺回饋**: 等待配對時藍色 LED 閃爍 (500ms 間隔)

---

## Constitution Check (Phase 1 後)

| Principle                   | Pre-design | Post-design | Change Notes       |
| --------------------------- | ---------- | ----------- | ------------------ |
| I. Simplicity               | ✅         | ✅          | 維持簡潔設計       |
| II. Modularity              | ✅         | ✅          | 獨立檔案結構確認   |
| III. Avoid Over-Development | ✅         | ✅          | 只實作規格所需功能 |
| VII. Test Coverage          | ⚠️         | ⚠️          | 硬體測試需手動執行 |

**結論**: Constitution 檢查通過，可進入 Phase 2 任務分解。
