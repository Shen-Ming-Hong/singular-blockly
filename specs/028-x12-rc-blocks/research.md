# Research: CyberBrick X12 與 RC 遙控積木

**功能分支**: `028-x12-rc-blocks`  
**研究日期**: 2026-01-04  
**狀態**: 完成

## 研究目標

1. 確認 CyberBrick `rc_module` MicroPython API 的完整介面
2. 研究現有 X11 積木實現模式
3. 確定搖桿/按鈕通道對應關係
4. 制定最佳的積木設計方案

---

## 決策 1: rc_module API 介面

### 決策

使用 CyberBrick 官方 `rc_module` API，包含以下主要函式：

| API 函式           | 說明                       | 回傳值        |
| ------------------ | -------------------------- | ------------- |
| `rc_master_init()` | 初始化發射端 (Master) 模式 | None          |
| `rc_slave_init()`  | 初始化接收端 (Slave) 模式  | None          |
| `rc_master_data()` | 讀取發射端本機資料         | Tuple 或 None |
| `rc_slave_data()`  | 讀取來自發射端的遠端資料   | Tuple 或 None |
| `rc_index()`       | 取得配對索引               | 0/1/2         |

### 理由

官方 API 來自 MakerWorld CyberBrick 文檔 (https://makerworld.com/en/cyberbrick/api-doc/cyberbrick_core/lib/rc_module.html)，這是唯一的官方介面，確保與韌體相容。

### 考慮的替代方案

-   **ESP-NOW 原生 API**: 太底層，需要自行處理配對和資料格式
-   **自訂無線協定**: 不相容現有 CyberBrick 遙控器硬體

---

## 決策 2: RC 資料 Tuple 結構

### 決策

資料格式為 10 元素 Tuple: `[L1, L2, L3, R1, R2, R3, K1, K2, K3, K4]`

| 索引 | 通道 | 類型     | 範圍   | 說明                    |
| ---- | ---- | -------- | ------ | ----------------------- |
| 0    | L1   | 搖桿 ADC | 0-4095 | 左搖桿 X 軸             |
| 1    | L2   | 搖桿 ADC | 0-4095 | 左搖桿 Y 軸             |
| 2    | L3   | 搖桿 ADC | 0-4095 | 左搖桿第三軸 (如旋鈕)   |
| 3    | R1   | 搖桿 ADC | 0-4095 | 右搖桿 X 軸             |
| 4    | R2   | 搖桿 ADC | 0-4095 | 右搖桿 Y 軸             |
| 5    | R3   | 搖桿 ADC | 0-4095 | 右搖桿第三軸 (如旋鈕)   |
| 6    | K1   | 按鈕     | 0/1    | 按鈕 1 (0=按下, 1=放開) |
| 7    | K2   | 按鈕     | 0/1    | 按鈕 2                  |
| 8    | K3   | 按鈕     | 0/1    | 按鈕 3                  |
| 9    | K4   | 按鈕     | 0/1    | 按鈕 4                  |

### 理由

這是官方文檔中明確定義的資料格式，範例值 `[1885, 1960, 1992, 2106, 1945, 2009, 1, 1, 1, 1]` 顯示搖桿靜止時約在中點 (2048) 附近。

### 考慮的替代方案

-   **自訂資料結構**: 與硬體韌體不相容，不可行

---

## 決策 3: 積木顏色配置

### 決策

| 選單 | HSV 色相 | 顏色描述                      |
| ---- | -------- | ----------------------------- |
| X12  | 150      | 綠色 (發射端硬體功能)         |
| RC   | 160      | 青色 (無線通訊功能)           |
| X11  | 180      | 藍綠色 (現有，接收端硬體功能) |

### 理由

根據功能規格 FR-013 和 FR-014，使用相近但可區分的顏色來表示不同的功能類別。X12 和 X11 都是硬體擴展板，但分別對應發射端和接收端，使用不同色調便於識別。

### 考慮的替代方案

-   **統一使用 X11 顏色 (180)**: 無法區分發射端和接收端功能，易混淆

---

## 決策 4: 積木分離策略 (X12 vs RC)

### 決策

將功能分為兩個獨立選單：

**RC 選單 (無線通訊)**:

-   `rc_master_init` - 初始化發射端
-   `rc_slave_init` - 初始化接收端
-   `rc_get_joystick` - 讀取遠端搖桿
-   `rc_get_joystick_mapped` - 讀取並映射遠端搖桿
-   `rc_is_button_pressed` - 檢查遠端按鈕
-   `rc_get_button` - 讀取遠端按鈕狀態
-   `rc_is_connected` - 檢查連線狀態
-   `rc_get_rc_index` - 取得配對索引

**X12 選單 (發射端本機讀取)**:

-   `x12_get_joystick` - 讀取本機搖桿
-   `x12_get_joystick_mapped` - 讀取並映射本機搖桿
-   `x12_is_button_pressed` - 檢查本機按鈕
-   `x12_get_button` - 讀取本機按鈕狀態

### 理由

1. **職責分離**: RC 處理無線通訊，X12 處理本機硬體
2. **使用情境不同**: 發射端用 X12+RC，接收端只用 RC
3. **減少混淆**: 清楚區分「讀取本機」和「讀取遠端」
4. **符合規格**: 功能規格明確定義兩個獨立選單

### 考慮的替代方案

-   **全部放入 RC 選單**: 會使選單過於冗長，且混淆本機/遠端讀取
-   **全部放入 X12 選單**: 語義不正確，RC 功能不應放在硬體板選單

---

## 決策 5: 預設值與安全處理

### 決策

當無線資料不可用時 (`rc_slave_data()` 回傳 `None`)：

| 資料類型       | 預設值 | 說明               |
| -------------- | ------ | ------------------ |
| 搖桿 ADC       | 2048   | 中點值，馬達不動作 |
| 按鈕狀態       | 1      | 放開狀態           |
| `is_connected` | False  | 未連線             |

### 理由

符合規格 FR-016 的安全要求。預設值 2048 是搖桿中點，可避免意外的馬達動作。按鈕預設為「放開」狀態更安全。

### 考慮的替代方案

-   **回傳錯誤或拋出例外**: 對初學者不友善，可能導致程式崩潰
-   **搖桿預設 0**: 可能導致馬達反向轉動

---

## 決策 6: 搖桿數值映射演算法

### 決策

使用線性映射公式：

```python
def map_value(value, in_min, in_max, out_min, out_max):
    return (value - in_min) * (out_max - out_min) // (in_max - in_min) + out_min
```

對於搖桿映射 (輸入範圍 0-4095)：

```python
mapped = (joystick_value * (out_max - out_min) // 4095) + out_min
```

### 理由

-   線性映射是最直觀的方式，符合使用者預期
-   使用整數除法 (`//`) 避免浮點數問題
-   與 Arduino 的 `map()` 函式行為一致

### 考慮的替代方案

-   **非線性映射 (如指數曲線)**: 過於複雜，留給進階使用者自行實現
-   **浮點數計算**: MicroPython 處理較慢，且精度對此應用無益

---

## 決策 7: i18n 鍵值命名規範

### 決策

遵循現有專案命名規範：

| 類型     | 格式                         | 範例                                 |
| -------- | ---------------------------- | ------------------------------------ |
| 選單名稱 | `CATEGORY_{MENU}`            | `CATEGORY_X12`, `CATEGORY_RC`        |
| 標籤     | `{MENU}_LABEL_{GROUP}`       | `RC_LABEL_INIT`, `RC_LABEL_JOYSTICK` |
| 積木前綴 | `{MENU}_{BLOCK}_PREFIX`      | `RC_GET_JOYSTICK_PREFIX`             |
| 積木後綴 | `{MENU}_{BLOCK}_SUFFIX`      | `RC_GET_JOYSTICK_SUFFIX`             |
| 提示     | `{MENU}_{BLOCK}_TOOLTIP`     | `RC_GET_JOYSTICK_TOOLTIP`            |
| 下拉選項 | `{MENU}_{DROPDOWN}_{OPTION}` | `RC_JOYSTICK_L1`                     |

### 理由

與現有 X11 積木的 i18n 鍵值格式一致，便於維護和自動化驗證。

### 考慮的替代方案

-   (無，必須遵循現有規範)

---

## 待解決問題

所有 NEEDS CLARIFICATION 項目皆已透過官方文檔和專案分析解決。

---

## 參考資料

1. CyberBrick rc_module API 文檔: https://makerworld.com/en/cyberbrick/api-doc/cyberbrick_core/lib/rc_module.html
2. 專案現有 X11 積木實現: `media/blockly/blocks/x11.js`, `media/blockly/generators/micropython/x11.js`
3. 專案 i18n 結構: `media/locales/*/messages.js`
4. Blockly 積木定義最佳實踐: 參考專案現有模式
