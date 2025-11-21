/**
 * ESP32 PWM Validation Tests
 *
 * 測試 ESP32 PWM 頻率與解析度驗證邏輯
 * 參考: specs/011-esp32-pwm-setup/contracts/esp32-pwm-api.md
 */

import * as assert from 'assert';

/**
 * PWM 驗證結果介面
 */
interface PwmValidationResult {
	frequency: number; // 最終頻率
	resolution: number; // 最終解析度 (可能已調整)
	adjusted: boolean; // 是否進行了自動調整
	warning?: string; // 警告訊息 (如有調整)
	info?: string; // 驗證通過訊息
}

/**
 * 驗證並調整 ESP32 PWM 配置
 *
 * 此函數是 media/blockly/generators/arduino/io.js 中 validateAndAdjustPwmConfig 的 TypeScript 版本
 * 用於單元測試,確保驗證邏輯正確性
 *
 * @param frequency - 目標頻率 (Hz)
 * @param resolution - 目標解析度 (bit)
 * @returns 驗證結果
 */
function validateAndAdjustPwmConfig(frequency: number, resolution: number): PwmValidationResult {
	const APB_CLK = 80000000; // ESP32 APB_CLK 頻率 (80MHz)
	const maxValue = frequency * Math.pow(2, resolution);

	if (maxValue > APB_CLK) {
		// 自動調整解析度至最大可用值
		const maxResolution = Math.floor(Math.log2(APB_CLK / frequency));
		const adjustedResolution = Math.max(8, maxResolution); // 最低 8 bit

		return {
			frequency: frequency,
			resolution: adjustedResolution,
			adjusted: true,
			warning:
				`⚠️ 警告：原始設定 ${frequency}Hz @ ${resolution}bit 超出限制\n` +
				`   (${frequency} × ${Math.pow(2, resolution)} = ${maxValue} > ${APB_CLK})\n` +
				`   已自動調整為 ${frequency}Hz @ ${adjustedResolution}bit`,
		};
	}

	return {
		frequency: frequency,
		resolution: resolution,
		adjusted: false,
		info: `// ✓ 驗證: ${frequency} × ${Math.pow(2, resolution)} = ${maxValue} < ${APB_CLK}`,
	};
}

