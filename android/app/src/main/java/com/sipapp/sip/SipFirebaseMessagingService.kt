package com.sipapp.sip

import android.util.Log
import android.content.Intent
import com.google.firebase.messaging.RemoteMessage
import com.google.firebase.messaging.FirebaseMessagingService

/**
 * Recebe push notifications do Firebase.
 *
 * Quando o servidor SIP envia uma push (via FCM) para indicar chamada recebida,
 * este service acorda o app e inicia o Foreground Service para que o Linphone
 * Core possa receber o INVITE.
 */
class SipFirebaseMessagingService : FirebaseMessagingService() {

    companion object {
        private const val TAG = "SipFirebaseMsgService"
    }

    /**
     * Chamado quando o Firebase gera um novo token (ou na primeira vez).
     * Salva o token para uso futuro no SIP REGISTER.
     */
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.i(TAG, "Novo push token FCM: ${token.take(20)}...")
        PushTokenManager.saveToken(applicationContext, token)
    }

    /**
     * Chamado quando uma push notification é recebida.
     * O servidor SIP envia um data message com info da chamada.
     */
    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        Log.i(TAG, "Push recebida! Data: ${message.data}")

        val caller = message.data["caller"]
            ?: message.data["from"]
            ?: message.data["call-id"]
            ?: "Chamada recebida"

        // Iniciar o Foreground Service para manter o app vivo
        // enquanto o Linphone Core processa o INVITE
        try {
            CallForegroundService.start(
                context = applicationContext,
                caller = caller,
                isIncoming = true
            )
        } catch (e: Exception) {
            Log.e(TAG, "Falha ao iniciar foreground service via push: ${e.message}", e)
        }

        // Abrir o app no foreground (se não estiver aberto)
        try {
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                        Intent.FLAG_ACTIVITY_CLEAR_TOP or
                        Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("incoming_call", true)
                putExtra("caller", caller)
            }
            if (launchIntent != null) {
                startActivity(launchIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Falha ao abrir app via push: ${e.message}", e)
        }
    }
}
