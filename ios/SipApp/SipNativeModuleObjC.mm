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

// ===== CALLBACKS GLOBAIS =====

static void registration_state_changed(LinphoneCore *lc, LinphoneProxyConfig *cfg, LinphoneRegistrationState cstate, const char *message) {
    SipNativeModuleObjC *module = (__bridge SipNativeModuleObjC *)linphone_core_get_user_data(lc);
    if (!module) {
        NSLog(@"[SipNativeModule] ERROR: Module is NULL in registration callback!");
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
        case LinphoneRegistrationNone:
            state = @"none";
            break;
        default:
            state = @"progress";
            break;
    }
    
    const char *domain = linphone_proxy_config_get_domain(cfg);
    NSLog(@"[SipNativeModule] REG state=%d mapped=%@ message=%s domain=%s", 
          cstate, state, message ? message : "(null)", domain ? domain : "(null)");
    
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
    
    NSString *direction = nil;
    LinphoneCallDir callDir = linphone_call_get_dir(call);
    if (callDir == LinphoneCallIncoming) {
        direction = @"Incoming";
    } else if (callDir == LinphoneCallOutgoing) {
        direction = @"Outgoing";
    }
    
    switch (cstate) {
        case LinphoneCallIncomingReceived: {
            state = @"incoming";
            NSUUID *uuid = [NSUUID UUID];
            module.currentCallUUID = uuid;
            [[CallKitManager shared] reportIncomingCallWithUUID:uuid handle:remoteUri completion:^(NSError *error) {
                if (error) NSLog(@"[SipNativeModule] CallKit error: %@", error);
            }];
            [module sendEventWithName:@"onIncomingCall" body:@{@"from": remoteUri}];
            break;
        }
        case LinphoneCallOutgoingInit:
        case LinphoneCallOutgoingProgress:
        case LinphoneCallOutgoingRinging:
        case LinphoneCallOutgoingEarlyMedia: {
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
    
    const LinphoneErrorInfo *errorInfo = linphone_call_get_error_info(call);
    int sipCode = errorInfo ? linphone_error_info_get_protocol_code(errorInfo) : 0;
    
    NSLog(@"[SipNativeModule] CALL state=%d mapped=%@ msg=%s remote=%@ sipCode=%d", 
          cstate, state, message ? message : "(null)", remoteUri, sipCode);
    
    [module sendEventWithName:@"onCallState" body:@{
        @"state": state,
        @"message": message ? [NSString stringWithUTF8String:message] : @"",
        @"remoteUri": remoteUri,
        @"direction": direction ?: [NSNull null]
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
    NSLog(@"[SipNativeModule] iterate loop started");
}

- (void)stopIterateTimer {
    [self.iterateTimer invalidate];
    self.iterateTimer = nil;
    NSLog(@"[SipNativeModule] iterate loop stopped");
}

- (void)iterate {
    if (self.core) {
        linphone_core_iterate(self.core);
    }
}

// ===== HELPERS =====

- (void)tryEnableEchoFeatures:(LinphoneCore *)core {
    // Echo Cancellation
    if (linphone_core_echo_cancellation_enabled(core)) {
        NSLog(@"[SipNativeModule] Echo cancellation already enabled");
    } else {
        linphone_core_enable_echo_cancellation(core, TRUE);
        NSLog(@"[SipNativeModule] Echo cancellation enabled");
    }
    
    // Echo Limiter
    if (linphone_core_echo_limiter_enabled(core)) {
        NSLog(@"[SipNativeModule] Echo limiter already enabled");
    } else {
        linphone_core_enable_echo_limiter(core, TRUE);
        NSLog(@"[SipNativeModule] Echo limiter enabled");
    }
}

- (void)configureCodecs:(LinphoneCore *)core {
    // Lista COMPLETA de codecs suportados pelo Linphone
    NSArray *allowedCodecs = @[
        // Wideband (melhor qualidade)
        @"opus",        // Opus - melhor codec moderno
        @"speex",       // Speex wideband
        @"g722",        // G.722 - HD voice
        @"amr-wb",      // AMR wideband
        @"aac-eld",     // AAC-ELD
        
        // Narrowband (compatibilidade)
        @"pcmu",        // G.711 μ-law (padrão US)
        @"pcma",        // G.711 A-law (padrão EU)
        @"gsm",         // GSM
        @"ilbc",        // iLBC - boa para redes ruins
        @"g729",        // G.729 - baixo bitrate
        @"amr",         // AMR narrowband
        @"silk",        // SILK (Skype codec)
        @"codec2",      // Codec2 - ultra low bitrate
        @"g726-16",     // G.726 16kbps
        @"g726-24",     // G.726 24kbps
        @"g726-32",     // G.726 32kbps
        @"g726-40"      // G.726 40kbps
    ];
    
    const bctbx_list_t *audioCodecs = linphone_core_get_audio_codecs(core);
    const bctbx_list_t *elem = audioCodecs;
    
    NSMutableArray *enabledList = [NSMutableArray array];
    
    while (elem != NULL) {
        LinphonePayloadType *pt = (LinphonePayloadType *)elem->data;
        const char *mimeType = linphone_payload_type_get_mime_type(pt);
        NSString *mimeTypeLower = [[NSString stringWithUTF8String:mimeType] lowercaseString];
        
        BOOL shouldEnable = [allowedCodecs containsObject:mimeTypeLower];
        linphone_payload_type_enable(pt, shouldEnable);
        
        if (shouldEnable) {
            int clockRate = linphone_payload_type_get_clock_rate(pt);
            int channels = linphone_payload_type_get_channels(pt);
            [enabledList addObject:[NSString stringWithFormat:@"%@/%d/ch%d", mimeTypeLower, clockRate, channels]];
        }
        
        elem = elem->next;
    }
    
    NSLog(@"[SipNativeModule] CODECS: %lu codecs habilitados de %lu disponíveis", (unsigned long)enabledList.count, (unsigned long)[allowedCodecs count]);
    NSLog(@"[SipNativeModule] CODECS enabled: %@", [enabledList componentsJoinedByString:@", "]);
}

// ===== INITIALIZE =====

RCT_EXPORT_METHOD(initialize:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        NSLog(@"[SipNativeModule] ========== INITIALIZE START ==========");
        
        if (self.core) {
            NSLog(@"[SipNativeModule] Core already exists, reusing");
            resolve(@YES);
            return;
        }
        
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
        };
        
        // Create Linphone Factory
        LinphoneFactory *factory = linphone_factory_get();
        
        // Enable debug
        linphone_factory_set_log_collection_path(factory, NULL);
        linphone_factory_enable_log_collection(factory, LinphoneLogCollectionEnabledWithoutPreviousLogHandler);
        
        // Create Core
        self.core = linphone_factory_create_core_3(factory, NULL, NULL, (__bridge void *)self);
        
        if (!self.core) {
            NSLog(@"[SipNativeModule] ERROR: Failed to create core");
            reject(@"INIT_ERROR", @"Failed to create Linphone core", nil);
            return;
        }
        
        NSLog(@"[SipNativeModule] Core created successfully");
        
        // ===== NAT / STUN / ICE =====
        LinphoneNatPolicy *natPolicy = linphone_core_create_nat_policy(self.core);
        linphone_nat_policy_set_stun_server(natPolicy, "stun.linphone.org");
        linphone_nat_policy_enable_stun(natPolicy, TRUE);
        linphone_nat_policy_enable_ice(natPolicy, TRUE);
        linphone_nat_policy_enable_turn(natPolicy, FALSE);
        linphone_nat_policy_enable_upnp(natPolicy, FALSE);
        linphone_core_set_nat_policy(self.core, natPolicy);
        linphone_nat_policy_unref(natPolicy);
        
        NSLog(@"[SipNativeModule] NAT policy configured (STUN + ICE)");
        
        // ===== AUDIO =====
        linphone_core_set_mic_enabled(self.core, TRUE);
        [self tryEnableEchoFeatures:self.core];
        
        // ===== CODECS =====
        [self configureCodecs:self.core];
        
        // ===== CALLBACKS =====
        LinphoneCoreCbs *cbs = linphone_factory_create_core_cbs(factory);
        linphone_core_cbs_set_registration_state_changed(cbs, registration_state_changed);
        linphone_core_cbs_set_call_state_changed(cbs, call_state_changed);
        linphone_core_add_callbacks(self.core, cbs);
        linphone_core_cbs_unref(cbs);
        
        linphone_core_set_user_data(self.core, (__bridge void *)self);
        
        // ===== AUDIO SESSION =====
        AVAudioSession *session = [AVAudioSession sharedInstance];
        NSError *error = nil;
        [session setCategory:AVAudioSessionCategoryPlayAndRecord 
                        mode:AVAudioSessionModeVoiceChat 
                     options:AVAudioSessionCategoryOptionAllowBluetooth | AVAudioSessionCategoryOptionDefaultToSpeaker
                       error:&error];
        if (error) {
            NSLog(@"[SipNativeModule] Audio session error: %@", error);
        }
        [session setActive:YES error:nil];
        
        // ===== START CORE =====
        linphone_core_start(self.core);
        NSLog(@"[SipNativeModule] Core started");
        
        [self startIterateTimer];
        
        // Check for active calls after start (restore from background)
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            const bctbx_list_t *calls = linphone_core_get_calls(self.core);
            if (calls != NULL) {
                LinphoneCall *activeCall = (LinphoneCall *)calls->data;
                LinphoneCallState state = linphone_call_get_state(activeCall);
                const LinphoneAddress *addr = linphone_call_get_remote_address(activeCall);
                const char *uri = addr ? linphone_address_as_string_uri_only(addr) : "";
                
                NSLog(@"[SipNativeModule] Active call found after start: state=%d remote=%s", state, uri);
                
                if (state == LinphoneCallIncomingReceived) {
                    [self sendEventWithName:@"onIncomingCall" body:@{@"from": [NSString stringWithUTF8String:uri]}];
                }
            }
        });
        
        [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"none", @"message": @"Core inicializado"}];
        
        NSLog(@"[SipNativeModule] ========== INITIALIZE SUCCESS ==========");
        resolve(@YES);
        
    } @catch (NSException *exception) {
        NSLog(@"[SipNativeModule] EXCEPTION: %@", exception.reason);
        reject(@"INIT_ERROR", exception.reason, nil);
    }
}

