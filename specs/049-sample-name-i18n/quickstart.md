# Quickstart：為範本 JSON 新增名稱翻譯

**Feature**: 049-sample-name-i18n  
**適用對象**：範本作者、add-cyberbrick-sample SKILL 執行者

---

## 前置條件

- 已建立或現有範本 JSON 檔案（如 `media/samples/my-sample.json`）
- 該範本中含有中文函式名稱或變數名稱

---

## 步驟一：確認需要翻譯的名稱

在 Blockly 工作區中確認：
- **函式名稱**：所有 `arduino_function` 積木的函式名稱（程式面板中出現的函式標籤）
- **變數名稱**：工作區左側的變數清單（包含用於函式參數的區域變數）

---

## 步驟二：在 JSON 根層新增 `nameTranslations`

範本 JSON 的原始結構：
```json
{
  "workspace": { ... },
  "board": "cyberbrick"
}
```

新增後的結構：
```json
{
  "workspace": { ... },
  "board": "cyberbrick",
  "nameTranslations": {
    "variables": {
      "中文變數名稱": {
        "en": "english_var_name",
        "ja": "日本語変数名"
      }
    },
    "functions": {
      "中文函式名稱": {
        "en": "english_func_name",
        "ja": "日本語関数名"
      }
    }
  }
}
```

---

## 步驟三：翻譯命名規則

| 規則 | 說明 | 範例（合法） | 範例（不合法）|
|---|---|---|---|
| 允許 Unicode 字母開頭 | 字母或底線開頭 | `controller`、`контроллер`、`コントローラー` | `1speed`、`-go` |
| 允許字母、數字、底線 | 不含空格或符號 | `move_forward`、`speed2` | `move forward`、`go-left` |
| 建議填寫 `en` 翻譯 | 作為回退層使用 | `"en": "controller"` | （省略 `en` 時無回退）|

---

## 步驟四：選填語系

只需填寫你有把握的語系，其他語系會自動回退到 `en`，再回退到原始中文名稱。

支援的語系代碼：`en`、`ja`、`ko`、`de`、`fr`、`es`、`it`、`pt-br`、`ru`、`pl`、`cs`、`hu`、`bg`、`tr`

---

## 完整範例（節錄自 Soccer Robot）

```json
{
  "workspace": { ... },
  "board": "cyberbrick",
  "nameTranslations": {
    "variables": {
      "前後搖桿數值": {
        "en": "joystick_forward_back",
        "ja": "ジョイスティック前後値",
        "ko": "조이스틱_앞뒤값",
        "de": "joystick_vorwaerts_rueckwaerts"
      },
      "左右搖桿數值": {
        "en": "joystick_left_right",
        "ja": "ジョイスティック左右値"
      },
      "最大速度": {
        "en": "max_speed",
        "ja": "最大速度"
      },
      "紅色": {
        "en": "red",
        "ja": "red",
        "ko": "red"
      },
      "左輪速度": {
        "en": "left_wheel_speed",
        "ja": "左輪速度"
      }
    },
    "functions": {
      "遙控器": {
        "en": "controller",
        "ja": "コントローラー",
        "ko": "컨트롤러"
      },
      "馬達移動": {
        "en": "motor_move",
        "ja": "モーター移動"
      },
      "車燈": {
        "en": "set_car_lights",
        "ja": "車のライト設定"
      }
    }
  }
}
```

---

## 注意事項

1. **`variables` 映射涵蓋函式參數**：像 `紅色`、`左輪速度` 這類只在函式 `extraState` 中出現的參數名稱，也放在 `variables` 映射中，不放在 `functions` 映射
2. **函式名稱不在 `variables` 映射**：函式本身的名稱（如 `車燈`）放在 `functions` 映射
3. **舊範本不受影響**：不含 `nameTranslations` 的舊範本 JSON 將以原始名稱載入

---

## 驗證方式

載入此範本後，在英文介面環境下應看到：
- 變數面板顯示 `joystick_forward_back`（而非 `前後搖桿數值`）
- 函式積木標籤顯示 `controller`（而非 `遙控器`）
- 生成的 MicroPython 程式碼使用英文識別字
