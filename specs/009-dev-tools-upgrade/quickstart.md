# Quickstart Guide: Dev Tools Dependency Upgrade

**Feature**: 009-dev-tools-upgrade  
**Target Audience**: Developers executing the upgrade  
**Estimated Time**: 30 minutes  
**Prerequisites**: Windows PowerShell, Node.js 22+, Git

---

## Overview

This guide walks through upgrading three development tool dependencies in the Singular Blockly project:

1. **@typescript-eslint/eslint-plugin**: 8.46.1 → 8.46.2 (PATCH - bug fixes)
2. **ESLint ecmaVersion**: 2022 → 2023 (Config alignment for ES2023 syntax)
3. **webpack-cli**: 5.1.4 → 6.0.1 (MAJOR - requires Node.js 18+, webpack 5.82+)

**Risk Level**: 🟢 LOW for items 1-2, 🟡 MEDIUM for item 3  
**Rollback**: Easy via Git (pre-upgrade tag and backups created)

---

## Quick Reference

### Commands Cheat Sheet

```powershell
# Environment verification
node --version  # Expect: v22.16.0+
git status      # Expect: clean working tree

# Backup
git add . && git commit -m "chore: pre-upgrade checkpoint"
git tag pre-009-upgrade

# Upgrade sequence
npm install @typescript-eslint/eslint-plugin@8.46.2
npm run compile && npm test  # Verify

# Edit eslint.config.mjs: ecmaVersion: 2023
npm run compile && npm test  # Verify

npm install webpack-cli@6.0.1 --save-dev
npm run compile && npm test  # Verify

# Rollback (if needed)
git reset --hard pre-009-upgrade && npm ci
```

---

## Step-by-Step Guide

### Step 1: Environment Verification (2 minutes)

**Objective**: Ensure system meets requirements for webpack-cli 6.x

**Actions**:

```powershell
# 1.1 Check Node.js version (must be 18.12.0+)
node --version
# Expected output: v22.16.0 or higher

# 1.2 Check npm version
npm --version
# Expected output: 10.x or higher

# 1.3 Verify Git working tree is clean
git status
# Expected output: "working tree clean" or only untracked files

# 1.4 Ensure dependencies are installed
if (-Not (Test-Path node_modules)) { npm install }
```

**✅ Success Criteria**:

-   Node.js version ≥ 22.16.0
-   Git shows no uncommitted changes in tracked files
-   `node_modules/` folder exists

---

### Step 2: Capture Baseline Metrics (5 minutes)

**Objective**: Record current performance for comparison

**Actions**:

```powershell
# 2.1 Record current dependency versions
npm list --depth=0 > pre-upgrade-versions.txt

# 2.2 Measure compile time (run 3 times, note average)
Measure-Command { npm run compile } | Select-Object TotalMilliseconds
Measure-Command { npm run compile } | Select-Object TotalMilliseconds
Measure-Command { npm run compile } | Select-Object TotalMilliseconds
# Expected: ~4000ms each run

# 2.3 Check bundle size
(Get-Item dist/extension.js).Length / 1KB
# Expected: ~130KB

# 2.4 Record test baseline
npm test
# Expected: 189/190 passing (1 known failure)
```

**📊 Expected Baselines**:

-   Compile time: ~4000ms ±10%
-   Bundle size: ~130KB
-   Tests: 189/190 passing

---

### Step 3: Create Backup (2 minutes)

**Objective**: Enable quick rollback if issues arise

**Actions**:

```powershell
# 3.1 Commit current state
git add .
git commit -m "chore: pre-upgrade checkpoint"

# 3.2 Tag for easy rollback
git tag pre-009-upgrade

# 3.3 Backup critical files
Copy-Item package.json package.json.backup
Copy-Item package-lock.json package-lock.json.backup

# 3.4 Verify backup created
Test-Path package.json.backup  # Should return: True
```

**✅ Success Criteria**:

-   Git commit created
-   Tag `pre-009-upgrade` exists
-   Backup files present

---

### Step 4: Upgrade @typescript-eslint/eslint-plugin (5 minutes)

**Objective**: Update to 8.46.2 for bug fixes

**Actions**:

