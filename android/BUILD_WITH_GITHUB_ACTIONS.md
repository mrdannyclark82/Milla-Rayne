# Building the Android App with GitHub Actions

This guide explains how to build the Android app using GitHub Actions since local builds require x86/x64 architecture.

## Quick Start

### Option 1: Automatic Build on Push

Simply push your changes to the `main` or `develop` branch:

```bash
cd /home/mrdannyclark82/Milla-Rayne
git add android/
git commit -m "Update Android app"
git push origin main
```

The workflow will automatically build and upload the APK as an artifact.

### Option 2: Manual Build

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Android Build** workflow
4. Click **Run workflow** button
5. Wait for the build to complete (usually 3-5 minutes)
6. Download the APK from the **Artifacts** section

## Downloading the APK

After the workflow completes:

1. Go to the workflow run page
2. Scroll down to **Artifacts** section
3. Click on **app-debug** to download the APK
4. Extract the ZIP file to get the APK

## Setting Up Signed Releases

To create signed release builds, you need to add secrets to your repository:

### 1. Generate a Keystore

On a machine with Java installed:

```bash
keytool -genkey -v -keystore release.keystore -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

Follow the prompts to set passwords and information.

### 2. Encode Keystore to Base64

```bash
base64 -w 0 release.keystore > keystore.txt
```

### 3. Add GitHub Secrets

Go to your repository on GitHub:

1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

- `KEYSTORE_BASE64`: Contents of keystore.txt
- `KEYSTORE_PASSWORD`: Password you set for the keystore
- `KEY_ALIAS`: The alias you used (e.g., "my-key-alias")
- `KEY_PASSWORD`: Password for the key (usually same as keystore password)

### 4. Create a Release

Push a version tag to trigger a release build:

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

Or use the **Android Release Build** workflow manually from the Actions tab.

## Workflow Files

Two workflows are available:

### 1. `android-build.yml` (Debug Builds)

- **Triggers**: Push to main/develop, pull requests, manual
- **Purpose**: Quick debug builds for testing
- **Output**: Debug APK (unsigned)

### 2. `android-release.yml` (Release Builds)

- **Triggers**: Version tags, manual
- **Purpose**: Production-ready signed releases
- **Output**: Signed release APK + Debug APK
- **Features**:
  - Automatic GitHub release creation
  - 90-day artifact retention
  - Support for app signing

## Troubleshooting

### Build Fails

- Check the workflow logs in GitHub Actions tab
- Look for errors in the "Build Debug APK" step
- Ensure `android/gradlew` has execute permissions

### No Artifacts

- The build must complete successfully to generate artifacts
- Check that the APK path in the workflow matches your build output

### Signing Issues

- Verify all 4 secrets are set correctly
- Ensure the keystore password matches
- Check that KEY_ALIAS matches the alias in your keystore

## Local Development

For local development on this ARM64 Chromebook:

- Use Android Studio on an x86/x64 machine
- Use cloud-based IDEs (GitHub Codespaces, Gitpod)
- Use the GitHub Actions workflows for building

## CI/CD Integration

The workflows can be extended to:

- Run unit tests
- Run instrumentation tests
- Deploy to Google Play Store
- Send notifications on build completion

Example additions can be added to the workflow files as needed.
