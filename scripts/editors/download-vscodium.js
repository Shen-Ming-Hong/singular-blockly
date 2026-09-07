'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const version = '1.126.04524';
const platform = `${process.platform}-${process.arch}`;
const targets = {
  'darwin-arm64': ['zip', 'VSCodium.app/Contents/MacOS/VSCodium'],
  'darwin-x64': ['zip', 'VSCodium.app/Contents/MacOS/VSCodium'],
  'linux-x64': ['tar.gz', 'codium'],
  'win32-x64': ['zip', 'VSCodium.exe'],
};

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!response.ok) { throw new Error(`Download failed: ${response.status} ${url}`); }
  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const target = targets[platform];
  if (!target) { throw new Error(`Unsupported VSCodium test platform: ${platform}`); }
  const [extension, executable] = target;
  const directory = path.join(process.env.RUNNER_TEMP || os.tmpdir(), `singular-blockly-codium-${version}-${platform}`);
  fs.mkdirSync(directory, { recursive: true });
  const filename = `VSCodium-${platform}-${version}.${extension}`;
  const url = `https://github.com/VSCodium/vscodium/releases/download/${version}/${filename}`;
  const [bytes, checksum] = await Promise.all([download(url), download(`${url}.sha256`)]);
  const expected = checksum.toString('utf8').match(/^[a-fA-F0-9]{64}\b/)?.[0].toLowerCase();
  if (!expected || crypto.createHash('sha256').update(bytes).digest('hex') !== expected) {
    throw new Error(`SHA-256 mismatch: ${filename}`);
  }
  const archive = path.join(directory, filename);
  fs.writeFileSync(archive, bytes);
  if (process.platform === 'darwin') {
    execFileSync('ditto', ['-x', '-k', archive, directory], { stdio: 'inherit' });
  } else if (process.platform === 'win32') {
    execFileSync('tar', ['-xf', archive, '-C', directory], { stdio: 'inherit' });
  } else {
    execFileSync('tar', ['-xzf', archive, '-C', directory], { stdio: 'inherit' });
  }
  const executablePath = path.join(directory, executable);
  if (!fs.statSync(executablePath).isFile()) { throw new Error('VSCodium executable missing'); }
  if (process.env.GITHUB_ENV) {
    fs.appendFileSync(process.env.GITHUB_ENV, `VSCODE_EXECUTABLE_PATH=${executablePath}\n`);
  }
  process.stdout.write(`VSCodium ${version}: ${executablePath}\nSHA-256: ${expected}\n`);
}

main().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