```powershell
# 4.1 Install new version
npm install @typescript-eslint/eslint-plugin@8.46.2

# 4.2 Verify version in package.json
Get-Content package.json | Select-String "@typescript-eslint/eslint-plugin"
# Expected: "@typescript-eslint/eslint-plugin": "^8.46.2"

# 4.3 Verify no peer warnings
# Check npm install output - should show no warnings

# 4.4 Test compilation
npm run compile
# Expected: exit code 0, no errors

# 4.5 Run ESLint
npx eslint src/ --max-warnings=0
# Expected: exit code 0, no warnings

# 4.6 Run full test suite
npm test
# Expected: 189/190 passing (baseline maintained)

# 4.7 Commit upgrade
git add package.json package-lock.json
git commit -m "chore: upgrade @typescript-eslint/eslint-plugin to 8.46.2"
```

**✅ Success Criteria**:

-   `package.json` shows version 8.46.2
-   Compilation succeeds
-   Tests pass (189/190)
-   No ESLint errors

**🔴 Rollback on Failure**:

```powershell
git reset --hard HEAD~1
npm ci
```

---

### Step 5: Update ESLint ecmaVersion (3 minutes)

**Objective**: Enable ES2023 syntax linting

**Actions**:

```powershell
# 5.1 Open eslint.config.mjs in editor
code eslint.config.mjs

# 5.2 Locate line ~17 (in first config object)
# Find:
languageOptions: {
  ecmaVersion: 2022,  // ← Change this line
  sourceType: 'module',
  globals: globals.node,
}

# 5.3 Update to ES2023
languageOptions: {
  ecmaVersion: 2023,  // ← Changed from 2022
  sourceType: 'module',
  globals: globals.node,
}

# 5.4 Save file and close editor

# 5.5 Verify ESLint accepts new config
npx eslint src/ --max-warnings=0
# Expected: exit code 0, no warnings

# 5.6 Test compilation
npm run compile
# Expected: exit code 0, no errors

# 5.7 Run full test suite
npm test
# Expected: 189/190 passing (baseline maintained)

# 5.8 Commit change
git add eslint.config.mjs
git commit -m "chore: update ESLint ecmaVersion to 2023"
```

**✅ Success Criteria**:

-   `eslint.config.mjs` shows `ecmaVersion: 2023`
-   No ESLint errors
-   Compilation succeeds
-   Tests pass (189/190)

**🔴 Rollback on Failure**:

```powershell
git reset --hard HEAD~1
```

---

### Step 6: Audit Scripts for webpack-cli 6.x (3 minutes)

**Objective**: Verify no CLI option renames needed

**Actions**:

```powershell
# 6.1 Check package.json scripts for --define-process-env-node-env
Get-Content package.json | Select-String "--define-process-env-node-env"
# Expected: No matches (option not used)

# 6.2 Check webpack.config.js for CLI references
Get-Content webpack.config.js | Select-String "--define-process-env-node-env"
# Expected: No matches (option not used)

# 6.3 Review package.json scripts manually
code package.json
# Verify: No "webpack init", "webpack loader", or "webpack plugin" commands
# Current scripts use: "webpack" and "webpack --watch" only
```

**✅ Success Criteria**:

-   No `--define-process-env-node-env` usage found
-   No deprecated commands (`init`, `loader`, `plugin`) found
-   Scripts only use basic `webpack` commands

**⚠️ If CLI Options Found**:
Follow migration guide in `research.md` section 4.2 to rename options.

---

### Step 7: Upgrade webpack-cli (5 minutes)

**Objective**: Update to 6.0.1 for latest features and security fixes

**Actions**:

```powershell
# 7.1 Install new version
npm install webpack-cli@6.0.1 --save-dev

# 7.2 Verify version in package.json
Get-Content package.json | Select-String "webpack-cli"
# Expected: "webpack-cli": "^6.0.1"

# 7.3 Verify no peer warnings
# Check npm install output - should show no warnings

# 7.4 Test compilation
npm run compile
# Expected: exit code 0, no errors

# 7.5 Test watch mode (verify starts correctly)
npm run watch
# Expected: "webpack is watching the files..." message
# Press Ctrl+C to stop after verification

# 7.6 Run full test suite
npm test
# Expected: 189/190 passing (baseline maintained)

# 7.7 Commit upgrade
git add package.json package-lock.json
git commit -m "chore: upgrade webpack-cli to 6.0.1"
```

