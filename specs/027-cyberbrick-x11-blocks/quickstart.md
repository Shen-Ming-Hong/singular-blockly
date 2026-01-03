# Quickstart: CyberBrick X11 擴展板積木開發

**Branch**: `027-cyberbrick-x11-blocks` | **Date**: 2026-01-03

## 快速開始

### 1. 開發環境設定

```powershell
# 確保在專案根目錄
cd e:\singular-blockly

# 安裝依賴
npm install

# 啟動開發監視模式
npm run watch
```

### 2. 測試開發版本

1. 在 VS Code 中按 `F5` 啟動擴充套件開發主機
2. 開啟任意資料夾作為工作區
3. 使用命令面板 `Ctrl+Shift+P` → `Singular Blockly: 開啟編輯器`
4. 在開發板選擇器中選擇 `CyberBrick`
5. 展開 Toolbox 中的 `X11 擴展板` 類別

---

## 檔案結構

```
media/blockly/
├── blocks/
│   └── x11.js                    # 積木定義
└── generators/
    └── micropython/
        └── x11.js                # MicroPython 生成器

media/toolbox/
├── categories/
│   └── cyberbrick_x11.json       # Toolbox 類別定義
└── cyberbrick.json               # 更新以引入 x11 類別

media/locales/
├── zh-hant/messages.js           # 繁體中文翻譯
├── en/messages.js                # 英文翻譯
└── [其他 13 種語言]/messages.js
```

---

## 開發工作流程

### 新增積木步驟

1. **定義積木** (`media/blockly/blocks/x11.js`)

```javascript
Blockly.Blocks['x11_servo_180_angle'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('X11_SERVO_180_ANGLE_PREFIX'))
			.appendField(
				new Blockly.FieldDropdown([
					['S1', '1'],
					['S2', '2'],
					['S3', '3'],
					['S4', '4'],
				]),
				'PORT'
			);
		this.appendValueInput('ANGLE').setCheck('Number').appendField(window.languageManager.getMessage('X11_SERVO_180_ANGLE_SUFFIX'));
		this.appendDummyInput().appendField('°');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180); // X11 專屬顏色
		this.setTooltip(window.languageManager.getMessage('X11_SERVO_180_ANGLE_TOOLTIP'));
	},
};
```

2. **新增生成器** (`media/blockly/generators/micropython/x11.js`)

```javascript
generator.forBlock['x11_servo_180_angle'] = function (block) {
	// 添加 import
	generator.addImport('from bbl.servos import ServosController');

	// 添加硬體初始化
	generator.addHardwareInit('servos', 'servos = ServosController()');

	// 取得參數
	const port = block.getFieldValue('PORT');
	const angle = generator.valueToCode(block, 'ANGLE', generator.ORDER_NONE) || '0';

	// 生成程式碼 (含 clamp)
	return `servos.set_angle(${port}, max(0, min(180, ${angle})))\n`;
};
```

3. **新增 Toolbox 項目** (`media/toolbox/categories/cyberbrick_x11.json`)

```json
{
	"kind": "block",
	"type": "x11_servo_180_angle",
	"inputs": {
		"ANGLE": {
			"shadow": {
				"type": "math_number",
				"fields": { "NUM": 90 }
			}
		}
	}
}
```

4. **新增翻譯** (所有 15 個 `media/locales/*/messages.js`)

```javascript
// zh-hant
X11_SERVO_180_ANGLE_PREFIX: '伺服馬達(180°)',
X11_SERVO_180_ANGLE_SUFFIX: '轉到',
X11_SERVO_180_ANGLE_TOOLTIP: '適用於 180° 伺服馬達 (PG001)，直接轉到指定角度',

// en
X11_SERVO_180_ANGLE_PREFIX: 'Servo(180°)',
X11_SERVO_180_ANGLE_SUFFIX: 'rotate to',
X11_SERVO_180_ANGLE_TOOLTIP: 'For 180° servo (PG001), rotate directly to specified angle',
```

---

## 驗證指令

```powershell
# 驗證 i18n 翻譯完整性
npm run validate:i18n

# 執行測試
npm run test

# 檢查程式碼風格
npm run lint
```

---

## 常見問題

### Q: 為什麼積木沒有出現在 Toolbox？

檢查：

1. `cyberbrick.json` 是否有 `$include` 引入 `cyberbrick_x11.json`
2. 積木類型名稱在 blocks、generators、toolbox 中是否一致
3. 是否選擇了 CyberBrick 開發板

### Q: 為什麼生成的程式碼沒有 import？

檢查：

1. 生成器是否呼叫了 `generator.addImport()`
2. `micropython.js` 中的 `finish()` 方法是否正確處理 imports

### Q: timing_proc() 什麼時候會被注入？

只有當使用了 `x11_servo_180_stepping` 積木時才會自動注入。其他伺服馬達積木（`set_angle`、`set_speed`、`stop`）不需要 timing_proc()。

---

## 相關文件

-   [功能規格書](spec.md)
-   [研究文件](research.md)
-   [資料模型](data-model.md)
-   [API 合約](contracts/api.md)