- (void)handleCallKitAnswer {
    if (!self.core) return;
    
    const bctbx_list_t *calls = linphone_core_get_calls(self.core);
    const bctbx_list_t *elem = calls;
    
    while (elem != NULL) {
        LinphoneCall *call = (LinphoneCall *)elem->data;
        LinphoneCallState state = linphone_call_get_state(call);
        
        if (state == LinphoneCallIncomingReceived || state == LinphoneCallIncomingEarlyMedia) {
            NSLog(@"[SipNativeModule] CallKit: Accepting call");
            LinphoneCallParams *params = linphone_core_create_call_params(self.core, call);
            linphone_call_params_enable_video(params, FALSE);
            linphone_call_accept_with_params(call, params);
            linphone_call_params_unref(params);
            return;
        }
        elem = elem->next;
    }
}

- (void)handleCallKitEnd {
    if (!self.core) return;
    
    LinphoneCall *currentCall = linphone_core_get_current_call(self.core);
    if (currentCall) {
        NSLog(@"[SipNativeModule] CallKit: Terminating current call");
        linphone_call_terminate(currentCall);
    } else {
        NSLog(@"[SipNativeModule] CallKit: Terminating all calls");
        linphone_core_terminate_all_calls(self.core);
    }
}

// ===== REGISTER =====

