# Voice Module Null Error Fix

## Problem
Android app shows error: `Cannot read property 'startSpeech' of null`

This indicates that the native Voice module (`@react-native-voice/voice`) is not properly linked or initialized.

## Root Cause
The native module reference is null when trying to call `Voice.start()`. This typically happens when:
1. The app hasn't been rebuilt after installing/updating the Voice package
2. Native modules aren't properly linked
3. The React Native bridge hasn't fully initialized

## Solution

### Step 1: Rebuild the App
Run the rebuild script:
```bash
cd mobile
./rebuild-android.sh
```

Or manually:
```bash
cd mobile/android
./gradlew clean
cd ..
rm -rf node_modules
npm install
npm run postinstall
npx react-native run-android
```

### Step 2: Verify Changes Made

1. **MainApplication.kt**: Removed manual VoicePackage addition - now relies on autolinking
2. **SpeakingScreen.js**: Improved error detection and handling for null native module
   - Detects when native module is null
   - Shows helpful error message with rebuild instructions
   - Increased retry logic and wait times

### Step 3: Check Logs
After rebuilding, check logs for:
- `[Voice] NativeModules Voice-related keys:` should show Voice-related modules
- `[Voice] Voice._loaded:` should be `true` after initialization
- No `Cannot read property 'startSpeech' of null` errors

## Technical Details

### Autolinking
React Native 0.82 uses autolinking by default. The `settings.gradle` file includes:
```gradle
extensions.configure(com.facebook.react.ReactSettingsExtension){ ex -> ex.autolinkLibrariesFromCommand() }
```

This automatically links `@react-native-voice/voice` package, so manual addition in `MainApplication.kt` is not needed and can cause conflicts.

### Error Detection
The updated `SpeakingScreen.js` now:
1. Checks if native module exists before using it
2. Detects null reference errors early
3. Provides clear error messages with rebuild instructions
4. Increases wait time for first initialization (1000ms)
5. Increases retry attempts (5 instead of 3)

## If Problem Persists

1. **Check AndroidManifest.xml**: Ensure `RECORD_AUDIO` permission is present
2. **Verify package installation**: `npm list @react-native-voice/voice`
3. **Check patch file**: Ensure `patches/@react-native-voice+voice+3.2.4.patch` is applied
4. **Clean everything**:
   ```bash
   cd mobile
   rm -rf node_modules android/app/build android/.gradle
   npm install
   npm run postinstall
   cd android && ./gradlew clean && cd ..
   npx react-native run-android
   ```

## Related Files
- `mobile/src/components/SpeakingScreen.js` - Main component with Voice integration
- `mobile/android/app/src/main/java/com/kidspeak/mobile/MainApplication.kt` - App initialization
- `mobile/android/app/src/main/AndroidManifest.xml` - Permissions
- `mobile/rebuild-android.sh` - Rebuild script

