package com.sipapp.sip

import android.util.Log
import android.content.Intent
import android.content.Context
import android.app.NotificationManager
import android.content.BroadcastReceiver

/**
 * Recebe ações dos botões da notificação de chamada recebida.
 * - ACTION_ACCEPT: aceita a chamada e abre o app
 * - ACTION_DECLINE: recusa a chamada
 */
class CallActionReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "CallActionReceiver"
        const val ACTION_ACCEPT = "com.sipapp.ACTION_ACCEPT_CALL"
        const val ACTION_DECLINE = "com.sipapp.ACTION_DECLINE_CALL"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.i(TAG, "Ação recebida: ${intent.action}")

        // Fechar a notification shade
        try {
            context.sendBroadcast(Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS))
        } catch (_: Throwable) {}

        when (intent.action) {
            ACTION_ACCEPT -> {
                Log.i(TAG, "Aceitando chamada...")

                // Abrir o app na tela de chamada
                val launchIntent = context.packageManager
                    .getLaunchIntentForPackage(context.packageName)?.apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                                Intent.FLAG_ACTIVITY_SINGLE_TOP
                        putExtra("action", "accept_call")
                    }
                if (launchIntent != null) {
                    context.startActivity(launchIntent)
                }

                // Aceitar a chamada via SipCallManager
                SipCallManager.acceptCall()
            }
            ACTION_DECLINE -> {
                Log.i(TAG, "Recusando chamada...")

                // Recusar a chamada via SipCallManager
                SipCallManager.declineCall()

                // Cancelar a notificação
                val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                nm.cancel(1001) // CALL_NOTIFICATION_ID
            }
        }
    }
}