RCT_EXPORT_METHOD(register:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (!self.core) {
            reject(@"NO_CORE", @"Core not initialized", nil);
            return;
        }
        
        NSString *sipDomain = params[@"sipDomain"] ?: @"";
        NSString *username = params[@"username"] ?: @"";
        NSString *password = params[@"password"] ?: @"";
        NSString *transport = params[@"transport"] ?: @"tcp";
        
        if (username.length == 0 || sipDomain.length == 0) {
            reject(@"INVALID_PARAMS", @"sipDomain and username are required", nil);
            return;
        }
        
        // Validar transporte
        NSString *validTransport = transport.lowercaseString;
        if (![validTransport isEqualToString:@"tcp"] && 
            ![validTransport isEqualToString:@"udp"] && 
            ![validTransport isEqualToString:@"tls"]) {
            NSLog(@"[SipNativeModule] Invalid transport '%@', using TCP", transport);
            validTransport = @"tcp";
        }
        
        NSLog(@"[SipNativeModule] register() domain=%@ user=%@ transport=%@", sipDomain, username, validTransport);
        
        // Remove old proxy config
        LinphoneProxyConfig *oldConfig = linphone_core_get_default_proxy_config(self.core);
        if (oldConfig) {
            NSLog(@"[SipNativeModule] Removing old proxy config");
            linphone_core_remove_proxy_config(self.core, oldConfig);
        }
        linphone_core_clear_all_auth_info(self.core);
        
        // Add auth info
        LinphoneFactory *factory = linphone_factory_get();
        LinphoneAuthInfo *authInfo = linphone_factory_create_auth_info(
            factory,
            [username UTF8String],
            NULL,
            [password UTF8String],
            NULL,
            [sipDomain UTF8String],
            [sipDomain UTF8String]
        );
        linphone_core_add_auth_info(self.core, authInfo);
        linphone_auth_info_unref(authInfo);
        
        // Create proxy config
        LinphoneProxyConfig *proxyConfig = linphone_core_create_proxy_config(self.core);
        
        NSString *identityStr = [NSString stringWithFormat:@"sip:%@@%@", username, sipDomain];
        LinphoneAddress *identity = linphone_factory_create_address(factory, [identityStr UTF8String]);
        linphone_proxy_config_set_identity_address(proxyConfig, identity);
        linphone_address_unref(identity);
        
        NSString *serverStr = [NSString stringWithFormat:@"sip:%@;transport=%@", sipDomain, validTransport];
        linphone_proxy_config_set_server_addr(proxyConfig, [serverStr UTF8String]);
        
        NSLog(@"[SipNativeModule] ProxyConfig configured: identity=%@ server=%@", identityStr, serverStr);
        
        linphone_proxy_config_enable_register(proxyConfig, TRUE);
        linphone_core_add_proxy_config(self.core, proxyConfig);
        linphone_core_set_default_proxy_config(self.core, proxyConfig);
        linphone_proxy_config_unref(proxyConfig);
        
        [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"progress", @"message": @"Registering..."}];
        
        NSLog(@"[SipNativeModule] register() completed");
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
        [self sendEventWithName:@"onRegistrationState" body:@{@"state": @"none", @"message": @"Unregistered"}];
    }
    resolve(@YES);
}

