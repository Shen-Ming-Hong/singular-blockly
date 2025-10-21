# Upgrade Validation Checklist

**Feature**: 009-dev-tools-upgrade  
**Purpose**: Contract for validating successful dependency upgrades  
**Date**: 2025-01-21

---

## Pre-Upgrade Verification

### Environment Checks

-   [ ] **Node.js Version**: `node --version` shows 22.16.0 or higher
-   [ ] **npm Version**: `npm --version` shows 10.x or higher
-   [ ] **Git Status**: `git status` shows no uncommitted changes
-   [ ] **Working Directory**: Current directory is project root (`E:\singular-blockly`)
-   [ ] **Dependencies Installed**: `node_modules/` folder exists and is complete

**Command**:

```powershell
# Verify environment
node --version  # Should output: v22.16.0 or higher
npm --version   # Should output: 10.x or higher
git status      # Should show: working tree clean
```

---

### Baseline Metrics Capture

-   [ ] **Current Versions Recorded**: Run `npm list --depth=0` and save output
-   [ ] **Compile Time Baseline**: Run `npm run compile` 3 times, record average duration
-   [ ] **Bundle Size Baseline**: Check `dist/extension.js` file size (should be ~130KB)
-   [ ] **Test Status Baseline**: Run `npm test`, record pass/fail count (189/190 expected)

**Commands**:

```powershell
# Capture baselines
npm list --depth=0 > pre-upgrade-versions.txt
Measure-Command { npm run compile } | Select-Object TotalMilliseconds
(Get-Item dist/extension.js).Length / 1KB
npm test
```

**Expected Baselines**:

-   Compile Time: ~4000ms ±10%
-   Bundle Size: ~130KB ±5%
-   Tests: 189/190 passing (1 known failure)

---

### Backup Creation

-   [ ] **Git Commit**: All changes committed with message "chore: pre-upgrade checkpoint"
-   [ ] **Branch Backup**: Tag current state as `pre-009-upgrade`
-   [ ] **package.json Backup**: Copy to `package.json.backup`
-   [ ] **package-lock.json Backup**: Copy to `package-lock.json.backup`

**Commands**:

```powershell
# Create backups
git add .
git commit -m "chore: pre-upgrade checkpoint"
git tag pre-009-upgrade
Copy-Item package.json package.json.backup
Copy-Item package-lock.json package-lock.json.backup
```

---

## Upgrade Execution

### Phase 1: @typescript-eslint/eslint-plugin 8.46.2

-   [ ] **Install Package**: `npm install @typescript-eslint/eslint-plugin@8.46.2`
-   [ ] **Verify Version**: Check `package.json` shows `"@typescript-eslint/eslint-plugin": "^8.46.2"`
-   [ ] **Verify Lock File**: Check `package-lock.json` has `@typescript-eslint/eslint-plugin@8.46.2`
-   [ ] **No Peer Warnings**: npm install output shows no peer dependency warnings
-   [ ] **Compile Succeeds**: `npm run compile` exits with code 0
-   [ ] **Tests Pass**: `npm test` shows 189/190 passing (baseline maintained)
-   [ ] **ESLint Passes**: Run `npx eslint src/ --max-warnings=0` with no errors
-   [ ] **Git Commit**: Commit with message "chore: upgrade @typescript-eslint/eslint-plugin to 8.46.2"

**Commands**:

```powershell
npm install @typescript-eslint/eslint-plugin@8.46.2
npm run compile
npm test
npx eslint src/ --max-warnings=0
git add package.json package-lock.json
git commit -m "chore: upgrade @typescript-eslint/eslint-plugin to 8.46.2"
```

---

### Phase 2: ESLint ecmaVersion 2023

