# Quickstart: HuskyLens 積木動態編號輸入

**Branch**: `035-huskylens-dynamic-index`

## 功能概述

修改 HuskyLens「取得方塊」和「取得箭頭」積木，使編號欄位能接受數字積木、變數積木或數學運算積木，讓使用者可以在迴圈中動態掃描所有偵測結果。

## 修改前後對比

### 積木外觀

```
修改前：[取得方塊] [0 ▼] [的] [X中心 ▼]
修改後：[取得方塊] [(0)] [的] [X中心 ▼]
         └─ 可連接其他積木
```

### 程式碼產生

```cpp
// 固定數字
huskylens.getBlock(0).xCenter

// 變數
huskylens.getBlock(i).xCenter

// 數學運算
huskylens.getBlock((i + 1)).xCenter
```

## 使用情境

### 迴圈掃描所有方塊

```
[重複 10 次 使用 i]
  [如果 [取得方塊] [(i)] [的] [X中心] > 100]
    [執行某動作]
```

產生的 Arduino 程式碼：

```cpp
for (int i = 0; i < 10; i++) {
    if (huskylens.getBlock(i).xCenter > 100) {
        // 執行某動作
    }
}
```

## 實作步驟摘要

1. **積木定義**：將 `FieldNumber` 改為 `appendValueInput('INDEX').setCheck('Number')`
2. **外觀設定**：加入 `this.setInputsInline(true)` 維持單行排列
3. **產生器**：將 `getFieldValue('INDEX')` 改為 `valueToCode(block, 'INDEX', ORDER_ATOMIC) || '0'`
4. **工具箱**：為積木添加 `shadow` block 設定（預設數字 0）

## 驗證方法

1. 執行 `npm run watch` 啟動開發模式
2. 按 F5 開啟 Extension Development Host
3. 開啟 Blockly 編輯器
4. 從工具箱拖曳「取得方塊」積木，確認預設有數字 0
5. 拖曳變數積木連接到編號欄位，確認連接成功
6. 產生程式碼，確認變數名稱正確出現在索引位置
