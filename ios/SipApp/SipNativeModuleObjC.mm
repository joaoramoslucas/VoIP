#import "SipNativeModuleObjC.h"
#import "CallKitManager.h"
#import "PushKitManager.h"
#import <AVFoundation/AVFoundation.h>
#import <linphone/linphone.h>

@interface SipNativeModuleObjC()
@property (nonatomic, assign) LinphoneCore *core;
@property (nonatomic, strong) NSTimer *iterateTimer;
@property (nonatomic, strong) NSUUID *currentCallUUID;
@end

static void registration_state_changed(LinphoneCore *lc, LinphoneProxyConfig *cfg, LinphoneRegistrationState cstate, const char *message) {
    NSLog(@"[SipNativeModule] ===== REGISTRATION STATE CALLBACK =====");
    NSLog(@"[SipNativeModule] State: %d, Message: %s", cstate, message ? message : "(null)");
    
    SipNativeModuleObjC *module = (__bridge SipNativeModuleObjC *)linphone_core_get_user_data(lc);
    if (!module) {
        NSLog(@"[SipNativeModule] ERROR: Module is NULL!");
        return;
    }
    
    NSString *state = @"none";
    switch (cstate) {
        case LinphoneRegistrationProgress:
            state = @"progress";
            break;
        case LinphoneRegistrationOk:
            state = @"ok";
            break;
        case LinphoneRegistrationFailed:
            state = @"failed";
            break;
        case LinphoneRegistrationCleared:
            state = @"none";
            break;
        default:
            break;
    }
    
    NSLog(@"[SipNativeModule] Sending event: state=%@", state);
    
    [module sendEventWithName:@"onRegistrationState" body:@{
        @"state": state,
        @"message": message ? [NSString stringWithUTF8String:message] : @""
    }];
}

static void call_state_changed(LinphoneCore *lc, LinphoneCall *call, LinphoneCallState cstate, const char *message) {
    SipNativeModuleObjC *module = (__bridge SipNativeModuleObjC *)linphone_core_get_user_data(lc);
    if (!module) return;
    
    NSString *state = @"idle";
    const LinphoneAddress *addr = linphone_call_get_remote_address(call);
    const char *uri = addr ? linphone_address_as_string_uri_only(addr) : "";
    NSString *remoteUri = [NSString stringWithUTF8String:uri];
    
    switch (cstate) {
        case LinphoneCallIncomingReceived: {
            state = @"incoming";
            NSUUID *uuid = [NSUUID UUID];
            module.currentCallUUID = uuid;
            [[CallKitManager shared] reportIncomingCallWithUUID:uuid handle:remoteUri completion:^(NSError *error) {
                if (error) NSLog(@"CallKit error: %@", error);
            }];
            [module sendEventWithName:@"onIncomingCall" body:@{@"remoteUri": remoteUri}];
            break;
        }
        case LinphoneCallOutgoingInit:
        case LinphoneCallOutgoingProgress:
        case LinphoneCallOutgoingRinging: {
            state = @"outgoing";
            if (!module.currentCallUUID) {
                NSUUID *uuid = [NSUUID UUID];
                module.currentCallUUID = uuid;
                [[CallKitManager shared] reportOutgoingCallWithUUID:uuid handle:remoteUri];
            }
            break;
        }
        case LinphoneCallConnected:
        case LinphoneCallStreamsRunning:
            state = @"connected";
            if (module.currentCallUUID) {
                [[CallKitManager shared] reportCallConnectedWithUUID:module.currentCallUUID];
            }
            break;
        case LinphoneCallEnd:
        case LinphoneCallReleased:
            state = @"ended";
            if (module.currentCallUUID) {
                [[CallKitManager shared] endCallWithUUID:module.currentCallUUID];
                module.currentCallUUID = nil;
            }
            break;
        case LinphoneCallError:
            state = @"error";
            break;
        default:
            break;
    }
    
    [module sendEventWithName:@"onCallState" body:@{
        @"state": state,
        @"message": message ? [NSString stringWithUTF8String:message] : @"",
        @"remoteUri": remoteUri
    }];
}

@implementation SipNativeModuleObjC

RCT_EXPORT_MODULE(SipNativeModule);

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onCallState", @"onIncomingCall", @"onRegistrationState"];
}