-   [ ] **File Located**: Open `eslint.config.mjs` in editor
-   [ ] **Property Found**: Locate `languageOptions.ecmaVersion: 2022`
-   [ ] **Value Updated**: Change to `languageOptions.ecmaVersion: 2023`
-   [ ] **File Saved**: Save `eslint.config.mjs`
-   [ ] **ESLint Passes**: Run `npx eslint src/ --max-warnings=0` with no errors
-   [ ] **Compile Succeeds**: `npm run compile` exits with code 0
-   [ ] **Tests Pass**: `npm test` shows 189/190 passing (baseline maintained)
-   [ ] **Git Commit**: Commit with message "chore: update ESLint ecmaVersion to 2023"

**Commands**:

```powershell
# Manual: Edit eslint.config.mjs line ~17: ecmaVersion: 2023
npx eslint src/ --max-warnings=0
npm run compile
npm test
git add eslint.config.mjs
git commit -m "chore: update ESLint ecmaVersion to 2023"
```

**File Change**:

```javascript
// eslint.config.mjs (around line 17)
languageOptions: {
  ecmaVersion: 2023,  // Changed from 2022
  sourceType: 'module',
  globals: globals.node,
}
```

---

### Phase 3: webpack-cli 6.0.1

**Pre-Flight Checks**:

-   [ ] **Audit Scripts**: Review `package.json` scripts for `--define-process-env-node-env` (none expected)
-   [ ] **Audit webpack.config.js**: Review for CLI option references (none expected)

**Upgrade Steps**:

-   [ ] **Install Package**: `npm install webpack-cli@6.0.1 --save-dev`
-   [ ] **Verify Version**: Check `package.json` shows `"webpack-cli": "^6.0.1"`
-   [ ] **Verify Lock File**: Check `package-lock.json` has `webpack-cli@6.0.1`
-   [ ] **No Peer Warnings**: npm install output shows no peer dependency warnings
-   [ ] **Compile Succeeds**: `npm run compile` exits with code 0
-   [ ] **Watch Mode Works**: `npm run watch` starts without errors (Ctrl+C to stop)
-   [ ] **Tests Pass**: `npm test` shows 189/190 passing (baseline maintained)
-   [ ] **Git Commit**: Commit with message "chore: upgrade webpack-cli to 6.0.1"

**Commands**:

```powershell
# Audit phase
Get-Content package.json | Select-String "--define-process-env-node-env"  # Should return empty
Get-Content webpack.config.js | Select-String "--define-process-env-node-env"  # Should return empty

# Upgrade phase
npm install webpack-cli@6.0.1 --save-dev
npm run compile
npm run watch  # Verify starts, then Ctrl+C
npm test
git add package.json package-lock.json
git commit -m "chore: upgrade webpack-cli to 6.0.1"
```

---

## Post-Upgrade Validation

### Performance Benchmarks

-   [ ] **Compile Time Measured**: Run `npm run compile` 3 times, calculate average
-   [ ] **Compile Time Within Bounds**: Average is within 3600-4400ms (baseline 4000ms ±10%)
-   [ ] **Bundle Size Measured**: Check `dist/extension.js` file size
-   [ ] **Bundle Size Within Bounds**: Size is within 123.5-136.5KB (baseline 130KB ±5%)
-   [ ] **Test Duration Measured**: Record total test execution time
-   [ ] **Test Duration Within Bounds**: Duration is <3000ms (hard limit)

**Commands**:

```powershell
# Measure compile time (run 3 times, average results)
Measure-Command { npm run compile } | Select-Object TotalMilliseconds

# Measure bundle size
(Get-Item dist/extension.js).Length / 1KB

# Measure test duration (from npm test output)
npm test  # Check "Time:" line in output
```

**Acceptance Criteria**:
| Metric | Baseline | Tolerance | Min | Max | Status |
|--------------|----------|-----------|---------|----------|--------|
| Compile Time | 4000ms | ±10% | 3600ms | 4400ms | [ ] |
| Bundle Size | 130KB | ±5% | 123.5KB | 136.5KB | [ ] |
| Test Duration| <3000ms | Hard limit| - | 3000ms | [ ] |

