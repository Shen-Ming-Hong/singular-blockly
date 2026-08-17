#!/usr/bin/env node

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const tar = require('tar');

async function main() {
  const output = path.resolve(process.argv[2] || path.join(os.tmpdir(), 'singular-managed-runtime-fake.tar.gz'));
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'singular-runtime-fixture-'));
  try {
    const pythonDir = path.join(fixtureRoot, 'python', process.platform === 'win32' ? '' : 'bin');
    fs.mkdirSync(pythonDir, { recursive: true });
    const executable = path.join(pythonDir, process.platform === 'win32' ? 'python.exe' : 'python3');
    fs.writeFileSync(executable, process.platform === 'win32' ? 'fake-python\r\n' : '#!/bin/sh\nprintf "Python 3.11.16\\n"\n');
    if (process.platform !== 'win32') fs.chmodSync(executable, 0o755);
    await tar.create({ cwd: fixtureRoot, gzip: true, file: output, portable: true }, ['python']);
    const bytes = fs.readFileSync(output);
    const result = {
      path: output,
      size: bytes.length,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      pythonRelativePath: path.relative(fixtureRoot, executable).split(path.sep).join('/'),
    };
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
