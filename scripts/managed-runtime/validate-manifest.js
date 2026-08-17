#!/usr/bin/env node

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const manifestPath = path.join(root, 'resources', 'managed-runtime', 'runtime-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const hex64 = /^[a-f0-9]{64}$/;
const safeToken = /^[A-Za-z0-9._+-]+$/;
const allowedHosts = new Set([
  'github.com',
  'raw.githubusercontent.com',
  'objects.githubusercontent.com',
  'release-assets.githubusercontent.com',
]);

function fail(message) {
  throw new Error(`Managed runtime manifest: ${message}`);
}

function validateDownload(download, label) {
  const url = new URL(download.url);
  if (url.protocol !== 'https:' || !allowedHosts.has(url.hostname)) {
    fail(`${label} must use an allowlisted HTTPS host`);
  }
  if (!hex64.test(download.sha256)) {
    fail(`${label} has an invalid SHA-256`);
  }
  if (!Number.isSafeInteger(download.size) || download.size <= 0) {
    fail(`${label} has an invalid size`);
  }
  if (!download.license || !download.source) {
    fail(`${label} must record license and source`);
  }
}

if (manifest.schemaVersion !== 1) fail('unsupported schemaVersion');
if (!safeToken.test(manifest.runtimeVersion)) fail('unsafe runtimeVersion');
if (!/^3\.11\.\d+$/.test(manifest.pythonVersion)) fail('Python must be an exact 3.11 patch release');
if (!/^\d+\.\d+\.\d+$/.test(manifest.mpremoteVersion)) fail('mpremote must be pinned');
if (manifest.platformio?.channel !== 'stable' || !/^>=\d+\.\d+\.\d+ <\d+\.\d+\.\d+$/.test(manifest.platformio.testedVersionRange)) {
  fail('PlatformIO must use stable with exact inclusive/exclusive tested version bounds');
}
validateDownload(manifest.installer, 'installer');

const targets = new Set();
for (const artifact of manifest.artifacts) {
  if (!safeToken.test(artifact.id)) fail(`unsafe artifact id: ${artifact.id}`);
  if (!['win32', 'darwin', 'linux'].includes(artifact.platform)) fail(`unsupported platform: ${artifact.platform}`);
  if (!['x64', 'arm64'].includes(artifact.arch)) fail(`unsupported arch: ${artifact.arch}`);
  if (!['stable', 'release-candidate'].includes(artifact.support)) fail(`unsupported support status: ${artifact.support}`);
  if (artifact.platform === 'linux' && artifact.libc !== 'glibc') fail('Linux artifacts must be glibc');
  if (artifact.platform !== 'linux' && artifact.libc !== null) fail('Only Linux artifacts may declare libc');
  if (artifact.archiveFormat !== 'tar.gz') fail('Only tar.gz artifacts are supported in schema v1');
  if (path.isAbsolute(artifact.pythonRelativePath) || artifact.pythonRelativePath.split(/[\\/]+/).includes('..')) {
    fail(`unsafe Python path: ${artifact.pythonRelativePath}`);
  }
  const target = `${artifact.platform}-${artifact.arch}`;
  if (targets.has(target)) fail(`duplicate target: ${target}`);
  targets.add(target);
  validateDownload(artifact, artifact.id);
}

for (const platform of ['win32', 'darwin', 'linux']) {
  if (!targets.has(`${platform}-x64`)) fail(`missing stable x64 artifact for ${platform}`);
}

for (const [name, spec] of Object.entries(manifest.platformPackages)) {
  if (!/^[a-z0-9_-]+$/.test(name) || !/^[a-z0-9_-]+\/[a-z0-9_-]+@\d+\.\d+\.\d+$/.test(spec)) {
    fail(`platform package ${name} must use an exact owner/name@version spec`);
  }
}

const digest = crypto.createHash('sha256').update(fs.readFileSync(manifestPath)).digest('hex');
process.stdout.write(`Managed runtime manifest is valid (${digest})\n`);
