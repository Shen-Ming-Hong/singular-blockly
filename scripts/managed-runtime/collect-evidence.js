#!/usr/bin/env node

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const result = { pathCases: [], evidence: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) { throw new Error(`Unexpected argument: ${token}`); }
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) { throw new Error(`Missing value for ${token}`); }
    index += 1;
    if (key === 'pathCase' || key === 'evidence') { result[`${key}s`].push(value); }
    else { result[key] = value; }
  }
  return result;
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assertIdentity(value, name, pattern) {
  if (typeof value !== 'string' || !pattern.test(value)) { throw new Error(`Invalid ${name}`); }
  return value;
}

function readRuntimeResult(filePath) {
  const result = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
  if (!result || result.success !== true || result.offlineRestart !== true || !Array.isArray(result.pathCases)) {
    throw new Error('Runtime result did not report a successful install and offline restart');
  }
  return result;
}

function collectEvidence(options) {
  const repository = assertIdentity(options.repository, 'repository', /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);
  const headSha = assertIdentity(options.headSha, 'head SHA', /^[a-f0-9]{40,64}$/);
  const treeSha = assertIdentity(options.treeSha, 'tree SHA', /^[a-f0-9]{40,64}$/);
  const vsixSha256 = options.vsixSha256 || sha256File(path.resolve(options.vsix));
  const manifestSha256 = options.manifestSha256 || sha256File(path.resolve(options.manifest));
  assertIdentity(vsixSha256, 'VSIX SHA-256', /^[a-f0-9]{64}$/);
  assertIdentity(manifestSha256, 'manifest SHA-256', /^[a-f0-9]{64}$/);
  const runtimeResult = options.runtimeResult ? readRuntimeResult(options.runtimeResult) : {
    os: options.os,
    arch: options.arch,
    artifactId: options.artifactId,
    artifactSha256: options.artifactSha256,
    pathCases: options.pathCases,
    offlineRestart: String(options.offlineRestart) === 'true',
    success: String(options.success) === 'true',
  };
  if (!['win32', 'darwin', 'linux'].includes(runtimeResult.os)) { throw new Error('Invalid OS'); }
  if (!['x64', 'arm64'].includes(runtimeResult.arch)) { throw new Error('Invalid architecture'); }
  if (options.os && options.os !== runtimeResult.os) { throw new Error('Runtime result OS does not match the runner matrix'); }
  if (options.arch && options.arch !== runtimeResult.arch) { throw new Error('Runtime result architecture does not match the runner matrix'); }
  if (!Array.isArray(runtimeResult.pathCases) || runtimeResult.pathCases.length === 0) { throw new Error('At least one path case is required'); }
  const pullRequestNumber = options.pullRequestNumber ? Number(options.pullRequestNumber) : null;
  if (pullRequestNumber !== null && (!Number.isSafeInteger(pullRequestNumber) || pullRequestNumber <= 0)) {
    throw new Error('Invalid pull request number');
  }

  return {
    schemaVersion: 1,
    repository,
    pullRequestNumber,
    headSha,
    treeSha,
    vsixSha256,
    manifestSha256,
    generatedAt: options.generatedAt || new Date().toISOString(),
    source: {
      eventName: assertIdentity(options.eventName || 'manual', 'event name', /^[A-Za-z0-9_.-]{1,100}$/),
      isFork: String(options.isFork || 'false') === 'true',
    },
    results: [{
      os: runtimeResult.os,
      arch: runtimeResult.arch,
      runner: assertIdentity(options.runner, 'runner', /^[A-Za-z0-9_. -]{1,100}$/),
      artifactId: assertIdentity(runtimeResult.artifactId, 'artifact id', /^[a-z0-9.-]{1,150}$/),
      artifactSha256: assertIdentity(runtimeResult.artifactSha256, 'artifact SHA-256', /^[a-f0-9]{64}$/),
      pathCases: [...new Set(runtimeResult.pathCases)].sort(),
      offlineRestart: runtimeResult.offlineRestart === true,
      success: runtimeResult.success === true,
    }],
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.output) { throw new Error('--output is required'); }
  const evidence = collectEvidence(options);
  fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
  fs.writeFileSync(path.resolve(options.output), `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' });
  process.stdout.write(`Wrote managed runtime evidence for ${evidence.results[0].os}/${evidence.results[0].arch}.\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { collectEvidence, parseArgs, readRuntimeResult, sha256File };
