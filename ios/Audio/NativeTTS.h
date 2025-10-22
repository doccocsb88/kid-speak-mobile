//
//  NativeTTS.h
//  KidSpeak
//
//  Created by AI Assistant on 2024
//

#import <Foundation/Foundation.h>
#import <AVFoundation/AVFoundation.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface NativeTTS : RCTEventEmitter <RCTBridgeModule, AVSpeechSynthesizerDelegate>

@property (nonatomic, strong) AVSpeechSynthesizer *speechSynthesizer;

@end
