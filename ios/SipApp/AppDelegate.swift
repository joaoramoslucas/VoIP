import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import AVFoundation

@objc class AppDelegateObjC: NSObject {
    @objc static func setupPushKit() {
        if let pushKitClass = NSClassFromString("PushKitManager") as? NSObject.Type {
            let shared = pushKitClass.perform(NSSelectorFromString("shared"))?.takeUnretainedValue()
            shared?.perform(NSSelectorFromString("registerForVoIPPushes"))
        }
    }
}

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Audio session
    let audioSession = AVAudioSession.sharedInstance()
    try? audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [.allowBluetooth, .defaultToSpeaker])
    try? audioSession.setActive(true)
    
    // PushKit
    AppDelegateObjC.setupPushKit()
    
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "SipApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
