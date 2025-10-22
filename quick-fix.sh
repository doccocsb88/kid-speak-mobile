#!/bin/bash
echo "🔧 Quick Fix for Xcode..."
echo ""
echo "1. Clean iOS build..."
cd ios
xcodebuild -workspace KidSpeak.xcworkspace -scheme KidSpeak clean 2>&1 | grep -E "(SUCCESS|FAILED|error)"
echo ""
echo "2. Pod install..."
pod install 2>&1 | grep -E "(Installing|Using|complete)"
cd ..
echo ""
echo "✅ Done! Now open Xcode and build:"
echo "   open ios/KidSpeak.xcworkspace"
echo ""
echo "   Then: Cmd+Shift+K (Clean) → Cmd+B (Build)"
