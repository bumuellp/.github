# .github

This repository contains organization-wide community health files and centralized configuration presets for `@bumuellp` repositories.

## Centralized Renovate Configuration

The dependency update policy is defined in [`renovate-config.json`](renovate-config.json).

### Features
- **Semantic Commits**: Enforces Conventional Commits (`chore(deps):`, `ci(actions):`, etc.) compatible with repository `commit-msg` hooks.
- **Pre-commit Grouping**: Groups all pre-commit hook revisions into a single weekly bundle.
- **GitHub Actions Security**: Groups action updates and pins by immutable full commit SHA (`pinDigests: true`).
- **Supply Chain Cooldown**: Waits 3 days (`minimumReleaseAge: 3 days`) after a package is published before opening non-critical PRs to protect against hijacked packages.
- **Rate Limiting & Schedule**: Runs on Monday mornings with strict concurrent PR limits to prevent CI saturation.
- **Multi-Ecosystem Support**: Out-of-the-box support for `uv` (Python), Docker, `npm`, and pre-commit.

### How to use in child repositories

Create a `.github/renovate.json` (or `renovate.json`) in the repository:

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "github>bumuellp/.github:renovate-config"
  ]
}
```
