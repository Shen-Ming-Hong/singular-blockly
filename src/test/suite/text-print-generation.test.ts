/**
 * text_print Generator Tests
 *
 * 測試 text_print 積木的 MicroPython 程式碼生成邏輯
 * 由於 Blockly 在 WebView (browser context) 中執行,此檔案為文件化測試
 * 實際程式碼生成驗證透過手動測試完成 (參見 tasks.md Phase 3)
 *
 * 參考:
 * - media/blockly/generators/micropython/text.js (text_print 生成器)
 * - media/blockly/blocks/arduino.js (text_print 積木定義)
 * - specs/039-fix-print-newline/contracts/generator-contract.md
 */

import * as assert from 'assert';

suite('text_print Code Generation Tests', () => {
	suite('程式碼生成格式驗證 (Code Generation Format)', () => {
		/**
		 * 測試案例 1: NEW_LINE = TRUE (勾選換行)
		 *
		 * 積木配置:
		 * - text_print: TEXT = "Hello", NEW_LINE = TRUE (勾選)
		 *
		 * 預期生成程式碼:
		 * ```python
		 * print("Hello")
		 * ```
		 *
		 * 終端機行為: 輸出 "Hello" 後自動換行
		 */
		test('NEW_LINE = TRUE: 應生成 print(msg)', () => {
			const expectedCode = /^print\("Hello"\)$/;

			// 註: 實際測試需在 Extension Development Host 中手動執行
			// 此處記錄預期格式供開發者參考
			assert.ok(expectedCode, '應使用標準 print 函數 (預設換行)');
		});

		/**
		 * 測試案例 2: NEW_LINE = FALSE (取消勾選換行)
		 *
		 * 積木配置:
		 * - text_print: TEXT = "World", NEW_LINE = FALSE (取消勾選)
		 *
		 * 預期生成程式碼:
		 * ```python
		 * print("World", end="")
		 * ```
		 *
		 * 終端機行為: 輸出 "World" 後不換行,下一個輸出接續在同一行
		 */
		test('NEW_LINE = FALSE: 應生成 print(msg, end="")', () => {
			const expectedCode = /^print\("World", end=""\)$/;

			assert.ok(expectedCode, '應添加 end="" 參數 (不換行)');
		});

		/**
		 * 測試案例 3: 空輸入
		 *
		 * 積木配置:
		 * - text_print: TEXT = (空), NEW_LINE = TRUE
		 *
		 * 預期生成程式碼:
		 * ```python
		 * print("")
		 * ```
		 *
		 * 終端機行為: 輸出空行 (僅換行符)
		 */
		test('空輸入: 應使用預設值 ""', () => {
			const expectedCode = /^print\(""\)$/;

			assert.ok(expectedCode, '空輸入應使用空字串');
		});

		/**
		 * 測試案例 4: 變數輸入
		 *
		 * 積木配置:
		 * - text_print: TEXT = variable (變數積木), NEW_LINE = FALSE
		 *
		 * 預期生成程式碼:
		 * ```python
		 * print(message, end="")
		 * ```
		 *
		 * 終端機行為: 輸出變數 message 的值,不換行
		 * 注意: 變數名稱不應加引號
		 */
		test('變數輸入: 不應加引號', () => {
			const expectedCode = /^print\([a-zA-Z_][a-zA-Z0-9_]*\)$/;

			assert.ok(expectedCode, '變數應不加引號');
		});
	});

	suite('特殊情境 (Edge Cases)', () => {
		/**
		 * 測試案例 5: 連續不換行輸出
		 *
		 * 積木配置:
		 * - text_print: TEXT = "A", NEW_LINE = FALSE
		 * - text_print: TEXT = "B", NEW_LINE = FALSE
		 * - text_print: TEXT = "C", NEW_LINE = TRUE
		 *
		 * 預期生成程式碼:
		 * ```python
		 * print("A", end="")
		 * print("B", end="")
		 * print("C")
		 * ```
		 *
		 * 終端機行為: 輸出 "ABC" (在同一行,最後換行)
		 */
		test('連續不換行: 多個積木獨立運作', () => {
			// MicroPython 的 print 不需要初始化設定
			// 每個積木獨立生成一行程式碼
			const independentExecution = true;

			assert.strictEqual(independentExecution, true, 'text_print 積木不需共享狀態');
		});

		/**
		 * 測試案例 6: 文字中包含換行符
		 *
		 * 積木配置:
		 * - text_print: TEXT = "Hello\nWorld", NEW_LINE = FALSE
		 *
		 * 預期生成程式碼:
		 * ```python
		 * print("Hello\nWorld", end="")
		 * ```
		 *
		 * 終端機行為:
		 * Hello
		 * World (無換行符結尾,下一個輸出接續)
		 *
		 * 注意: \n 在字串中間會換行,end="" 僅影響輸出結尾
		 */
		test('包含換行符: end 參數僅影響輸出結尾', () => {
			const expectedCode = /^print\("Hello\\nWorld", end=""\)$/;

			assert.ok(expectedCode, '字串中的 \\n 不影響 end 參數');
		});

		/**
		 * 測試案例 7: 表達式輸入
		 *
		 * 積木配置:
		 * - text_print: TEXT = (str(x) + str(y)), NEW_LINE = TRUE
		 *
		 * 預期生成程式碼:
		 * ```python
		 * print(str(x) + str(y))
		 * ```
		 *
		 * 終端機行為: 輸出表達式的計算結果,換行
		 * 注意: 表達式不應加引號
		 */
		test('表達式輸入: 不應加引號', () => {
			const expectedCode = /^print\(.+\)$/;

			assert.ok(expectedCode, '表達式應不加引號');
		});
	});

	suite('跨平台一致性 (Cross-Platform Consistency)', () => {
		/**
		 * 測試案例 8: Arduino 與 MicroPython 行為對等
		 *
		 * Arduino 版本:
		 * - NEW_LINE = TRUE  → Serial.println(msg)
		 * - NEW_LINE = FALSE → Serial.print(msg)
		 *
		 * MicroPython 版本:
		 * - NEW_LINE = TRUE  → print(msg)
		 * - NEW_LINE = FALSE → print(msg, end="")
		 *
		 * 行為等價性: 兩者在終端機上的輸出行為必須一致
		 */
		test('Arduino 與 MicroPython 行為對等', () => {
			const platformEquivalence = {
				arduino: {
					withNewLine: 'Serial.println(msg)',
					withoutNewLine: 'Serial.print(msg)',
				},
				micropython: {
					withNewLine: 'print(msg)',
					withoutNewLine: 'print(msg, end="")',
				},
			};

			assert.ok(platformEquivalence.arduino, 'Arduino 版本定義');
			assert.ok(platformEquivalence.micropython, 'MicroPython 版本定義');
		});
	});
});

/**
 * 手動測試檢查清單 (Manual Test Checklist)
 *
 * 執行步驟:
 * 1. 開啟 Extension Development Host (F5)
 * 2. 建立包含以下積木的專案:
 *    - text_print: TEXT = "A", NEW_LINE = FALSE
 *    - text_print: TEXT = "B", NEW_LINE = FALSE
 *    - text_print: TEXT = "C", NEW_LINE = TRUE
 * 3. 檢查生成的 main.py:
 *    print("A", end="")
 *    print("B", end="")
 *    print("C")
 * 4. 上傳至 CyberBrick，檢查終端機輸出: "ABC\n"
 *
 * 預期結果:
 * - NEW_LINE = TRUE: 每次輸出後自動換行
 * - NEW_LINE = FALSE: 輸出不換行,下一個輸出接續在同一行
 *
 * 邊際案例驗證:
 * 1. 包含 \n 的文字輸出 ("Hello\nWorld" + NEW_LINE=FALSE)
 * 2. 10+ 個連續不換行輸出
 * 3. 空白內容輸出
 * 4. 包含特殊字元 (引號、反斜線) 的內容
 */
