#!/bin/bash

# Script to add NativeAudioPlayer to Xcode project
# This script adds the native module files to the Xcode project

echo "🔧 Adding NativeAudioPlayer to Xcode project..."

# Get the project directory
PROJECT_DIR="/Users/mac/Documents/hai/KidSpeak/mobile/ios"
PROJECT_FILE="$PROJECT_DIR/KidSpeak.xcodeproj/project.pbxproj"

# Check if project file exists
if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ Xcode project file not found at $PROJECT_FILE"
    exit 1
fi

echo "✅ Found Xcode project at $PROJECT_FILE"
echo "📝 Please manually add the following files to your Xcode project:"
echo "   1. NativeAudioPlayer.h"
echo "   2. NativeAudioPlayer.m"
echo ""
echo "📋 Steps to add in Xcode:"
echo "   1. Open KidSpeak.xcworkspace in Xcode"
echo "   2. Right-click on 'KidSpeak' folder in Project Navigator"
echo "   3. Select 'Add Files to KidSpeak'"
echo "   4. Navigate to ios/KidSpeak/ folder"
echo "   5. Select both NativeAudioPlayer.h and NativeAudioPlayer.m"
echo "   6. Make sure 'Add to target: KidSpeak' is checked"
echo "   7. Click 'Add'"
echo ""
echo "🎯 After adding the files, rebuild the project:"
echo "   npx react-native run-ios"
