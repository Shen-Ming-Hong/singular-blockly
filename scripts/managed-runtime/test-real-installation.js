#!/usr/bin/env node

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name) { return process.argv.includes(name); }

async function main() {
  if (!hasFlag('--allow-network')) {
    throw new Error('Real runtime installation requires the explicit --allow-network flag');
  }
  const compiledRoot = path.resolve(__dirname, '../../out/services');
  if (!fs.existsSync(path.join(compiledRoot, 'managedRuntimeService.js'))) {
    throw new Error('Compile tests first with npm run compile-tests');
  }
  const { ManagedRuntimeStorage } = require(path.join(compiledRoot, 'managedRuntimeStorage.js'));
  const { ManagedRuntimeService } = require(path.join(compiledRoot, 'managedRuntimeService.js'));
  const { ManagedRuntimeInstaller } = require(path.join(compiledRoot, 'managedRuntimeInstaller.js'));
  const { runPlatformioProcess } = require(path.join(compiledRoot, 'platformioProcess.js'));
  const manifestPath = path.resolve(__dirname, '../../resources/managed-runtime/runtime-manifest.json');
  const manifestBytes = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const manifestSha256 = crypto.createHash('sha256').update(manifestBytes).digest('hex');
  const parent = path.resolve(argument('--root') || fs.realpathSync(os.tmpdir()));
  fs.mkdirSync(parent, { recursive: true });
  const sandboxPrefix = process.platform === 'win32' ? '使 用&-' : '使用者 中文 & managed runtime-';
  const sandboxRoot = fs.mkdtempSync(path.join(parent, sandboxPrefix));
  const root = path.join(
    sandboxRoot,
    'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'Singular-Ray.singular-blockly', 'runtime-v1',
  );
  fs.mkdirSync(root, { recursive: true });
  const storage = new ManagedRuntimeStorage(root);
  let installerCalls = 0;

  try {
    const debugProcess = async (command, args, options) => {
      try {
        return await runPlatformioProcess(command, args, options);
      } catch (error) {
        if (hasFlag('--debug-output')) {
          const raw = `${error.stdout || ''}\n${error.stderr || ''}`;
          const redacted = raw
            .split(root).join('<runtime-root>')
            .replace(/https?:\/\/\S+/gi, '<url>')
            .replace(/(token|password|authorization)\s*[:=]\s*\S+/gi, '$1=<redacted>')
            .slice(-4000);
          process.stderr.write(`[managed-runtime-e2e-debug]\n${redacted}\n`);
        }
        throw error;
      }
    };
    const installer = new ManagedRuntimeInstaller({
      storage, manifest, manifestSha256, runProcess: debugProcess,
    });
    const service = new ManagedRuntimeService({
      storage, manifest, manifestSha256,
      allowReleaseCandidate: hasFlag('--allow-release-candidate'),
      installer,
    });
    const record = await service.ensureReady({
      onProgress(progress) { process.stdout.write(`[managed-runtime-e2e] ${progress.stage} ${progress.percent}%\n`); },
    });
    const environment = await service.getCoreEnvironment('runtime-e2e-workspace');
    execFileSync(environment.invocation.command, [...environment.invocation.prefixArgs, '--version'], {
      cwd: root, env: { ...process.env, ...environment.invocation.env }, stdio: 'pipe', timeout: 30000,
    });

    const offlineService = new ManagedRuntimeService({
      storage, manifest, manifestSha256,
      allowReleaseCandidate: hasFlag('--allow-release-candidate'),
      installer: { async install() { installerCalls += 1; throw new Error('Offline restart attempted installation'); } },
    });
    const offlineRecord = await offlineService.ensureReady();
    const offlineEnvironment = await offlineService.getCoreEnvironment('runtime-e2e-workspace');
    execFileSync(offlineEnvironment.invocation.command, [...offlineEnvironment.invocation.prefixArgs, '--version'], {
      cwd: root, env: { ...process.env, ...offlineEnvironment.invocation.env }, stdio: 'pipe', timeout: 30000,
    });
    if (installerCalls !== 0 || offlineRecord.versionDirectory !== record.versionDirectory) {
      throw new Error('Offline restart did not reuse the committed runtime');
    }

    const result = {
      os: process.platform,
      arch: process.arch,
      artifactId: record.artifactId,
      artifactSha256: manifest.artifacts.find(artifact => artifact.id === record.artifactId)?.sha256,
      pathCases: ['unicode', 'space', 'special-characters', 'default-global-storage-shape', 'offline-restart'],
      offlineRestart: true,
      success: true,
    };
		if (!result.artifactSha256) { throw new Error('Installed artifact is not present in the packaged manifest'); }
    const resultPath = argument('--result');
    if (resultPath) { fs.writeFileSync(path.resolve(resultPath), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' }); }
    process.stdout.write(`Real managed runtime installation passed on ${process.platform}/${process.arch}.\n`);
  } finally {
    if (!hasFlag('--keep')) { fs.rmSync(sandboxRoot, { recursive: true, force: true }); }
    else { process.stdout.write(`Managed runtime test directory retained at ${sandboxRoot}.\n`); }
  }
}

main().catch(error => {
	const code = error && typeof error.code === 'string' ? `${error.code}: ` : '';
	process.stderr.write(`${code}${error.message}\n`);
	process.exitCode = 1;
});
