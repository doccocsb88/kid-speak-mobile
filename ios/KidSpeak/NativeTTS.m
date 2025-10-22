//
//  NativeTTS.m
//  KidSpeak
//
//  Created by AI Assistant on 2024
//

#import "NativeTTS.h"

@implementation NativeTTS

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onTTSSpeechStarted", @"onTTSSpeechFinished", @"onTTSSpeechError"];
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // Initialize speech synthesizer
        self.speechSynthesizer = [[AVSpeechSynthesizer alloc] init];
        self.speechSynthesizer.delegate = self;
        
        NSLog(@"✅ Native TTS initialized successfully");
    }
    return self;
}

RCT_EXPORT_METHOD(speakText:(NSString *)text
                  language:(NSString *)language
                  rate:(float)rate
                  pitch:(float)pitch
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        NSLog(@"🎤 Native TTS: Starting speech for text: %@", text);
        
        if (!text || text.length == 0) {
            reject(@"INVALID_TEXT", @"Text cannot be empty", nil);
            return;
        }
        
        // Stop any current speech
        [self.speechSynthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
        
        // Create speech utterance
        AVSpeechUtterance *utterance = [AVSpeechUtterance speechUtteranceWithString:text];
        
        // Set language (default to English if not specified)
        if (language && language.length > 0) {
            utterance.voice = [AVSpeechSynthesisVoice voiceWithLanguage:language];
        } else {
            utterance.voice = [AVSpeechSynthesisVoice voiceWithLanguage:@"en-US"];
        }
        
        // Set speech rate (0.0 to 1.0, default is 0.5)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * rate;
        if (utterance.rate < AVSpeechUtteranceMinimumSpeechRate) {
            utterance.rate = AVSpeechUtteranceMinimumSpeechRate;
        } else if (utterance.rate > AVSpeechUtteranceMaximumSpeechRate) {
            utterance.rate = AVSpeechUtteranceMaximumSpeechRate;
        }
        
        // Set pitch (0.5 to 2.0, default is 1.0)
        utterance.pitchMultiplier = pitch;
        if (utterance.pitchMultiplier < 0.5) {
            utterance.pitchMultiplier = 0.5;
        } else if (utterance.pitchMultiplier > 2.0) {
            utterance.pitchMultiplier = 2.0;
        }
        
        // Set volume
        utterance.volume = 1.0;
        
        NSLog(@"🎤 Native TTS: Speech settings - Rate: %.2f, Pitch: %.2f, Voice: %@", 
              utterance.rate, utterance.pitchMultiplier, utterance.voice.language);
        
        // Start speaking
        [self.speechSynthesizer speakUtterance:utterance];
        
        resolve(@{
            @"success": @YES, 
            @"message": @"Native TTS speech started",
            @"text": text,
            @"language": utterance.voice.language ?: @"en-US",
            @"rate": @(utterance.rate),
            @"pitch": @(utterance.pitchMultiplier)
        });
        
    } @catch (NSException *exception) {
        NSLog(@"❌ Native TTS exception: %@", exception.reason);
        reject(@"TTS_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(stopSpeaking:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        NSLog(@"🛑 Native TTS: Stopping speech...");
        
        BOOL wasSpeaking = self.speechSynthesizer.isSpeaking;
        
        if (wasSpeaking) {
            [self.speechSynthesizer stopSpeakingAtBoundary:AVSpeechBoundaryImmediate];
            NSLog(@"✅ Native TTS: Speech stopped");
        } else {
            NSLog(@"ℹ️ Native TTS: No speech was currently playing");
        }
        
        resolve(@{
            @"success": @YES,
            @"message": wasSpeaking ? @"Speech stopped" : @"No speech was playing",
            @"wasSpeaking": @(wasSpeaking)
        });
        
    } @catch (NSException *exception) {
        NSLog(@"❌ Native TTS stop exception: %@", exception.reason);
        reject(@"TTS_STOP_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(isSpeaking:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        BOOL speaking = self.speechSynthesizer.isSpeaking;
        
        resolve(@{
            @"isSpeaking": @(speaking),
            @"message": speaking ? @"Currently speaking" : @"Not speaking"
        });
        
    } @catch (NSException *exception) {
        NSLog(@"❌ Native TTS status exception: %@", exception.reason);
        reject(@"TTS_STATUS_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(getAvailableVoices:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        NSArray<AVSpeechSynthesisVoice *> *voices = [AVSpeechSynthesisVoice speechVoices];
        NSMutableArray *voiceList = [[NSMutableArray alloc] init];
        
        for (AVSpeechSynthesisVoice *voice in voices) {
            [voiceList addObject:@{
                @"identifier": voice.identifier,
                @"language": voice.language,
                @"name": voice.name ?: @"Unknown",
                @"quality": @(voice.quality)
            }];
        }
        
        NSLog(@"🎤 Native TTS: Found %lu available voices", (unsigned long)voices.count);
        
        resolve(@{
            @"success": @YES,
            @"voices": voiceList,
            @"count": @(voices.count)
        });
        
    } @catch (NSException *exception) {
        NSLog(@"❌ Native TTS voices exception: %@", exception.reason);
        reject(@"TTS_VOICES_EXCEPTION", exception.reason, nil);
    }
}

#pragma mark - AVSpeechSynthesizerDelegate

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didStartSpeechUtterance:(AVSpeechUtterance *)utterance {
    NSLog(@"🎤 Native TTS: Speech started");
    
    [self sendEventWithName:@"onTTSSpeechStarted" body:@{
        @"text": utterance.speechString,
        @"language": utterance.voice.language ?: @"en-US",
        @"rate": @(utterance.rate),
        @"pitch": @(utterance.pitchMultiplier)
    }];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didFinishSpeechUtterance:(AVSpeechUtterance *)utterance {
    NSLog(@"✅ Native TTS: Speech finished");
    
    [self sendEventWithName:@"onTTSSpeechFinished" body:@{
        @"text": utterance.speechString,
        @"language": utterance.voice.language ?: @"en-US",
        @"rate": @(utterance.rate),
        @"pitch": @(utterance.pitchMultiplier)
    }];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer didCancelSpeechUtterance:(AVSpeechUtterance *)utterance {
    NSLog(@"🛑 Native TTS: Speech cancelled");
    
    [self sendEventWithName:@"onTTSSpeechFinished" body:@{
        @"text": utterance.speechString,
        @"language": utterance.voice.language ?: @"en-US",
        @"rate": @(utterance.rate),
        @"pitch": @(utterance.pitchMultiplier),
        @"cancelled": @YES
    }];
}

- (void)speechSynthesizer:(AVSpeechSynthesizer *)synthesizer willSpeakRangeOfSpeechString:(NSRange)characterRange utterance:(AVSpeechUtterance *)utterance {
    // Optional: Send progress updates
    // NSLog(@"🎤 Native TTS: Speaking range: %@", NSStringFromRange(characterRange));
}

@end
