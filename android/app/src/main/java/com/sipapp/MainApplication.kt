package com.sipapp

import android.app.Application
import com.facebook.react.ReactHost
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative

import com.sipapp.sip.SipNativePackage
import com.sipapp.sip.AppForegroundTracker

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.toMutableList().apply {
          add(SipNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Track foreground/background state for call notification suppression
    registerActivityLifecycleCallbacks(AppForegroundTracker)
    loadReactNative(this)
  }
}
