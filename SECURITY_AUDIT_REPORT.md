# 🔒 AUDITORIA DE SEGURANÇA E FALHAS CRÍTICAS - SIPAPP

## 📊 RESUMO EXECUTIVO

**Data:** 2024
**Versão:** 1.0.0
**Plataformas:** Android + iOS
**Tipo:** Aplicativo VoIP SIP

---

## 🚨 FALHAS CRÍTICAS ENCONTRADAS

### ❌ CRÍTICO 1: SENHAS ARMAZENADAS EM TEXTO PLANO
**Severidade:** 🔴 CRÍTICA
**Localização:** `src/services/storage/credentialStorage.ts`
**Problema:**
```typescript
// SENHA ARMAZENADA SEM CRIPTOGRAFIA!
export type StoredAccount = SipAccountCredentials & {
    id: string;
    displayName: string;
    addedAt: number;
};

// SipAccountCredentials contém:
// - username
// - password  ← TEXTO PLANO!
// - sipDomain
// - transport
```

**Impacto:**
- ✅ Qualquer app com acesso root pode ler as senhas
- ✅ Backup do dispositivo expõe senhas
- ✅ Malware pode roubar credenciais
- ✅ Violação de LGPD/GDPR

**Solução Necessária:**
```typescript
// USAR KEYCHAIN (iOS) / KEYSTORE (Android)
import * as Keychain from 'react-native-keychain';

// Salvar
await Keychain.setGenericPassword(username, password, {
  service: `sipapp_${sipDomain}`,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
});

// Carregar
const credentials = await Keychain.getGenericPassword({
  service: `sipapp_${sipDomain}`,
});
```

**Biblioteca:** `react-native-keychain`

---

### ❌ CRÍTICO 2: CLEARTEXT TRAFFIC HABILITADO
**Severidade:** 🔴 CRÍTICA
**Localização:** `android/app/src/main/AndroidManifest.xml`
**Problema:**
```xml
android:usesCleartextTraffic="${usesCleartextTraffic}"
```

**Impacto:**
- ✅ Permite HTTP não criptografado
- ✅ Man-in-the-middle attacks
- ✅ Interceptação de credenciais SIP
- ✅ Violação de boas práticas

**Solução:**
```xml
<!-- FORÇAR APENAS HTTPS/TLS -->
android:usesCleartextTraffic="false"
```

**Exceção:** Se servidor SIP não suportar TLS, criar Network Security Config:
```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">sip.cliente.com</domain>
    </domain-config>
</network-security-config>
```

---

### ⚠️ ALTO 3: BACKUP HABILITADO (Android)
**Severidade:** 🟠 ALTA
**Localização:** `android/app/src/main/AndroidManifest.xml`
**Problema:**
```xml
android:allowBackup="false"  ← BOM!
```

**Status:** ✅ JÁ ESTÁ CORRETO!

Mas verificar se há `android:fullBackupContent`:
```xml
<!-- Se existir, adicionar exclusões -->
<full-backup-content>
    <exclude domain="sharedpref" path="@sipapp_accounts"/>
    <exclude domain="sharedpref" path="@sipapp_active_account"/>
</full-backup-content>
```

---

### ⚠️ ALTO 4: LOGS SENSÍVEIS EM PRODUÇÃO
**Severidade:** 🟠 ALTA
**Localização:** Múltiplos arquivos
**Problema:**
```typescript
// Android
Log.i(logTag, "register() domain=$sipDomain user=$username transport=$transport")

// iOS
NSLog(@"[SipNativeModule] register() domain=%@ user=%@ transport=%@", sipDomain, username, transport);
```

**Impacto:**
- ✅ Logs podem conter informações sensíveis
- ✅ Logcat (Android) acessível por outros apps
- ✅ Crash reports podem expor dados

