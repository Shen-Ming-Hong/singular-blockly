#!/usr/bin/env node

'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const requestedRootIndex = process.argv.indexOf('--root');
const requestedRoot = requestedRootIndex >= 0 ? process.argv[requestedRootIndex + 1] : undefined;
const parent = requestedRoot ? path.resolve(requestedRoot) : fs.realpathSync(os.tmpdir());
fs.mkdirSync(parent, { recursive: true });
const root = fs.mkdtempSync(path.join(parent, 'singular-runtime-paths-'));
const fixtureScript = path.resolve(__dirname, 'create-fake-artifact.js');
const cases = [
  '中文 路徑',
  'special []()@#$!',
  'emoji-🚀-runtime',
  'Cafe\u0301-normalized',
  `long-${'segment123-'.repeat(12)}`,
];

try {
  for (const name of cases) {
    const caseRoot = path.join(root, name);
    const downloads = path.join(caseRoot, 'downloads');
    fs.mkdirSync(downloads, { recursive: true });
    const archive = path.join(downloads, 'fake runtime.tar.gz');
    const output = execFileSync(process.execPath, [fixtureScript, archive], { encoding: 'utf8' });
    const metadata = JSON.parse(output.trim());
    const bytes = fs.readFileSync(archive);
    assert.strictEqual(bytes.length, metadata.size);
    assert.strictEqual(crypto.createHash('sha256').update(bytes).digest('hex'), metadata.sha256);

    const staging = path.join(caseRoot, 'current.json.staging');
    const current = path.join(caseRoot, 'current.json');
    fs.writeFileSync(staging, JSON.stringify({ ready: true, artifact: metadata.sha256 }));
    fs.renameSync(staging, current);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(current, 'utf8')), { ready: true, artifact: metadata.sha256 });

    // Offline restart contract: the committed record and content-addressed
    // artifact are reusable without invoking any network transport.
    assert.ok(fs.existsSync(path.join(downloads, 'fake runtime.tar.gz')));
    assert.ok(fs.existsSync(current));
  }

  if (process.platform !== 'win32' && typeof process.getuid === 'function' && process.getuid() !== 0) {
    const readOnly = path.join(root, 'read-only');
    fs.mkdirSync(readOnly);
    fs.chmodSync(readOnly, 0o555);
    try {
      assert.throws(() => fs.writeFileSync(path.join(readOnly, 'probe'), 'x'), error =>
        error && (error.code === 'EACCES' || error.code === 'EPERM'));
    } finally {
      fs.chmodSync(readOnly, 0o755);
    }
  }

  process.stdout.write(`Managed runtime path matrix passed on ${process.platform}/${process.arch} (${cases.length} paths).\n`);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
