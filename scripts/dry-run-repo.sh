#!/usr/bin/env bash
# On-demand full GitHub dry-run helper for testing Renovate PRs, grouping,
# packageRules precedence, and automerge behavior without writing to GitHub.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/dry-run-repo.sh [owner/repo] [report-json-path]

Examples:
  ./scripts/dry-run-repo.sh bumuellp/mine-my-own-bum
  ./scripts/dry-run-repo.sh bumuellp/dot-github /tmp/renovate-dry-run.json

Environment variables:
  RENOVATE_TOKEN / GITHUB_TOKEN  GitHub token (falls back to 'gh auth token')
  RENOVATE_BIN                   Explicit path to renovate CLI binary
  LOG_LEVEL                      Renovate log level (default: debug)
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

TARGET_REPO="${1:-bumuellp/.github}"
REPORT_PATH="${2:-}"

resolve_renovate_bin() {
  if [[ -n "${RENOVATE_BIN:-}" && -x "${RENOVATE_BIN}" ]]; then
    printf '%s\n' "${RENOVATE_BIN}"
    return 0
  fi

  if command -v renovate >/dev/null 2>&1; then
    command -v renovate
    return 0
  fi

  local cached
  cached="$(find "${HOME}/.cache/pre-commit" -maxdepth 4 -path '*/node_env-*/bin/renovate' -type f 2>/dev/null | head -n 1 || true)"
  if [[ -n "${cached}" && -x "${cached}" ]]; then
    printf '%s\n' "${cached}"
    return 0
  fi

  return 1
}

TOKEN="${RENOVATE_TOKEN:-${GITHUB_TOKEN:-}}"
if [[ -z "${TOKEN}" ]]; then
  if command -v gh >/dev/null 2>&1; then
    TOKEN="$(gh auth token)"
  else
    echo "Error: Set RENOVATE_TOKEN / GITHUB_TOKEN or authenticate with 'gh auth login'." >&2
    exit 1
  fi
fi

ARGS=(
  "--platform=github"
  "--token=${TOKEN}"
  "--dry-run=full"
  "--print-config=true"
  "--repository-cache=reset"
)

if [[ -n "${REPORT_PATH}" ]]; then
  ARGS+=("--report-type=file" "--report-path=${REPORT_PATH}")
fi

ARGS+=("${TARGET_REPO}")

export LOG_LEVEL="${LOG_LEVEL:-debug}"

if RENOVATE_CMD="$(resolve_renovate_bin)"; then
  exec "${RENOVATE_CMD}" "${ARGS[@]}"
fi

exec npx --yes renovate@44.93.5 "${ARGS[@]}"
