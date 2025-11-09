# GitHub Actions Setup Guide

This guide will help you set up and configure GitHub Actions for the Milla Rayne project.

## 🚀 Quick Start

All workflows are already configured and will run automatically. However, to get the most out of CI/CD, follow these setup steps.

## 📋 Prerequisites

- Repository admin access
- GitHub account with 2FA enabled
- (Optional) Codecov account for enhanced coverage reporting

## 🔧 Initial Setup

### 1. Enable GitHub Actions

GitHub Actions should be enabled by default. To verify:

1. Go to repository **Settings** → **Actions** → **General**
2. Under "Actions permissions", ensure "Allow all actions and reusable workflows" is selected
3. Click **Save**

### 2. Configure Branch Protection

Recommended settings for the `main` branch:

1. Go to **Settings** → **Branches**
2. Add branch protection rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (at least 1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - Select required status checks:
     - `node (18.x)` and `node (20.x)` from CI
     - `lint-and-format`, `type-check`, `test`, `build` from PR Checks
   - ✅ Require conversation resolution before merging
   - ✅ Include administrators (optional but recommended)
3. Click **Create** or **Save changes**

### 3. Set Up Codecov (Optional but Recommended)

#### Option A: Using Codecov Cloud (Easiest)

1. Go to [codecov.io](https://codecov.io/)
2. Sign up/in with your GitHub account
3. Add the repository `mrdannyclark82/Milla-Rayne`
4. Copy the upload token
5. Add to GitHub Secrets:
   - Go to repository **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: (paste the token)
   - Click **Add secret**

#### Option B: Using GitHub Comments (Token-less)

If you don't want to use a token, Codecov can work without it for public repositories:
1. Remove the `token` line from workflow files
2. Codecov will post comments on PRs automatically

### 4. Configure Dependabot (Already Set Up)

Dependabot is already configured via `.github/dependabot.yml`. To customize:

1. Edit `.github/dependabot.yml`
2. Adjust update frequency, reviewers, or labels
3. Commit changes

Current settings:
- **npm**: Daily updates
- **GitHub Actions**: Weekly updates

## 🔐 Required Secrets

### For Basic CI/CD (No Secrets Needed)

The basic CI/CD workflows work without any secrets:
- ✅ CI workflow (linting, testing, building)
- ✅ PR Checks workflow
- ✅ CodeQL security scanning
- ✅ Prevent large files check

### For Code Coverage (Optional)

Add `CODECOV_TOKEN` as described above for enhanced coverage reporting.

### For Deployment (When Ready)

Add these secrets when you're ready to deploy:

#### Heroku Deployment
- `HEROKU_API_KEY`: Get from Heroku Account Settings
- `HEROKU_EMAIL`: Your Heroku account email

#### Railway Deployment
- `RAILWAY_TOKEN`: Get from Railway dashboard

#### VPS/Server Deployment
- `VPS_SSH_KEY`: Private SSH key for server access
- `VPS_HOST`: Server hostname or IP address
- `VPS_USER`: SSH username

#### Other Services
- `CODECOV_TOKEN`: Coverage reporting token (optional)

## 📊 Available Workflows

### 1. CI Workflow
**File:** `.github/workflows/ci.yml`
**Trigger:** Push to main, Pull requests to main
**What it does:**
- Tests on Node.js 18.x and 20.x
- Runs linter and formatter
- Runs TypeScript type checking
- Builds the application
- Runs tests with coverage
- Uploads coverage to Codecov

### 2. PR Checks Workflow
**File:** `.github/workflows/pr-checks.yml`
**Trigger:** Pull request events
**What it does:**
- Detailed linting and formatting checks
- TypeScript type checking
- Full test suite with coverage
- Build verification
- Bundle size reporting
- Security audits
- Secret scanning

### 3. CodeQL Security Scanning
**File:** `.github/workflows/codeql.yml`
**Trigger:** Push, PRs, weekly schedule
**What it does:**
- Scans for security vulnerabilities
- Analyzes JavaScript/TypeScript and Python code
- Posts results to Security tab

### 4. Build and Release
**File:** `.github/workflows/release.yml`
**Trigger:** Git tags (v*.*.*), manual dispatch
**What it does:**
- Builds production artifacts
- Creates GitHub releases
- Builds and publishes Docker images
- Generates release notes

### 5. Deployment
**File:** `.github/workflows/deploy.yml`
**Trigger:** Push to main (staging), manual (production)
**What it does:**
- Deploys to staging automatically
- Deploys to production manually
- Supports multiple platforms (Heroku, Railway, VPS)

### 6. Prevent Large Files
**File:** `.github/workflows/prevent-large-files.yml`
**Trigger:** Pull requests
**What it does:**
- Checks for files larger than 5MB
- Prevents accidental large file commits

## 🐳 Docker Registry Setup

### GitHub Container Registry (GHCR)

Docker images are automatically published to GHCR when you create a release:

1. Images are public by default
2. To make them private:
   - Go to package settings in GHCR
   - Change visibility to private
3. No additional secrets needed (uses `GITHUB_TOKEN`)

Access images:
```bash
docker pull ghcr.io/mrdannyclark82/milla-rayne:latest
docker pull ghcr.io/mrdannyclark82/milla-rayne:v1.0.0
```

## 📈 Monitoring Workflows

### View Workflow Runs

1. Go to repository **Actions** tab
2. Select a workflow from the left sidebar
3. Click on a run to see details
4. View logs, artifacts, and status

### Check Status Badges

Add these badges to your README (already added):
```markdown
[![CI](https://github.com/mrdannyclark82/Milla-Rayne/workflows/CI/badge.svg)](https://github.com/mrdannyclark82/Milla-Rayne/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/mrdannyclark82/Milla-Rayne/branch/main/graph/badge.svg)](https://codecov.io/gh/mrdannyclark82/Milla-Rayne)
```

### Enable Notifications

1. Go to **Settings** → **Notifications**
2. Configure email notifications for:
   - Failed workflows
   - Security alerts
   - Dependabot alerts

## 🔄 Creating a Release

### Automated Release Process

1. Commit all changes
2. Create and push a version tag:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
3. GitHub Actions will automatically:
   - Build the application
   - Run all tests
   - Create a GitHub release
   - Upload build artifacts
   - Build and push Docker image

### Manual Release (via UI)

1. Go to repository **Actions** tab
2. Select "Build and Release" workflow
3. Click **Run workflow**
4. Fill in the form and run

## 🧪 Running Tests Locally

Before pushing, run these commands locally:

```bash
# Install dependencies
npm ci

# Run linter
npm run lint

# Check formatting
npm run format -- --check

# Run type checking
npm run check

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Build application
npm run build
```

## 🐛 Troubleshooting

### Workflow Fails on TypeScript Check

The project has pre-existing TypeScript errors. The workflow uses `continue-on-error: true` to not block CI. To fix:
```bash
npm run check
# Fix reported errors
```

### Coverage Upload Fails

If Codecov uploads fail:
1. Verify `CODECOV_TOKEN` is set correctly
2. Check Codecov service status
3. Review workflow logs for details
4. Token is optional for public repos

### Docker Build Fails

Common issues:
- Missing dependencies: Check Dockerfile
- Large files: Review .dockerignore
- Build errors: Test locally with `docker build -t test .`

### Deployment Fails

1. Verify all required secrets are set
2. Check deployment target is accessible
3. Review deployment logs
4. Test deployment commands locally

## 📚 Advanced Configuration

### Customize Code Coverage Thresholds

Edit `codecov.yml`:
```yaml
coverage:
  status:
    project:
      default:
        target: 80%  # Change this
```

Edit `vitest.config.server.ts`:
```typescript
coverage: {
  lines: 80,      // Change these
  functions: 80,
  branches: 80,
  statements: 80,
}
```

### Add More Test Environments

Edit `.github/workflows/ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]  # Add more versions
```

### Enable Auto-Merge for Dependabot

1. Go to **Settings** → **Actions** → **General**
2. Under "Workflow permissions", select "Read and write permissions"
3. Enable "Allow GitHub Actions to create and approve pull requests"
4. Add auto-merge workflow (template available in docs)

### Set Up Deployment Environments

1. Go to **Settings** → **Environments**
2. Create environments: `staging`, `production`
3. Add environment-specific secrets
4. Configure protection rules:
   - Required reviewers for production
   - Wait timer before deployment
   - Deployment branches

## 🎯 Best Practices

### For Contributors

1. **Always run tests locally** before pushing
2. **Keep PRs focused** on single features
3. **Write tests** for new features
4. **Update documentation** when needed
5. **Follow code style** (enforced by linter)

### For Maintainers

1. **Review Dependabot PRs** weekly
2. **Monitor security alerts** (enabled in CodeQL)
3. **Check coverage trends** in Codecov
4. **Keep workflows updated** with latest actions
5. **Document workflow changes** in this file

## 📞 Getting Help

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Codecov Docs**: https://docs.codecov.com/
- **Docker Docs**: https://docs.docker.com/
- **Open an Issue**: For project-specific help

## ✅ Verification Checklist

After setup, verify:

- [ ] CI workflow runs on push to main
- [ ] PR checks run on pull requests
- [ ] CodeQL scans run weekly
- [ ] Codecov uploads coverage successfully
- [ ] Branch protection rules are active
- [ ] Dependabot creates PRs for updates
- [ ] Status badges show in README
- [ ] Docker builds succeed (after creating release)
- [ ] All secrets are configured (if using deployments)

---

**Last Updated:** November 9, 2024

For questions or issues, open a GitHub issue or discussion.
