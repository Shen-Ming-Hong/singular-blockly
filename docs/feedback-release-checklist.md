# Feedback release checklist

This gate must be completed for every release that enables the hosted feedback service. Source-code checks cannot prove publisher-console settings or production infrastructure, so unchecked items block release.

Local evidence below was fully refreshed for version 0.88.0 on 2026-08-26. The current review candidate is `/private/tmp/singular-blockly-feedback-0.88.0-20260826.vsix` (1,085 entries, 6,827,557 bytes) with SHA-256 `ccb0c88011fcc72ce55b0f1c7d1e8951af16a5ce955d2c39b6890a3e22f54a21`. It remains a local temporary artifact and has not been uploaded or published.

## Automated evidence

- [x] `npm run ci:static`（compile、lint、15 語系驗證、i18n 21、release 25、Worker contracts/typecheck、VSIX verifier 6、triage Skill 4、Worker 151 全數通過；Worker test 因沙箱限制改在核准的本機程序重跑一次）
- [x] T233–T235 targeted regression suites（Extension 16、portal 20）
- [x] `npm run feedback:contracts` and `npm run feedback:test` (151 passing)
- [x] `npm run validate:i18n` and `npm run test:i18n` (21 passing)
- [x] `npm run test:unit:ci` (1363 passing, 1 provider-dependent pending) and `npm run test:integration` (9 passing, 3 provider-dependent pending)
- [x] Production VSIX created with the current `@vscode/vsce` and passed to `npm run feedback:verify-vsix -- /private/tmp/singular-blockly-feedback-0.88.0-20260826.vsix` (1,085 entries; SHA-256 `ccb0c88011fcc72ce55b0f1c7d1e8951af16a5ce955d2c39b6890a3e22f54a21`)
- [x] Production VSIX contains the required Blockly, theme, `node-ssh`, and `ssh2` runtime files while excluding `ssh2/test` credential fixtures
- [x] VSIX contains `PRIVACY.md`, `SUPPORT.md`, and `TERMS.md`, and excludes `workers/`, deployment files, tests, Skills, fixtures, and secrets
- [x] Marketplace homepage and hosted `bugs.url` support link return HTTP 200 without authentication; `/privacy`, `/support`, and `/terms` also return 200

## VS Code Marketplace publisher console — manual blockers

- [x] 2026-08-26 publisher console is accessible, `Singular Blockly` 0.87.5 is public under `Singular-Ray`, the Entra managed identity remains a Contributor, and the signed-in maintainer remains Owner
- [x] Candidate listing links to the public, version-matching privacy notice, and the hosted URL returns HTTP 200
- [x] 2026-08-26 Marketplace publisher profile Support is `https://blockly-support.singular-ai.org/support`; the candidate manifest uses the same public `bugs.url`, and the in-product feedback path does not require GitHub
- [x] Candidate listing disclosure points to the public service terms
- [x] Candidate README describes Cloudflare/GitHub processing and the user-initiated support transfer without calling it telemetry
- [ ] Marketplace malware/secret scan completed without suppression of a real credential
- [x] Azure user-assigned managed identity、限制於 `repo:Shen-Ming-Hong/singular-blockly:environment:release` 的 GitHub environment federated credential 與 `release` environment variables 已建立，正式 workflow 已改用 `--azure-credential`
- [x] 已以 `verify_membership=false` 解析 Marketplace User ID `c10b08d9-c997-6e25-b64c-eb0b4e3c6a11`，以 Contributor 加入 `Singular-Ray`，並以 `verify_membership=true` 完成不發布的 `vsce verify-pat Singular-Ray --azure-credential` 驗證（GitHub Actions run `32875470418`）
- [x] Entra workflow 已經 PR #141 squash merge 至 `master`；不發布驗證成功後，舊 repository secret `VSCE_PAT` 與不再需要的 `AZURE_SUBSCRIPTION_ID` 已刪除

Verified Publisher is an optional trust badge rather than an update prerequisite. The current root domain `singular-ai.org` does not resolve and therefore cannot satisfy Marketplace's HTTPS HEAD 200 eligibility rule; do not submit a verification claim until the root domain is live and both the publisher/extension and domain age requirements are met.

The `Singular-Ray` public publisher profile now describes Singular Blockly and links to the public support page and source repository. Domain and Company website remain intentionally blank; no 0.88.0 VSIX was uploaded while updating the profile.

