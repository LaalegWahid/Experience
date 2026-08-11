#!/usr/bin/env bash
#
# Copy the whole project into ./staging (honoring .gitignore), then publish that
# snapshot to the `develop` branch of the SAME GitHub repo the deploy script
# pushes to. Use this for the test/staging Vercel deploy (NEXT_PUBLIC_APP_ENV=test):
# same code as production, just a different branch so Vercel can build it with
# staging env vars.
#
# "Honoring .gitignore" is delegated to git itself rather than re-parsing the
# ignore rules: we copy every file git considers part of the working tree —
# tracked files plus untracked files that are NOT ignored. Ignored paths
# (node_modules, .next, .env*, *.tsbuildinfo, …) are therefore skipped, and so
# is .git, the deploy/ folder and the staging/ folder itself.
#
# WARNING: the publish step runs `git push --force`, which REPLACES the target
# branch's history with this snapshot. Override the target with env vars if needed:
#   DEPLOY_REMOTE=… DEPLOY_BRANCH=… ./copy-to-staging.sh
set -euo pipefail

# Where the snapshot is published (force-pushed). Same repo as the production
# deploy, but the `develop` branch by default. Override via env if needed.
DEPLOY_REMOTE="${DEPLOY_REMOTE:-https://github.com/LaalegWahid/Experience.git}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-develop}"

# Run from the repository root regardless of where the script is invoked from.
cd "$(git rev-parse --show-toplevel)"
# Re-read the root via pwd so its path format matches the shell's (avoids the
# C:/… vs /c/… mismatch between git and MSYS/Git Bash on Windows).
ROOT="$(pwd)"

DEST="staging"

# This script's own path relative to the repo root, so it can exclude itself
# from the copy (the staging artifact shouldn't carry its own build tooling).
SELF_REL="$(basename "${BASH_SOURCE[0]}")"
SELF_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ "$SELF_DIR" != "$ROOT" ] && SELF_REL="${SELF_DIR#"$ROOT"/}/$SELF_REL"

# Start from a clean target so removed files don't linger across runs.
rm -rf "$DEST"
mkdir -p "$DEST"

count=0
# -z / -d '' use NUL separators so paths with spaces or newlines are safe.
#   --cached          → tracked files
#   --others          → untracked files
#   --exclude-standard→ apply .gitignore / .git/info/exclude / global excludes
while IFS= read -r -d '' file; do
  # Defensive: never copy the destination into itself.
  case "$file" in
    "$DEST"/*) continue ;;
  esac
  # Skip this script itself and its sibling deploy script (build tooling).
  if [ "$file" = "$SELF_REL" ]; then continue; fi
  case "$file" in
    copy-to-deploy.sh|copy-to-staging.sh) continue ;;
  esac
  mkdir -p "$DEST/$(dirname "$file")"
  cp -p "$file" "$DEST/$file"
  count=$((count + 1))
done < <(git ls-files -z --cached --others --exclude-standard)

echo "Copied $count file(s) into $ROOT/$DEST"

# ---------------------------------------------------------------------------
# Publish: make staging/ a fresh single-commit repo and force-push it to the
# develop branch, replacing that branch's contents with this snapshot.
# staging/.git is recreated every run (staging/ is wiped above), so each publish
# is a clean one-commit history.
# ---------------------------------------------------------------------------
cd "$DEST"

git init -q
git add -A
git commit -q -m "Staging snapshot $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git branch -M "$DEPLOY_BRANCH"
git remote add origin "$DEPLOY_REMOTE"

echo "Force-pushing snapshot to $DEPLOY_REMOTE ($DEPLOY_BRANCH)…"
git push --force origin "$DEPLOY_BRANCH"

echo "Done."
