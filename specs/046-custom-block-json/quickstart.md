# 快速上手：自訂積木 JSON 系統

**Branch**: `046-custom-block-json` | **Date**: 2026-02-24

## 最簡範例

### 1. 建立自訂積木 JSON

在工作區的 `blockly/custom-blocks/` 資料夾中建立 `hello_led.json`：

```json
{
	"$schema": "../schemas/custom-block.schema.json",
	"type": "hello_led",
	"message": "LED 亮 %1 秒",
	"colour": 160,
	"shape": "statement",
	"inputs": [
		{
			"name": "SECONDS",
			"type": "number",
			"default": 1,
			"min": 0,
			"max": 60
		}
	],
	"arduino": {
		"code": "digitalWrite(LED_BUILTIN, HIGH);\ndelay(${SECONDS} * 1000);\ndigitalWrite(LED_BUILTIN, LOW);\n"
	},
	"micropython": {
		"code": "led.on()\ntime.sleep(${SECONDS})\nled.off()\n",
		"imports": ["from machine import Pin", "import time"],
		"hardwareInit": {
			"led": "led = Pin(2, Pin.OUT)"
		}
	}
}
```

### 2. 驗證結果

儲存檔案後，積木編輯器的工具箱會立即出現「Singular Block」分類，其中包含「LED 亮 ▢ 秒」積木。

### 3. 使用積木

拖曳積木到工作區，連接到 `setup/loop` 容器中。系統會依據板卡選擇自動生成 Arduino 或 MicroPython 程式碼。

---

## 使用精靈 UI 建立

1. 點擊工具箱「Singular Block」分類中的「＋ 建立新積木」按鈕
2. 步驟一：輸入基本設定（名稱、顏色、形狀）
3. 步驟二：新增輸入欄位（數字、文字、下拉選單等）
4. 步驟三：撰寫 Arduino / MicroPython 程式碼模板
5. 步驟四：確認並儲存

---

## 使用 MCP 聊天建立

在 VS Code Copilot 聊天中使用 `create_custom_block` 工具，描述你想要的積木。

---

## 開發者快速啟動

```powershell
# 切換到功能分支
git checkout 046-custom-block-json

# 安裝依賴
npm install

# 啟動開發模式
npm run watch

# 按 F5 啟動擴充功能偵錯
# 在測試的 VS Code 中開啟含 blockly/ 目錄的工作區
# 建立 blockly/custom-blocks/test.json 測試
```
