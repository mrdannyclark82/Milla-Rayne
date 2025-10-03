#!/usr/bin/env bash
# Alternative cleanup using BFG Repo-Cleaner (https://rtyley.github.io/bfg-repo-cleaner/)
# Requires: java + bfg-<version>.jar
# WARNING: This rewrites history.

set -euo pipefail

BFG_JAR="${BFG_JAR:-bfg.jar}"

if [ ! -f "$BFG_JAR" ]; then
  echo "Place the BFG jar in this directory or set BFG_JAR=/path/to/bfg.jar" >&2
  exit 1
fi

echo "Creating backup branch 'pre-cleanup-backup'..."
git branch pre-cleanup-backup || true

# Remove big files by size threshold (10MB)
java -jar "$BFG_JAR" --strip-blobs-bigger-than 10M .

# Remove common bulky paths/patterns
cat > .bfg-deletions.txt <<'EOF'
regex:node_modules/.* 
regex:dist/.* 
regex:build/.* 
regex:\.gradle/.*
regex:app/build/.*
regex:\.cxx/.*
regex:captures/.*
regex:.*\.(apk|aab|ipa|mp4|mov|zip|tar|tar\.gz|psd|ai)$
EOF

java -jar "$BFG_JAR" --delete-files --no-blob-protection --replace-text .bfg-deletions.txt .

echo "Cleaning refs and GC..."
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
