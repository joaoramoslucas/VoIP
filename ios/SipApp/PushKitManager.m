#import "PushKitManager.h"
#import "CallKitManager.h"

@interface PushKitManager () <PKPushRegistryDelegate>
@property (nonatomic, strong) PKPushRegistry *pushRegistry;
@end

@implementation PushKitManager

+ (instancetype)shared {
    static PushKitManager *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[PushKitManager alloc] init];
    });
    return instance;
}

- (instancetype)init {
    if (self = [super init]) {
        _pushRegistry = [[PKPushRegistry alloc] initWithQueue:dispatch_get_main_queue()];
        _pushRegistry.delegate = self;
    }
    return self;
}

- (void)registerForVoIPPushes {
    self.pushRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
}

#pragma mark - PKPushRegistryDelegate

- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
    if ([type isEqualToString:PKPushTypeVoIP]) {
        NSData *token = credentials.token;
        NSString *tokenString = [self stringFromDeviceToken:token];
        NSLog(@"[PushKit] VoIP token: %@", tokenString);
        
        [[NSUserDefaults standardUserDefaults] setObject:tokenString forKey:@"voip_push_token"];
        [[NSUserDefaults standardUserDefaults] synchronize];
    }
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
    NSLog(@"[PushKit] Incoming push: %@", payload.dictionaryPayload);
    
    if ([type isEqualToString:PKPushTypeVoIP]) {
        NSDictionary *data = payload.dictionaryPayload;
        NSString *caller = data[@"caller"] ?: @"Unknown";
        
        NSUUID *uuid = [NSUUID UUID];
        [[CallKitManager shared] reportIncomingCallWithUUID:uuid handle:caller completion:^(NSError *error) {
            if (error) {
                NSLog(@"[PushKit] CallKit error: %@", error);
            }
            completion();
        }];
        
        if (self.onIncomingPushCall) {
            self.onIncomingPushCall(data);
        }
    } else {
        completion();
    }
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type {
    NSLog(@"[PushKit] Token invalidated for type: %@", type);
}

- (NSString *)stringFromDeviceToken:(NSData *)deviceToken {
    const unsigned char *bytes = (const unsigned char *)[deviceToken bytes];
    NSMutableString *token = [NSMutableString string];
    for (NSUInteger i = 0; i < deviceToken.length; i++) {
        [token appendFormat:@"%02x", bytes[i]];
    }
    return [token copy];
}

@end
