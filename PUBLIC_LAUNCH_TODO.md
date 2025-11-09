# TODO Before Making Repository Public

This is your actionable checklist for preparing the repository for public release. Complete these items in order.

## 🚨 CRITICAL - DO THESE FIRST (Security)

### 1. Rotate ALL Exposed API Keys ⚠️ MANDATORY

The following API keys were found in committed files and MUST be rotated:

- [ ] **xAI API Key** - Get new at https://console.x.ai/
- [ ] **OpenRouter Mistral Key** - Rotate at https://openrouter.ai/
- [ ] **OpenRouter Venice Key** - Rotate at https://openrouter.ai/
- [ ] **OpenRouter Qwen Key** - Rotate at https://openrouter.ai/
- [ ] **OpenRouter Gemini Key** - Rotate at https://openrouter.ai/
- [ ] **OpenRouter Grok Key** - Rotate at https://openrouter.ai/
- [ ] **Wolfram Alpha App ID** - Rotate at https://developer.wolframalpha.com/
- [ ] **GitHub Token** - Revoke and create new at https://github.com/settings/tokens
- [ ] **ElevenLabs API Key** - Rotate at https://elevenlabs.io/
- [ ] **Google OAuth Client ID & Secret** - Create new at https://console.cloud.google.com/
- [ ] **Google API Key** - Rotate at https://console.cloud.google.com/apis/credentials
- [ ] **Hugging Face API Key** - Rotate at https://huggingface.co/settings/tokens
- [ ] **Admin Token** - Generate new: `openssl rand -hex 32`
- [ ] **Memory Encryption Key** - Generate new: `openssl rand -base64 32`

**After rotating, update your local `.env` file with the new keys.**

### 2. Verify Sensitive Data Removal

- [x] ~~Removed .env.save and .env.save.1 files~~ (DONE)
- [x] ~~Removed personal conversation data~~ (DONE)
- [x] ~~Removed audio messages~~ (DONE)
- [x] ~~Updated .gitignore~~ (DONE)
- [ ] Double-check no other sensitive files exist: `git grep -i "password\|secret\|token" -- '*.ts' '*.js'`

### 3. Clean Git History (Optional but Recommended)

Since sensitive data was in the repository:

- [ ] **Option A**: Use BFG Repo-Cleaner to remove sensitive data from history
  ```bash
  # Install BFG
  brew install bfg  # or download from https://rtyley.github.io/bfg-repo-cleaner/
  
  # Clone a fresh copy
  git clone --mirror https://github.com/mrdannyclark82/Milla-Rayne.git
  
  # Remove sensitive files
  bfg --delete-files .env.save* Milla-Rayne.git
  bfg --delete-files memories.txt Milla-Rayne.git
  
  # Clean and force push
  cd Milla-Rayne.git
  git reflog expire --expire=now --all && git gc --prune=now --aggressive
  git push --force
  ```

- [ ] **Option B**: Start fresh with a new repository
  - Create new empty repository
  - Copy current cleaned state
  - Push as initial commit
  - Archive old repository

## 📋 HIGH PRIORITY - Do Before Public Launch

### 4. Branch Cleanup

- [ ] Review branch list: Go to https://github.com/mrdannyclark82/Milla-Rayne/branches
- [ ] Delete merged branches (look for ~28 `copilot/fix-*` and `alert-autofix-*` branches)
- [ ] Review `copilot/create-oauth-routes-server` - merge if needed, otherwise delete
- [ ] Set up automatic branch deletion in repository settings

### 5. GitHub Security Features

- [ ] Enable Dependabot alerts: Settings → Security → Dependabot alerts
- [ ] Enable secret scanning: Settings → Security → Secret scanning
- [ ] Enable code scanning: Settings → Security → Code scanning
- [ ] Add branch protection rules for main branch
- [ ] Enable 2FA on your GitHub account

### 6. Documentation Review

- [ ] Review README for any personal information
- [ ] Update .env.example if you added new environment variables
- [ ] Check all markdown files for personal references
- [ ] Add screenshots to README (see REPOSITORY_ENHANCEMENT_GUIDE.md)
- [ ] Consider adding a demo GIF

