#!/usr/bin/env bash
# Audits working tree heft and historical blob sizes. Outputs audit_report.txt
set -euo pipefail

OUT="audit_report.txt"
echo "Repo storage audit ($(date -u))" > "$OUT"
echo "===============================" >> "$OUT"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run from inside a Git repository." >&2
  exit 1
fi

# 1) Largest historical blobs (top 50)
echo -e "\n[Top 50 largest blobs in history]" >> "$OUT"
TMP_ALLOBJ="$(mktemp)"
git rev-list --objects --all > "$TMP_ALLOBJ"

# Build SHA -> path map
# Get sizes for blobs only
TMP_BLOBS="$(mktemp)"
cut -d' ' -f1 "$TMP_ALLOBJ" | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize)' \
  | awk '$1=="blob"{print $3" "$2}' \
  | sort -nr | head -n 50 > "$TMP_BLOBS"

# Join sizes with paths
echo -e "size_bytes\tsha\tpath" >> "$OUT"
while read -r size sha; do
  path=$(grep "^$sha " "$TMP_ALLOBJ" | head -n1 | cut -d' ' -f2-)
  echo -e "${size}\t${sha}\t${path}" >> "$OUT"
done < "$TMP_BLOBS"

rm -f "$TMP_ALLOBJ" "$TMP_BLOBS"

# 2) Largest directories in current working tree (top level)
echo -e "\n[Largest directories (top-level, working tree)]" >> "$OUT"
# Portable du (reports apparent size, best-effort across OS)
du -sh -- * 2>/dev/null | sort -hr | head -n 50 >> "$OUT" || true

# 3) Largest tracked files in HEAD (top 50)
echo -e "\n[Top 50 largest tracked files in HEAD]" >> "$OUT"
git ls-files -z | xargs -0 -I{} sh -c 'printf "%s\t%s\n" "$(wc -c < "{}")" "{}"' \
  | sort -nr | head -n 50 \
  | awk -F'\t' '{printf "%s\t%s\n",$1,$2}' >> "$OUT"

# 4) Git LFS overview (if present)
echo -e "\n[Git LFS files]" >> "$OUT"
if command -v git-lfs >/dev/null 2>&1 && git lfs env >/dev/null 2>&1; then
  git lfs ls-files >> "$OUT" || echo "No LFS files found" >> "$OUT"
else
  echo "git-lfs not installed or not configured" >> "$OUT"
fi

echo -e "\nDone. See $OUT" && echo "Wrote $OUT"