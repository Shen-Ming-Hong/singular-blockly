/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 檢查貢獻者技能（.github/skills）與它們在 .agents/skills、.claude/skills 的連結。
 *
 * - 每個 .github/skills/<name> 在 .agents/skills 與 .claude/skills 都有指向它的相對 symlink
 * - .claude/skills/speckit-* 指向 .agents/skills/speckit-*
 * - SKILL.md frontmatter 的 name 等於資料夾名，description 非空且不超過 1024 字元
 * - 技能 Markdown 內的相對連結都存在
 * - SKILL.md 與 references/lessons.md 不超過大小上限，lessons.md 沒有重複標題
 *
 * symlink 以 git index 判斷（mode 120000 與 blob 內容），因此在不支援 symlink 的
 * checkout（例如 Windows、或連結沒有被建立的雲端容器）也能檢查。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOURCE_DIR = '.github/skills';
const LINK_DIRS = ['.agents/skills', '.claude/skills'];
const MAX_DESCRIPTION = 1024;
const MAX_SKILL_BYTES = 32 * 1024;
const MAX_LESSONS_BYTES = 20 * 1024;

function git(args) {
	return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
}

function readIndexEntries(dir) {
	const entries = new Map();
	for (const line of git(['ls-files', '-s', '--', dir]).split('\n')) {
		const match = /^(\d+) ([0-9a-f]+) \d+\t(.+)$/.exec(line);
		if (match) {
			entries.set(match[3], { mode: match[1], sha: match[2] });
		}
	}
	return entries;
}

function readSymlinkTarget(entry) {
	return git(['cat-file', 'blob', entry.sha]).trim();
}

