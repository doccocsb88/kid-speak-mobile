#!/bin/bash

# Script to view KidSpeak app logs on Android
# Usage: ./view-logs.sh [filter]

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}KidSpeak Log Viewer${NC}"
echo "===================="
echo "Default filter: speech (use './view-logs.sh speech' for debugging)"
echo ""

# Get the filter option
FILTER=${1:-"speech"}

# Show help for invalid options without requiring device
case $FILTER in
    "help"|"-h"|"--help")
        echo "Usage: ./view-logs.sh [filter]"
        echo ""
        echo "Filters:"
        echo "  speech  - Speech recognition logs (DEFAULT - RECOMMENDED for debugging) 🎤"
        echo "  voice   - Voice recognition logs only ([Voice], [Permission], [VAD])"
        echo "  state   - State transitions only ([State], [Ref])"
        echo "  all     - All KidSpeak logs"
        echo "  raw     - All React Native logs (no filter)"
        echo "  app     - All logs from KidSpeak app"
        echo "  native  - Native Android module logs"
        echo ""
        echo "Examples:"
        echo "  ./view-logs.sh speech   # Speech recognition debugging (recommended)"
        echo "  ./view-logs.sh voice    # Voice logs only"
        echo "  ./view-logs.sh all      # All KidSpeak logs"
        echo "  ./view-logs.sh          # Same as 'speech'"
        exit 0
        ;;

    "speech"|"voice"|"state"|"all"|"raw"|"app"|"native")
        # Valid filter, check device connection
        if ! adb devices | grep -q "device$"; then
            echo -e "${YELLOW}⚠️  No Android device connected!${NC}"
            echo "Please connect your device via USB or start an emulator."
            exit 1
        fi
        ;;

    *)
        # Invalid filter, show help
        echo "Invalid filter: $FILTER"
        echo ""
        echo "Usage: ./view-logs.sh [filter]"
        echo ""
        echo "Filters:"
        echo "  speech  - Speech recognition logs (DEFAULT - RECOMMENDED for debugging) 🎤"
        echo "  voice   - Voice recognition logs only ([Voice], [Permission], [VAD])"
        echo "  state   - State transitions only ([State], [Ref])"
        echo "  all     - All KidSpeak logs"
        echo "  raw     - All React Native logs (no filter)"
        echo "  app     - All logs from KidSpeak app"
        echo "  native  - Native Android module logs"
        echo ""
        echo "Examples:"
        echo "  ./view-logs.sh speech   # Speech recognition debugging (recommended)"
        echo "  ./view-logs.sh voice    # Voice logs only"
        echo "  ./view-logs.sh all      # All KidSpeak logs"
        echo "  ./view-logs.sh          # Same as 'speech'"
        exit 1
        ;;
esac

case $FILTER in
    "speech")
        echo -e "${GREEN}🎤 Viewing Speech Recognition logs (DEFAULT - RECOMMENDED)...${NC}"
        echo "Filtering: Voice, KSSpeech, Permission, VAD, State, DEBUG, ModuleSelection"
        echo "Also includes: KSSpeechModule, RecognitionService, SODA native logs"
        echo "Excludes: Volume level messages"
        echo ""
        adb logcat -c  # Clear log buffer
        adb logcat | grep -E "ReactNativeJS.*\[(Voice|KSSpeech|Permission|VAD|State|DEBUG|ModuleSelection)\]|KSSpeechModule|RecognitionService|SODA" | grep -v "\[Voice\] Volume:"
        ;;

    "voice")
        echo -e "${GREEN}📱 Viewing Voice-related logs only...${NC}"
        echo "Filtering: [Voice], [Permission], [VAD], [State]"
        echo "Excludes: Volume level messages"
        echo ""
        adb logcat -c  # Clear log buffer
        adb logcat | grep -E "ReactNativeJS.*\[Voice\]|ReactNativeJS.*\[Permission\]|ReactNativeJS.*\[VAD\]|ReactNativeJS.*\[State\]" | grep -v "\[Voice\] Volume:"
        ;;

    "state")
        echo -e "${GREEN}📱 Viewing State transitions only...${NC}"
        echo "Filtering: [State], [Ref]"
        echo ""
        adb logcat -c
        adb logcat | grep -E "ReactNativeJS.*\[State\]|ReactNativeJS.*\[Ref\]"
        ;;

    "all")
        echo -e "${GREEN}📱 Viewing ALL KidSpeak logs...${NC}"
        echo "Filtering: [Voice], [Permission], [VAD], [State], [Ref], [UI], [API], [Audio], [TTS], [KSSpeech], [DEBUG], [ModuleSelection]"
        echo "Excludes: Volume level messages"
        echo ""
        adb logcat -c
        adb logcat | grep -E "ReactNativeJS.*\[(Voice|Permission|VAD|State|Ref|UI|API|Audio|TTS|KSSpeech|DEBUG|ModuleSelection)\]" | grep -v "\[Voice\] Volume:"
        ;;

    "raw")
        echo -e "${GREEN}📱 Viewing ALL React Native logs (no filter)...${NC}"
        echo ""
        adb logcat -c
        adb logcat | grep "ReactNativeJS"
        ;;

    "app")
        echo -e "${GREEN}📱 Viewing ALL logs from KidSpeak app...${NC}"
        echo "Package: com.kidspeak.mobile"
        echo ""
        adb logcat -c
        adb logcat | grep -E "com.kidspeak.mobile|ReactNativeJS"
        ;;

    "native")
        echo -e "${GREEN}📱 Viewing Native Android logs...${NC}"
        echo "Filtering: KSSpeechModule, RecognitionService, SODA, SpeechRecognizer"
        echo ""
        adb logcat -c
        adb logcat | grep -E "KSSpeechModule|RecognitionService|SODA|SpeechRecognizer|MainApplication"
        ;;
    
    *)
        # This should not be reached due to the earlier case, but just in case
        echo "Invalid filter: $FILTER"
        exit 1
        ;;
esac

