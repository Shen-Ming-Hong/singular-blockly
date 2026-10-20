/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 依 webpack source map 產生 dist/THIRD_PARTY_NOTICES.md
 *
 * dist/extension.js 會把第三方套件打包進單一檔案，套件原本的 LICENSE 不會跟著出貨。
 * 這支腳本從 source map 找出被打包的套件，連同其生產相依（例如 tar 已預先打包了自己的相依），
 * 收集名稱、版本、授權與授權全文，供 VSIX 一併散布。
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT, 'dist');
const SOURCE_MAP = path.join(DIST_DIR, 'extension.js.map');
const OUTPUT = path.join(DIST_DIR, 'THIRD_PARTY_NOTICES.md');
const LICENSE_FILE_PATTERN = /^(licen[sc]e|copying)(\.(md|txt|markdown))?$/i;

function packageNameFromSource(source) {
	const match = source.match(/node_modules\/((?:@[^/]+\/)?[^/]+)\/(?!.*node_modules\/)/);
	return match ? { name: match[1], prefix: source.slice(0, match.index + match[0].length - 1) } : undefined;
}

function sourceToDirectory(prefix) {
	return path.join(ROOT, prefix.replace(/^webpack:\/\/[^/]+\/\.\//, ''));
}

function resolvePackageDirectory(name, fromDirectory) {
	let current = fromDirectory;
	while (true) {
		const candidate = path.join(current, 'node_modules', name);
		if (fs.existsSync(path.join(candidate, 'package.json'))) {
			return candidate;
		}
		const parent = path.dirname(current);
		if (parent === current) {
			return undefined;
		}
		current = parent;
	}
}

function readLicenseText(directory) {
	const licenseFile = fs.readdirSync(directory).find(name => LICENSE_FILE_PATTERN.test(name));
	return licenseFile ? fs.readFileSync(path.join(directory, licenseFile), 'utf8').trim() : undefined;
}

function describeLicense(pkg) {
	if (typeof pkg.license === 'string') {
		return pkg.license;
	}
	if (pkg.license && pkg.license.type) {
		return pkg.license.type;
	}
	if (Array.isArray(pkg.licenses)) {
		return pkg.licenses.map(entry => entry.type || entry).join(' OR ');
	}
	return 'UNKNOWN';
}

function collectBundledPackages() {
	if (!fs.existsSync(SOURCE_MAP)) {
		throw new Error(`Missing ${path.relative(ROOT, SOURCE_MAP)}; run "npm run package" first.`);
	}
	const { sources } = JSON.parse(fs.readFileSync(SOURCE_MAP, 'utf8'));
	const packages = new Map();
	const queue = [];

	for (const source of sources) {
		const found = packageNameFromSource(source);
		if (found) {
			queue.push(sourceToDirectory(found.prefix));
		}
	}

	while (queue.length > 0) {
		const directory = fs.realpathSync(queue.shift());
		if (packages.has(directory)) {
			continue;
		}
		const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
		packages.set(directory, {
			name: pkg.name,
			version: pkg.version,
			license: describeLicense(pkg),
			homepage: pkg.homepage || (pkg.repository && (pkg.repository.url || pkg.repository)) || '',
			licenseText: readLicenseText(directory),
		});
		for (const dependency of Object.keys(pkg.dependencies || {})) {
			const dependencyDirectory = resolvePackageDirectory(dependency, directory);
			if (dependencyDirectory) {
				queue.push(dependencyDirectory);
			}
		}
	}

	return [...packages.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function render(packages) {
	const lines = [
		'# Third-Party Notices',
		'',
		'`dist/extension.js` bundles the following third-party packages. Their license',
		'terms are reproduced below. Packages shipped under `node_modules/` in the VSIX',
		'keep their own license files, and runtime components downloaded after',
		'installation are listed in `dist/managed-runtime/THIRD_PARTY_NOTICES.md`.',
		'',
		'| Package | Version | License |',
		'| --- | --- | --- |',
		...packages.map(pkg => `| ${pkg.name} | ${pkg.version} | ${pkg.license} |`),
		'',
	];

	for (const pkg of packages) {
		lines.push(`## ${pkg.name}@${pkg.version}`, '');
		lines.push(`License: ${pkg.license}`);
		if (pkg.homepage) {
			lines.push(`Source: ${String(pkg.homepage).replace(/^git\+/, '')}`);
		}
		lines.push('');
		if (pkg.licenseText) {
			lines.push('```text', pkg.licenseText, '```', '');
		} else {
			lines.push(`No license file is included in the package; it is distributed under ${pkg.license}.`, '');
		}
	}

	return `${lines.join('\n').trimEnd()}\n`;
}

try {
	const packages = collectBundledPackages();
	const missing = packages.filter(pkg => pkg.license === 'UNKNOWN');
	if (missing.length > 0) {
		throw new Error(`Bundled packages without a declared license: ${missing.map(pkg => pkg.name).join(', ')}`);
	}
	fs.writeFileSync(OUTPUT, render(packages));
	console.log(`Wrote ${path.relative(ROOT, OUTPUT)} (${packages.length} packages).`);
} catch (error) {
	console.error(`Failed to generate third-party notices: ${error.message}`);
	process.exitCode = 1;
}
