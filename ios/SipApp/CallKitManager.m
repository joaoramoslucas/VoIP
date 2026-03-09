#import "CallKitManager.h"
#import <AVFoundation/AVFoundation.h>

@interface CallKitManager () <CXProviderDelegate>
@property (nonatomic, strong) CXProvider *provider;
@property (nonatomic, strong) CXCallController *callController;
@property (nonatomic, strong) NSUUID *currentCallUUID;
@end

@implementation CallKitManager

+ (instancetype)shared {
    static CallKitManager *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[CallKitManager alloc] init];
    });
    return instance;
}

- (instancetype)init {
    if (self = [super init]) {
        CXProviderConfiguration *config = [[CXProviderConfiguration alloc] init];
        config.supportsVideo = NO;
        config.maximumCallsPerCallGroup = 1;
        config.supportedHandleTypes = [NSSet setWithObjects:@(CXHandleTypeGeneric), @(CXHandleTypePhoneNumber), nil];
        
        _provider = [[CXProvider alloc] initWithConfiguration:config];
        [_provider setDelegate:self queue:nil];
        _callController = [[CXCallController alloc] init];
    }
    return self;
}

- (void)reportIncomingCallWithUUID:(NSUUID *)uuid handle:(NSString *)handle completion:(void (^)(NSError *))completion {
    CXCallUpdate *update = [[CXCallUpdate alloc] init];
    update.remoteHandle = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:handle];
    update.hasVideo = NO;
    
    self.currentCallUUID = uuid;
    
    [self.provider reportNewIncomingCallWithUUID:uuid update:update completion:^(NSError *error) {
        if (completion) completion(error);
    }];
}

- (void)reportOutgoingCallWithUUID:(NSUUID *)uuid handle:(NSString *)handle {
    self.currentCallUUID = uuid;
    
    CXCallUpdate *update = [[CXCallUpdate alloc] init];
    update.remoteHandle = [[CXHandle alloc] initWithType:CXHandleTypeGeneric value:handle];
    update.hasVideo = NO;
    
    [self.provider reportCallWithUUID:uuid updated:update];
    [self.provider reportOutgoingCallWithUUID:uuid startedConnectingAtDate:[NSDate date]];
}

- (void)reportCallConnectedWithUUID:(NSUUID *)uuid {
    [self.provider reportOutgoingCallWithUUID:uuid connectedAtDate:[NSDate date]];
}

- (void)endCallWithUUID:(NSUUID *)uuid {
    CXEndCallAction *action = [[CXEndCallAction alloc] initWithCallUUID:uuid];
    CXTransaction *transaction = [[CXTransaction alloc] initWithAction:action];
    
    [self.callController requestTransaction:transaction completion:^(NSError *error) {
        if (error) {
            NSLog(@"CallKit: Error ending call: %@", error);
        }
    }];
}

#pragma mark - CXProviderDelegate

- (void)providerDidReset:(CXProvider *)provider {
    self.currentCallUUID = nil;
}

- (void)provider:(CXProvider *)provider performAnswerCallAction:(CXAnswerCallAction *)action {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeVoiceChat options:0 error:nil];
    [session setActive:YES error:nil];
    
    if (self.onAnswerCall) {
        self.onAnswerCall();
    }
    [action fulfill];
}

- (void)provider:(CXProvider *)provider performEndCallAction:(CXEndCallAction *)action {
    if (self.onEndCall) {
        self.onEndCall();
    }
    self.currentCallUUID = nil;
    [action fulfill];
}

- (void)provider:(CXProvider *)provider performStartCallAction:(CXStartCallAction *)action {
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeVoiceChat options:0 error:nil];
    [session setActive:YES error:nil];
    [action fulfill];
}

- (void)provider:(CXProvider *)provider didActivateAudioSession:(AVAudioSession *)audioSession {
}

- (void)provider:(CXProvider *)provider didDeactivateAudioSession:(AVAudioSession *)audioSession {
}

@end