**✅ Success Criteria**:

-   `package.json` shows version 6.0.1
-   Compilation succeeds
-   Watch mode starts without errors
-   Tests pass (189/190)

**🔴 Rollback on Failure**:

```powershell
git reset --hard HEAD~1
npm ci
```

---

### Step 8: Performance Validation (5 minutes)

**Objective**: Confirm performance within acceptable bounds

**Actions**:

```powershell
# 8.1 Measure post-upgrade compile time (3 runs)
$times = @()
1..3 | ForEach-Object {
  $result = Measure-Command { npm run compile }
  $times += $result.TotalMilliseconds
  Write-Host "Run $_: $($result.TotalMilliseconds)ms"
}
$avg = ($times | Measure-Object -Average).Average
Write-Host "`nAverage compile time: ${avg}ms (Baseline: 4000ms ±10%)"

# Acceptable range: 3600ms - 4400ms

# 8.2 Measure bundle size
$size = (Get-Item dist/extension.js).Length / 1KB
Write-Host "Bundle size: ${size}KB (Baseline: 130KB ±5%)"

# Acceptable range: 123.5KB - 136.5KB

# 8.3 Check test duration (from npm test output)
npm test
# Look for "Time:" line in output, should be <3000ms
```

**✅ Success Criteria**:

-   ✅ Compile time: 3600-4400ms
-   ✅ Bundle size: 123.5-136.5KB
-   ✅ Test duration: <3000ms

**🔴 If Performance Degraded**:
Document findings and investigate before proceeding.

---

### Step 9: Functional Validation (5 minutes)

**Objective**: Ensure extension works in VSCode

**Actions**:

```powershell
# 9.1 Open VSCode
code .

# 9.2 Press F5 to launch Extension Development Host
# (Or use Run > Start Debugging)

# 9.3 In Extension Development Host window:
# - Press Ctrl+Shift+P
# - Type "Singular Blockly: Open Editor"
# - Press Enter

# 9.4 Verify Blockly editor loads with:
# ✅ Toolbox on left side
# ✅ Workspace area in center
# ✅ Board selector dropdown (default: Arduino Uno)

# 9.5 Test basic functionality:
# - Drag "設定" (Setup) block from toolbox to workspace
# - Verify Arduino code appears in preview pane
# - Change board to "ESP32" from dropdown
# - Verify board-specific code updates
# - Toggle theme (light ↔ dark) from theme button
# - Save workspace (Ctrl+S)
# - Close editor and reopen - verify workspace restored

# 9.6 Close Extension Development Host
```

**✅ Success Criteria**:

-   Extension loads without errors
-   Blockly editor renders correctly
-   Code generation works
-   Board switching works
-   Theme toggle works
-   Save/load functionality works

---

### Step 10: Final Verification (3 minutes)

**Objective**: Ensure no dependency conflicts

**Actions**:

```powershell
# 10.1 Check for duplicate packages
npm ls @typescript-eslint/eslint-plugin
npm ls webpack-cli
# Expected: Single version listed for each

# 10.2 Run clean install to verify lockfile
npm ci
# Expected: Completes without errors or modifications

# 10.3 Run security audit
npm audit
# Expected: No high/critical vulnerabilities

# 10.4 Compare versions
Get-Content pre-upgrade-versions.txt | Select-String "eslint-plugin|webpack-cli"
npm list --depth=0 | Select-String "eslint-plugin|webpack-cli"
# Verify: Versions upgraded as expected
```

**✅ Success Criteria**:

-   No duplicate dependencies
-   `npm ci` succeeds
-   No critical security issues
-   Version numbers correct

---

### Step 11: Update Documentation (3 minutes)

**Objective**: Record changes in CHANGELOG.md

**Actions**:

```powershell
# 11.1 Open CHANGELOG.md
code CHANGELOG.md

# 11.2 Add entry under "## [Unreleased]" (or create section if missing)
## [Unreleased]

### Changed
- Upgraded `@typescript-eslint/eslint-plugin` from 8.46.1 to 8.46.2 (bug fixes)
- Upgraded `webpack-cli` from 5.1.4 to 6.0.1 (requires Node.js 18+, webpack 5.82+)
- Updated ESLint `ecmaVersion` from 2022 to 2023 for ES2023 syntax support