function parseFrontmatter(text) {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
	if (!match) {
		return null;
	}
	const fields = {};
	for (const line of match[1].split(/\r?\n/)) {
		const field = /^([A-Za-z-]+):\s*(.*)$/.exec(line);
		if (field) {
			fields[field[1]] = field[2].replace(/^(['"])(.*)\1$/, '$2').trim();
		}
	}
	return fields;
}

function stripCode(text) {
	return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function findRelativeLinks(text) {
	const links = [];
	const pattern = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
	let match;
	while ((match = pattern.exec(stripCode(text)))) {
		const target = match[1];
		if (/^(https?:|mailto:|#)/i.test(target) || target.startsWith('<')) {
			continue;
		}
		links.push(decodeURI(target.split('#')[0]));
	}
	return links;
}

function listMarkdownFiles(dir) {
	const files = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...listMarkdownFiles(full));
		} else if (entry.name.endsWith('.md')) {
			files.push(full);
		}
	}
	return files;
}

function checkSkills() {
	const errors = [];
	const sourceRoot = path.join(ROOT, SOURCE_DIR);
	const skills = fs
		.readdirSync(sourceRoot, { withFileTypes: true })
		.filter(entry => entry.isDirectory())
		.map(entry => entry.name)
		.sort();

	const agentsIndex = readIndexEntries('.agents/skills');
	const linkIndexes = new Map(LINK_DIRS.map(dir => [dir, dir === '.agents/skills' ? agentsIndex : readIndexEntries(dir)]));

	for (const skill of skills) {
		for (const dir of LINK_DIRS) {
			const linkPath = `${dir}/${skill}`;
			const entry = linkIndexes.get(dir).get(linkPath);
			const expected = `../../${SOURCE_DIR}/${skill}`;
			if (!entry) {
				errors.push(`${linkPath}: 缺少指向 ${expected} 的 symlink`);
			} else if (entry.mode !== '120000') {
				errors.push(`${linkPath}: 應該是 symlink（mode 120000），實際是 ${entry.mode}`);
			} else if (readSymlinkTarget(entry) !== expected) {
				errors.push(`${linkPath}: 指向 ${readSymlinkTarget(entry)}，應指向 ${expected}`);
			}
		}

		const skillDir = path.join(sourceRoot, skill);
		const skillFile = path.join(skillDir, 'SKILL.md');
		if (!fs.existsSync(skillFile)) {
			errors.push(`${SOURCE_DIR}/${skill}: 缺少 SKILL.md`);
			continue;
		}
		const text = fs.readFileSync(skillFile, 'utf8');
		const frontmatter = parseFrontmatter(text);
		if (!frontmatter) {
			errors.push(`${SOURCE_DIR}/${skill}/SKILL.md: 缺少 frontmatter`);
		} else {
			if (frontmatter.name !== skill) {
				errors.push(`${SOURCE_DIR}/${skill}/SKILL.md: name「${frontmatter.name || ''}」應等於資料夾名「${skill}」`);
			}
			const description = frontmatter.description || '';
			if (!description) {
				errors.push(`${SOURCE_DIR}/${skill}/SKILL.md: description 不可為空`);
			} else if ([...description].length > MAX_DESCRIPTION) {
				errors.push(`${SOURCE_DIR}/${skill}/SKILL.md: description 超過 ${MAX_DESCRIPTION} 字元`);
			}
		}
		if (Buffer.byteLength(text) > MAX_SKILL_BYTES) {
			errors.push(`${SOURCE_DIR}/${skill}/SKILL.md: ${Buffer.byteLength(text)} bytes，超過 ${MAX_SKILL_BYTES}；把細節移到 references/`);
		}

		const lessonsFile = path.join(skillDir, 'references', 'lessons.md');
		if (fs.existsSync(lessonsFile)) {
			const lessons = fs.readFileSync(lessonsFile, 'utf8');
			if (Buffer.byteLength(lessons) > MAX_LESSONS_BYTES) {
				errors.push(`${SOURCE_DIR}/${skill}/references/lessons.md: 超過 ${MAX_LESSONS_BYTES} bytes；先合併相近條目`);
			}
			const seen = new Set();
			for (const heading of lessons.match(/^##\s+.+$/gm) || []) {
				const key = heading.replace(/\s+/g, ' ').trim();
				if (seen.has(key)) {
					errors.push(`${SOURCE_DIR}/${skill}/references/lessons.md: 重複標題「${key}」`);
				}
				seen.add(key);
			}
		}

		for (const file of listMarkdownFiles(skillDir)) {
			for (const link of new Set(findRelativeLinks(fs.readFileSync(file, 'utf8')))) {
				if (!fs.existsSync(path.resolve(path.dirname(file), link))) {
					errors.push(`${path.relative(ROOT, file)}: 連結 ${link} 不存在`);
				}
			}
		}
	}

	const claudeIndex = linkIndexes.get('.claude/skills');
	const speckitSkills = new Set();
	for (const file of agentsIndex.keys()) {
		const match = /^\.agents\/skills\/(speckit-[^/]+)\/SKILL\.md$/.exec(file);
		if (match) {
			speckitSkills.add(match[1]);
		}
	}
	for (const skill of speckitSkills) {
		const linkPath = `.claude/skills/${skill}`;
		const entry = claudeIndex.get(linkPath);
		const expected = `../../.agents/skills/${skill}`;
		if (!entry || entry.mode !== '120000' || readSymlinkTarget(entry) !== expected) {
			errors.push(`${linkPath}: 應是指向 ${expected} 的 symlink`);
		}
	}

	for (const [dir, index] of linkIndexes) {
		for (const [file, entry] of index) {
			const name = file.slice(dir.length + 1).split('/')[0];
			if (entry.mode === '120000' && !skills.includes(name) && !speckitSkills.has(name)) {
				errors.push(`${file}: 指向不存在的技能 ${readSymlinkTarget(entry)}`);
			}
		}
	}

	return { skills, speckitSkills: [...speckitSkills], errors };
}

if (require.main === module) {
	const { skills, speckitSkills, errors } = checkSkills();
	if (errors.length > 0) {
		for (const error of errors) {
			process.stderr.write(`✗ ${error}\n`);
		}
		process.stderr.write(`\n貢獻者技能檢查失敗：${errors.length} 個問題\n`);
		process.exit(1);
	}
	process.stdout.write(`✓ ${skills.length} 個貢獻者技能、${speckitSkills.length} 個 Spec Kit 連結檢查通過\n`);
}

module.exports = { checkSkills, findRelativeLinks, parseFrontmatter };
