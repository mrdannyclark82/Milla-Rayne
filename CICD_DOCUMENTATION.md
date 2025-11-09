# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) setup for the Milla Rayne project using GitHub Actions.

## 📋 Overview

The project uses GitHub Actions for automated testing, building, and deployment. The CI/CD pipeline includes:

- **Continuous Integration (CI)**: Automated testing on every push and pull request
- **Continuous Deployment (CD)**: Automated deployment to staging/production environments
- **Security Scanning**: CodeQL analysis and dependency audits
- **Release Management**: Automated release creation with artifacts

## 🔄 Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:** Push to `main`, Pull Requests to `main`

**Jobs:**
- **Node.js Testing** (Matrix: Node 18.x, 20.x)
  - Install dependencies
  - Run linting
  - Check code formatting
  - Run TypeScript type checking
  - Build application
  - Run tests

- **Python Testing** (Conditional)
  - Only runs if `requirements.txt` exists
  - Install dependencies
  - Run linting with flake8
  - Run tests with pytest

**Status:** ✅ Active

### 2. PR Checks Workflow (`.github/workflows/pr-checks.yml`)

**Triggers:** Pull Request events (opened, synchronized, reopened)

**Jobs:**
- **Lint and Format Check**: ESLint and Prettier validation
- **Type Check**: TypeScript compilation check
- **Test**: Run full test suite with coverage
- **Build Check**: Verify successful build
- **Bundle Size Check**: Report build artifact sizes
- **Security Check**: NPM audit and secret scanning
- **PR Summary**: Aggregate results for easy review

**Status:** ✅ Active

### 3. CodeQL Security Scanning (`.github/workflows/codeql.yml`)

**Triggers:** 
- Push to `main`
- Pull Requests to `main`
- Weekly schedule (Sundays at 3 AM)

**Languages Analyzed:**
- JavaScript/TypeScript
- Python

**Status:** ✅ Active

### 4. Build and Release Workflow (`.github/workflows/release.yml`)

**Triggers:**
- Version tags (`v*.*.*`)
- Manual workflow dispatch

**Jobs:**
- **Build**: Compile and test application
- **Create Release**: Generate GitHub release with artifacts
- **Docker Build**: Build and push Docker image to GHCR

**Artifacts:**
- Release archive (`.tar.gz`)
- Build metadata
- Docker image

**Status:** ✅ Active

### 5. Deployment Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` (auto-deploy to staging)
- Manual workflow dispatch (choose environment)

**Environments:**
- **Staging**: Auto-deployed on main branch updates
- **Production**: Manual deployment only

**Deployment Options:**
- Heroku (template provided)
- Railway (template provided)
- Custom VPS via SSH (template provided)

**Status:** 🔧 Templates provided, needs configuration

### 6. Prevent Large Files (`.github/workflows/prevent-large-files.yml`)

**Triggers:** Pull Requests

**Purpose:** Prevents accidental commits of large files (>5MB)

**Status:** ✅ Active (pre-existing)

### 7. Dependabot (`.github/dependabot.yml`)

**Purpose:** Automated dependency updates

**Status:** ✅ Active (pre-existing)

## 🐳 Docker Support

### Dockerfile

Multi-stage build optimized for production:
- **Stage 1**: Build application
- **Stage 2**: Production image with minimal dependencies

Features:
- Non-root user (nodejs)
- Health check endpoint
- Dumb-init for proper signal handling
- Alpine Linux for small image size

### Docker Compose

Easy local development with Docker:
```bash
docker-compose up
```

Features:
- Environment variable support
- Volume mounts for persistence
- Health checks
- Network isolation

### Building Docker Image

```bash
# Build locally
docker build -t milla-rayne:latest .

# Run locally
docker run -p 5000:5000 --env-file .env milla-rayne:latest

# Or use docker-compose
docker-compose up
```

### GitHub Container Registry

Images are automatically published to:
```
ghcr.io/mrdannyclark82/milla-rayne:latest
ghcr.io/mrdannyclark82/milla-rayne:v1.0.0
```

## 🚀 Deployment Guide

### Automated Deployment Setup

#### 1. Staging Environment

Auto-deploys on every push to `main`:

1. Configure staging environment in repository settings
2. Add required secrets (if any)
3. Update deploy script in `deploy.yml`

#### 2. Production Environment

Manual deployment via workflow dispatch:

1. Go to Actions → Deploy → Run workflow
2. Select "production" environment
3. Confirm deployment

