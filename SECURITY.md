# Security Policy

## Supported Versions
We support security fixes on the latest `main` branch and the most recent tagged release.

## Reporting a Vulnerability
Please email security reports to <mrdannyclark82@gmail.com>. We will acknowledge receipt within 48 hours and strive to provide a remediation plan within 14 days.

Do not open public issues for security problems. If a PoC is required, minimize sensitive data and never include secrets or tokens.

## Handling of Secrets
- Never commit secrets. Use environment variables and `.env` locally.
- Prefer short-lived tokens or a GitHub App over classic PATs for automation features.