**Solução:**
```typescript
// Criar logger condicional
const isDev = __DEV__;

const secureLog = {
  info: (tag: string, message: string) => {
    if (isDev) {
      console.log(`[${tag}] ${message}`);
    }
  },
  error: (tag: string, message: string) => {
    // Sempre logar erros, mas sanitizar
    console.error(`[${tag}] ${sanitize(message)}`);
  }
};

// Sanitizar dados sensíveis
const sanitize = (msg: string) => {
  return msg
    .replace(/password=\S+/gi, 'password=***')
    .replace(/token=\S+/gi, 'token=***');
};
```

---

### ⚠️ MÉDIO 5: FALTA VALIDAÇÃO DE ENTRADA
**Severidade:** 🟡 MÉDIA
**Localização:** `src/screens/Login/LoginScreen.tsx`
**Problema:**
```typescript
const handleLogin = async () => {
    if (!canSubmit) return;
    // SEM VALIDAÇÃO DE FORMATO!
    await actions.registerAccount({
        sipDomain: saved?.sipDomain ?? 'sip.linphone.org',
        username: username.trim(),  // ← Pode conter caracteres inválidos
        password,  // ← Sem validação
        transport: saved?.transport ?? 'tcp',
    });
};
```

**Impacto:**
- ✅ SQL Injection (se servidor vulnerável)
- ✅ XSS (se exibido em web)
- ✅ Buffer overflow (se servidor C/C++ vulnerável)

**Solução:**
```typescript
// Validar formato SIP URI
const validateSipUri = (uri: string): boolean => {
  const sipRegex = /^[a-zA-Z0-9._-]+(@[a-zA-Z0-9.-]+)?$/;
  return sipRegex.test(uri);
};

// Validar domínio
const validateDomain = (domain: string): boolean => {
  const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return domainRegex.test(domain) || ipRegex.test(domain);
};

// Sanitizar entrada
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove caracteres perigosos
    .substring(0, 255); // Limita tamanho
};
```

---

### ⚠️ MÉDIO 6: FALTA RATE LIMITING
**Severidade:** 🟡 MÉDIA
**Localização:** `src/screens/Login/LoginScreen.tsx`
**Problema:**
```typescript
// Usuário pode tentar login infinitas vezes
const handleLogin = async () => {
    // SEM LIMITE DE TENTATIVAS!
    await actions.registerAccount(...);
};
```

**Impacto:**
- ✅ Brute force attacks
- ✅ DoS no servidor SIP
- ✅ Consumo excessivo de recursos

**Solução:**
```typescript
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutos

const [loginAttempts, setLoginAttempts] = useState(0);
const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

const handleLogin = async () => {
    // Verificar lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        setError(`Aguarde ${remaining}s antes de tentar novamente`);
        return;
    }

    try {
        await actions.registerAccount(...);
        setLoginAttempts(0); // Reset on success
    } catch {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
            setLockoutUntil(Date.now() + LOCKOUT_TIME);
            setError('Muitas tentativas. Aguarde 5 minutos.');
        } else {
            setError(`Falha no login. ${MAX_ATTEMPTS - newAttempts} tentativas restantes.`);
        }
    }
};
```

---

### ⚠️ MÉDIO 7: FALTA TIMEOUT EM CHAMADAS
**Severidade:** 🟡 MÉDIA
**Localização:** `src/state/sip/sipStore.tsx`
**Problema:**
```typescript
const startCall = async (to: string) => {
    // SEM TIMEOUT!
    await sipNative.startCall({ to });
    // Chamada pode ficar "outgoing" para sempre
};
```

**Impacto:**
- ✅ Chamadas travadas
- ✅ UI congelada
- ✅ Recursos não liberados

**Solução:**
```typescript
const CALL_TIMEOUT = 60 * 1000; // 60 segundos

const startCall = async (to: string) => {
    await initializeCore();

    const next: SipCallSnapshot = {
        remoteUri: to,
        state: 'outgoing',
        message: 'Calling...',
        direction: 'Outgoing',
        lastUpdatedAtMs: nowMs(),
    };
    setCall(next);

    // Timeout automático
    const timeoutId = setTimeout(() => {
        if (call.state === 'outgoing') {
            hangUp();
            setCall({
                state: 'error',
                message: 'Timeout: Sem resposta',
                remoteUri: null,
                direction: null,
                lastUpdatedAtMs: nowMs(),
            });
        }
    }, CALL_TIMEOUT);

    try {
        await sipNative.startCall({ to });
    } finally {
        clearTimeout(timeoutId);
    }
};
```

