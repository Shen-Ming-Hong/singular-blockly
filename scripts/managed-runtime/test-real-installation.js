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

    const pathCases = ['unicode', 'space', 'special-characters', 'default-global-storage-shape', 'offline-restart'];
    let esp32 = null;
    if (hasFlag('--esp32-packages')) {
      esp32 = await installEsp32Packages({ compiledRoot, storage, manifest, manifestSha256, sandboxRoot });
      pathCases.push('esp32-work-root');
    }

    const result = {
      os: process.platform,
      arch: process.arch,
      artifactId: record.artifactId,
      artifactSha256: manifest.artifacts.find(artifact => artifact.id === record.artifactId)?.sha256,
      pathCases,
      offlineRestart: true,
      ...(esp32 ? { workRootKind: esp32.workRootKind, longestPathLength: esp32.longestPathLength } : {}),
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

const ESP32_PLATFORM = 'espressif32@7.0.1';
const WINDOWS_MAX_PATH = 260;

/** Longest absolute path below a directory, without following links. */
function longestPathBelow(directory) {
  let longest = directory.length;
  const pending = [directory];
  while (pending.length > 0) {
    const current = pending.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      longest = Math.max(longest, target.length);
      if (entry.isDirectory() && !entry.isSymbolicLink()) { pending.push(target); }
    }
  }
  return longest;
}

/**
 * Spec 074: install and build an ESP32 Arduino project through Singular Core
 * on Windows, using the short PlatformIO work root, and measure the longest
 * real path. The sandbox LOCALAPPDATA contains non-ASCII characters, so the
 * system-drive fallback with hardened ACLs is exercised.
 */
async function installEsp32Packages({ compiledRoot, storage, manifest, manifestSha256, sandboxRoot }) {
  if (process.platform !== 'win32') { throw new Error('--esp32-packages is supported only on Windows'); }
  const { ManagedRuntimeService } = require(path.join(compiledRoot, 'managedRuntimeService.js'));
  const { PlatformioWorkRootService } = require(path.join(compiledRoot, 'managedRuntimeWorkRoot.js'));
  const localAppData = path.join(sandboxRoot, 'AppData', 'Local');
  fs.mkdirSync(localAppData, { recursive: true });
  const workRoot = new PlatformioWorkRootService({
    storage,
    customManagedRoot: false,
    env: { ...process.env, LOCALAPPDATA: localAppData },
  });
  const service = new ManagedRuntimeService({
    storage, manifest, manifestSha256,
    allowReleaseCandidate: hasFlag('--allow-release-candidate'),
    installer: { async install() { throw new Error('ESP32 check must reuse the installed runtime'); } },
    workRoot,
  });
  await service.ensureReady();
  const projectDir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'sb-esp32-'));
  let selected = null;
  try {
    fs.mkdirSync(path.join(projectDir, 'src'));
    fs.writeFileSync(path.join(projectDir, 'platformio.ini'), [
      '[env:esp32]',
      `platform = ${ESP32_PLATFORM}`,
      'board = esp32dev',
      'framework = arduino',
      '',
    ].join('\n'));
    fs.writeFileSync(path.join(projectDir, 'src', 'main.cpp'), '#include <Arduino.h>\nvoid setup() {}\nvoid loop() {}\n');
    const environment = await service.getCoreEnvironment(`file:///${projectDir.replace(/\\/g, '/')}`, { workload: 'arduino' });
    selected = await workRoot.current();
    if (!selected || environment.workRoot !== selected.root) { throw new Error('Arduino workload did not use the PlatformIO work root'); }
    const run = args => execFileSync(environment.invocation.command, [...environment.invocation.prefixArgs, ...args], {
      cwd: projectDir, env: { ...process.env, ...environment.invocation.env }, stdio: 'pipe', timeout: 20 * 60 * 1000,
    });
    process.stdout.write(`[managed-runtime-e2e] installing ${ESP32_PLATFORM} into the ${selected.kind} work root\n`);
    run(['pkg', 'install', '--project-dir', projectDir]);
    process.stdout.write('[managed-runtime-e2e] building the ESP32 Arduino project\n');
    run(['run', '--project-dir', projectDir]);
    const longestPathLength = longestPathBelow(selected.root);
    process.stdout.write(`[managed-runtime-e2e] longest work-root path: ${longestPathLength} characters\n`);
    if (longestPathLength >= WINDOWS_MAX_PATH) {
      throw new Error(`PlatformIO work root produced a ${longestPathLength}-character path`);
    }
    return { workRootKind: selected.kind, longestPathLength };
  } finally {
    fs.rmSync(projectDir, { recursive: true, force: true });
    if (selected && selected.kind === 'system-drive' && !hasFlag('--keep')) {
      fs.rmSync(selected.root, { recursive: true, force: true });
    }
  }
}

main().catch(error => {
	const code = error && typeof error.code === 'string' ? `${error.code}: ` : '';
	process.stderr.write(`${code}${error.message}\n`);
	process.exitCode = 1;
});