## 🎨 MEDIUM PRIORITY - Makes Repo More Attractive

### 7. Visual Enhancements

- [ ] Add 3-4 high-quality screenshots to README
- [ ] Create an animated demo GIF (use LICEcap or Kap)
- [ ] Create a banner image for the repository
- [ ] Take screenshots showing web, CLI, and Android versions

### 8. Repository Settings

- [ ] Add repository description in GitHub settings
- [ ] Add website URL if you have one
- [ ] Add topics/tags: `ai-assistant`, `chatbot`, `typescript`, `react`, `voice-assistant`, `sqlite`
- [ ] Set repository social preview image

### 9. Community Files

- [x] ~~CODE_OF_CONDUCT.md exists~~ ✓
- [x] ~~CONTRIBUTING.md exists~~ ✓
- [x] ~~SECURITY.md exists~~ ✓
- [x] ~~LICENSE exists~~ ✓
- [ ] Create CHANGELOG.md for version history
- [ ] Add issue templates (.github/ISSUE_TEMPLATE/)
- [ ] Add PR template (.github/pull_request_template.md)

### 10. GitHub Actions / CI/CD

- [ ] Set up basic CI workflow
  ```yaml
  # .github/workflows/ci.yml
  name: CI
  on: [push, pull_request]
  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
        - run: npm ci
        - run: npm run check
        - run: npm run lint
        - run: npm test
  ```

## 🚀 NICE TO HAVE - For Maximum Impact

### 11. Marketing & Promotion

- [ ] Write a blog post about the project
- [ ] Post on Reddit (r/opensource, r/programming)
- [ ] Share on Twitter/X with hashtags
- [ ] Submit to Product Hunt
- [ ] Post on dev.to with tutorial
- [ ] Share on LinkedIn
- [ ] Submit to Hacker News

### 12. Additional Features

- [ ] Create Docker deployment option
- [ ] Add one-click deploy buttons (Heroku, Railway)
- [ ] Set up GitHub Pages for documentation
- [ ] Create video demo for YouTube
- [ ] Write tutorial series

### 13. Code Quality

- [ ] Improve test coverage
- [ ] Set up code coverage reporting (Codecov)
- [ ] Fix TypeScript errors: `npm run check`
- [ ] Fix linting issues: `npm run lint`
- [ ] Run full test suite: `npm test`

## ✅ Final Checklist Before Going Public

Before you change repository visibility to public:

- [ ] All API keys have been rotated ⚠️ CRITICAL
- [ ] Tested with new API keys and everything works
- [ ] No personal information in any file
- [ ] No sensitive data in git history (or history cleaned)
- [ ] Branch cleanup completed
- [ ] Security features enabled on GitHub
- [ ] README looks professional with badges and screenshots
- [ ] Documentation is complete and accurate
- [ ] CI/CD is set up and passing
- [ ] License is appropriate (MIT ✓)
- [ ] You're ready to support issues and PRs from the community

## 🎯 After Going Public

Once the repository is public:

- [ ] Monitor GitHub security alerts
- [ ] Respond to issues and PRs promptly
- [ ] Engage with the community
- [ ] Share updates on social media
- [ ] Iterate based on feedback
- [ ] Keep dependencies updated

---

## 📚 Reference Documents

For detailed information, refer to:
- [SECURITY_AUDIT_CHECKLIST.md](SECURITY_AUDIT_CHECKLIST.md) - Detailed security information
- [BRANCH_CLEANUP_GUIDE.md](BRANCH_CLEANUP_GUIDE.md) - Branch management details
- [REPOSITORY_ENHANCEMENT_GUIDE.md](REPOSITORY_ENHANCEMENT_GUIDE.md) - Marketing and growth strategies
- [SECURITY.md](SECURITY.md) - Security policy and features
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines

---

## 🆘 Need Help?

If you're unsure about any step:
1. Review the detailed guide documents above
2. Check GitHub's documentation
3. Ask in developer communities (Stack Overflow, Reddit)
4. Consider hiring a security consultant for the git history cleaning

**Remember**: The most critical step is rotating all exposed API keys. Everything else can be done gradually, but this must be done before going public.

Good luck! 🚀
