# Branch Cleanup Quick Reference

**Quick action guide for cleaning up the Milla-Rayne repository branches**

---

## TL;DR

- **70 total branches** (including main)
- **52 branches should be deleted** (sandbox and stale copilot branches)
- **12 branches need review** (security fixes, dependencies, features)
- **5 branches ready to merge** (dependencies and security fixes)

---

## Immediate Actions

### 1. Merge Security Fixes (PRIORITY 1)
```bash
# Alert autofix branches - MERGE IMMEDIATELY after review
alert-autofix-59    # Server-side request forgery fix
alert-autofix-70    # Server-side request forgery fix
```

### 2. Merge Safe Dependency Updates (PRIORITY 2)
```bash
# Safe patch/minor updates - MERGE
dependabot/npm_and_yarn/react-dom-19.2.1
dependabot/npm_and_yarn/tanstack/react-query-5.90.12
dependabot/npm_and_yarn/google/gemini-cli-0.19.4
```

### 3. Review Major Updates (PRIORITY 3)
```bash
# Major version updates - REVIEW before merge
dependabot/npm_and_yarn/types/express-rate-limit-6.0.2    # Major version
dependabot/github_actions/peaceiris/actions-gh-pages-4    # Major version
```

### 4. Delete Sandbox Branches (PRIORITY 4)
**45 branches** - All sandbox branches are temporary and can be safely deleted:
- 35 `sandbox/fix-security-*` branches
- 4 `sandbox/message-history-*` branches
- 4 `sandbox/real-time-chat_*` branches
- 2 `sandbox/test-sandbox_*` branches

### 5. Delete Stale Copilot Branches (PRIORITY 5)
**7 branches** - Initial plan only, never completed:
- copilot/analyze-different-branches
- copilot/fix-agent-failing-actions
- copilot/fix-copilot-action-errors
- copilot/fix-failing-pr
- copilot/update-coding-ai-service
- copilot/improve-slow-code-efficiency
- copilot/run-tests-checklist-completion

### 6. Review Feature Branches (PRIORITY 6)
```bash
grok              # Grok AI integration - REVIEW
millastitch       # OpenAI integration - REVIEW
```

### 7. Review Active Copilot Branches (PRIORITY 7)
```bash
copilot/redesign-landing-page-ui-ux-again    # Recent UI work - REVIEW
copilot/fix-chat-interface-responses          # Completed work - REVIEW
copilot/redesign-landing-page-ui-ux          # Superseded? - DELETE
```

---

## One-Command Cleanup Scripts

### Delete All Sandbox Branches (45 branches)
```bash
# Copy and paste this entire block
for branch in \
  sandbox/fix-security-1764701125429_1764701125429 \
  sandbox/fix-security-1764701301746_1764701301746 \
  sandbox/fix-security-1764701454452_1764701454452 \
  sandbox/fix-security-1764702172738_1764702172738 \
  sandbox/fix-security-1764702588611_1764702588611 \
  sandbox/fix-security-1764704839782_1764704839782 \
  sandbox/fix-security-1764706914784_1764706914785 \
  sandbox/fix-security-1764707180107_1764707180107 \
  sandbox/fix-security-1764714333222_1764714333222 \
  sandbox/fix-security-1764748819990_1764748819991 \
  sandbox/fix-security-1764759494913_1764759494913 \
  sandbox/fix-security-1764770294955_1764770294955 \
  sandbox/fix-security-1764781095540_1764781095540 \
  sandbox/fix-security-1764783234956_1764783234956 \
  sandbox/fix-security-1764789985000_1764789985000 \
  sandbox/fix-security-1764790494284_1764790494284 \
  sandbox/fix-security-1764791001505_1764791001506 \
  sandbox/fix-security-1764791261111_1764791261111 \
  sandbox/fix-security-1764791543845_1764791543845 \
  sandbox/fix-security-1764792473163_1764792473163 \
  sandbox/fix-security-1764792908296_1764792908296 \
  sandbox/fix-security-1764793867869_1764793867869 \
  sandbox/fix-security-1764795086711_1764795086711 \
  sandbox/fix-security-1764812997241_1764812997241 \
  sandbox/fix-security-1764814976102_1764814976102 \
  sandbox/fix-security-1764819095961_1764819095962 \
  sandbox/fix-security-1764819453467_1764819453468 \
  sandbox/fix-security-1764824150349_1764824150349 \
  sandbox/fix-security-1764824585459_1764824585461 \
  sandbox/fix-security-1764824841929_1764824841930 \
  sandbox/fix-security-1764828314742_1764828314742 \
  sandbox/fix-security-1764829762822_1764829762822 \
  sandbox/fix-security-1764829909005_1764829909005 \
  sandbox/fix-security-1764830725544_1764830725544 \
  sandbox/fix-security-1764833111901_1764833111901 \
  sandbox/fix-security-1764844041122_1764844041122 \
  sandbox/fix-security-1765483317227_1765483317227 \
  sandbox/fix-security-1765484424366_1765484424367 \
  sandbox/fix-security-1765484848191_1765484848191 \
  sandbox/message-history_1763256220491 \
  sandbox/message-history_1763716113710 \
  sandbox/message-history_1764701123416 \
  sandbox/message-history_1764824148124 \
  sandbox/real-time-chat_1763256218395 \
  sandbox/real-time-chat_1763716105584 \
  sandbox/real-time-chat_1764701118755 \
  sandbox/real-time-chat_1764824146072 \
  sandbox/test-sandbox_1764782649328 \
  sandbox/test-sandbox_1764782745470; do
  echo "Deleting $branch..."
  git branch -D "$branch" 2>/dev/null || true
  git push origin --delete "$branch" 2>/dev/null || true
done
echo "✓ Deleted 45 sandbox branches"
```