### Manual Deployment Options

#### Deploy to Heroku

1. Create Heroku app
2. Add secrets to GitHub:
   - `HEROKU_API_KEY`
   - `HEROKU_EMAIL`
3. Enable `deploy-heroku` job in `deploy.yml`
4. Push to main or run workflow

#### Deploy to Railway

1. Create Railway project
2. Get Railway token
3. Add `RAILWAY_TOKEN` secret to GitHub
4. Enable `deploy-railway` job in `deploy.yml`
5. Deploy via workflow

#### Deploy to Custom VPS

1. Set up VPS with Node.js and PM2
2. Add secrets to GitHub:
   - `VPS_SSH_KEY`: Private SSH key
   - `VPS_HOST`: Server hostname/IP
   - `VPS_USER`: SSH username
3. Enable `deploy-vps` job in `deploy.yml`
4. Deploy via workflow

## 🔐 Required Secrets

### For CI/CD

None required - workflows use `GITHUB_TOKEN` automatically.

### For Docker

- Automatically uses `GITHUB_TOKEN` for GHCR

### For Deployment (Optional)

Add these in Settings → Secrets → Actions:

- `HEROKU_API_KEY`: Heroku deployment key
- `HEROKU_EMAIL`: Heroku account email
- `RAILWAY_TOKEN`: Railway CLI token
- `VPS_SSH_KEY`: SSH private key for VPS
- `VPS_HOST`: VPS hostname or IP
- `VPS_USER`: SSH username
- `CODECOV_TOKEN`: Code coverage reporting (optional)

### For Application

Application secrets should be stored as environment secrets:

- `OPENROUTER_API_KEY`
- `XAI_API_KEY`
- `MISTRAL_API_KEY`
- etc. (see `.env.example`)

## 📊 Monitoring

### GitHub Actions Status

View workflow runs:
- Repository → Actions tab
- See all workflow runs and their status
- Download artifacts from completed runs

### Build Status Badges

Add to README:
```markdown
[![CI](https://github.com/mrdannyclark82/Milla-Rayne/workflows/CI/badge.svg)](https://github.com/mrdannyclark82/Milla-Rayne/actions/workflows/ci.yml)
[![CodeQL](https://github.com/mrdannyclark82/Milla-Rayne/workflows/CodeQL/badge.svg)](https://github.com/mrdannyclark82/Milla-Rayne/actions/workflows/codeql.yml)
```

## 🔧 Customization

### Modify CI Checks

Edit `.github/workflows/ci.yml`:
- Add/remove Node.js versions in matrix
- Add custom build steps
- Configure test coverage reporting

### Add Deployment Target

1. Copy example job in `deploy.yml`
2. Customize deployment commands
3. Add required secrets
4. Enable job (set `if: true`)

### Environment Variables

Configure in:
- `docker-compose.yml`: For Docker deployments
- Repository Settings → Environments: For GitHub deployments
- Deployment platform: For Heroku, Railway, etc.

## 📝 Best Practices

### Branch Protection

Enable in repository settings:
- Require PR reviews
- Require status checks to pass
- Require branches to be up to date
- Include administrators

### Secrets Management

- Never commit secrets to code
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use environment-specific secrets

### Testing

- Write tests for new features
- Maintain test coverage above 80%
- Run tests locally before pushing
- Fix failing tests promptly

### Deployment

- Test in staging before production
- Use manual approval for production
- Monitor deployments for errors
- Have rollback plan ready

## 🆘 Troubleshooting

### CI Failures

1. Check workflow logs in Actions tab
2. Reproduce issue locally:
   ```bash
   npm ci
   npm run lint
   npm run check
   npm run build
   npm test
   ```
3. Fix issue and push

### Docker Build Failures

1. Test Docker build locally:
   ```bash
   docker build -t test .
   ```
2. Check Dockerfile syntax
3. Verify all files exist
4. Review `.dockerignore`

### Deployment Failures

1. Check deployment logs
2. Verify secrets are set correctly
3. Test deployment scripts locally
4. Check target environment status

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Deployment Platform Docs](https://docs.railway.app/) (Railway example)

## 🔄 Updates

This CI/CD setup was last updated: November 9, 2024

To update workflows:
1. Edit workflow files in `.github/workflows/`
2. Test changes in a feature branch
3. Merge to main after verification

---

**Questions?** Open an issue or check the repository discussions.
