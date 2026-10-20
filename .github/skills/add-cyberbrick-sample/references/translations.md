# 範例工作區翻譯細節

### Phase 2.5: Generate Name Translations 生成名稱翻譯映射

若範例工作區的**積木中包含中文（繁體中文）函式名稱或變數名稱**，必須在 `{filename}.json` 頂層加入 `nameTranslations` 欄位，讓非中文使用者載入範本時自動看到可讀的識別字（FR-003/FR-008）。

#### 掃描策略 Scan Strategy

掃描範圍：**全量掃描，不設排除規則**

1. **變數名稱**：`workspace.variables[].name` ── 涵蓋全域變數與函式參數名稱
2. **函式名稱**：遞迴遍歷所有積木，找出 `type === "arduino_function"` 的 `fields.NAME`

```javascript
// 掃描積木樹（Node 腳本範例）
function scanBlocks(blocks) {
	if (!Array.isArray(blocks)) {
		return;
	}
	for (const b of blocks) {
		if (!b) {
			continue;
		}
		if (b.type === 'arduino_function' && b.fields?.NAME) {
			funcs.add(b.fields.NAME);
		}
		if (b.inputs) {
			for (const k of Object.keys(b.inputs)) {
				const inp = b.inputs[k];
				if (inp?.block) {
					scanBlocks([inp.block]);
				}
				if (inp?.shadow) {
					scanBlocks([inp.shadow]);
				}
			}
		}
		if (b.next?.block) {
			scanBlocks([b.next.block]);
		}
	}
}
scanBlocks(workspace.blocks.blocks);
```

#### 14 個非 zh-hant 語系清單與翻譯格式

翻譯映射放在 `nameTranslations.variables` 與 `nameTranslations.functions`，
key 為原始中文名稱，value 為含以下 14 個語系的物件：

| 語系代碼 | 語言                   | 語系代碼 | 語言             |
| -------- | ---------------------- | -------- | ---------------- |
| `en`     | 英文（必填，作為回退） | `ru`     | 俄文             |
| `ja`     | 日文                   | `pl`     | 波蘭文           |
| `ko`     | 韓文                   | `cs`     | 捷克文           |
| `de`     | 德文                   | `hu`     | 匈牙利文         |
| `fr`     | 法文                   | `bg`     | 保加利亞文       |
| `es`     | 西班牙文               | `tr`     | 土耳其文         |
| `it`     | 義大利文               | `pt-br`  | 葡萄牙文（巴西） |

**完整格式範例：**

```json
"nameTranslations": {
  "variables": {
    "前後搖桿數值": {
      "en": "joystick_forward_back",
      "ja": "joystick_forward_back",
      "ko": "joystick_forward_back",
      "de": "joystick_vorwaerts_zurueck",
      "fr": "joystick_avant_arriere",
      "es": "joystick_adelante_atras",
      "it": "joystick_avanti_indietro",
      "pt-br": "joystick_frente_tras",
      "ru": "joystick_vpered_nazad",
      "pl": "joystick_przod_tyl",
      "cs": "joystick_dopredu_dozadu",
      "hu": "joystick_elore_hatra",
      "bg": "joystick_napreed_nazad",
      "tr": "joystick_ileri_geri"
    }
  },
  "functions": {
    "遙控器": {
      "en": "controller",
      "ja": "controller",
      "ko": "controller",
      "de": "fernsteuerung",
      "fr": "telecommande",
      "es": "controlador",
      "it": "telecomando",
      "pt-br": "controle",
      "ru": "pult",
      "pl": "kontroler",
      "cs": "ovladac",
      "hu": "taviranyito",
      "bg": "distantsionno",
      "tr": "uzaktan_kumanda"
    }
  }
}
```

#### 識別字合法性規則 Identifier Validity Rules

每個翻譯值必須符合本專案的跨平台 ASCII 程式識別字規則：

- ✅ 以字母（`a-z`、`A-Z`）或底線（`_`）開頭
- ✅ 後接字母、數字（`0-9`）、底線
- ❌ **不含**空格、連字號（`-`）、標點符號（`.`、`!`、`'`…）
- ❌ **不以數字開頭**
- ❌ **不含**重音字母（`é`、`ó`、`ü`、`ñ`…），請用 ASCII 等效（`e`、`o`、`u`、`n`）
- ❌ **不含** CJK 字元（中日韓文字），即使 Unicode 合法也不使用，確保跨平台相容性

**驗證腳本：**

