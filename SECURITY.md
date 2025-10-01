# Security Policy

## Supported Versions
We support security fixes on the latest `main` branch and the most recent tagged release.

## Reporting a Vulnerability
Please email security reports to <mrdannyclark82@gmail.com>. We will acknowledge receipt within 48 hours and strive to provide a remediation plan within 14 days.

Do not open public issues for security problems. If a PoC is required, minimize sensitive data and never include secrets or tokens.

## Handling of Secrets
- Never commit secrets. Use environment variables and `.env` locally.
- Prefer short-lived tokens or a GitHub App over classic PATs for automation features.

## Data Encryption at Rest

### Memory Encryption
As of the latest version, Milla Rayne supports field-level encryption for sensitive conversation data stored in the SQLite database.

**Features:**
- AES-256-GCM authenticated encryption
- Versioned encryption format (`enc:v1:...`) for future compatibility
- Environment variable-based key management
- Backward compatible with existing plaintext data
- No performance impact on read/write operations

**Setup:**
1. Generate a secure encryption key:
   ```bash
   openssl rand -base64 32
   ```

2. Add the key to your `.env` file:
   ```
   MEMORY_KEY=your_generated_key_here
   ```

3. Restart the application - all new messages will be encrypted automatically

**Key Management:**
- Store the `MEMORY_KEY` securely (e.g., in a password manager)
- Do NOT commit the key to version control
- Back up the key - data cannot be recovered without it
- Consider rotating keys periodically for enhanced security

**Important Notes:**
- If `MEMORY_KEY` is not set, messages are stored in plaintext (default behavior)
- Changing the encryption key will make existing encrypted data unreadable
- The encryption protects data at rest but not data in transit
- Repository analysis and improvement features continue to work normally
