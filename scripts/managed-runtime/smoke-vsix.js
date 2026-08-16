#!/usr/bin/env node

'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const JSZip = require('jszip');
const { runVSCodeCommand } = require('@vscode/test-electron');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const vsix = path.resolve(argument('--vsix') || process.env.VSIX_PATH || '');
  if (!vsix || !fs.statSync(vsix).isFile()) { throw new Error('A valid --vsix path is required'); }
  const archive = await JSZip.loadAsync(fs.readFileSync(vsix), { checkCRC32: true });
  const required = [
    'extension/package.json',
    'extension/dist/managed-runtime/runtime-manifest.json',
    'extension/dist/managed-runtime/THIRD_PARTY_NOTICES.md',
  ];
  for (const name of required) { assert.ok(archive.file(name), `VSIX is missing ${name}`); }
  const extensionPackage = JSON.parse(await archive.file('extension/package.json').async('string'));
  const manifestBytes = Buffer.from(await archive.file('extension/dist/managed-runtime/runtime-manifest.json').async('uint8array'));
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  assert.strictEqual(manifest.schemaVersion, 1);
  assert.ok(Array.isArray(manifest.artifacts) && manifest.artifacts.length >= 3);

  const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'managed-vsix-smoke-'));
  try {
    const fakeArchive = path.join(temporary, 'fake-runtime.tar.gz');
    const fakeMetadata = JSON.parse(execFileSync(process.execPath, [
      path.resolve(__dirname, 'create-fake-artifact.js'), fakeArchive,
    ], { encoding: 'utf8' }).trim());
    const fakeBytes = fs.readFileSync(fakeArchive);
    assert.strictEqual(fakeBytes.length, fakeMetadata.size);
    assert.strictEqual(crypto.createHash('sha256').update(fakeBytes).digest('hex'), fakeMetadata.sha256);

    const profileArgs = [
      '--user-data-dir', path.join(temporary, 'user-data'),
      '--extensions-dir', path.join(temporary, 'extensions'),
    ];
    await runVSCodeCommand([...profileArgs, '--install-extension', vsix, '--force'], { version: '1.109.0' });
    const listed = await runVSCodeCommand([...profileArgs, '--list-extensions', '--show-versions'], { version: '1.109.0' });
    const expected = `${extensionPackage.publisher}.${extensionPackage.name}@${extensionPackage.version}`.toLowerCase();
    assert.ok(listed.stdout.toLowerCase().split(/\r?\n/).includes(expected), `Installed extension list did not contain ${expected}`);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  process.stdout.write(`VSIX managed-runtime smoke passed (${manifest.runtimeVersion}).\n`);
}

main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
