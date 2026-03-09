#import <Foundation/Foundation.h>
#import <PushKit/PushKit.h>

@interface PushKitManager : NSObject
+ (instancetype)shared;
- (void)registerForVoIPPushes;
@property (nonatomic, copy) void (^onIncomingPushCall)(NSDictionary *payload);
@end
