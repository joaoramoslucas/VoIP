import Foundation
import React
// import linphonesw // O SDK do Linphone deverá ser importado no Xcode

@objc(SipNativeModule)
class SipNativeModule: RCTEventEmitter {
    
    // Suporte aos eventos React Native
    override func supportedEvents() -> [String]! {
        return ["onCallState", "onIncomingCall", "onRegistrationState"]
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - Initializer
    @objc
    func initialize(_ options: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // FIXME: Inicializar Linphone Core com linphonesw
        // let factory = Factory.Instance
        // let core = try! factory.createCore(...)
        
        print("SipNativeModule: Initialize chamado")
        
        self.sendEvent(withName: "onRegistrationState", body: ["state": "none", "message": "iOS Init (Aguardando Xcode build)"])
        resolve(true)
    }
    
    @objc
    func setPushToken(_ params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let token = params["token"] as? String ?? ""
        print("SipNativeModule: Push Token = \(token)")
        // Store in UserDefaults ou similar para injetar na config SIP do Linphone
        resolve(true)
    }
    
    @objc
    func getPushToken(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        resolve("STUB_TOKEN_IOS")
    }

    // MARK: - VoIP Actions
    @objc
    func register(_ params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // let domain = params["sipDomain"] as? String
        // let username = params["username"] as? String
        // let password = params["password"] as? String
        print("SipNativeModule: call register")
        
        self.sendEvent(withName: "onRegistrationState", body: ["state": "progress", "message": "Sending REGISTER"])
        
        // Simulação do sucesso para testes da tela
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.sendEvent(withName: "onRegistrationState", body: ["state": "ok", "message": "Registered (iOS Stub)"])
            resolve(true)
        }
    }
    
    @objc
    func unregister(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        self.sendEvent(withName: "onRegistrationState", body: ["state": "none", "message": "Unregistered"])
        resolve(true)
    }
    
    @objc
    func startCall(_ params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let destination = params["to"] as? String ?? ""
        print("SipNativeModule: startCall para \(destination)")
        
        self.sendEvent(withName: "onCallState", body: ["state": "outgoing", "message": "Calling", "remoteUri": destination])
        resolve(true)
    }
    
    @objc
    func setMute(_ params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let muted = params["muted"] as? Bool ?? false
        // core.micEnabled = !muted
        print("SipNativeModule: setMute \(muted)")
        resolve(true)
    }
    
    @objc
    func setSpeaker(_ params: NSDictionary, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let speakerOn = params["speakerOn"] as? Bool ?? false
        // Ativar viva-voz nativo via AVAudioSession no iOS
        print("SipNativeModule: setSpeaker \(speakerOn)")
        resolve(true)
    }
    
    @objc
    func hangup(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        // core.currentCall?.terminate()
        print("SipNativeModule: hangup")
        self.sendEvent(withName: "onCallState", body: ["state": "ended", "message": "User hung up"])
        resolve(true)
    }

    @objc
    func acceptCall(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        print("SipNativeModule: acceptCall")
        resolve(true)
    }
    
    @objc
    func declineCall(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        print("SipNativeModule: declineCall")
        resolve(true)
    }
}