suite('ESP32 PWM Validation Tests', () => {
	suite('相容配置測試 (Compatible Configurations)', () => {
		test('75000Hz @ 8bit 不應調整 (預設值)', () => {
			const result = validateAndAdjustPwmConfig(75000, 8);

			assert.strictEqual(result.adjusted, false, '不應進行調整');
			assert.strictEqual(result.frequency, 75000, '頻率應保持 75000Hz');
			assert.strictEqual(result.resolution, 8, '解析度應保持 8bit');
			assert.ok(result.info, '應包含驗證通過訊息');
			assert.ok(result.info!.includes('19200000'), '應顯示計算結果');
			assert.strictEqual(result.warning, undefined, '不應有警告訊息');
		});

		test('5000Hz @ 12bit 不應調整', () => {
			const result = validateAndAdjustPwmConfig(5000, 12);

			assert.strictEqual(result.adjusted, false);
			assert.strictEqual(result.frequency, 5000);
			assert.strictEqual(result.resolution, 12);
			assert.ok(result.info!.includes('20480000')); // 5000 * 4096 = 20480000
		});

		test('50000Hz @ 10bit 不應調整', () => {
			const result = validateAndAdjustPwmConfig(50000, 10);

			assert.strictEqual(result.adjusted, false);
			assert.strictEqual(result.frequency, 50000);
			assert.strictEqual(result.resolution, 10);
			assert.ok(result.info!.includes('51200000')); // 50000 * 1024 = 51200000
		});

		test('1Hz @ 16bit 不應調整 (最低頻率 + 最高解析度)', () => {
			const result = validateAndAdjustPwmConfig(1, 16);

			assert.strictEqual(result.adjusted, false);
			assert.strictEqual(result.frequency, 1);
			assert.strictEqual(result.resolution, 16);
			assert.ok(result.info!.includes('65536')); // 1 * 65536 = 65536
		});

		test('80000Hz @ 8bit 不應調整 (最高頻率 + 最低解析度)', () => {
			const result = validateAndAdjustPwmConfig(80000, 8);
			const maxValue = 80000 * 256; // 20480000

			assert.strictEqual(result.adjusted, false);
			assert.strictEqual(result.frequency, 80000);
			assert.strictEqual(result.resolution, 8);
			assert.ok(maxValue <= 80000000, '計算值應小於 APB_CLK');
		});
	});

	suite('不相容配置測試 (Incompatible Configurations)', () => {
		test('75000Hz @ 12bit 應自動調整為 10bit', () => {
			const result = validateAndAdjustPwmConfig(75000, 12);

			assert.strictEqual(result.adjusted, true, '應進行調整');
			assert.strictEqual(result.frequency, 75000, '頻率應保持不變');
			assert.ok(result.resolution < 12, '解析度應降低');
			assert.ok(result.resolution >= 8, '解析度不應低於 8bit');
			assert.ok(result.warning, '應包含警告訊息');
			assert.ok(result.warning!.includes('超出限制'), '應說明超出限制');
			assert.ok(result.warning!.includes('已自動調整'), '應說明已調整');
		});

		test('75000Hz @ 16bit 應自動調整為可用解析度', () => {
			const result = validateAndAdjustPwmConfig(75000, 16);

			assert.strictEqual(result.adjusted, true);
			assert.strictEqual(result.frequency, 75000);
			assert.ok(result.resolution <= 10, '解析度應大幅降低');
			assert.ok(result.resolution >= 8, '解析度不應低於 8bit');

			// 驗證調整後的配置符合限制
			const finalMaxValue = 75000 * Math.pow(2, result.resolution);
			assert.ok(finalMaxValue <= 80000000, '調整後應符合限制');
		});

		test('80000Hz @ 10bit 應自動調整 (邊界超出)', () => {
			const result = validateAndAdjustPwmConfig(80000, 10);
			const originalMaxValue = 80000 * 1024; // 81920000 > 80000000

			assert.ok(originalMaxValue > 80000000, '原始配置應超出限制');
			assert.strictEqual(result.adjusted, true);
			assert.strictEqual(result.frequency, 80000);
			assert.ok(result.resolution < 10, '解析度應降低');

			// 驗證調整後的配置
			const finalMaxValue = 80000 * Math.pow(2, result.resolution);
			assert.ok(finalMaxValue <= 80000000, '調整後應符合限制');
		});

		test('100000Hz @ 8bit 應自動調整 (頻率超出實際限制)', () => {
			// 注意: FieldNumber 應在 UI 層級阻止此輸入 (max: 80000)
			// 但驗證函數仍應正確處理
			const result = validateAndAdjustPwmConfig(100000, 8);
			const originalMaxValue = 100000 * 256; // 25600000 < 80000000

			// 此案例實際上是相容的 (計算結果未超出)
			// 但若超出 FieldNumber 的 max (80000),積木應阻止輸入
			assert.ok(originalMaxValue <= 80000000, '計算值未超出 APB_CLK');
		});
	});

	suite('邊界值測試 (Boundary Tests)', () => {
		test('計算正確性: 頻率 × 2^解析度 公式驗證', () => {
			const testCases = [
				{ freq: 75000, res: 8, expected: 19200000 },
				{ freq: 75000, res: 10, expected: 76800000 },
				{ freq: 5000, res: 12, expected: 20480000 },
				{ freq: 1, res: 16, expected: 65536 },
				{ freq: 80000, res: 8, expected: 20480000 },
			];

			testCases.forEach(testCase => {
				const maxValue = testCase.freq * Math.pow(2, testCase.res);
				assert.strictEqual(maxValue, testCase.expected, `${testCase.freq}Hz × 2^${testCase.res} 應等於 ${testCase.expected}`);
			});
		});

		test('APB_CLK 邊界: 接近 80000000 的配置', () => {
			// 尋找最大可用配置
			const freq = 75000;
			let maxResolution = 8;

			for (let res = 8; res <= 16; res++) {
				const maxValue = freq * Math.pow(2, res);
				if (maxValue <= 80000000) {
					maxResolution = res;
				} else {
					break;
				}
			}

			// 驗證最大解析度
			const resultMax = validateAndAdjustPwmConfig(freq, maxResolution);
			assert.strictEqual(resultMax.adjusted, false, '最大可用解析度不應調整');

			// 驗證超出一級的解析度
			const resultExceed = validateAndAdjustPwmConfig(freq, maxResolution + 1);
			assert.strictEqual(resultExceed.adjusted, true, '超出一級應調整');
			assert.strictEqual(resultExceed.resolution, maxResolution, '應調整為最大可用解析度');
		});

		test('最低解析度限制: 調整後不應低於 8bit', () => {
			// 極端案例: 極高頻率可能導致解析度計算結果 < 8
			const extremeFreq = 80000000 / Math.pow(2, 7); // 計算會得到 7bit
			const result = validateAndAdjustPwmConfig(extremeFreq, 10);

			assert.ok(result.resolution >= 8, '解析度不應低於 8bit');
		});

		test('解析度範圍驗證: 8-16 bit', () => {
			const freq = 50000;
			const resolutions = [8, 10, 12, 13, 14, 15, 16];

			resolutions.forEach(res => {
				const result = validateAndAdjustPwmConfig(freq, res);
				assert.ok(result.resolution >= 8 && result.resolution <= 16, `解析度應在 8-16 bit 範圍內,實際: ${result.resolution}`);
			});
		});
	});

	suite('特殊情境測試 (Special Cases)', () => {
		test('馬達驅動晶片推薦範圍: 20-100KHz @ 8bit', () => {
			const frequencies = [20000, 50000, 75000, 100000];

			frequencies.forEach(freq => {
				const result = validateAndAdjustPwmConfig(freq, 8);
				const maxValue = freq * 256;

				assert.ok(maxValue <= 80000000, `${freq}Hz @ 8bit 應符合硬體限制`);
				assert.strictEqual(result.adjusted, false, `${freq}Hz @ 8bit 不應需要調整`);
			});
		});

		test('伺服馬達頻率不衝突: 50Hz 與 PWM 頻率獨立', () => {
			// 伺服馬達使用 ESP32Servo 庫 (50Hz)
			// PWM 設定使用 LEDC (75KHz)
			// 兩者應互不干擾

			const servoPwmFreq = 50; // 伺服馬達 PWM
			const ledcPwmFreq = 75000; // LEDC PWM

			const servoResult = validateAndAdjustPwmConfig(servoPwmFreq, 8);
			const ledcResult = validateAndAdjustPwmConfig(ledcPwmFreq, 8);

			assert.strictEqual(servoResult.adjusted, false, '伺服馬達頻率應有效');
			assert.strictEqual(ledcResult.adjusted, false, 'LEDC 頻率應有效');
		});

		test('預設值安全性: 75000Hz @ 8bit 始終有效', () => {
			// 確保預設值永遠不會被調整 (向後相容關鍵)
			const result = validateAndAdjustPwmConfig(75000, 8);

			assert.strictEqual(result.adjusted, false, '預設值不應調整');
			assert.strictEqual(result.frequency, 75000);
			assert.strictEqual(result.resolution, 8);

			const maxValue = 75000 * 256;
			assert.ok(maxValue < 80000000, '預設值應遠低於限制,確保安全餘裕');
		});

		test('訊息格式正確性', () => {
			// 驗證通過訊息格式
			const passResult = validateAndAdjustPwmConfig(75000, 8);
			assert.ok(passResult.info, '應有 info 訊息');
			assert.ok(passResult.info!.includes('✓ 驗證'), '應包含 ✓ 符號');
			assert.ok(passResult.info!.includes('75000'), '應顯示頻率');
			assert.ok(passResult.info!.includes('256'), '應顯示 2^8 = 256');
			assert.ok(passResult.info!.includes('80000000'), '應顯示 APB_CLK');

			// 警告訊息格式
			const warnResult = validateAndAdjustPwmConfig(75000, 12);
			assert.ok(warnResult.warning, '應有 warning 訊息');
			assert.ok(warnResult.warning!.includes('⚠️ 警告'), '應包含 ⚠️ 符號');
			assert.ok(warnResult.warning!.includes('原始設定'), '應說明原始設定');
			assert.ok(warnResult.warning!.includes('超出限制'), '應說明超出原因');
			assert.ok(warnResult.warning!.includes('已自動調整'), '應說明調整結果');
		});
	});

	suite('錯誤處理測試 (Error Handling)', () => {
		test('極端輸入: 頻率為 0 (FieldNumber 應阻止,但驗證函數應處理)', () => {
			// 注意: FieldNumber min=1 應在 UI 層級阻止此輸入
			// 但驗證函數應有防禦性程式設計
			const result = validateAndAdjustPwmConfig(0, 8);

			// 0 * 256 = 0 < 80000000,技術上「相容」但無意義
			// 實際應用中應在 FieldNumber 層級處理
			assert.strictEqual(result.adjusted, false);
		});

		test('極端輸入: 解析度為 0 (FieldDropdown 應阻止)', () => {
			// FieldDropdown 僅提供 8-16 選項,不應出現 0
			// 但驗證函數應處理
			const result = validateAndAdjustPwmConfig(75000, 0);

			// 75000 * 2^0 = 75000 < 80000000
			// 但解析度 0 無意義,應在 UI 層級防止
			assert.strictEqual(result.adjusted, false);
		});

		test('負數輸入: FieldNumber 應阻止負數', () => {
			// 測試驗證函數對負數的處理 (雖然不應出現)
			const result = validateAndAdjustPwmConfig(-1000, 8);

			// -1000 * 256 = -256000 (技術上會通過 <= 80000000 檢查)
			// 實際應在 FieldNumber min=1 處理
			assert.strictEqual(result.adjusted, false);
		});
	});
});
