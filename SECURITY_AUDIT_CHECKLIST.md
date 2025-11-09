# Security Audit Checklist - Before Making Repository Public

## ⚠️ CRITICAL - API Keys and Secrets

**Status: URGENT - API keys were found committed in .env.save files**

### Action Items:

- [x] **REMOVED**: `.env.save` and `.env.save.1` files from repository
- [ ] **ROTATE ALL API KEYS** - The following keys were exposed and MUST be rotated:

#### API Keys That Need Immediate Rotation:

1. **xAI API Key**
   - Old Key: `xai-RFBDE0T0GmlIdHbOS5bViOUC4VsGoOSkA1w2d6190JICdNH1NpcprjtX4IRz5w9Y4ktkkP3c0BkLY0q1`
   - Action: Generate new key at https://console.x.ai/

2. **OpenRouter API Keys** (Multiple)
   - Mistral Key: `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`
   - Venice Key: `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`
   - Qwen Key: `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`
   - Gemini Key: `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`
   - Grok1 Key: `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`
   - Action: Rotate all keys at https://openrouter.ai/

3. **Wolfram Alpha App ID**
   - Old ID: `5PPW8WVHWX`
   - Action: Generate new App ID at https://developer.wolframalpha.com/

4. **GitHub Token**
   - Old Token: `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`
   - Action: Revoke and create new token at https://github.com/settings/tokens

5. **ElevenLabs API Key**
   - Old Key: `38360714b364041bd9958ec2ba3d49e06ab4f2cc706ea590f24e97940699622a`
   - Action: Rotate key at https://elevenlabs.io/

6. **Google OAuth Credentials**
   - Client ID: `759591812989-vrler5d5ot38igtfftqk6l033udgg3ge.apps.googleusercontent.com`
   - Client Secret: `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`
   - Action: Create new OAuth credentials at https://console.cloud.google.com/

7. **Google API Key**
   - Old Key: `AIzaSyCNct0gML1MhEMUg83Va0g1Bjfq90EkGYM`
   - Action: Rotate key at https://console.cloud.google.com/apis/credentials

8. **Hugging Face API Key**
   - Old Key: `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`
   - Action: Rotate key at https://huggingface.co/settings/tokens

9. **Admin Token**
   - Old Token: `9bd3f016f6e081a399a7161816cfcd8eab50dafb87793e9fa897960e7add40e7`
   - Action: Generate new token: `openssl rand -hex 32`

10. **Memory Encryption Key**
    - Old Key: `jNk/Cbxt1iMuCauyx70EXG2hZ5VLtCmt4E3XhnrnF+o=`
    - Action: Generate new key: `openssl rand -base64 32`
    - Note: This will require re-encrypting existing encrypted memories

## 🔒 Personal Data Removed

- [x] **REMOVED**: Personal conversation history (`memory/memories.txt` - 11MB+)
- [x] **REMOVED**: Encrypted memories (`memory/memories_encrypted.txt`)
- [x] **REMOVED**: Merged memories (`memory/merged_memories.txt`)
- [x] **REMOVED**: Audio messages (11 .webm files from `memory/audio_messages/`)
- [x] **REMOVED**: CSV backups (`memory/Milla_backup.csv`, `memory/knowledge.csv`)
- [x] **REMOVED**: Log files that might contain personal data

## 📝 .gitignore Updated

- [x] Added patterns to prevent committing `.env.save*` files
- [x] Added patterns for all memory files with personal data
- [x] Added patterns for log files and debug output
- [x] Added virtual environment directories (.venv, python/)
- [x] Added local config directories (.local, .config, .idx)

## 🧹 Repository Cleanup Completed

- [x] Removed 1700+ tracked files from virtual environments
- [x] Removed debug logs and server logs
- [x] Removed personal audio recordings

## 📋 Additional Security Best Practices

### Before Going Public:

1. **Review All Files**
   - [ ] Search for hardcoded credentials: `git grep -i "password\|api_key\|secret\|token" -- '*.ts' '*.tsx' '*.js' '*.py'`
   - [ ] Check for personal names or identifiable information
   - [ ] Review comments for sensitive information

2. **Update Documentation**
   - [ ] Ensure README doesn't reference personal information
   - [ ] Update setup instructions to use `.env.example` only
   - [ ] Add security best practices to SECURITY.md

3. **Git History Considerations**
   - [ ] Consider using BFG Repo-Cleaner or git-filter-repo to remove sensitive data from history
   - [ ] Note: Since API keys were exposed, rotating them is MANDATORY regardless of history cleanup

4. **Enable GitHub Security Features**
   - [ ] Enable Dependabot alerts
   - [ ] Enable secret scanning
   - [ ] Enable code scanning (if applicable)
   - [ ] Add branch protection rules

5. **Review Access Controls**
   - [ ] Set up appropriate collaborator permissions
   - [ ] Consider using GitHub Environments for deployment secrets
   - [ ] Enable 2FA for all maintainers

## 🎯 Post-Publication Monitoring

After making the repository public:

- [ ] Monitor GitHub security alerts
- [ ] Set up notifications for new issues/PRs
- [ ] Regularly update dependencies
- [ ] Review any contributions for security issues

## ⚠️ IMPORTANT NOTES

1. **The exposed API keys have access to paid services**. Rotating them is not optional.
2. **Personal conversations were in plain text**. Consider who might have accessed the repository before this cleanup.
3. **Git history still contains the sensitive data**. Consider force-pushing a cleaned history or starting fresh if this is a concern.
4. **Memory encryption key exposure** means any encrypted memories could be decrypted by anyone with repository access.

## 📞 Emergency Response

If you discover unauthorized usage of the exposed keys:

1. Immediately rotate the affected key
2. Check service usage logs for unauthorized access
3. Contact the service provider if suspicious activity is detected
4. Consider filing a security incident report with affected services

---

**Last Updated**: November 9, 2024
**Status**: CRITICAL - API Key Rotation Required Before Public Release
