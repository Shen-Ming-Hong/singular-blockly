#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { parseArgs, sha256File } = require('./collect-evidence');

const SHA = /^[a-f0-9]{40,64}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MATRIX_X64 = ['darwin/x64', 'linux/x64', 'win32/x64'];
const REQUIRED_PATH_CASES = ['offline-restart', 'space', 'special-characters', 'unicode'];
const SENSITIVE_PATH = /(?:^|[\s"'])(?:[A-Za-z]:\\Users\\|\/Users\/|\/home\/|\/root\/)/;

function readEvidence(filePath) {
  const value = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!value || value.schemaVersion !== 1 || !Array.isArray(value.results)) { throw new Error(`Unsupported evidence: ${filePath}`); }
  return value;
}

function assertPrivacy(value) {
  const serialized = JSON.stringify(value);
  if (SENSITIVE_PATH.test(serialized) || /(?:https?|socks):\/\//i.test(serialized) || /(?:token|password|secret)=/i.test(serialized)) {
    throw new Error('Evidence contains a forbidden path, URL, or credential-like value');
  }
}

function manifestArm64Matrix(manifestPath) {
  if (!manifestPath) { return []; }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return manifest.artifacts
    .filter(artifact => artifact.arch === 'arm64')
    .map(artifact => `${artifact.platform}/${artifact.arch}`)
    .sort();
}

function manifestArtifacts(manifestPath) {
  if (!manifestPath) { return new Map(); }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return new Map(manifest.artifacts.map(artifact => [
    `${artifact.platform}/${artifact.arch}`,
    { id: artifact.id, sha256: artifact.sha256 },
  ]));
}

function verifyEvidence(evidenceList, options) {
  if (!['pr', 'release', 'tree'].includes(options.mode)) { throw new Error('Mode must be pr, release, or tree'); }
  if (evidenceList.length === 0) { throw new Error('No evidence files were provided'); }
  const expected = {
    repository: options.repository,
    headSha: options.headSha,
    treeSha: options.treeSha,
    vsixSha256: options.vsixSha256 || (options.vsix ? sha256File(path.resolve(options.vsix)) : undefined),
    manifestSha256: options.manifestSha256 || (options.manifest ? sha256File(path.resolve(options.manifest)) : undefined),
  };
  if (!expected.repository || !expected.treeSha || !SHA.test(expected.treeSha) || !expected.manifestSha256 || !SHA256.test(expected.manifestSha256)) {
    throw new Error('Repository, tree SHA, and manifest SHA-256 expectations are required');
  }
  if (options.mode !== 'tree' && (!expected.headSha || !SHA.test(expected.headSha) || !expected.vsixSha256 || !SHA256.test(expected.vsixSha256))) {
    throw new Error('PR and release verification require head and VSIX identities');
  }

  const results = [];
  const expectedArtifacts = manifestArtifacts(options.manifest);
  const completed = new Set();
  for (const evidence of evidenceList) {
    assertPrivacy(evidence);
    for (const key of ['repository', 'treeSha', 'manifestSha256']) {
      if (evidence[key] !== expected[key]) { throw new Error(`Evidence ${key} does not match the candidate`); }
    }
    if (options.mode !== 'tree') {
      for (const key of ['headSha', 'vsixSha256']) {
        if (evidence[key] !== expected[key]) { throw new Error(`Evidence ${key} does not match the candidate`); }
      }
    }
    if (options.pullRequestNumber !== undefined) {
      const expectedPr = options.pullRequestNumber ? Number(options.pullRequestNumber) : null;
      if (evidence.pullRequestNumber !== expectedPr) { throw new Error('Evidence pullRequestNumber does not match the candidate'); }
    }
    if (options.eventName !== undefined && evidence.source?.eventName !== options.eventName) {
      throw new Error('Evidence eventName does not match the candidate');
    }
    if (!Number.isFinite(Date.parse(evidence.generatedAt))) { throw new Error('Evidence timestamp is invalid'); }
    if (evidence.results.length !== 1) { throw new Error('Each evidence file must contain exactly one matrix result'); }
    for (const result of evidence.results) {
      if (!['win32', 'darwin', 'linux'].includes(result.os) || !['x64', 'arm64'].includes(result.arch)) {
        throw new Error('Evidence matrix identity is invalid');
      }
      if (
        result.success !== true ||
        result.offlineRestart !== true ||
        !Array.isArray(result.pathCases) ||
        REQUIRED_PATH_CASES.some(pathCase => !result.pathCases.includes(pathCase))
      ) {
        throw new Error(`Evidence failed for ${result.os}/${result.arch}`);
      }
      const matrix = `${result.os}/${result.arch}`;
      if (completed.has(matrix)) { throw new Error(`Duplicate evidence for ${matrix}`); }
      const expectedArtifact = expectedArtifacts.get(matrix);
      if (options.manifest && (!expectedArtifact || result.artifactId !== expectedArtifact.id || result.artifactSha256 !== expectedArtifact.sha256)) {
        throw new Error(`Evidence artifact does not match the manifest for ${matrix}`);
      }
      completed.add(matrix);
      results.push(result);
    }
  }

  const required = options.mode === 'release'
    ? [...MATRIX_X64, ...manifestArm64Matrix(options.manifest)]
    : MATRIX_X64;
  const missing = [...new Set(required)].filter(matrix => !completed.has(matrix));
  if (missing.length > 0) { throw new Error(`Missing required evidence: ${missing.join(', ')}`); }
  return { matrix: [...completed].sort(), evidenceCount: evidenceList.length };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const paths = options.evidences || [];
  const result = verifyEvidence(paths.map(readEvidence), options);
  process.stdout.write(`Managed runtime evidence verified: ${result.matrix.join(', ')}.\n`);
}

if (require.main === module) {
  try { main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}

module.exports = { assertPrivacy, manifestArm64Matrix, manifestArtifacts, readEvidence, verifyEvidence };
