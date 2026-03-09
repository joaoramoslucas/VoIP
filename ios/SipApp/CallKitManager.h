#import <Foundation/Foundation.h>
#import <CallKit/CallKit.h>

@interface CallKitManager : NSObject
+ (instancetype)shared;
- (void)reportIncomingCallWithUUID:(NSUUID *)uuid handle:(NSString *)handle completion:(void (^)(NSError *))completion;
- (void)reportOutgoingCallWithUUID:(NSUUID *)uuid handle:(NSString *)handle;
- (void)reportCallConnectedWithUUID:(NSUUID *)uuid;
- (void)endCallWithUUID:(NSUUID *)uuid;
@property (nonatomic, copy) void (^onAnswerCall)(void);
@property (nonatomic, copy) void (^onEndCall)(void);
@end