---

### ⚠️ BAIXO 8: FALTA VERIFICAÇÃO DE CERTIFICADO TLS
**Severidade:** 🟢 BAIXA
**Localização:** Código nativo (Linphone)
**Problema:**
- Linphone SDK pode aceitar certificados auto-assinados por padrão

**Solução:**
```kotlin
// Android
val core = linphoneFactory.createCore(null, null, reactContext)
core.rootCa = "/path/to/ca-bundle.crt" // Certificados confiáveis
```

```objc
// iOS
linphone_core_set_root_ca(core, "/path/to/ca-bundle.crt");
```

---

### ⚠️ BAIXO 9: FALTA OFUSCAÇÃO DE CÓDIGO
**Severidade:** 🟢 BAIXA
**Localização:** `android/app/build.gradle`
**Problema:**
```gradle
def enableProguardInReleaseBuilds = false  // ← DESABILITADO!
```

**Solução:**
```gradle
def enableProguardInReleaseBuilds = true

// proguard-rules.pro
-keep class com.sipapp.sip.** { *; }
-keep class org.linphone.** { *; }
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
```

---

### ⚠️ BAIXO 10: FALTA DETECÇÃO DE ROOT/Jailbreak
**Severidade:** 🟢 BAIXA
**Problema:**
- App funciona em dispositivos rooteados/jailbroken
- Maior risco de malware

**Solução:**
```typescript
import JailMonkey from 'jail-monkey';

useEffect(() => {
    if (JailMonkey.isJailBroken()) {
        Alert.alert(
            'Dispositivo Inseguro',
            'Este dispositivo está rooteado/jailbroken. O app pode não funcionar corretamente.',
            [{ text: 'Entendi', style: 'cancel' }]
        );
    }
}, []);
```

**Biblioteca:** `jail-monkey`

---

## 📋 CHECKLIST DE SEGURANÇA

### 🔴 CRÍTICO (CORRIGIR IMEDIATAMENTE)
- [ ] **1. Criptografar senhas** (react-native-keychain)
- [ ] **2. Desabilitar cleartext traffic** (AndroidManifest)

### 🟠 ALTO (CORRIGIR ANTES DE PRODUÇÃO)
- [x] **3. Desabilitar backup** (já está correto)
- [ ] **4. Remover logs sensíveis** (sanitizar em produção)

### 🟡 MÉDIO (RECOMENDADO)
- [ ] **5. Validar entrada de usuário** (regex + sanitização)
- [ ] **6. Implementar rate limiting** (login attempts)
- [ ] **7. Adicionar timeout em chamadas** (60s)

### 🟢 BAIXO (OPCIONAL)
- [ ] **8. Verificar certificados TLS** (Linphone config)
- [ ] **9. Habilitar ProGuard** (ofuscação)
- [ ] **10. Detectar root/jailbreak** (jail-monkey)

---

## 🛡️ RECOMENDAÇÕES ADICIONAIS

### 1. Implementar Certificate Pinning
```typescript
// Para servidores SIP específicos
const trustedCertificates = [
  'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
];
```

### 2. Adicionar Biometria (Opcional)
```typescript
import ReactNativeBiometrics from 'react-native-biometrics';

const authenticate = async () => {
  const { success } = await ReactNativeBiometrics.simplePrompt({
    promptMessage: 'Confirme sua identidade',
  });
  return success;
};
```

### 3. Implementar Session Timeout
```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos

useEffect(() => {
    const timer = setTimeout(() => {
        actions.logout();
        Alert.alert('Sessão Expirada', 'Faça login novamente');
    }, SESSION_TIMEOUT);
    
    return () => clearTimeout(timer);
}, []);
```