- (void)startIterateTimer {
    if (self.iterateTimer) return;
    self.iterateTimer = [NSTimer scheduledTimerWithTimeInterval:0.02
                                                         target:self
                                                       selector:@selector(iterate)
                                                       userInfo:nil
                                                        repeats:YES];
}

- (void)stopIterateTimer {
    [self.iterateTimer invalidate];
    self.iterateTimer = nil;
}

- (void)iterate {
    if (self.core) {
        linphone_core_iterate(self.core);
    }
}

RCT_EXPORT_METHOD(initialize:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSLog(@"[SipNativeModule] ========== INITIALIZE START ==========");
        
        // CallKit callbacks
        __weak typeof(self) weakSelf = self;
        [CallKitManager shared].onAnswerCall = ^{
            [weakSelf handleCallKitAnswer];
        };
        [CallKitManager shared].onEndCall = ^{
            [weakSelf handleCallKitEnd];
        };
        
        // PushKit callback
        [PushKitManager shared].onIncomingPushCall = ^(NSDictionary *payload) {
            NSLog(@"[SipNativeModule] Push call received: %@", payload);
            // Linphone vai receber a chamada via SIP após o push acordar o app
        };
        
        LinphoneCoreVTable vtable = {0};
        vtable.registration_state_changed = registration_state_changed;
        vtable.call_state_changed = call_state_changed;
        
        LinphoneFactory *factory = linphone_factory_get();
        self.core = linphone_factory_create_core_3(factory, NULL, NULL, (__bridge void *)self);
        
        if (!self.core) {
            NSLog(@"[SipNativeModule] ERROR: Failed to create core");
            reject(@"INIT_ERROR", @"Failed to create Linphone core", nil);
            return;
        }
        
        NSLog(@"[SipNativeModule] Core created successfully");
        
        LinphoneCoreCbs *cbs = linphone_factory_create_core_cbs(factory);
        linphone_core_cbs_set_registration_state_changed(cbs, registration_state_changed);
        linphone_core_cbs_set_call_state_changed(cbs, call_state_changed);
        linphone_core_add_callbacks(self.core, cbs);
        linphone_core_cbs_unref(cbs);
        
        linphone_core_set_user_data(self.core, (__bridge void *)self);
        linphone_core_start(self.core);
        
        NSLog(@"[SipNativeModule] Core started");
        
        AVAudioSession *session = [AVAudioSession sharedInstance];
        [session setCategory:AVAudioSessionCategoryPlayAndRecord mode:AVAudioSessionModeVoiceChat options:0 error:nil];
        [session setActive:YES error:nil];
        
        [self startIterateTimer];
        
        NSLog(@"[SipNativeModule] ========== INITIALIZE SUCCESS ==========");
        resolve(@YES);
    } @catch (NSException *exception) {
        NSLog(@"[SipNativeModule] EXCEPTION: %@", exception.reason);
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

- (void)handleCallKitAnswer {
    if (self.core) {
        LinphoneCall *call = linphone_core_get_current_call(self.core);
        if (call) {
            linphone_call_accept(call);
        }
    }
}

- (void)handleCallKitEnd {
    if (self.core) {
        LinphoneCall *call = linphone_core_get_current_call(self.core);
        if (call) {
            linphone_call_terminate(call);
        } else {
            linphone_core_terminate_all_calls(self.core);
        }
    }
}

RCT_EXPORT_METHOD(setPushToken:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    resolve(@YES);
}

RCT_EXPORT_METHOD(getPushToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *token = [[NSUserDefaults standardUserDefaults] stringForKey:@"voip_push_token"];
    resolve(token ?: @"");
}

RCT_EXPORT_METHOD(register:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    @try {
        NSString *domain = params[@"sipDomain"] ?: @"sip.linphone.org";
        NSString *username = params[@"username"] ?: @"";
        NSString *password = params[@"password"] ?: @"";
        NSString *transport = params[@"transport"] ?: @"tcp";
        
        if (username.length == 0 || domain.length == 0) {
            reject(@"INVALID_PARAMS", @"sipDomain and username are required", nil);
            return;
        }
        
        NSLog(@"[SipNativeModule] register() domain=%@ user=%@ transport=%@", domain, username, transport);
        
        LinphoneTransportType transportType = LinphoneTransportTcp;
        if ([transport.lowercaseString isEqualToString:@"udp"]) {
            transportType = LinphoneTransportUdp;
        } else if ([transport.lowercaseString isEqualToString:@"tls"]) {
            transportType = LinphoneTransportTls;
        }
        
        // Remove old proxy config
        LinphoneProxyConfig *oldConfig = linphone_core_get_default_proxy_config(self.core);
        if (oldConfig) {
            NSLog(@"[SipNativeModule] Removing old proxy config");
            linphone_core_remove_proxy_config(self.core, oldConfig);
        }
        linphone_core_clear_all_auth_info(self.core);
        
        // Add auth info
        LinphoneAuthInfo *authInfo = linphone_auth_info_new(
            [username UTF8String],
            NULL,
            [password UTF8String],
            NULL,
            [domain UTF8String],
            [domain UTF8String]
        );
        linphone_core_add_auth_info(self.core, authInfo);
        linphone_auth_info_unref(authInfo);
        
        // Create proxy config
        LinphoneProxyConfig *proxyConfig = linphone_core_create_proxy_config(self.core);
        
        NSString *identityStr = [NSString stringWithFormat:@"sip:%@@%@", username, domain];
        LinphoneAddress *identity = linphone_address_new([identityStr UTF8String]);
        linphone_proxy_config_set_identity_address(proxyConfig, identity);
        linphone_address_unref(identity);
        
        NSString *serverStr = [NSString stringWithFormat:@"sip:%@;transport=%@", domain, transport];
        linphone_proxy_config_set_server_addr(proxyConfig, [serverStr UTF8String]);
        
        linphone_proxy_config_enable_register(proxyConfig, TRUE);
        linphone_core_add_proxy_config(self.core, proxyConfig);
        linphone_core_set_default_proxy_config(self.core, proxyConfig);
        linphone_proxy_config_unref(proxyConfig);
        
        [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"progress", @"message": @"Registering..."}];
        
        resolve(@YES);
    } @catch (NSException *exception) {
        NSLog(@"[SipNativeModule] register() error: %@", exception.reason);
        [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"failed", @"message": exception.reason ?: @"Registration failed"}];
        reject(@"REGISTER_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(unregister:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (self.core) {
        linphone_core_clear_proxy_config(self.core);
        linphone_core_clear_all_auth_info(self.core);
    }
    resolve(@YES);
}

