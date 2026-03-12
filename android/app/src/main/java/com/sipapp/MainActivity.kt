package com.sipapp

import android.os.Bundle
import android.os.Build
import android.content.Intent
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.modules.core.DeviceEventManagerModule
import android.content.Context

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null) // Safe for react-native-screens
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    } else {
      @Suppress("DEPRECATION")
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
      )
    }
    
    // Verificar se foi aberto por notificação de chamada
    handleIncomingCallIntent(intent)
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    intent?.let { handleIncomingCallIntent(it) }
  }

  private fun handleIncomingCallIntent(intent: Intent?) {
    if (intent?.getBooleanExtra("incoming_call", false) == true) {
      val caller = intent.getStringExtra("caller") ?: "Unknown"
      
      // Salvar flag - AsyncStorage usa SharedPreferences com prefixo
      val prefs = getSharedPreferences("RCTAsyncLocalStorage_V1", Context.MODE_PRIVATE)
      prefs.edit()
        .putString("hasIncomingCall", "true")
        .putString("incomingCaller", caller)
        .apply()
      
      // Enviar evento também
      android.os.Handler(android.os.Looper.getMainLooper()).postDelayed({
        reactInstanceManager?.currentReactContext
          ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
          ?.emit("navigateToIncomingCall", caller)
      }, 500)
    }
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "SipApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
