# .github

This repository contains organization-wide community health files and centralized configuration presets for `@bumuellp` repositories.

## Centralized Renovate Configuration

The dependency update policy is defined in [`renovate-config.json`](renovate-config.json).

### Features
- **Base Preset**: Extends `config:best-practices` for high-security defaults and reduced noise.
- **Semantic Commits**: Enforces Conventional Commits (`chore(deps):`, `ci(actions):`, `fix(deps):`) compliant with repository `commit-msg` hooks.
- **Immediate Security Remediation**: Automatically scans GitHub Advisories and Google [OSV.dev](https://osv.dev) (`osvVulnerabilityAlerts`). Vulnerabilities bypass weekly schedules, are marked `[SECURITY]`, and immediately raise remediation PRs without waiting for cooldowns.
- **Lockfile Maintenance**: Weekly scheduled maintenance runs on Monday mornings to refresh transitive lockfile dependencies across `uv.lock` and `package-lock.json`.
- **Pre-commit Grouping**: Groups all pre-commit hook revisions into a single weekly bundle.
- **GitHub Actions Security**: Groups action updates and pins actions by immutable full commit SHA (`pinDigests: true`).
- **Supply Chain Cooldown**: Enforces `"minimumReleaseAge": "3 days"` on non-security updates to protect against zero-day package takeovers.
- **Rate Limiting & Schedule**: Runs on Monday mornings with strict concurrent PR limits (max 5 concurrent PRs, 2 per hour) to prevent CI saturation.
- **Multi-Ecosystem Support**: First-class support for Python (`uv` / `pyproject.toml`), Dockerfiles, `npm`, and pre-commit.

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