RCT_EXPORT_METHOD(startCall:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    @try {
        NSString *destination = params[@"to"] ?: @"";
        LinphoneAddress *addr = linphone_address_new([destination UTF8String]);
        LinphoneCallParams *callParams = linphone_core_create_call_params(self.core, NULL);
        linphone_call_params_set_media_encryption(callParams, LinphoneMediaEncryptionNone);
        
        linphone_core_invite_address_with_params(self.core, addr, callParams);
        
        linphone_address_unref(addr);
        linphone_call_params_unref(callParams);
        
        resolve(@YES);
    } @catch (NSException *exception) {
        reject(@"CALL_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(setMute:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (self.core) {
        BOOL muted = [params[@"muted"] boolValue];
        linphone_core_set_mic_enabled(self.core, !muted);
    }
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
    if (self.core) {
        LinphoneCall *call = linphone_core_get_current_call(self.core);
        if (call) {
            linphone_call_terminate(call);
        } else {
            linphone_core_terminate_all_calls(self.core);
        }
    }
    resolve(@YES);
}

RCT_EXPORT_METHOD(acceptCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (self.core) {
        LinphoneCall *call = linphone_core_get_current_call(self.core);
        if (call) {
            linphone_call_accept(call);
        }
    }
    resolve(@YES);
}

RCT_EXPORT_METHOD(declineCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (self.core) {
        LinphoneCall *call = linphone_core_get_current_call(self.core);
        if (call) {
            linphone_call_decline(call, LinphoneReasonDeclined);
        }
    }
    resolve(@YES);
}

RCT_EXPORT_METHOD(sendDtmf:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (self.core) {
        NSString *digit = params[@"digit"] ?: @"";
        if (digit.length > 0) {
            LinphoneCall *call = linphone_core_get_current_call(self.core);
            if (call) {
                linphone_call_send_dtmf(call, [digit characterAtIndex:0]);
            }
        }
    }
    resolve(@YES);
}

- (void)dealloc {
    [self stopIterateTimer];
    if (self.core) {
        linphone_core_stop(self.core);
        linphone_core_unref(self.core);
        self.core = NULL;
    }
}

@end
