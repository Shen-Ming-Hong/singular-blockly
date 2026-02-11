# 快速開始指南：防止孤立積木產生無效程式碼

**功能分支**: `044-prevent-orphan-blocks`
**建立日期**: 2025-07-15

## 先決條件

- Node.js 18+ 已安裝
- VSCode 已安裝
- 已 clone `singular-blockly` 專案
- 已切換到 `044-prevent-orphan-blocks` 分支

## 快速設定

```bash
# 1. 切換分支
git checkout 044-prevent-orphan-blocks

# 2. 安裝依賴
npm install

# 3. 建置專案
npm run compile

# 4. 執行測試
npm test
```

## 架構概覽

本功能實作三層防護架構：

```
第一層：workspaceToCode() 頂層過濾
  ↓ 僅允許 allowedTopLevelBlocks_ 中的積木
第二層：forBlock Guard 深層防護
  ↓ isInAllowedContext() 檢查每個控制積木
第三層：block.onchange 視覺警告
  ↓ setWarningText() 在孤立積木上顯示警告
```

## 主要修改檔案

### Generator 層

| 檔案 | 修改內容 |
|------|----------|
| `media/blockly/generators/arduino/index.js` | 新增 `workspaceToCode()` 覆寫、`allowedTopLevelBlocks_` 清單、`isInAllowedContext()` helper |
| `media/blockly/generators/arduino/loops.js` | 各 forBlock 加入 context guard |
| `media/blockly/generators/arduino/logic.js` | `controls_if` forBlock 加入 context guard |
| `media/blockly/generators/micropython/index.js` | 新增 `isInAllowedContext()` helper |
| `media/blockly/generators/micropython/loops.js` | 各 forBlock 加入 context guard |
| `media/blockly/generators/micropython/logic.js` | `controls_if` forBlock 加入 context guard |

### Block 定義層

| 檔案 | 修改內容 |
|------|----------|
| `media/blockly/blocks/loops.js` | 控制積木加入 `onchange` 孤立警告回呼 |

### 多語系

| 檔案 | 修改內容 |
|------|----------|
| `media/locales/*/messages.js` | 所有 15 個語系加入 `ORPHAN_BLOCK_WARNING` 鍵值 |

## 開發指南

### 新增 Guard 到 forBlock

在每個控制流程積木的 `forBlock` handler 開頭加入 guard：

```javascript
window.arduinoGenerator.forBlock['controls_whileUntil'] = function (block) {
    // ⬇️ 新增：深層防護
    if (!window.arduinoGenerator.isInAllowedContext(block)) {
        return '';
    }
    // === 以下為原有邏輯，不修改 ===
    const until = block.getFieldValue('MODE') === 'UNTIL';
    // ...
};
```

### 新增 onchange 警告到 Block 定義

```javascript
Blockly.Blocks['controls_whileUntil'] = {
    init: function () {
        // ... 原有初始化 ...
    },
    // ⬇️ 新增：孤立警告
    onchange: function () {
        if (!this.workspace || this.workspace.isFlyout) return;
        if (window.isInAllowedContext(this)) {
            this.setWarningText(null);
        } else {
            this.setWarningText(
                window.languageManager.getMessage('ORPHAN_BLOCK_WARNING') ||
                'This block must be placed inside setup(), loop(), or a function to generate code.'
            );
        }
    },
};
```

### 新增語系翻譯

在 `media/locales/{lang}/messages.js` 中新增：

```javascript
ORPHAN_BLOCK_WARNING: '此積木必須放在 setup()、loop() 或函式內才能產生程式碼。',
```

## 手動測試案例

### 測試 1：孤立控制積木不產生程式碼
1. 開啟 VSCode，啟動 Singular Blockly Extension
2. 從積木選單拖一個 `while` 積木到工作區空白處
3. 切換到程式碼檢視
4. ✅ 預期：程式碼中不包含 `while` 迴圈

### 測試 2：孤立積木顯示警告
1. 拖一個 `for` 積木到工作區空白處
2. ✅ 預期：積木上出現黃色警告圖示，訊息為對應語系的警告文字

### 測試 3：移入容器後警告消失
1. 將上述孤立 `for` 積木拖入 `loop()` 區域
2. ✅ 預期：警告圖示消失，程式碼正常生成

### 測試 4：合法位置的積木不受影響
1. 確認 `loop()` 內的 `while` 積木仍正常生成 `while` 迴圈程式碼
2. 確認自訂函式內的 `if` 積木仍正常生成 `if` 條件程式碼
3. ✅ 預期：與修改前行為完全一致

### 測試 5：始終生成積木不受影響
1. 在工作區頂層放置一個 `servo_setup` 積木
2. ✅ 預期：servo 設定程式碼仍正常生成

### 測試 6：多語系警告
1. 切換介面語言到不同語系
2. 拖一個控制積木到空白處
3. ✅ 預期：警告訊息以對應語言顯示

## 相關文件

- [功能規格書](./spec.md)
- [研究報告](./research.md)
- [資料模型](./data-model.md)
- [Generator 介面合約](./contracts/generator-interfaces.md)
- [積木警告事件合約](./contracts/block-warning-events.md)