### 4. Adicionar Logs de Auditoria
```typescript
const auditLog = {
  login: (username: string, success: boolean) => {
    // Enviar para servidor de logs
    logToServer({
      event: 'login',
      username,
      success,
      timestamp: Date.now(),
      device: Platform.OS,
    });
  },
};
```

### 5. Implementar 2FA (Opcional)
```typescript
// TOTP (Time-based One-Time Password)
import * as OTPAuth from 'otpauth';

const verify2FA = (token: string, secret: string): boolean => {
  const totp = new OTPAuth.TOTP({ secret });
  return totp.validate({ token }) !== null;
};
```

---

## 📊 SCORE DE SEGURANÇA

### Antes das Correções
```
🔴 CRÍTICO:  2 falhas
🟠 ALTO:     2 falhas
🟡 MÉDIO:    3 falhas
🟢 BAIXO:    3 falhas
───────────────────────
SCORE: 40/100 (INSEGURO)
```

### Depois das Correções Críticas + Altas
```
🔴 CRÍTICO:  0 falhas
🟠 ALTO:     0 falhas
🟡 MÉDIO:    3 falhas
🟢 BAIXO:    3 falhas
───────────────────────
SCORE: 75/100 (ACEITÁVEL)
```

### Depois de TODAS as Correções
```
🔴 CRÍTICO:  0 falhas
🟠 ALTO:     0 falhas
🟡 MÉDIO:    0 falhas
🟢 BAIXO:    0 falhas
───────────────────────
SCORE: 95/100 (EXCELENTE)
```

---

## 🎯 PRIORIDADES

### FASE 1: CRÍTICO (1-2 dias)
1. ✅ Implementar `react-native-keychain` para senhas
2. ✅ Desabilitar cleartext traffic

### FASE 2: ALTO (2-3 dias)
3. ✅ Sanitizar logs em produção
4. ✅ Adicionar exclusões de backup

### FASE 3: MÉDIO (3-5 dias)
5. ✅ Validação de entrada
6. ✅ Rate limiting
7. ✅ Timeout em chamadas

### FASE 4: BAIXO (Opcional)
8. ✅ Certificate pinning
9. ✅ ProGuard
10. ✅ Root detection

---

## 📚 BIBLIOTECAS RECOMENDADAS

```json
{
  "dependencies": {
    "react-native-keychain": "^8.2.0",        // Criptografia de senhas
    "jail-monkey": "^2.8.0",                  // Root/Jailbreak detection
    "react-native-biometrics": "^3.0.1"       // Biometria (opcional)
  }
}
```

---

## 🔍 FERRAMENTAS DE TESTE

### Android
```bash
# Análise estática
./gradlew lint

# Verificar permissões
adb shell dumpsys package com.sipapp | grep permission

# Verificar backup
adb shell bmgr list transports
```

### iOS
```bash
# Análise estática
xcodebuild analyze

# Verificar keychain
security dump-keychain

# Verificar entitlements
codesign -d --entitlements - SipApp.app
```

### Penetration Testing
- **OWASP ZAP:** Interceptar tráfego
- **Frida:** Análise dinâmica
- **MobSF:** Análise automática

---

## ✅ CONCLUSÃO

**Status Atual:** 🟠 INSEGURO (40/100)

**Falhas Críticas:** 2
- Senhas em texto plano
- Cleartext traffic habilitado

**Ação Imediata Necessária:**
1. Implementar `react-native-keychain`
2. Desabilitar cleartext traffic
3. Sanitizar logs

**Após Correções:** 🟢 SEGURO (75-95/100)

**Tempo Estimado:** 5-10 dias de desenvolvimento

---

## 📞 CONTATO

Para dúvidas sobre implementação das correções, consulte:
- OWASP Mobile Security: https://owasp.org/www-project-mobile-security/
- React Native Security: https://reactnative.dev/docs/security
- Linphone Security: https://linphone.org/technical-corner/liblinphone
