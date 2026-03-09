import Foundation
import React
import AVFoundation
import UserNotifications
import Contacts

@objc(PermissionsModule)
class PermissionsModule: NSObject {
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    @objc
    func requestMicrophonePermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        AVAudioSession.sharedInstance().requestRecordPermission { granted in
            resolve(granted)
        }
    }
    
    @objc
    func requestNotificationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let center = UNUserNotificationCenter.current()
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, error in
            if let error = error {
                reject("PERMISSION_ERROR", error.localizedDescription, error)
            } else {
                resolve(granted)
            }
        }
    }
    
    @objc
    func requestContactsPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let store = CNContactStore()
        store.requestAccess(for: .contacts) { granted, error in
            if let error = error {
                reject("PERMISSION_ERROR", error.localizedDescription, error)
            } else {
                resolve(granted)
            }
        }
    }
    
    @objc
    func checkMicrophonePermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let status = AVAudioSession.sharedInstance().recordPermission
        resolve(status == .granted)
    }
    
    @objc
    func checkNotificationPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            resolve(settings.authorizationStatus == .authorized)
        }
    }
    
    @objc
    func checkContactsPermission(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let status = CNContactStore.authorizationStatus(for: .contacts)
        resolve(status == .authorized)
    }
}
