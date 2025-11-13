# Voice Module Name Fix

## Problem
Native module was registered with name "RCTVoice" but JavaScript code was looking for "Voice" in `NativeModules.Voice`, causing `Cannot read property 'startSpeech' of null` error.

## Root Cause
Mismatch between:
- Native module name: `VoiceModule.getName()` returned `"RCTVoice"`
- JavaScript lookup: `NativeModules.Voice` (from `@react-native-voice/voice/dist/index.js`)

## Solution
Created patch file `patches/@react-native-voice+voice+3.2.4.patch` that changes:
```java
@Override
public String getName() {
-  return "RCTVoice";
+  return "Voice";
}
```

## How to Apply
The patch is automatically applied when you run:
```bash
npm install
# or
npm run postinstall
```

## Rebuild Required
After applying the patch, rebuild the Android app:
```bash
cd mobile/android
./gradlew clean
cd ..
npx react-native run-android
```

## Verification
After rebuild, check logs:
```bash
adb logcat | grep -E 'Voice|MainApplication'
```

You should see:
- `MainApplication: VoicePackage found in autolinking: true`
- `[Voice] NativeModules Voice-related keys:` should include "Voice"
- No more `Cannot read property 'startSpeech' of null` errors

## Files Changed
- `mobile/patches/@react-native-voice+voice+3.2.4.patch` - Patch file (auto-applied)
- `mobile/node_modules/@react-native-voice/voice/android/src/main/java/com/wenkesj/voice/VoiceModule.java` - Modified source (after patch)