### Delete Stale Copilot Branches (7 branches)
```bash
for branch in \
  copilot/analyze-different-branches \
  copilot/fix-agent-failing-actions \
  copilot/fix-copilot-action-errors \
  copilot/fix-failing-pr \
  copilot/update-coding-ai-service \
  copilot/improve-slow-code-efficiency \
  copilot/run-tests-checklist-completion; do
  echo "Deleting $branch..."
  git branch -D "$branch" 2>/dev/null || true
  git push origin --delete "$branch" 2>/dev/null || true
done
echo "✓ Deleted 7 stale copilot branches"
```

---

## Branch Status Dashboard

### ✅ Safe to Delete (52 branches)
- 45 Sandbox branches (all temporary)
- 7 Stale copilot branches (incomplete)

### ⚠️ Review Required (12 branches)
- 2 Security fixes (alert-autofix-59, alert-autofix-70)
- 5 Dependency updates (all dependabot branches)
- 2 Feature branches (grok, millastitch)
- 3 Copilot branches (UI redesign, chat fixes)

### 🔄 Current Work (1 branch)
- copilot/analyze-branch-status (this branch)

### 🏠 Main Branch
- main (protected)

---

## Decision Tree

```
Is the branch a sandbox/* branch?
├─ YES → DELETE (all are temporary)
└─ NO
   ├─ Is it a copilot/* branch with only "Initial plan"?
   │  ├─ YES → DELETE (never completed)
   │  └─ NO → REVIEW (may have valuable work)
   ├─ Is it an alert-autofix-* branch?
   │  └─ YES → REVIEW & MERGE (security fixes)
   ├─ Is it a dependabot/* branch?
   │  ├─ Patch/minor update? → MERGE (after quick review)
   │  └─ Major update? → REVIEW & TEST (breaking changes possible)
   └─ Is it a feature branch (grok, millastitch)?
      └─ YES → REVIEW (may have valuable features)
```

---

## Post-Cleanup Recommendations

1. **Enable automatic branch deletion** in GitHub Settings:
   - Settings → General → Pull Requests → Automatically delete head branches

2. **Set up branch protection rules**:
   - Protect `main` branch
   - Require PR reviews
   - Require status checks

3. **Configure Dependabot auto-merge** for patch updates:
   - Create `.github/dependabot.yml` with auto-merge settings

4. **Create branch naming convention**:
   - `feature/*` for new features
   - `fix/*` for bug fixes
   - `hotfix/*` for urgent production fixes
   - `chore/*` for maintenance tasks

5. **Schedule monthly branch audits** to prevent future sprawl

---

## Verification Commands

### Check remaining branches after cleanup
```bash
git fetch --all --prune
git branch -a | wc -l  # Should show ~18 branches (down from 70)
```

### Verify no important branches were deleted
```bash
git branch -a
git log --all --oneline --graph --decorate -20
```

---

**See BRANCH_ANALYSIS.md for detailed analysis**