---

### Functional Validation

-   [ ] **Extension Loads**: Press F5 in VSCode, Extension Development Host opens
-   [ ] **Command Palette**: Run "Singular Blockly: Open Editor" command
-   [ ] **WebView Renders**: Blockly editor displays with toolbox
-   [ ] **Block Creation**: Drag a block from toolbox to workspace
-   [ ] **Code Generation**: Generated Arduino code appears in preview pane
-   [ ] **Board Selection**: Change board from dropdown (e.g., Arduino Uno → ESP32)
-   [ ] **Theme Toggle**: Switch between light and dark themes
-   [ ] **File Save**: Save workspace to `blockly/main.json`
-   [ ] **File Load**: Close and reopen editor, workspace state restored

---

### Dependency Verification

-   [ ] **No Duplicate Packages**: Run `npm ls @typescript-eslint/eslint-plugin` shows single version
-   [ ] **No Duplicate webpack-cli**: Run `npm ls webpack-cli` shows single version
-   [ ] **No Peer Warnings**: Run `npm install` (no arguments) shows no warnings
-   [ ] **Lockfile Consistent**: Run `npm ci` succeeds without modifications
-   [ ] **Audit Clean**: Run `npm audit` shows no high/critical vulnerabilities

**Commands**:

```powershell
npm ls @typescript-eslint/eslint-plugin
npm ls webpack-cli
npm install
npm ci
npm audit
```

---

### Documentation Updates

-   [ ] **CHANGELOG.md Updated**: Add entry under "Unreleased" or next version
-   [ ] **package.json Verified**: All version numbers correct
-   [ ] **README.md Checked**: No version-specific references need updating

**CHANGELOG.md Entry**:

```markdown
## [Unreleased]

### Changed

-   Upgraded `@typescript-eslint/eslint-plugin` from 8.46.1 to 8.46.2 (bug fixes)
-   Upgraded `webpack-cli` from 5.1.4 to 6.0.1 (major version, Node.js 18+ required)
-   Updated ESLint `ecmaVersion` from 2022 to 2023 for ES2023 syntax support

### Performance

-   Compile time: [ACTUAL]ms (baseline 4000ms ±10%)
-   Bundle size: [ACTUAL]KB (baseline 130KB ±5%)
-   Test suite: 189/190 passing (1 known failure - baseline maintained)
```

---

## Rollback Procedure

### If Validation Fails

**Immediate Rollback**:

```powershell
# Restore backups
git reset --hard pre-009-upgrade
Copy-Item package.json.backup package.json -Force
Copy-Item package-lock.json.backup package-lock.json -Force
npm ci
npm run compile
npm test
```

**Verification After Rollback**:

-   [ ] **Versions Restored**: `npm list --depth=0` matches `pre-upgrade-versions.txt`
-   [ ] **Compile Works**: `npm run compile` succeeds
-   [ ] **Tests Pass**: `npm test` shows 189/190 passing
-   [ ] **Extension Works**: Manual functional test passes

---

## Success Criteria Summary

✅ **All Criteria Met**:

-   [ ] All 3 dependencies upgraded to target versions
-   [ ] All compilation and tests passing (189/190 baseline)
-   [ ] Performance within acceptable bounds (compile time ±10%, bundle size ±5%)
-   [ ] No new ESLint errors introduced
-   [ ] Extension functional validation passes
-   [ ] No peer dependency warnings
-   [ ] Documentation updated (CHANGELOG.md)

**Final Sign-off**:

-   Date: ******\_\_\_******
-   Validated by: ******\_\_\_******
-   Git commit SHA: ******\_\_\_******
-   Status: ✅ APPROVED / ❌ REJECTED

---

**Contract Version**: 1.0  
**Last Updated**: 2025-01-21  
**Maintained by**: singular-blockly development team
