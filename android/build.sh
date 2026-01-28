#!/bin/bash
# Build script for Milla Rayne Android App

set -e

echo "🤖 Building Milla Rayne Android App..."
echo ""

# Check if we're in the android directory
if [ ! -f "gradlew" ]; then
    echo "❌ Error: gradlew not found. Please run this script from the android/ directory."
    exit 1
fi

# Make gradlew executable
chmod +x gradlew

# Build type (default: debug)
BUILD_TYPE="${1:-debug}"

if [ "$BUILD_TYPE" = "debug" ]; then
    echo "📦 Building debug APK..."
    ./gradlew assembleDebug
    
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo "✅ Build successful!"
        echo "📱 APK location: $APK_PATH"
        echo ""
        echo "To install on a connected device:"
        echo "  adb install $APK_PATH"
        echo ""
        echo "To install and run:"
        echo "  adb install -r $APK_PATH && adb shell am start -n com.millarayne/.MainActivity"
    else
        echo "❌ Build failed - APK not found"
        exit 1
    fi
    
elif [ "$BUILD_TYPE" = "release" ]; then
    echo "📦 Building release APK..."
    echo "⚠️  Note: Release builds require signing configuration"
    ./gradlew assembleRelease
    
    APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
    
    if [ -f "$APK_PATH" ]; then
        echo ""
        echo "✅ Build successful!"
        echo "📱 APK location: $APK_PATH"
        echo ""
        echo "⚠️  This APK is unsigned and cannot be installed without signing"
    else
        echo "❌ Build failed - APK not found"
        exit 1
    fi
else
    echo "❌ Invalid build type: $BUILD_TYPE"
    echo "Usage: ./build.sh [debug|release]"
    exit 1
fi
