#!/usr/bin/env node
/**
 * Offline extraction testbench for renovate-config.json.
 * Runs Renovate (--platform=local --dry-run=extract) against synthetic
 * fixtures in tests/fixtures/ and asserts expected dependencies are captured.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = join(REPO_ROOT, "renovate-config.json");
const FIXTURES_DIR = join(REPO_ROOT, "tests", "fixtures");

function findRenovateBin() {
  if (process.env.RENOVATE_BIN && existsSync(process.env.RENOVATE_BIN)) {
    return process.env.RENOVATE_BIN;
  }

  for (const dir of (process.env.PATH ?? "").split(":")) {
    const candidate = join(dir, "renovate");
    if (dir && existsSync(candidate)) {
      return candidate;
    }
  }

  const preCommitCache = join(homedir(), ".cache", "pre-commit");
  if (existsSync(preCommitCache)) {
    for (const entry of readdirSync(preCommitCache, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const repoDir = join(preCommitCache, entry.name);
      for (const sub of readdirSync(repoDir, { withFileTypes: true })) {
        if (!sub.isDirectory() || !sub.name.startsWith("node_env-")) {
          continue;
        }
        const candidate = join(repoDir, sub.name, "bin", "renovate");
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  }

  throw new Error(
    "Could not find 'renovate' binary. Run via 'pre-commit run renovate-extract-test --all-files' or set RENOVATE_BIN."
  );
}

const EXPECTED = [
  {
    manager: "regex",
    packageFile: "config/settings.yaml",
    depName: "itzg/minecraft-server",
    currentValue: "2026.10.0",
    datasource: "docker",
  },
  {
    manager: "regex",
    packageFile: "config/settings.yaml",
    depName: "ghcr.io/bumuellp/mc-agent",
    currentValue: "0.1.0",
    currentDigest:
      "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    datasource: "docker",
  },
  {
    manager: "regex",
    packageFile: ".github/actions/sample/action.yml",
    depName: "hetznercloud/cli",
    currentValue: "v1.70.2",
    datasource: "github-releases",
  },
  {
    manager: "regex",
    packageFile: ".github/actions/sample/action.yml",
    depName: "pre-commit",
    currentValue: "4.6.2",
    datasource: "pypi",
  },
  {
    manager: "github-actions",
    packageFile: ".github/actions/sample/action.yml",
    depName: "actions/checkout",
    currentValue: "v7",
    datasource: "github-tags",
  },
  {
    manager: "dockerfile",
    packageFile: "images/Dockerfile",
    depName: "debian",
    currentValue: "trixie-slim",
    datasource: "docker",
  },
  {
    manager: "regex",
    packageFile: "images/Dockerfile",
    depName: "golang.org/x/text",
    currentValue: "v0.44.0",
    datasource: "go",
  },
  {
    manager: "regex",
    packageFile: "images/Dockerfile",
    depName: "kubernetes-sigs/kustomize",
    currentValue: "v5.8.1",
    extractVersion: "^kustomize/(?<version>.+)$",
    datasource: "github-releases",
  },
  {
    manager: "regex",
    packageFile: "images/Dockerfile",
    depName: "jqlang/jq",
    currentValue: "1.7.1",
    extractVersion: "^jq-(?<version>.+)$",
    datasource: "github-releases",
  },
  {
    manager: "cargo",
    packageFile: "Cargo.toml",
    depName: "serde",
    currentValue: "1.0.219",
    datasource: "crate",
  },
  {
    manager: "npm",
    packageFile: "package.json",
    depName: "oxlint",
    currentValue: "^1.94.0",
    datasource: "npm",
  },
  {
    manager: "poetry",
    packageFile: "pyproject.toml",
    depName: "httpx",
    currentValue: ">=0.28.1",
    datasource: "pypi",
  },
  {
    manager: "mise",
    packageFile: "mise.toml",
    depName: "uv",
    currentValue: "0.13.5",
    datasource: "github-releases",
  },
  {
    manager: "regex",
    packageFile: "iac/templates/docker-compose.yml.tftpl",
    depName: "ghcr.io/bumuellp/mc-agent",
    currentValue: "0.1.0",
    datasource: "docker",
  },
  {
    manager: "regex",
    packageFile: "iac/templates/docker-compose.yml.tftpl",
    depName: "postgres",
    currentValue: "16.4-alpine",
    datasource: "docker",
  },
  {
    manager: "docker-compose",
    packageFile: "compose.yaml",
    depName: "caddy",
    currentValue: "2.8.4",
    datasource: "docker",
  },
  {
    manager: "regex",
    packageFile: ".tofu-version",
    depName: "opentofu/opentofu",
    currentValue: "1.10.6",
    datasource: "github-releases",
  },
  {
    manager: "regex",
    packageFile: ".github-api-version",
    depName: "github-rest-api",
    currentValue: "2022-11-28",
    datasource: "custom.github-api-versions",
  },
  {
    manager: "pre-commit",
    packageFile: ".pre-commit-config.yaml",
    depName: "pre-commit/pre-commit-hooks",
    currentValue: "v5.0.0",
    datasource: "github-tags",
  },
];

describe("Renovate fixture extraction", () => {
  let workRoot;
  let packageFiles;

  before(() => {
    const renovateBin = findRenovateBin();
    workRoot = mkdtempSync(join(tmpdir(), "renovate-extract-test-"));
    const fixtureWorkdir = join(workRoot, "repo");
    const reportPath = join(workRoot, "report.json");

    cpSync(FIXTURES_DIR, fixtureWorkdir, { recursive: true });
    writeFileSync(
      join(fixtureWorkdir, "renovate.json"),
      readFileSync(CONFIG_PATH, "utf8")
    );

    execFileSync(
      renovateBin,
      [
        "--platform=local",
        "--dry-run=extract",
        "--repository-cache=reset",
        "--report-type=file",
        `--report-path=${reportPath}`,
      ],
      {
        cwd: fixtureWorkdir,
        env: { ...process.env, LOG_LEVEL: "error" },
        stdio: "inherit",
      }
    );

    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    packageFiles = report.repositories?.local?.packageFiles ?? {};
  });

  after(() => {
    if (workRoot) {
      rmSync(workRoot, { recursive: true, force: true });
    }
  });

  for (const exp of EXPECTED) {
    test(`extracts ${exp.depName}=${exp.currentValue} from ${exp.packageFile} (${exp.manager})`, () => {
      const files = packageFiles[exp.manager] ?? [];
      const fileEntry = files.find((f) => f.packageFile === exp.packageFile);
      assert.ok(
        fileEntry,
        `Missing file '${exp.packageFile}' under manager '${exp.manager}'`
      );

      const dep = (fileEntry.deps ?? []).find(
        (d) =>
          d.depName === exp.depName &&
          d.currentValue === exp.currentValue &&
          d.datasource === exp.datasource &&
          (!exp.currentDigest || d.currentDigest === exp.currentDigest) &&
          (!exp.extractVersion || d.extractVersion === exp.extractVersion)
      );
      assert.ok(
        dep,
        `Missing dep ${exp.depName}=${exp.currentValue} (${exp.datasource}) in ${exp.manager}:${exp.packageFile}`
      );
    });
  }

  test("does not hijack datasource annotations without depName= (e.g. mojang-java)", () => {
    const settingsDeps = (packageFiles.regex ?? [])
      .filter((f) => f.packageFile === "config/settings.yaml")
      .flatMap((f) => f.deps ?? []);
    assert.equal(
      settingsDeps.some((d) => d.currentValue === "26.3"),
      false,
      "datasource without depName= should remain untouched"
    );
  });
});
