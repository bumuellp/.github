# .github

This repository contains organization-wide community health files and centralized configuration presets for `@bumuellp` repositories.

## Centralized Renovate Configuration

The dependency update policy is defined in [`renovate-config.json`](renovate-config.json).

### Features
- **Base Preset & Built-in Managers**: Extends `config:best-practices` (which enables the Dependency Dashboard, Docker/GitHub Actions digest pinning, devDependency pinning, config migration, and abandonment checks), `:enablePreCommit` (enables the opt-in `pre-commit` manager), and `customManagers:dockerfileVersions` for `# renovate:` annotations in Dockerfiles.
- **Semantic Commits**: Enforces Conventional Commits (`chore(...)`, `ci(actions):`, `build(docker):`, `fix(deps):`) via `:semanticCommits` to satisfy repository `commit-msg` hooks.
- **Schedule & Lifecycle**: Runs Monday mornings (`before 6am on monday`, `Europe/Berlin`) with `updateNotScheduled: true` so already-open PRs stay current mid-week, `internalChecksFilter: "strict"`, and `prCreation: "not-pending"` to avoid opening PRs while checks are pending. Concurrent PRs are capped at 5 (2/hour).
- **Supply Chain Cooldown**: Enforces `"minimumReleaseAge": "3 days"` on third-party updates, while exempting security alerts and trusted `bumuellp/*` repositories, actions, hooks, and container images (`minimumReleaseAge: null`).
- **Low-Risk Automerge & Clean Reviews**:
  - Uses `platformAutomerge: true` (native GitHub auto-merge where available, falling back to Renovate-managed merge on GitHub Free private repos), with `assigneesFromCodeOwners: true` and `reviewersFromCodeOwners: true` (Renovate automatically skips requesting reviewers on automerged PRs unless checks fail).
  - Automerges non-major updates (`minor`, `patch`, `pin`, `digest`) across `pre-commit`, `github-actions`, `pep621`/`uv`, `mise`, `dockerfile`/`docker-compose` (keeping Python minor runtime tag upgrades in a separate PR), `npm`, non-breaking `cargo`, and `custom.regex` managers.
  - Keeps `major` updates, breaking `0.x` Cargo crates, `github-rest-api`, and `lockFileMaintenance` non-automerged, gating `major`/breaking updates behind `dependencyDashboardApproval: true`.
- **Immediate Security Remediation**: Scans GitHub Advisories and Google [OSV.dev](https://osv.dev) (`osvVulnerabilityAlerts` + dashboard summary). Security fixes bypass weekly schedules and cooldowns (`minimumReleaseAge: null`).
- **Weekly Lockfile Maintenance**: Runs Monday mornings (`before 6am on monday`) with `automerge: false` to refresh transitive dependencies.
- **Custom Managers & Datasources**:
  - OpenTofu `.tftpl` compose files (`(?:docker-)?compose*.ya?ml.tftpl`) for hardcoded container images and optional digests.
  - `# renovate: datasource=... depName=...` annotations in YAML files (both inline and preceding-line formats, without interfering with repo-local custom datasources omitting `depName=`).
  - `.tofu-version` files tracked against `opentofu/opentofu` GitHub releases.
  - `.github-api-version` files tracked against `https://api.github.com/versions` via custom datasource `github-api-versions` (labeled `api-breaking-change`).
- **Multi-Ecosystem Support**: `uv`/`pep621`, `npm`, `cargo`, `mise`, `dockerfile`, `docker-compose`, `github-actions`, `pre-commit`, and custom regex/Dockerfile annotations.

### How to use in child repositories

Create a `.github/renovate.json` in the repository:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "github>bumuellp/.github:renovate-config"
  ]
}
```

For `platformAutomerge: true` to use GitHub's native auto-merge on public or paid private repos, enable **Allow auto-merge** in the repository's **Settings > General > Pull Requests** (otherwise Renovate falls back to merging on its next run once checks pass).

### Testing & Verification

1. **Automated Pre-Commit & CI Checks**:
   - `renovate-config-validator` validates JSON schema and preset syntax.
   - `renovate-extract-test` runs [`scripts/test-renovate-extract.mjs`](scripts/test-renovate-extract.mjs) (`node --test`) using Renovate (`--platform=local --dry-run=extract`) offline against synthetic fixtures in [`tests/fixtures/`](tests/fixtures/) to verify every built-in and custom regex manager extracts the expected dependencies.
   - Run locally:
     ```bash
     pre-commit run --all-files
     ```
2. **On-Demand Full GitHub Dry-Run**:
   - Use [`scripts/dry-run-repo.sh`](scripts/dry-run-repo.sh) to inspect resolved `packageRules` (`--print-config=true`) and simulate PRs, groups, and `automerge` decisions against any repository without creating branches or PRs:
     ```bash
     ./scripts/dry-run-repo.sh bumuellp/mine-my-own-bum
     ```
   - To test preset changes from a branch before merging to `main`, temporarily reference `"github>bumuellp/.github:renovate-config#<branch>"` in the target repo's `.github/renovate.json` when running the dry-run.