### Performance
- Compile time: [ACTUAL]ms (baseline 4000ms ±10%)
- Bundle size: [ACTUAL]KB (baseline 130KB ±5%)
- Test suite: 189/190 passing (1 known failure - baseline maintained)

# 11.3 Fill in [ACTUAL] values from Step 8 measurements

# 11.4 Save and commit
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for dev tools upgrade"
```

**✅ Success Criteria**:

-   CHANGELOG.md updated with accurate version numbers
-   Performance metrics recorded
-   Git commit created

---

## Rollback Procedure

### If Any Step Fails

**Quick Rollback**:

```powershell
# Option 1: Reset to pre-upgrade tag
git reset --hard pre-009-upgrade

# Option 2: Restore from backups
Copy-Item package.json.backup package.json -Force
Copy-Item package-lock.json.backup package-lock.json -Force

# Reinstall dependencies
npm ci

# Verify rollback
npm run compile
npm test
```

**Verification After Rollback**:

```powershell
# Check versions match baseline
Get-Content pre-upgrade-versions.txt
npm list --depth=0
# Should match exactly

# Test functionality
npm run compile  # Should succeed
npm test         # Should show 189/190 passing
```

---

## Troubleshooting

### Common Issues

**Issue 1: npm install fails with peer dependency warnings**

**Symptoms**:

```
npm WARN ERESOLVE overriding peer dependency
```

**Solution**:

```powershell
# Use --force flag (only if warnings are for optional dependencies)
npm install <package> --force

# Or use --legacy-peer-deps
npm install <package> --legacy-peer-deps
```

---

**Issue 2: webpack-cli 6.x fails with "Cannot find module 'webpack'"**

**Symptoms**:

```
Error: Cannot find module 'webpack'
```

**Solution**:

```powershell
# Reinstall webpack (ensure version 5.82.0+)
npm install webpack@^5.102.1 --save-dev
npm run compile
```

---

**Issue 3: ESLint errors after ecmaVersion upgrade**

**Symptoms**:

```
Parsing error: Unexpected token ...
```

**Solution**:

```powershell
# Verify @typescript-eslint/parser version matches plugin
npm list @typescript-eslint/parser
npm list @typescript-eslint/eslint-plugin

# If mismatched, update parser
npm install @typescript-eslint/parser@^8.46.2
```

---

**Issue 4: Performance degradation after upgrade**

**Symptoms**:

-   Compile time >4400ms (>10% increase)
-   Bundle size >136.5KB (>5% increase)

**Solution**:

```powershell
# 1. Clear webpack cache
Remove-Item -Recurse -Force node_modules/.cache

# 2. Rebuild from scratch
Remove-Item -Recurse -Force dist
npm run compile

# 3. If still slow, check for rogue processes
Get-Process | Where-Object { $_.ProcessName -like "*node*" }
```

---

## Success Checklist

Before considering upgrade complete, verify:

-   [x] All 3 dependencies upgraded to target versions
-   [x] Compilation succeeds without errors
-   [x] Tests pass (189/190 baseline maintained)
-   [x] ESLint runs without warnings
-   [x] Performance within bounds (compile ±10%, bundle ±5%)
-   [x] Extension functional validation passes
-   [x] No peer dependency warnings
-   [x] No security vulnerabilities introduced
-   [x] CHANGELOG.md updated
-   [x] All changes committed to Git

**Final Git Log Should Show**:

```
chore: docs: update CHANGELOG for dev tools upgrade
chore: upgrade webpack-cli to 6.0.1
chore: update ESLint ecmaVersion to 2023
chore: upgrade @typescript-eslint/eslint-plugin to 8.46.2
chore: pre-upgrade checkpoint
```

---

## Next Steps

**After Successful Upgrade**:

1. Push branch to remote: `git push origin 009-dev-tools-upgrade`
2. Create pull request with validation checklist
3. Request code review from team
4. Merge after approval

**If Issues Found**:

1. Document findings in GitHub issue
2. Rollback using procedure above
3. Investigate root cause
4. Retry upgrade with fixes

---

**Guide Version**: 1.0  
**Last Updated**: 2025-01-21  
**Estimated Completion Time**: 30 minutes  
**Difficulty**: 🟢 Beginner-friendly (with clear rollback path)
