package com.sipapp.sip

import android.app.*
import android.os.Build
import android.util.Log
import android.os.IBinder
import android.content.Intent
import android.content.Context
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class CallForegroundService : Service() {

    companion object {
        private const val TAG = "CallForegroundService"

        private const val CALL_CHANNEL_ID = "sip_call_channel"
        private const val KEEPALIVE_CHANNEL_ID = "sip_keepalive_channel"

        private const val CALL_NOTIFICATION_ID = 1001
        private const val KEEPALIVE_NOTIFICATION_ID = 1002

        const val ACTION_START_CALL = "com.sipapp.sip.ACTION_START_CALL"
        const val ACTION_STOP_CALL = "com.sipapp.sip.ACTION_STOP_CALL"
        const val ACTION_START_KEEPALIVE = "com.sipapp.sip.ACTION_START_KEEPALIVE"
        const val ACTION_STOP_KEEPALIVE = "com.sipapp.sip.ACTION_STOP_KEEPALIVE"

        const val EXTRA_CALLER = "extra_caller"
        const val EXTRA_IS_INCOMING = "extra_is_incoming"

        private var currentMode: String? = null

        fun start(context: Context, caller: String?, isIncoming: Boolean) {
            val intent = Intent(context, CallForegroundService::class.java).apply {
                action = ACTION_START_CALL
                putExtra(EXTRA_CALLER, caller ?: "Desconhecido")
                putExtra(EXTRA_IS_INCOMING, isIncoming)
            }
            startServiceSafe(context, intent)
        }

        fun stop(context: Context) {
            val intent = Intent(context, CallForegroundService::class.java).apply {
                action = ACTION_STOP_CALL
            }
            startServiceSafe(context, intent)
        }

        fun startKeepAlive(context: Context) {
            val intent = Intent(context, CallForegroundService::class.java).apply {
                action = ACTION_START_KEEPALIVE
            }
            startServiceSafe(context, intent)
        }

        fun stopKeepAlive(context: Context) {
            try {
                val intent = Intent(context, CallForegroundService::class.java)
                context.stopService(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Falha ao parar keepalive: ${e.message}", e)
            }
        }

        private fun startServiceSafe(context: Context, intent: Intent) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Falha ao iniciar service: ${e.message}", e)
            }
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null
    private var isInCall = false

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_CALL -> {
                val caller = intent.getStringExtra(EXTRA_CALLER) ?: "Desconhecido"
                val isIncoming = intent.getBooleanExtra(EXTRA_IS_INCOMING, false)
                val notification = if (isIncoming) {
                    buildIncomingCallNotification(caller)
                } else {
                    buildActiveCallNotification(caller)
                }
                startForeground(CALL_NOTIFICATION_ID, notification)
                isInCall = true
                currentMode = "call"
                acquireWakeLock()
                Log.i(TAG, "Foreground service: CALL mode (caller=$caller, incoming=$isIncoming)")
            }
            ACTION_STOP_CALL -> {
                isInCall = false
                releaseWakeLock()
                val notification = buildKeepAliveNotification()
                startForeground(KEEPALIVE_NOTIFICATION_ID, notification)
                currentMode = "keepalive"
                Log.i(TAG, "Foreground service: voltou para KEEPALIVE")
            }
            ACTION_START_KEEPALIVE -> {
                if (!isInCall) {
                    val notification = buildKeepAliveNotification()
                    startForeground(KEEPALIVE_NOTIFICATION_ID, notification)
                    currentMode = "keepalive"
                    Log.i(TAG, "Foreground service: KEEPALIVE mode")
                }
            }
            ACTION_STOP_KEEPALIVE -> {
                if (!isInCall) {
                    releaseWakeLock()
                    stopForeground(STOP_FOREGROUND_REMOVE)
                    stopSelf()
                    currentMode = null
                    Log.i(TAG, "Foreground service: STOPPED")
                }
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        releaseWakeLock()
        currentMode = null
        super.onDestroy()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java)

            // Canal de chamada recebida (máxima prioridade)
            val callChannel = NotificationChannel(
                CALL_CHANNEL_ID,
                "Chamadas SIP",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificação de chamada SIP"
                setSound(null, null)
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 1000, 500, 1000)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            manager.createNotificationChannel(callChannel)

            // Canal keep-alive (baixa prioridade)
            val keepAliveChannel = NotificationChannel(
                KEEPALIVE_CHANNEL_ID,
                "SIP Conectado",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Mantém o SIP conectado em background"
                setSound(null, null)
                setShowBadge(false)
            }
            manager.createNotificationChannel(keepAliveChannel)
        }
    }

    /**
     * Notificação de chamada RECEBIDA — heads-up com botões Atender/Recusar
     */
    private fun buildIncomingCallNotification(caller: String): Notification {
        // Intent para abrir o app
        val fullScreenIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("incoming_call", true)
            putExtra("caller", caller)
        }
        val fullScreenPendingIntent = PendingIntent.getActivity(
            this, 0, fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Botão ATENDER
        val acceptIntent = Intent(this, CallActionReceiver::class.java).apply {
            action = CallActionReceiver.ACTION_ACCEPT
        }
        val acceptPendingIntent = PendingIntent.getBroadcast(
            this, 1, acceptIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        // Botão RECUSAR
        val declineIntent = Intent(this, CallActionReceiver::class.java).apply {
            action = CallActionReceiver.ACTION_DECLINE
        }
        val declinePendingIntent = PendingIntent.getBroadcast(
            this, 2, declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setContentTitle("📞 Chamada recebida")
            .setContentText(caller)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setOngoing(true)
            .setAutoCancel(false)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(fullScreenPendingIntent)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .addAction(android.R.drawable.ic_menu_call, "✅ Atender", acceptPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "❌ Recusar", declinePendingIntent)
            .setVibrate(longArrayOf(0, 1000, 500, 1000, 500, 1000))
            .build()
    }

    /**
     * Notificação de chamada ATIVA (já conectada)
     */
    private fun buildActiveCallNotification(caller: String): Notification {
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CALL_CHANNEL_ID)
            .setContentTitle("Em chamada")
            .setContentText(caller)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }

    /**
     * Notificação keep-alive (baixa prioridade, silenciosa)
     */
    private fun buildKeepAliveNotification(): Notification {
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, KEEPALIVE_CHANNEL_ID)
            .setContentTitle("SIP Conectado")
            .setContentText("Pronto para receber chamadas")
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .setSilent(true)
            .build()
    }

    private fun acquireWakeLock() {
        if (wakeLock == null) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "SipApp::CallWakeLock"
            ).apply {
                acquire(60 * 60 * 1000L)
            }
            Log.i(TAG, "WakeLock acquired")
        }
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Log.i(TAG, "WakeLock released")
            }
        }
        wakeLock = null
    }
}
