package com.sipapp.sip

import android.util.Log
import org.linphone.core.Call
import org.linphone.core.Core
import org.linphone.core.Reason

/**
 * Singleton que mantém referência ao Linphone Core.
 * Permite que o BroadcastReceiver (CallActionReceiver) aceite/recuse chamadas
 * sem precisar de acesso ao SipNativeModule.
 */
object SipCallManager {
    private const val TAG = "SipCallManager"

    var core: Core? = null

    fun acceptCall() {
        val c = core
        if (c == null) {
            Log.e(TAG, "acceptCall: core é null")
            return
        }

        try {
            // Buscar chamada incoming
            val call = c.currentCall
                ?: c.calls.firstOrNull { it.state == Call.State.IncomingReceived || it.state == Call.State.IncomingEarlyMedia }
                ?: c.calls.firstOrNull()

            if (call == null) {
                Log.e(TAG, "acceptCall: nenhuma chamada encontrada")
                return
            }

            Log.i(TAG, "acceptCall: aceitando call state=${call.state}")
            val params = c.createCallParams(call)
            params?.isVideoEnabled = false
            call.acceptWithParams(params)
        } catch (t: Throwable) {
            Log.e(TAG, "acceptCall error: ${t.message}", t)
        }
    }

    fun declineCall() {
        val c = core
        if (c == null) {
            Log.e(TAG, "declineCall: core é null")
            return
        }

        try {
            val call = c.currentCall
                ?: c.calls.firstOrNull { it.state == Call.State.IncomingReceived || it.state == Call.State.IncomingEarlyMedia }
                ?: c.calls.firstOrNull()

            if (call == null) {
                Log.e(TAG, "declineCall: nenhuma chamada encontrada")
                return
            }

            Log.i(TAG, "declineCall: recusando call state=${call.state}")
            call.decline(Reason.Declined)
        } catch (t: Throwable) {
            Log.e(TAG, "declineCall error: ${t.message}", t)
        }
    }
}