## Open VSX — manual blockers

- [x] 2026-08-26 Open VSX profile reports that the Eclipse Foundation Open VSX Publisher Agreement is signed
- [x] 2026-08-26 `Singular-Ray` namespace exists, contains the current 0.87.5 extension, and lists `Shen-Ming-Hong` / Ray Shen as Owner
- [x] 2026-08-26 created a dedicated `singular-blockly GitHub Actions release environment` token and stored it only as GitHub `release` environment secret `OVSX_PAT`; the legacy repository-level secret was deleted after post-write verification
- [ ] Open VSX secret, blocklist, and namespace-similarity scans pass; no real finding is suppressed
- [ ] Published metadata, icon, license, homepage, support, and policy links render correctly

Token inventory before rotation: Open VSX had one undescribed token created about two months earlier, with no expiry and last accessed six days earlier. GitHub had repository-level `OVSX_PAT` dated 2026-06-30 and no `release` environment `OVSX_PAT`.

Rotation result: the new token was generated in the official Open VSX UI, transferred without logging or writing it to disk, and saved as the sole GitHub Actions `release` environment secret. GitHub API verification confirmed exactly one environment `OVSX_PAT` before the repository-level secret was deleted, then confirmed the repository count was zero and environment count remained one. Both the browser token display and isolated clipboard were cleared. A separate non-publishing `ovsx verify-pat` could not reach `open-vsx.org` from the local command network, so the old Open VSX server-side token remains a temporary rollback credential; revoke that legacy token immediately after the first authorized publish proves the new environment secret works. Do not expose or copy it back into GitHub.

The `Singular-Ray` namespace profile now links to the project homepage, public support page and `Shen-Ming-Hong` GitHub profile, with the reviewed Singular Blockly description.

## Data controller authorization

- [x] 2026-08-26 the project owner explicitly confirmed data-controller authority and accepted the reviewed Cloudflare/GitHub processing, cross-border and backup limits, retention/deletion boundaries, education/minor notice and consent responsibilities, user-entered text/screenshot risk, and anonymous-credential recovery limitation documented in `PRIVACY.md`, `SUPPORT.md`, and `TERMS.md`

## Production feedback service — manual blockers

- [x] `https://blockly-support.singular-ai.org/health`, `/privacy`, `/support`, and `/terms` return the reviewed production version
- [x] D1 and private R2 bindings match `docs/feedback-deployment.md`; no development IDs or placeholder secrets remain
- [x] GitHub App is installed only on the selected private feedback and public product repositories with Metadata read and Issues read/write permissions
- [x] Cloudflare Access protects maintainer attachment access; CORS/origin and webhook repository allowlists match production
- [x] Production create/detail/list/message replay/recovery/private-sync/delete-all smoke passed for `SB-KMYPSBZ4` and `SB-XT89QWE4` (private issues #5/#6); both issues are now content-free `[Deleted feedback]` tombstones with zero comments, and earlier interrupted synthetic issues #3/#4 were also durably cleaned
- [x] D1 migrations through `0004_detached_development_approvals.sql` are applied; current 100% Worker version is `aa5f5203-2ad4-4fd8-97f8-8c57fe10cb70`; public endpoints return 200 and unauthenticated attachment access returns 302
- [x] Deletion preserves a content-free public approval record with `feedback_id` detached and `link_severed_at` recorded; the synthetic public Issue was deleted after verification
- [x] GitHub App webhook `669404259` is active at `/api/v1/github/webhooks`, subscribes only to Issues and Issue comment, uses the same secret as the Worker, and production issue-comment deliveries return 202
- [x] Create, list, detail, message replay, recovery, private sync, status, public-reply, owner approval, delete, delete replay, delete-all, session revocation, and tombstone smoke tests pass; private Issue #10 is locked with zero comments and active synthetic feedback／pending outbox counts are 0
- [x] 2026-08-26 completed a documented Cloudflare deployment rollback drill from `aa5f5203` to `f6ccc71a` and immediately restored `aa5f5203`; both directions kept `/health`, `/privacy`, `/support`, and `/terms` at HTTP 200, and D1 Time Travel was not used

Reviewer: Local Codex（two-round bounded review: `CLEAR`）  Date: 2026-08-26  Release: 0.88.0
