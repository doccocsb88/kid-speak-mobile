//
//  NativeAudioPlayer.m
//  KidSpeak
//
//  Created by AI Assistant on 2024
//

#import "NativeAudioPlayer.h"

@implementation NativeAudioPlayer

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onAudioPlaybackFinished", @"onAudioPlaybackError"];
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // Configure audio session for playback
        NSError *error;
        AVAudioSession *audioSession = [AVAudioSession sharedInstance];
        
        // Set category for playback
        [audioSession setCategory:AVAudioSessionCategoryPlayback 
                      withOptions:AVAudioSessionCategoryOptionMixWithOthers 
                            error:&error];
        
        if (error) {
            NSLog(@"❌ Audio session category error: %@", error.localizedDescription);
        }
        
        // Set mode
        [audioSession setMode:AVAudioSessionModeDefault error:&error];
        if (error) {
            NSLog(@"❌ Audio session mode error: %@", error.localizedDescription);
        }
        
        // Activate session
        [audioSession setActive:YES error:&error];
        if (error) {
            NSLog(@"❌ Audio session activation error: %@", error.localizedDescription);
        } else {
            NSLog(@"✅ Native audio session configured successfully");
        }
    }
    return self;
}

RCT_EXPORT_METHOD(playAudioFromBase64:(NSString *)base64String
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        NSLog(@"🔊 Native audio player: Starting playback...");
        
        // Convert base64 to NSData
        NSData *audioData = [[NSData alloc] initWithBase64EncodedString:base64String options:0];
        
        if (!audioData || audioData.length == 0) {
            reject(@"INVALID_AUDIO_DATA", @"Invalid base64 audio data", nil);
            return;
        }
        
        NSLog(@"📄 Native audio player: Audio data size: %lu bytes", (unsigned long)audioData.length);
        
        // Create audio player
        NSError *error;
        AVAudioPlayer *audioPlayer = [[AVAudioPlayer alloc] initWithData:audioData error:&error];
        
        if (error) {
            NSLog(@"❌ Native audio player error: %@", error.localizedDescription);
            reject(@"AUDIO_PLAYER_ERROR", error.localizedDescription, error);
            return;
        }
        
        // Set delegate
        audioPlayer.delegate = self;
        
        // Set volume
        audioPlayer.volume = 1.0;
        
        // Prepare to play
        if (![audioPlayer prepareToPlay]) {
            reject(@"AUDIO_PREPARE_ERROR", @"Failed to prepare audio for playback", nil);
            return;
        }
        
        NSLog(@"✅ Native audio player: Prepared successfully");
        
        // Play audio
        if (![audioPlayer play]) {
            reject(@"AUDIO_PLAY_ERROR", @"Failed to start audio playback", nil);
            return;
        }
        
        NSLog(@"🎵 Native audio player: Started playing");
        
        // Store player reference to prevent deallocation
        self.audioPlayer = audioPlayer;
        
        resolve(@{@"success": @YES, @"message": @"Audio playback started"});
        
    } @catch (NSException *exception) {
        NSLog(@"❌ Native audio player exception: %@", exception.reason);
        reject(@"AUDIO_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(stopAudio:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        if (self.audioPlayer && [self.audioPlayer isPlaying]) {
            [self.audioPlayer stop];
            NSLog(@"🛑 Native audio player: Stopped");
        }
        resolve(@{@"success": @YES, @"message": @"Audio stopped"});
    } @catch (NSException *exception) {
        NSLog(@"❌ Native audio stop exception: %@", exception.reason);
        reject(@"AUDIO_STOP_EXCEPTION", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(isPlaying:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    
    @try {
        BOOL playing = (self.audioPlayer && [self.audioPlayer isPlaying]);
        resolve(@{@"isPlaying": @(playing)});
    } @catch (NSException *exception) {
        NSLog(@"❌ Native audio isPlaying exception: %@", exception.reason);
        reject(@"AUDIO_STATUS_EXCEPTION", exception.reason, nil);
    }
}

#pragma mark - AVAudioPlayerDelegate

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag {
    NSLog(@"🎵 Native audio player: Finished playing successfully: %@", flag ? @"YES" : @"NO");
    
    // Send event to React Native
    [self sendEventWithName:@"onAudioPlaybackFinished" body:@{
        @"success": @(flag),
        @"message": flag ? @"Audio playback completed successfully" : @"Audio playback finished with error"
    }];
    
    // Clean up
    self.audioPlayer = nil;
}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error {
    NSLog(@"❌ Native audio player decode error: %@", error.localizedDescription);
    
    // Send event to React Native
    [self sendEventWithName:@"onAudioPlaybackError" body:@{
        @"error": error.localizedDescription,
        @"code": @(error.code)
    }];
    
    // Clean up
    self.audioPlayer = nil;
}

@end
