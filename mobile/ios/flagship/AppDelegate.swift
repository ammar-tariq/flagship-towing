import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import Firebase
import GoogleMaps
import RNBootSplash // ⬅️ add this import
import react_native_stallion

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Must be set before any MapView is created. Value comes from
    // mobileFlagship/.env → GOOGLE_MAPS_IOS_API_KEY (injected into Info.plist).
    let mapsKey = (Bundle.main.object(forInfoDictionaryKey: "GMSApiKey") as? String ?? "")
      .trimmingCharacters(in: .whitespacesAndNewlines)
    precondition(
      !mapsKey.isEmpty,
      "Missing GOOGLE_MAPS_IOS_API_KEY. Copy mobileFlagship/.env.example to .env."
    )
    GMSServices.provideAPIKey(mapsKey)

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "flagship",
      in: window,
      launchOptions: launchOptions
    )
    FirebaseApp.configure()

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
        StallionModule.getBundleURL()
    #endif
  }
  // ⬇️ override this method
  override func customize(_ rootView: RCTRootView) {
    super.customize(rootView)
    RNBootSplash.initWithStoryboard("BootSplash", rootView: rootView) // ⬅️ initialize the splash screen
  }
}
