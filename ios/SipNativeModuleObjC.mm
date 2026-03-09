#import "SipNativeModuleObjC.h"
#import <AVFoundation/AVFoundation.h>

@interface SipNativeModuleObjC()
@property (nonatomic, strong) NSString *registeredUsername;
@property (nonatomic, assign) BOOL isRegistered;
@end

@implementation SipNativeModuleObjC

RCT_EXPORT_MODULE(SipNativeModule);

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onCallState", @"onIncomingCall", @"onRegistrationState"];
}

RCT_EXPORT_METHOD(initialize:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        AVAudioSession *session = [AVAudioSession sharedInstance];
        [session setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeVoiceChat options:0 error:nil];
        [session setActive:YES error:nil];
        
        self.isRegistered = NO;
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(setPushToken:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@YES);
}

RCT_EXPORT_METHOD(getPushToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@"");
}

RCT_EXPORT_METHOD(register:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *username = params[@"username"] ?: @"";
    self.registeredUsername = username;
    
    [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"progress", @"message": @"Registering..."}];
    
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        self.isRegistered = YES;
        [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"ok", @"message": @"Registered"}];
        resolve(@YES);
    });
}

RCT_EXPORT_METHOD(unregister:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    self.isRegistered = NO;
    [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"none", @"message": @"Unregistered"}];
    resolve(@YES);
}

RCT_EXPORT_METHOD(startCall:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.isRegistered) {
        reject(@"NOT_REGISTERED", @"Not registered", nil);
        return;
    }
    
    NSString *destination = params[@"to"] ?: @"";
    [self sendEventWithName:@"onCallState" body:@{@"state": @"outgoing", @"message": @"Calling", @"remoteUri": destination}];
    
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(2.0 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        [self sendEventWithName:@"onCallState" body:@{@"state": @"connected", @"message": @"Connected", @"remoteUri": destination}];
    });
    
    resolve(@YES);
}

RCT_EXPORT_METHOD(setMute:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@YES);
}

RCT_EXPORT_METHOD(setSpeaker:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    BOOL speakerOn = [params[@"speakerOn"] boolValue];
    AVAudioSession *session = [AVAudioSession sharedInstance];
    if (speakerOn) {
        [session overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:nil];
    } else {
        [session overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:nil];
    }
    resolve(@YES);
}

RCT_EXPORT_METHOD(hangup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self sendEventWithName:@"onCallState" body:@{@"state": @"ended", @"message": @"Call ended", @"remoteUri": @""}];
    resolve(@YES);
}

RCT_EXPORT_METHOD(acceptCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self sendEventWithName:@"onCallState" body:@{@"state": @"connected", @"message": @"Call accepted", @"remoteUri": @""}];
    resolve(@YES);
}

RCT_EXPORT_METHOD(declineCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    [self sendEventWithName:@"onCallState" body:@{@"state": @"ended", @"message": @"Call declined", @"remoteUri": @""}];
    resolve(@YES);
}

@end
