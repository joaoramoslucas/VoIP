package com.sipapp.sip

import android.util.Log
import android.os.Looper
import android.os.Handler
import org.linphone.core.*
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class SipNativeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val logTag = "SipNativeModule"

    // ===== Linphone Core =====
    private var linphoneCore: Core? = null
    private var coreListener: CoreListenerStub? = null

    // O Linphone no Android precisa de iterate() rodando em loop
    private val iterateHandler = Handler(Looper.getMainLooper())
    private var isIterateLoopRunning: Boolean = false

    private val iterateRunnable = object : Runnable {
        override fun run() {
            try {
                linphoneCore?.iterate()
            } catch (exception: Exception) {
                Log.e(logTag, "iterate() error: ${exception.message}", exception)
            } finally {
                if (isIterateLoopRunning) {
                    iterateHandler.postDelayed(this, 20) // ~50fps (padrão comum)
                }
            }
        }
    }

    override fun getName(): String = "SipNativeModule"

    // ===== Helpers: Eventos RN =====

    private fun tryEnableEchoFeaturesSafely(core: Core) {
    // Tenta habilitar echo cancellation / echo limiter em VÁRIAS versões do Linphone
        fun tryCallBooleanSetter(methodName: String, value: Boolean): Boolean {
            return try {
                val m = core.javaClass.methods.firstOrNull { it.name == methodName && it.parameterTypes.size == 1 }
                if (m != null) {
                    m.invoke(core, value)
                    Log.i(logTag, "Audio tweak OK: $methodName($value)")
                    true
                } else false
            } catch (t: Throwable) {
                Log.w(logTag, "Audio tweak FAIL: $methodName($value) -> ${t.message}")
                false
            }
        }

        fun trySetBooleanProperty(setterName: String, value: Boolean): Boolean {
            // Kotlin property geralmente vira setter setXxx(boolean)
            return tryCallBooleanSetter(setterName, value)
        }

        // Echo Cancellation
        val echoCancellationEnabled =
            tryCallBooleanSetter("enableEchoCancellation", true) ||
            trySetBooleanProperty("setEchoCancellationEnabled", true) ||
            trySetBooleanProperty("setEchoCancellation", true)

        if (!echoCancellationEnabled) {
            Log.w(logTag, "EchoCancellation: não disponível neste Linphone SDK (ok, seguindo sem).")
        }

        // Echo Limiter
        val echoLimiterEnabled =
            tryCallBooleanSetter("enableEchoLimiter", true) ||
            trySetBooleanProperty("setEchoLimiterEnabled", true) ||
            trySetBooleanProperty("setEchoLimiter", true)

        if (!echoLimiterEnabled) {
            Log.w(logTag, "EchoLimiter: não disponível neste Linphone SDK (ok, seguindo sem).")
        }
    }

    private fun emitEventToReactNative(eventName: String, payload: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, payload)
    }

    private fun emitRegistrationState(state: String, message: String? = null) {
        val payload = Arguments.createMap().apply {
            putString("state", state)
            if (message != null) putString("message", message)
        }
        emitEventToReactNative("onRegistrationState", payload)
    }

    private fun emitCallState(state: String, message: String? = null) {
        val payload = Arguments.createMap().apply {
            putString("state", state)
            if (message != null) putString("message", message)
        }
        emitEventToReactNative("onCallState", payload)
    }

    private fun emitIncomingCall(from: String) {
        val payload = Arguments.createMap().apply {
            putString("from", from)
        }
        emitEventToReactNative("onIncomingCall", payload)
    }

    // Converte RegistrationState do Linphone pro seu padrão JS
    private fun mapRegistrationState(state: RegistrationState): String {
        return when (state) {
            RegistrationState.Progress -> "progress"
            RegistrationState.Ok -> "ok"
            RegistrationState.Cleared, RegistrationState.None -> "none"
            RegistrationState.Failed -> "failed"
            else -> "progress"
        }
    }

    // Converte Call.State do Linphone pro seu padrão JS
    private fun mapCallState(state: Call.State): String {
        return when (state) {
            Call.State.IncomingReceived -> "incoming"
            Call.State.OutgoingInit,
            Call.State.OutgoingProgress,
            Call.State.OutgoingRinging,
            Call.State.OutgoingEarlyMedia -> "outgoing"
            Call.State.Connected,
            Call.State.StreamsRunning -> "connected"
            Call.State.End,
            Call.State.Released -> "ended"
            Call.State.Error -> "error"
            else -> "idle"
        }
    }

    // ===== Lifecycle Core =====
    private fun startIterateLoopIfNeeded() {
        if (isIterateLoopRunning) return
        isIterateLoopRunning = true
        iterateHandler.post(iterateRunnable)
        Log.i(logTag, "iterate loop started")
    }

    private fun stopIterateLoop() {
        isIterateLoopRunning = false
        iterateHandler.removeCallbacks(iterateRunnable)
        Log.i(logTag, "iterate loop stopped")
    }

    private fun ensureCoreInitializedOrThrow() {
        if (linphoneCore == null) {
            throw IllegalStateException("Linphone Core não inicializado. Chame initialize() primeiro.")
        }
    }

    // ===== Métodos expostos ao JS =====
    private fun logEnabledAudioCodecs(core: Core) {
        try {
            val audioPayloadTypes = core.audioPayloadTypes
            val enabled = mutableListOf<String>()

            audioPayloadTypes.forEach { payloadType ->
                val mimeTypeLower = try {
                    val getMimeTypeMethod = payloadType.javaClass.methods
                        .firstOrNull { it.name == "getMimeType" && it.parameterTypes.isEmpty() }
                    (getMimeTypeMethod?.invoke(payloadType) as? String ?: "").lowercase()
                } catch (_: Throwable) { "" }

                val clockRate = try {
                    val getClockRateMethod = payloadType.javaClass.methods
                        .firstOrNull { it.name == "getClockRate" && it.parameterTypes.isEmpty() }
                    (getClockRateMethod?.invoke(payloadType) as? Int) ?: -1
                } catch (_: Throwable) { -1 }

                val channels = try {
                    val getChannelsMethod = payloadType.javaClass.methods
                        .firstOrNull { it.name == "getChannels" && it.parameterTypes.isEmpty() }
                    (getChannelsMethod?.invoke(payloadType) as? Int) ?: 1
                } catch (_: Throwable) { 1 }

                // tenta ler "enabled"/"isEnabled" (varia por SDK)
                val isEnabled = try {
                    val enabledMethod = payloadType.javaClass.methods
                        .firstOrNull { it.name == "enabled" && it.parameterTypes.isEmpty() }
                    (enabledMethod?.invoke(payloadType) as? Boolean) ?: false
                } catch (_: Throwable) {
                    try {
                        val isEnabledMethod = payloadType.javaClass.methods
                            .firstOrNull { it.name == "isEnabled" && it.parameterTypes.isEmpty() }
                        (isEnabledMethod?.invoke(payloadType) as? Boolean) ?: false
                    } catch (_: Throwable) { false }
                }

                if (isEnabled) enabled.add("${mimeTypeLower}/${clockRate}ch$channels")
            }

            Log.i(logTag, "Enabled audio payloads AFTER filter: ${enabled.joinToString(", ")}")
        } catch (t: Throwable) {
            Log.w(logTag, "Falha ao logar codecs habilitados: ${t.message}")
        }
    }

    private fun setPayloadEnabledCompat(payload: Any, enabled: Boolean) {
        try {
            // tenta setEnabled(boolean)
            val m = payload.javaClass.methods.firstOrNull { it.name == "setEnabled" && it.parameterTypes.size == 1 }
            if (m != null) {
                m.invoke(payload, enabled)
                return
            }
        } catch (_: Throwable) { }

        try {
            // tenta enable(boolean) ou enable()
            val m = payload.javaClass.methods.firstOrNull { it.name == "enable" }
            if (m != null) {
                if (m.parameterTypes.size == 1) m.invoke(payload, enabled) else if (enabled) m.invoke(payload)
                return
            }
        } catch (_: Throwable) { }

        try {
            // tenta isEnabled field/property (não dá pra setar normalmente)
        } catch (_: Throwable) { }
    }

    @ReactMethod
    fun initialize(options: ReadableMap, promise: Promise) {
        try {
            Log.i(logTag, "initialize() - criando Linphone Core")

            if (linphoneCore != null) {
                Log.i(logTag, "initialize(): core já existe, reutilizando")
                promise.resolve(true)
                return
            }

            val linphoneFactory = Factory.instance()

            try {
                linphoneFactory.setDebugMode(true, "Linphone")
                Log.i(logTag, "Linphone debugMode ON")
            } catch (_: Throwable) {}

            try {
                linphoneFactory.enableLogCollection(LogCollectionState.Enabled)
            } catch (_: Throwable) {}

            val core = linphoneFactory.createCore(null, null, reactContext)
            linphoneCore = core

            // ==============================
            // NAT / STUN / ICE
            // ==============================

            val natPolicy = core.createNatPolicy()
            natPolicy.stunServer = "stun.linphone.org"
            natPolicy.isStunEnabled = true

            try { natPolicy.isIceEnabled = true } catch (_: Throwable) {}
            try { natPolicy.isTurnEnabled = false } catch (_: Throwable) {}
            try { natPolicy.isUpnpEnabled = false } catch (_: Throwable) {}

            core.natPolicy = natPolicy

            // ==============================
            // AUDIO IMPROVEMENTS
            // ==============================

            try {
                tryEnableEchoFeaturesSafely(core)
            } catch (t: Throwable) {
                Log.w(logTag, "Audio improvements skipped: ${t.message}")
            }

            core.isMicEnabled = true

            // ==============================
            // CODECS
            // ==============================

            try {
                val audioPayloadTypes = core.audioPayloadTypes

                audioPayloadTypes.forEach { payloadType ->
                    val getMimeTypeMethod =
                        payloadType.javaClass.methods.firstOrNull {
                            it.name == "getMimeType" && it.parameterTypes.isEmpty()
                        }

                    val mimeTypeLower =
                        (getMimeTypeMethod?.invoke(payloadType) as? String ?: "").lowercase()

                    val isAllowed =
                        mimeTypeLower == "opus" ||
                        mimeTypeLower == "pcmu" ||
                        mimeTypeLower == "pcma"

                    setPayloadEnabledCompat(payloadType, isAllowed)
                }

                Log.i(logTag, "CODECS filtered: opus/pcmu/pcma")

                logEnabledAudioCodecs(core)

            } catch (t: Throwable) {
                Log.w(logTag, "Falha ao configurar codecs: ${t.message}")
            }

            // ==============================
            // LISTENER
            // ==============================

            coreListener = object : CoreListenerStub() {

                override fun onRegistrationStateChanged(
                    core: Core,
                    proxyConfig: ProxyConfig,
                    state: RegistrationState,
                    message: String
                ) {
                    val mapped = mapRegistrationState(state)

                    Log.i(
                        logTag,
                        "REG state=$state mapped=$mapped message=$message proxyDomain=${proxyConfig.domain}"
                    )

                    emitRegistrationState(mapped, message)
                }

                override fun onCallStateChanged(
                    core: Core,
                    call: Call,
                    state: Call.State,
                    message: String
                ) {

                    val mapped = mapCallState(state)

                    val remote =
                        try { call.remoteAddress?.asStringUriOnly() }
                        catch (_: Throwable) { null }

                    val sipCode =
                        try { call.errorInfo?.protocolCode }
                        catch (_: Throwable) { null }

                    val sipPhrase =
                        try { call.errorInfo?.phrase }
                        catch (_: Throwable) { null }

                    Log.i(
                        logTag,
                        "CALL state=$state mapped=$mapped msg=$message remote=$remote sipCode=$sipCode"
                    )

                    if (state == Call.State.IncomingReceived) {
                        emitIncomingCall(remote ?: "unknown")
                    }

                    emitCallState(mapped, message)
                }
            }

            core.addListener(coreListener)

            core.start()

            startIterateLoopIfNeeded()

            emitRegistrationState("none", "Core inicializado")

            promise.resolve(true)

        } catch (exception: Exception) {

            Log.e(logTag, "initialize() error: ${exception.message}", exception)

            promise.reject("INIT_ERROR", exception.message, exception)
        }
    }

    @ReactMethod
    fun register(params: ReadableMap, promise: Promise) {
        try {
            ensureCoreInitializedOrThrow()

            val sipDomain = params.getString("sipDomain") ?: ""  // ✅ servidor SIP do cliente
            val username = params.getString("username") ?: ""  // ✅ ramal/usuário do cliente
            val password = params.getString("password") ?: "" // ✅ senha do ramal
            val transport = params.getString("transport") ?: "tcp" // ✅ udp/tcp/tls

            if (sipDomain.isBlank() || username.isBlank()) {
                promise.reject("INVALID_PARAMS", "sipDomain e username são obrigatórios")
                return
            }

            Log.i(logTag, "register() REAL domain=$sipDomain user=$username transport=$transport")

            val core = linphoneCore!!
            val factory = Factory.instance()

            // Remove proxy antigo (MVP simples: 1 conta)
            core.defaultProxyConfig?.let { oldConfig ->
                Log.i(logTag, "removendo proxy config antigo")
                core.removeProxyConfig(oldConfig)
            }  
            
            try {
                core.clearAllAuthInfo()
            } catch (_: Throwable) {
                // se sua versão não tiver esse método, a gente faz fallback depois
            }

            // Auth
            val authInfo = factory.createAuthInfo(
                username,
                null,
                password,
                null,
                null,
                sipDomain
            )
            core.addAuthInfo(authInfo)

            // EXEMPLO Identity: sip:1001@sip.domain.com
            val identity = "sip:$username@$sipDomain"
            val identityAddress = factory.createAddress(identity)

            val proxyConfig = core.createProxyConfig()
            proxyConfig.identityAddress = identityAddress

            // ADICIONAR SERVIDOR (inclui transporte)
            proxyConfig.serverAddr = "sip:$sipDomain;transport=$transport"    // <------ ALTERAR AQUI
            proxyConfig.edit()
            proxyConfig.isRegisterEnabled = true
            proxyConfig.done()

            core.addProxyConfig(proxyConfig)
            core.defaultProxyConfig = proxyConfig

            emitRegistrationState("progress", "Enviando REGISTER…")
            promise.resolve(true)

        } catch (exception: Exception) {
            Log.e(logTag, "register() error: ${exception.message}", exception)
            emitRegistrationState("failed", exception.message ?: "Erro ao registrar")
            promise.reject("REGISTER_ERROR", exception.message, exception)
        }
    }

    @ReactMethod
    fun unregister(promise: Promise) {
        try {
            ensureCoreInitializedOrThrow()

            val core = linphoneCore!!
            core.defaultProxyConfig?.let { config ->
                config.edit()
                config.isRegisterEnabled = false
                config.done()
                core.refreshRegisters()
            }

            emitRegistrationState("none", "Desregistrando…")
            promise.resolve(true)

        } catch (exception: Exception) {
            Log.e(logTag, "unregister() error: ${exception.message}", exception)
            promise.reject("UNREGISTER_ERROR", exception.message, exception)
        }
    }

    @ReactMethod
    fun startCall(params: ReadableMap, promise: Promise) {
        try {
            ensureCoreInitializedOrThrow()

            val destinationInput = params.getString("to") ?: ""
            if (destinationInput.isBlank()) {
                promise.reject("INVALID_PARAMS", "to é obrigatório")
                return
            }

            val core = linphoneCore!!
            Log.i(logTag, "startCall() REAL to=$destinationInput")

            // Monta destino com domain do proxy quando necessário
            val proxyDomain: String = try { core.defaultProxyConfig?.domain ?: "" } catch (_: Throwable) { "" }

            val destinationUri: String = when {
                destinationInput.startsWith("sip:") -> destinationInput
                destinationInput.contains("@") -> "sip:$destinationInput"
                proxyDomain.isNotBlank() -> "sip:$destinationInput@$proxyDomain"
                else -> destinationInput
            }

            val destinationAddress = core.interpretUrl(destinationUri)
            if (destinationAddress == null) {
                promise.reject("INVALID_ADDRESS", "Não consegui interpretar o destino: $destinationUri")
                return
            }

            val callParams = core.createCallParams(null)
            if (callParams == null) {
                promise.reject("CALLPARAMS_NULL", "createCallParams retornou null")
                return
            }

            // =========================
            // ✅ FORÇA “MODO BÁSICO”
            // =========================

            // 1 Só áudio
            try { callParams.isVideoEnabled = false } catch (_: Throwable) {}

            // 2 Sem criptografia de mídia (pra teste)
            try { callParams.mediaEncryption = MediaEncryption.SRTP } catch (_: Throwable) {}

            // 3 Evita early media (se existir)
            try {
                val m = callParams.javaClass.methods.firstOrNull { it.name == "setEarlyMediaSendingEnabled" && it.parameterTypes.size == 1 }
                if (m != null) m.invoke(callParams, false)
                else {
                    // algumas versões têm property
                    val prop = callParams.javaClass.methods.firstOrNull { it.name == "setIsEarlyMediaSendingEnabled" && it.parameterTypes.size == 1 }
                    prop?.invoke(callParams, false)
                }
            } catch (_: Throwable) {}

            // 4 Tenta desabilitar AVPF (se existir no CallParams)
            try {
                val avpfMethod = callParams.javaClass.methods.firstOrNull { it.name == "setAvpfEnabled" && it.parameterTypes.size == 1 }
                avpfMethod?.invoke(callParams, false)
            } catch (_: Throwable) {}

            Log.i(
                logTag,
                "Inviting address=${try { destinationAddress.asStringUriOnly() } catch (_: Throwable) { destinationUri }} (video=false, enc=SRTP)"
            )

            // =========================
            // ✅ LOGA O SDP (OFFER)
            // =========================
            // Importante: só dá pra tentar pegar SDP DEPOIS que callParams existe.
            try {
                val getLocalDescMethod = callParams.javaClass.methods.firstOrNull {
                    it.name == "getLocalDescription" && it.parameterTypes.isEmpty()
                }
                Log.i(logTag, "MediaEncryption=${callParams.mediaEncryption}")

                val localDescObject = getLocalDescMethod?.invoke(callParams)

                val asStringMethod = localDescObject?.javaClass?.methods?.firstOrNull {
                    it.name == "asString" && it.parameterTypes.isEmpty()
                }

                val sdpString = asStringMethod?.invoke(localDescObject) as? String

                if (!sdpString.isNullOrBlank()) {
                    Log.i(logTag, "SDP OFFER (local):\n$sdpString")
                } else {
                    Log.w(logTag, "SDP OFFER: não consegui obter (getLocalDescription/asString indisponível ou retornou vazio)")
                }
            } catch (t: Throwable) {
                Log.w(logTag, "Falha ao logar SDP OFFER: ${t.message}")
            }

            // =========================
            // ✅ DISPARA A CHAMADA
            // =========================
            val createdCall = core.inviteAddressWithParams(destinationAddress, callParams)
            if (createdCall == null) {
                promise.reject("CALL_FAILED", "inviteAddressWithParams retornou null")
                return
            }

            // log extra do call criado
            try {
                val remote = try { createdCall.remoteAddress?.asStringUriOnly() } catch (_: Throwable) { null }
                Log.i(logTag, "Call created OK remote=$remote")
            } catch (_: Throwable) {}

            promise.resolve(true)

        } catch (exception: Exception) {
            Log.e(logTag, "startCall() error: ${exception.message}", exception)
            emitCallState("error", exception.message ?: "Erro ao iniciar chamada")
            promise.reject("CALL_ERROR", exception.message, exception)
        }
    }

    @ReactMethod
    fun setMute(params: ReadableMap, promise: Promise) {
        Log.i(logTag, "setMute() params=$params")

        val core = linphoneCore
        if (core == null) {
            promise.reject("NO_CORE", "Core not initialized")
            return
        }

        val muted = params.hasKey("muted") && params.getBoolean("muted")

        try {
            core.isMicEnabled = !muted
            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("MUTE_ERROR", t.message, t)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Obrigatório pro NativeEventEmitter (especialmente no new architecture)
        Log.i(logTag, "addListener(eventName=$eventName)")
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Obrigatório pro NativeEventEmitter (especialmente no new architecture)
        Log.i(logTag, "removeListeners(count=$count)")
    }
    
    override fun getConstants(): MutableMap<String, Any> {
        return mutableMapOf(
            "SUPPORTED_EVENTS" to listOf("onCallState", "onIncomingCall", "onRegistrationState")
        )
    }

    @ReactMethod
    fun setSpeaker(params: ReadableMap, promise: Promise) {
        Log.i(logTag, "setSpeaker() params=$params")

        val core = linphoneCore
        if (core == null) {
            promise.reject("NO_CORE", "Core not initialized")
            return
        }

        val speakerOn = params.hasKey("speakerOn") && params.getBoolean("speakerOn")

        try {
            val devices = core.audioDevices
            val target = devices.firstOrNull { device ->
                val typeAsText = device.type.toString()

                if (speakerOn) {
                    typeAsText.contains("Speaker", ignoreCase = true)
                } else {
                    typeAsText.contains("Earpiece", ignoreCase = true) ||
                    typeAsText.contains("Headphones", ignoreCase = true)
                }
            }

            if (target != null) {
                core.outputAudioDevice = target
            } else {
                Log.w(logTag, "setSpeaker(): não achei device compatível (speakerOn=$speakerOn)")
            }

            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("SPEAKER_ERROR", t.message, t)
        }
    }

    @ReactMethod
    fun hangup(promise: Promise) {
        Log.i(logTag, "hangup()")

        val core = linphoneCore
        if (core == null) {
            promise.reject("NO_CORE", "Core not initialized")
            return
        }

        try {
            val currentCall = core.currentCall
            if (currentCall != null) {
                currentCall.terminate()
            } else {
                Log.w(logTag, "hangup(): não tem call ativa")
            }

            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("HANGUP_ERROR", t.message, t)
        }
    }
    
    override fun invalidate() {
        // Chamado quando o RN descarta o módulo
        try {
            stopIterateLoop()
            linphoneCore?.removeListener(coreListener)
            linphoneCore?.stop()
            linphoneCore = null
            coreListener = null
        } catch (_: Exception) {
        }
        super.invalidate()
    }
}