// ===== CALL METHODS =====

RCT_EXPORT_METHOD(startCall:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    @try {
        if (!self.core) {
            reject(@"NO_CORE", @"Core not initialized", nil);
            return;
        }
        
        NSString *destinationInput = params[@"to"] ?: @"";
        if (destinationInput.length == 0) {
            reject(@"INVALID_PARAMS", @"to is required", nil);
            return;
        }
        
        NSLog(@"[SipNativeModule] startCall() to=%@", destinationInput);
        
        // Build destination URI
        LinphoneProxyConfig *proxy = linphone_core_get_default_proxy_config(self.core);
        const char *proxyDomain = proxy ? linphone_proxy_config_get_domain(proxy) : NULL;
        
        NSString *destinationUri;
        if ([destinationInput hasPrefix:@"sip:"]) {
            destinationUri = destinationInput;
        } else if ([destinationInput containsString:@"@"]) {
            destinationUri = [NSString stringWithFormat:@"sip:%@", destinationInput];
        } else if (proxyDomain) {
            destinationUri = [NSString stringWithFormat:@"sip:%@@%s", destinationInput, proxyDomain];
        } else {
            destinationUri = destinationInput;
        }
        
        LinphoneAddress *addr = linphone_core_interpret_url(self.core, [destinationUri UTF8String]);
        if (!addr) {
            reject(@"INVALID_ADDRESS", @"Cannot interpret destination", nil);
            return;
        }
        
        LinphoneCallParams *callParams = linphone_core_create_call_params(self.core, NULL);
        linphone_call_params_enable_video(callParams, FALSE);
        linphone_call_params_set_media_encryption(callParams, LinphoneMediaEncryptionNone);
        
        NSLog(@"[SipNativeModule] Inviting address=%s (video=false)", linphone_address_as_string_uri_only(addr));
        
        LinphoneCall *call = linphone_core_invite_address_with_params(self.core, addr, callParams);
        
        linphone_call_params_unref(callParams);
        linphone_address_unref(addr);
        
        if (!call) {
            reject(@"CALL_FAILED", @"Failed to create call", nil);
            return;
        }
        
        NSLog(@"[SipNativeModule] Call created successfully");
        resolve(@YES);
        
    } @catch (NSException *exception) {
        NSLog(@"[SipNativeModule] startCall() error: %@", exception.reason);
        reject(@"CALL_ERROR", exception.reason, nil);
    }
}

