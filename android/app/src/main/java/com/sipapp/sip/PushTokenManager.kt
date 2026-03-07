package com.sipapp.sip

import android.util.Log
import android.content.Context

/**
 * Gerencia o push token do Firebase em SharedPreferences.
 * Usado pelo SipNativeModule para configurar push no Linphone
 * e pelo SipFirebaseMessagingService para salvar tokens novos.
 */
object PushTokenManager {
    private const val TAG = "PushTokenManager"
    private const val PREFS_NAME = "sip_push_prefs"
    private const val KEY_PUSH_TOKEN = "push_token"

    fun saveToken(context: Context, token: String) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_PUSH_TOKEN, token)
            .apply()
        Log.i(TAG, "Push token saved: ${token.take(20)}...")
    }

    fun getToken(context: Context): String? {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .getString(KEY_PUSH_TOKEN, null)
    }
}
