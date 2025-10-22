//
//  NativeAudioPlayer.h
//  KidSpeak
//
//  Created by AI Assistant on 2024
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface NativeAudioPlayer : RCTEventEmitter <RCTBridgeModule, AVAudioPlayerDelegate>

@property (nonatomic, strong) AVAudioPlayer *audioPlayer;

@end
