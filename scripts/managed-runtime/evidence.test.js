#!/usr/bin/env node

'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { collectEvidence } = require('./collect-evidence');
const { verifyEvidence } = require('./verify-evidence');

const headSha = 'a'.repeat(40);
const treeSha = 'b'.repeat(40);
const vsixSha256 = 'c'.repeat(64);
const manifestSha256 = 'd'.repeat(64);
const artifactSha256 = 'e'.repeat(64);
const requiredPathCases = ['unicode', 'space', 'special-characters', 'offline-restart'];

function evidence(osName, arch = 'x64', overrides = {}) {
  return collectEvidence({
    repository: 'singular/singular-blockly', headSha, treeSha, vsixSha256, manifestSha256,
    pullRequestNumber: '42', eventName: 'pull_request',
    os: osName, arch, runner: 'github-hosted', artifactId: `artifact-${osName}-${arch}`,
    artifactSha256, pathCases: requiredPathCases, offlineRestart: 'true', success: 'true',
    generatedAt: '2026-08-16T00:00:00.000Z', ...overrides,
  });
}

const temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'runtime-evidence-'));
try {
  const manifestPath = path.join(temporary, 'manifest.json');
  const artifacts = ['darwin', 'linux', 'win32'].flatMap(platform => ['x64', 'arm64'].map(arch => ({
    id: `artifact-${platform}-${arch}`,
    platform,
    arch,
    sha256: artifactSha256,
  })));
  fs.writeFileSync(manifestPath, JSON.stringify({ artifacts }));
  const x64 = [evidence('darwin'), evidence('linux'), evidence('win32')];
  const baseOptions = {
    mode: 'pr', repository: 'singular/singular-blockly', headSha, treeSha, vsixSha256, manifestSha256,
    manifest: manifestPath, pullRequestNumber: '42', eventName: 'pull_request',
  };

  assert.deepStrictEqual(verifyEvidence(x64, baseOptions).matrix, ['darwin/x64', 'linux/x64', 'win32/x64']);
  assert.throws(() => verifyEvidence(x64.slice(1), baseOptions), /Missing required evidence/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { headSha: 'f'.repeat(40) }), ...x64.slice(1)], baseOptions), /headSha/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { treeSha: 'f'.repeat(40) }), ...x64.slice(1)], baseOptions), /treeSha/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { vsixSha256: 'f'.repeat(64) }), ...x64.slice(1)], baseOptions), /vsixSha256/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { pullRequestNumber: '43' }), ...x64.slice(1)], baseOptions), /pullRequestNumber/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { eventName: 'workflow_dispatch' }), ...x64.slice(1)], baseOptions), /eventName/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { pathCases: ['/Users/private/project'] }), ...x64.slice(1)], baseOptions), /forbidden path/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { pathCases: ['unicode'] }), ...x64.slice(1)], baseOptions), /Evidence failed/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { offlineRestart: 'false' }), ...x64.slice(1)], baseOptions), /Evidence failed/);
  assert.throws(() => verifyEvidence([evidence('darwin', 'x64', { artifactSha256: 'f'.repeat(64) }), ...x64.slice(1)], baseOptions), /artifact/);
  assert.throws(() => verifyEvidence([evidence('darwin'), ...x64], baseOptions), /Duplicate evidence/);

  const release = [...x64, evidence('darwin', 'arm64'), evidence('linux', 'arm64'), evidence('win32', 'arm64')];
  assert.strictEqual(verifyEvidence(release, { ...baseOptions, mode: 'release', manifest: manifestPath }).matrix.length, 6);
  assert.throws(() => verifyEvidence(release.slice(0, -1), { ...baseOptions, mode: 'release', manifest: manifestPath }), /win32\/arm64/);

  const runtimeResultPath = path.join(temporary, 'runtime-result.json');
  fs.writeFileSync(runtimeResultPath, JSON.stringify({
    os: 'linux', arch: 'x64', artifactId: 'artifact-linux-x64', artifactSha256,
    pathCases: requiredPathCases, offlineRestart: true, success: true,
  }));
  assert.strictEqual(evidence('linux', 'x64', { runtimeResult: runtimeResultPath }).results[0].artifactId, 'artifact-linux-x64');
  assert.throws(() => evidence('darwin', 'x64', { runtimeResult: runtimeResultPath }), /does not match/);
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

process.stdout.write('Managed runtime evidence tests passed.\n');
