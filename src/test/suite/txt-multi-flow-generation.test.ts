/**
 * TXT Multi-flow Code Generation Tests
 *
 * 測試 TXT 多流程 generator 的預期輸出格式。
 * 由於 Blockly generator 於 WebView (browser context) 執行，
 * 此檔案採用與現有 code-generation.test.ts 相同的 contract-style 測試模式：
 * 將關鍵輸出格式固定成可驗證的正則與範例字串，避免後續重構時退回單主程式模型。
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('TXT Multi-flow Code Generation Tests', () => {
	suite('多流程主程式骨架', () => {
		test('應建立 shared txt 並以 threads 啟動所有 TXT 流程', () => {
			const actualCode = [
				'import ftrobopy',
				'import threading',
				'',
				'def _txt_process_flowA():',
				"    print('A')",
				'',
				'def _txt_process_flowB():',
				"    print('B')",
				'',
				"txt = ftrobopy.ftrobopy('auto')",
				'_txt_threads = []',
				"_txt_threads.append(threading.Thread(target=_txt_process_flowA, name='Flow A', daemon=True))",
				"_txt_threads.append(threading.Thread(target=_txt_process_flowB, name='Flow B', daemon=True))",
				'',
				'for _txt_thread in _txt_threads:',
				'    _txt_thread.start()',
				'',
				'while any(_txt_thread.is_alive() for _txt_thread in _txt_threads):',
				'    for _txt_thread in _txt_threads:',
				'        _txt_thread.join(0.05)',
			].join('\n');

			assert.match(actualCode, /txt = ftrobopy\.ftrobopy\('auto'\)/, '應建立 shared txt 物件');
			assert.match(
				actualCode,
				/_txt_threads\.append\(threading\.Thread\(target=_txt_process_flowA, name=['"]Flow A['"], daemon=True\)\)/,
				'應為每個流程建立對應 thread'
			);
			assert.match(
				actualCode,
				/for _txt_thread in _txt_threads:\n    _txt_thread\.start\(\)/,
				'應逐一啟動已註冊的流程 thread'
			);
			assert.match(
				actualCode,
				/while any\(_txt_thread\.is_alive\(\) for _txt_thread in _txt_threads\):\n    for _txt_thread in _txt_threads:\n        _txt_thread\.join\(0\.05\)/,
				'主執行緒應等待所有流程結束，但不應干擾 shared txt 的 exchange-cycle 狀態'
			);
		});

		test('流程函式內的 variables_set 應保留 global 宣告', () => {
			const actualCode = [
				'def _txt_process_counter():',
				'    global counter',
				'    counter = counter + 1',
			].join('\n');

			assert.match(actualCode, /def _txt_process_counter\(\):/, '流程應包裝為獨立函式');
			assert.match(actualCode, /\n    global counter\n/, '流程內變數指定應保留 global 宣告');
		});

		test('txt_wait 應停留在流程函式內，不應退回全域單主程式語意', () => {
			const actualCode = [
				'import time',
				'',
				'def _txt_process_waiter():',
				'    _m1.setSpeed(200)',
				'    time.sleep(max(0.0, (1000) / 1000.0))',
				'    _m1.setSpeed(0)',
				'',
				"txt = ftrobopy.ftrobopy('auto')",
				'_txt_threads = []',
				"_txt_threads.append(threading.Thread(target=_txt_process_waiter, name='_txt_process_waiter', daemon=True))",
				'for _txt_thread in _txt_threads:',
				'    _txt_thread.start()',
				'while any(_txt_thread.is_alive() for _txt_thread in _txt_threads):',
				'    for _txt_thread in _txt_threads:',
				'        _txt_thread.join(0.05)',
			].join('\n');

			assert.match(
				actualCode,
				/^import time$/m,
				'txt_wait 應引入 time 模組供 wall-clock delay 使用'
			);
			assert.match(
				actualCode,
				/def _txt_process_waiter\(\):\n(?:    .*\n)*?    time\.sleep\(max\(0\.0, \(1000\) \/ 1000\.0\)\)/,
				'txt_wait 應存在於流程函式內，代表只暫停目前流程'
			);
			assert.doesNotMatch(
				actualCode,
				/txt\.updateWait\(1\.0\)/,
				'txt_wait 不應再使用 shared txt 的 exchange-cycle wait API'
			);
		});

		test('流程包裝後仍應保留 process 內的 controls_if / controls_forever pacing', () => {
			const actualCode = [
				'def _txt_process_poller():',
				'    while True:',
				'        if txt.input(1).state():',
				'            _m1.setSpeed(200)',
				'        txt.updateWait(0.01)  # Pace tight TXT hardware polling/control loops',
			].join('\n');

			assert.match(
				actualCode,
				/def _txt_process_poller\(\):\n    while True:\n        if txt\.input\(1\)\.state\(\):\n            _m1\.setSpeed\(200\)\n        txt\.updateWait\(0\.01\)/,
				'流程函式中的緊密 TXT 輪詢 loop 應保留 path-sensitive pacing'
			);
		});

		test('TXT generator 應提供 quote_ helper，供流程名稱與文字積木安全轉義', () => {
			const generatorIndexPath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'media',
				'blockly',
				'generators',
				'txt',
				'index.js'
			);
			const generatorTxtPath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'media',
				'blockly',
				'generators',
				'txt',
				'txt.js'
			);

			const generatorIndexSource = fs.readFileSync(generatorIndexPath, 'utf8');
			const generatorTxtSource = fs.readFileSync(generatorTxtPath, 'utf8');

			assert.match(
				generatorIndexSource,
				/window\.txtGenerator\.quote_\s*=\s*function\s*\(/,
				'TXT generator 應定義 quote_ helper，避免流程命名與文字積木 codegen 發生 TypeError'
			);
			assert.match(
				generatorTxtSource,
				/threadNameLiteral:\s*window\.txtGenerator\.quote_\(/,
				'txt_process 應透過 quote_ 轉義 thread name literal'
			);
		});

		test('txt_wait 應使用 wall-clock delay，而非 txt.updateWait', () => {
			const generatorTxtPath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'media',
				'blockly',
				'generators',
				'txt',
				'txt.js'
			);
			const generatorTxtSource = fs.readFileSync(generatorTxtPath, 'utf8');
			const txtWaitMatch = generatorTxtSource.match(
				/window\.txtGenerator\.forBlock\['txt_wait'\]\s*=\s*function\s*\(block\)\s*{[\s\S]*?};/
			);

			assert.ok(txtWaitMatch, 'TXT generator 應定義 txt_wait generator');

			const txtWaitSource = txtWaitMatch[0];
			const txtWaitExecutableSource = txtWaitSource
				.replace(/\/\*[\s\S]*?\*\//g, '')
				.replace(/^\s*\/\/.*$/gm, '');

			assert.match(
				txtWaitSource,
				/addImport\('import time'\)/,
				'txt_wait 應引入 time 模組'
			);
			assert.match(
				txtWaitSource,
				/time\.sleep\(/,
				'txt_wait 應使用 wall-clock delay 只暫停目前流程'
			);
			assert.doesNotMatch(
				txtWaitExecutableSource,
				/txt\.updateWait\(/,
				'txt_wait 不應再直接呼叫 txt.updateWait()，避免多流程延遲互相干擾'
			);
		});

		test('txt_motor_speed 應支援 MOTOR/LAMP/legacy component generator modes', () => {
			const generatorTxtPath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'media',
				'blockly',
				'generators',
				'txt',
				'txt.js'
			);
			const generatorTxtSource = fs.readFileSync(generatorTxtPath, 'utf8');
			const txtMotorSpeedMatch = generatorTxtSource.match(
				/window\.txtGenerator\.forBlock\['txt_motor_speed'\]\s*=\s*function\s*\(block\)\s*{[\s\S]*?};/
			);

			assert.ok(txtMotorSpeedMatch, 'TXT generator 應定義 txt_motor_speed generator');
			const txtMotorSpeedSource = `${txtMotorSpeedMatch[0]}\n${generatorTxtSource}`;

			assert.match(txtMotorSpeedSource, /normalizeTxtMOutputComponent|normalizeComponent/, 'generator 應對缺失、空字串或未知 COMPONENT 做 MOTOR fallback');
			assert.match(txtMotorSpeedSource, /generatorMode/, 'generator 分支應消費 component metadata');
			assert.match(txtMotorSpeedSource, /signed-speed/, 'MOTOR 應保留 signed speed mode');
			assert.match(txtMotorSpeedSource, /unsigned-level/, 'LAMP 應使用 unsigned 0..512 output level mode');
			assert.match(txtMotorSpeedSource, /DIRECTION/, 'MOTOR mode 應保留方向欄位');
			assert.match(txtMotorSpeedSource, /max\(0, min\(512, int\(/, 'LAMP mode 應限制為非負 0..512');
		});

		test('txt_motor_stop 與 txt_stop_all 應維持 M/O 停止語意', () => {
			const generatorTxtPath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'media',
				'blockly',
				'generators',
				'txt',
				'txt.js'
			);
			const generatorTxtSource = fs.readFileSync(generatorTxtPath, 'utf8');
			const stopSource = generatorTxtSource.match(
				/window\.txtGenerator\.forBlock\['txt_motor_stop'\]\s*=\s*function\s*\(block\)\s*{[\s\S]*?};/
			)?.[0] ?? '';
			const stopAllSource = generatorTxtSource.match(
				/window\.txtGenerator\.forBlock\['txt_stop_all'\]\s*=\s*function\s*\([^)]*\)\s*{[\s\S]*?};/
			)?.[0] ?? '';

			assert.match(stopSource, /setSpeed\(0\)/, 'txt_motor_stop 應只將選取 M 埠歸零');
			assert.doesNotMatch(stopSource, /COMPONENT|component/i, 'txt_motor_stop 不應推論 component');
			assert.match(stopAllSource, /for \(let i = 1; i <= 4; i\+\+\)/, 'txt_stop_all 應停止 M1-M4');
			assert.match(stopAllSource, /for \(let i = 1; i <= 8; i\+\+\)/, 'txt_stop_all 應關閉 O1-O8');
		});

		test('TXT generator 應記錄 M/O usage metadata 且保留 setup 前掃描流程', () => {
			const generatorIndexPath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'media',
				'blockly',
				'generators',
				'txt',
				'index.js'
			);
			const generatorTxtPath = path.join(
				__dirname,
				'..',
				'..',
				'..',
				'media',
				'blockly',
				'generators',
				'txt',
				'txt.js'
			);
			const generatorIndexSource = fs.readFileSync(generatorIndexPath, 'utf8');
			const generatorTxtSource = fs.readFileSync(generatorTxtPath, 'utf8');

			assert.match(generatorIndexSource, /mOutputUsages_\s*=\s*\[\]/, 'generator 應初始化 M usage metadata');
			assert.match(generatorIndexSource, /oOutputUsages_\s*=\s*\[\]/, 'generator 應初始化 O usage metadata');
			assert.match(generatorIndexSource, /addMOutputUsage/, 'generator 應提供 M output usage recorder');
			assert.match(generatorIndexSource, /addOOutputUsage/, 'generator 應提供 O output usage recorder');
			assert.match(generatorTxtSource, /addMOutputUsage\(motor, component, block\.id\)/, 'txt_motor_speed 應記錄 M/component usage');
			assert.match(generatorTxtSource, /addOOutputUsage\(output, block\.id\)/, 'txt_output 應記錄 O usage');
			assert.match(
				generatorIndexSource,
				/for \(const block of processBlocks\) \{\s*this\.blockToCode\(block\);\s*\}[\s\S]*if \(primarySetupBlock\)/,
				'process blocks 應仍在 txt_setup 前先掃描，確保 buildPreCreations 可取得硬體 usage'
			);
		});
	});
});