```javascript
const identRe = /^[A-Za-z_][A-Za-z0-9_]*$/;
for (const [key, entry] of Object.entries(nameTranslations.variables ?? {})) {
	for (const [locale, val] of Object.entries(entry)) {
		if (!identRe.test(val)) {
			console.error(`INVALID variables["${key}"]["${locale}"] = "${val}"`);
		}
	}
}
```

#### Phase 2.5 驗證清單

- [ ] 所有 `workspace.variables[].name` 均有對應的 `variables` 映射
- [ ] 所有 `arduino_function.fields.NAME` 均有對應的 `functions` 映射
- [ ] 所有翻譯值通過 `/^[A-Za-z_][A-Za-z0-9_]*$/` 識別字合法性驗證
- [ ] `en` 欄位已填（不允許空字串）
- [ ] 若工作區同時有中文與純 ASCII 名稱，已啟用的 `nameTranslations` 應涵蓋兩者，以確保結構完整
- [ ] 若工作區**完全無中文名稱**：可省略 `nameTranslations` 欄位（向後相容）

---

### Phase 2.6: Generate String Translations 生成字串翻譯映射

若積木中有 **`text` 類型積木**（`type === "text"`）的 `fields.TEXT` 包含中文字串（如 `"前:"`, `"按鈕:"`），可加入 `stringTranslations` 欄位讓這些標籤在載入時自動顯示目標語系文字。

> **與 `nameTranslations` 的差異：** `stringTranslations` 翻譯的是任意顯示字串，**無識別字格式限制**，值可包含冒號、空格、標點等任何字元，只要非空字串即合規。

#### 掃描策略 Scan Strategy

遞迴遍歷所有積木，找出 `type === "text"` 且 `fields.TEXT` 為中文字串的積木：

```javascript
// 掃描 text 積木（Node 腳本範例）
const textStrings = new Set();
function scanTextBlocks(blocks) {
	if (!Array.isArray(blocks)) return;
	for (const b of blocks) {
		if (!b) continue;
		if (b.type === 'text' && b.fields?.TEXT) {
			const text = b.fields.TEXT;
			// 只收集含有非 ASCII 字元（如中文）的字串
			if (/[^\x00-\x7F]/.test(text)) {
				textStrings.add(text);
			}
		}
		if (b.inputs) {
			for (const k of Object.keys(b.inputs)) {
				const inp = b.inputs[k];
				if (inp?.block) scanTextBlocks([inp.block]);
				if (inp?.shadow) scanTextBlocks([inp.shadow]);
			}
		}
		if (b.next?.block) scanTextBlocks([b.next.block]);
	}
}
scanTextBlocks(workspace.blocks.blocks);
```

#### 格式規則 Format Rules

- `stringTranslations` 為 `Record<string, Record<string, string>>`
- **外層 key**：原始中文字串（zh-hant 基準，完整比對）
- **內層 key**：14 個非 zh-hant 語系代碼
- **內層 value**：任意非空字串，無識別字格式限制（可含冒號、空格等）
- zh-hant 不填入（載入時原始字串即為 zh-hant 顯示值）

**完整格式範例：**

```json
"stringTranslations": {
  "前:": {
    "en": "Fwd:",
    "ja": "前:",
    "ko": "전:",
    "de": "Vor:",
    "fr": "Av:",
    "es": "Adel:",
    "it": "Avanti:",
    "pt-br": "Frt:",
    "ru": "Вп:",
    "pl": "Prz:",
    "cs": "Vpr:",
    "hu": "Előre:",
    "bg": "Напр:",
    "tr": "İleri:"
  },
  "按鈕:": {
    "en": "Btn:",
    "ja": "ボタン:",
    "ko": "버튼:",
    "de": "Taste:",
    "fr": "Btn:",
    "es": "Btn:",
    "it": "Btn:",
    "pt-br": "Btn:",
    "ru": "Кнп:",
    "pl": "Przc:",
    "cs": "Tl:",
    "hu": "Gomb:",
    "bg": "Копче:",
    "tr": "Btn:"
  }
}
```

#### 三層回退策略 Fallback

1. **目標語系**的翻譯值（若非空字串）
2. → **`en`** 翻譯值（若非空字串且目標非 en）
3. → **保留原始中文字串**（向後相容）

#### Phase 2.6 驗證清單

- [ ] 所有中文 `text` 積木字串均有對應的 `stringTranslations` 映射
- [ ] 所有 14 個非 zh-hant 語系均已填入（或至少 `en` 已填）
- [ ] 翻譯值為非空字串（可包含冒號、空格等，無識別字限制）
- [ ] 若工作區**完全無中文 text 字串**：可省略 `stringTranslations` 欄位（向後相容）

---