RCT_EXPORT_METHOD(hangup:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    LinphoneCall *currentCall = linphone_core_get_current_call(self.core);
    if (currentCall) {
        NSLog(@"[SipNativeModule] hangup(): terminating current call");
        linphone_call_terminate(currentCall);
    } else {
        NSLog(@"[SipNativeModule] hangup(): terminating all calls");
        linphone_core_terminate_all_calls(self.core);
    }
    
    resolve(@YES);
}

RCT_EXPORT_METHOD(acceptCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    const bctbx_list_t *calls = linphone_core_get_calls(self.core);
    const bctbx_list_t *elem = calls;
    
    while (elem != NULL) {
        LinphoneCall *call = (LinphoneCall *)elem->data;
        LinphoneCallState state = linphone_call_get_state(call);
        
        if (state == LinphoneCallIncomingReceived || state == LinphoneCallIncomingEarlyMedia) {
            NSLog(@"[SipNativeModule] acceptCall(): accepting call");
            LinphoneCallParams *params = linphone_core_create_call_params(self.core, call);
            linphone_call_params_enable_video(params, FALSE);
            linphone_call_accept_with_params(call, params);
            linphone_call_params_unref(params);
            resolve(@YES);
            return;
        }
        elem = elem->next;
    }
    
    reject(@"NO_CALL", @"No incoming call found", nil);
}

RCT_EXPORT_METHOD(declineCall:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    const bctbx_list_t *calls = linphone_core_get_calls(self.core);
    const bctbx_list_t *elem = calls;
    
    while (elem != NULL) {
        LinphoneCall *call = (LinphoneCall *)elem->data;
        LinphoneCallState state = linphone_call_get_state(call);
        
        if (state == LinphoneCallIncomingReceived || state == LinphoneCallIncomingEarlyMedia) {
            NSLog(@"[SipNativeModule] declineCall(): declining call");
            linphone_call_decline(call, LinphoneReasonDeclined);
            resolve(@YES);
            return;
        }
        elem = elem->next;
    }
    
    reject(@"NO_CALL", @"No incoming call found", nil);
}

// ===== AUDIO CONTROLS =====

RCT_EXPORT_METHOD(setMute:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    BOOL muted = [params[@"muted"] boolValue];
    linphone_core_set_mic_enabled(self.core, !muted);
    NSLog(@"[SipNativeModule] setMute: %d", muted);
    resolve(@YES);
}

RCT_EXPORT_METHOD(setSpeaker:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    BOOL speakerOn = [params[@"speakerOn"] boolValue];
    
    AVAudioSession *session = [AVAudioSession sharedInstance];
    if (speakerOn) {
        [session overrideOutputAudioPort:AVAudioSessionPortOverrideSpeaker error:nil];
    } else {
        [session overrideOutputAudioPort:AVAudioSessionPortOverrideNone error:nil];
    }
    
    NSLog(@"[SipNativeModule] setSpeaker: %d", speakerOn);
    resolve(@YES);
}

RCT_EXPORT_METHOD(sendDtmf:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.core) {
        reject(@"NO_CORE", @"Core not initialized", nil);
        return;
    }
    
    NSString *digit = params[@"digit"] ?: @"";
    if (digit.length > 0) {
        LinphoneCall *call = linphone_core_get_current_call(self.core);
        if (call) {
            linphone_call_send_dtmf(call, [digit characterAtIndex:0]);
            NSLog(@"[SipNativeModule] sendDtmf: %@", digit);
        }
    }
    resolve(@YES);
}

// ===== PUSH TOKEN =====

RCT_EXPORT_METHOD(setPushToken:(NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *token = params[@"token"] ?: @"";
    [[NSUserDefaults standardUserDefaults] setObject:token forKey:@"voip_push_token"];
    [[NSUserDefaults standardUserDefaults] synchronize];
    NSLog(@"[SipNativeModule] setPushToken: %@", [token substringToIndex:MIN(20, token.length)]);
    resolve(@YES);
}

RCT_EXPORT_METHOD(getPushToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    NSString *token = [[NSUserDefaults standardUserDefaults] stringForKey:@"voip_push_token"];
    resolve(token ?: @"");
}

// ===== CLEANUP =====

- (void)dealloc {
    [self stopIterateTimer];
    if (self.core) {
        linphone_core_stop(self.core);
        linphone_core_unref(self.core);
        self.core = NULL;
    }
}

@end
