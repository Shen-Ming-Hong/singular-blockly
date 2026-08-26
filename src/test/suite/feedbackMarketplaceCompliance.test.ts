/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Feedback Marketplace compliance contract', () => {
	const root = path.resolve(__dirname, '../../..');
	const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
	const manifest = JSON.parse(read('package.json'));

	test('publishes valid homepage and support resources in the manifest', () => {
		assert.match(manifest.homepage, /^https:\/\//);
		assert.strictEqual(manifest.bugs.url, 'https://blockly-support.singular-ai.org/support');
		assert.ok(manifest.contributes.menus['issue/reporter'].some((item: any) => item.command === 'singular-blockly.provideFeedback'));
	});

	test('uses an accessible Blockly product entry instead of a generic editor-title icon', () => {
		const editorTitle = manifest.contributes.menus['editor/title'] || [];
		assert.ok(!editorTitle.some((item: any) => item.command === 'singular-blockly.provideFeedback'));

		const html = read('media/html/blocklyEdit.html');
		const script = read('media/js/blocklyEdit.js');
		const styles = read('media/css/blocklyEdit.css');
		assert.match(html, /id="provideFeedbackButton"[^>]*class="feedback-entry-button"[^>]*aria-label=""/);
		assert.match(html, /class="feedback-entry-icon"/);
		assert.doesNotMatch(html, /id="provideFeedbackButtonLabel"/);
		assert.match(script, /getMessage\('FEEDBACK_PROVIDE_ACTION', 'Provide feedback'\)/);
		assert.match(script, /provideFeedbackButton\.setAttribute\('aria-label', label\)/);
		assert.match(script, /vscode\.postMessage\(\{ command: 'provideFeedback' \}\)/);
		assert.match(styles, /\.feedback-entry-button\s*\{[\s\S]*border-radius:\s*50%[\s\S]*var\(--editor-primary-action-bg/);
		assert.match(styles, /\.controls-container\s*\{[\s\S]*flex-wrap:\s*wrap/);
	});

	test('links online services, privacy, support, terms, and security from README', () => {
		const readme = read('README.md');
		for (const required of ['Online Services', 'PRIVACY.md', 'SUPPORT.md', 'TERMS.md', 'SECURITY.md', 'not telemetry']) {
			assert.ok(readme.includes(required), `README is missing ${required}`);
		}
	});

	test('privacy policy covers every required data lifecycle topic', () => {
		const privacy = read('PRIVACY.md');
		for (const required of ['收集的資料', 'Cloudflare', 'GitHub', '跨境', '保存', '刪除', '備份', '去識別化', '兒童與學生', '聯絡方式']) {
			assert.ok(privacy.includes(required), `PRIVACY.md is missing ${required}`);
		}
	});

	test('shows processors, retention, deletion, backups, owner approval, and student privacy before confirmation', () => {
		const english = read('media/locales/en/messages.js');
		for (const required of ['Cloudflare D1/R2', 'private GitHub', 'until you delete', 'backups', 'project-owner approval', 'student information']) {
			assert.ok(english.includes(required), `Feedback UI disclosure is missing ${required}`);
		}
		const html = read('media/html/feedback.html');
		assert.ok(html.indexOf('serviceDisclosure') < html.indexOf('confirmButton'));
		assert.ok(html.indexOf('personalDataWarning') < html.indexOf('reviewButton'));
	});

	test('keeps Worker and maintainer assets outside the VSIX while including public policies', () => {
		const ignore = read('.vscodeignore');
		for (const denied of ['**/workers/**', '**/.github/**', '**/scripts/**']) {
			assert.ok(ignore.includes(denied));
		}
		for (const included of ['!PRIVACY.md', '!SUPPORT.md', '!TERMS.md']) {
			assert.ok(ignore.includes(included));
		}
	});

	test('keeps release workflow shell blocks valid, preserves runtime dependencies, and verifies VSIX privacy', () => {
		for (const workflow of ['.github/workflows/ci.yml', '.github/workflows/runtime-installation.yml']) {
			const source = read(workflow);
			assert.ok(!source.includes('\t'), `${workflow} must not contain YAML tab indentation`);
			assert.match(source, /vsce package --out/);
			assert.doesNotMatch(source, /vsce package --no-dependencies/);
			assert.match(source, /npm run feedback:verify-vsix --/);
		}
	});

	test('disables broad Worker observability so raw requests are not retained as product logs', () => {
		const workerConfig = read('workers/feedback/wrangler.jsonc');
		assert.match(workerConfig, /"observability"\s*:\s*\{\s*"enabled"\s*:\s*false\s*\}/);
	});
});
