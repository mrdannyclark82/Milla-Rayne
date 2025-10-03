#!/usr/bin/env bash
# Rewrites history to purge heavy files and common bulky paths.
# Requires: pip install git-filter-repo (https://github.com/newren/git-filter-repo)
# WARNING: This rewrites history. Coordinate with collaborators. Make backups.

set -euo pipefail

if ! command -v git-filter-repo >/dev/null 2>&1; then
  echo "Please install git-filter-repo first." >&2
  exit 1
fi

echo "Creating backup branch 'pre-cleanup-backup'..."
git branch pre-cleanup-backup || true

echo "Purging common heavy paths and stripping blobs > 10MB..."
git filter-repo --force \
  --strip-blobs-bigger-than 10M \
  --path node_modules/ \
  --path dist/ \
  --path build/ \
  --path .gradle/ \
  --path app/build/ \
  --path .cxx/ \
  --path captures/ \
  --path-glob '*.apk' \
  --path-glob '*.aab' \
  --path-glob '*.ipa' \
  --path-glob '*.mp4' \
  --path-glob '*.mov' \
  --path-glob '*.zip' \
  --path-glob '*.tar' \
  --path-glob '*.tar.gz' \
  --path-glob '*.psd' \
  --path-glob '*.ai' \
  --invert-paths

echo "Pruning and GC..."
git reflog expire --expire-unreachable=now --all
git gc --prune=now --aggressive || true

cat <<'EONOTE'

Next steps (will rewrite remote history):
  1) Temporarily disable branch protection or allow force-push.
  2) Force-push:   git push --force --all && git push --force --tags
  3) Ask collaborators to re-clone or hard reset to the new history.
  4) Re-enable protections.

If you see missing assets you intended to keep, reset:
  git reset --hard pre-cleanup-backup
EONOTE
