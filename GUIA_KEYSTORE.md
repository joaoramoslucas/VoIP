# 🔑 GUIA COMPLETO - KEYSTORE ANDROID

## 1️⃣ CRIAR KEYSTORE

```bash
cd android/app

keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore sipapp-release.keystore \
  -alias sipapp-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Preencher informações:
```
Keystore password: [SENHA FORTE - ANOTE!]
Re-enter password: [REPITA]

First and last name: Nome da Empresa
Organizational unit: TI
Organization: Nome da Empresa Ltda
City: São Paulo
State: SP
Country code: BR

Confirm? yes

Key password: [ENTER para usar a mesma senha]
```

## 2️⃣ CONFIGURAR GRADLE

### Criar `android/gradle.properties`:
```properties
SIPAPP_RELEASE_STORE_FILE=sipapp-release.keystore
SIPAPP_RELEASE_KEY_ALIAS=sipapp-key-alias
SIPAPP_RELEASE_STORE_PASSWORD=SUA_SENHA_AQUI
SIPAPP_RELEASE_KEY_PASSWORD=SUA_SENHA_AQUI
```

### ✅ Já configurei:
- `android/app/build.gradle` - Signing config
- `.gitignore` - Protege keystore e senhas

## 3️⃣ GERAR APK/AAB DE RELEASE

### APK (para testes):
```bash
cd android
./gradlew assembleRelease

# Arquivo gerado:
# android/app/build/outputs/apk/release/app-release.apk
```

### AAB (para Play Store):
```bash
cd android
./gradlew bundleRelease

# Arquivo gerado:
# android/app/build/outputs/bundle/release/app-release.aab
```

## 4️⃣ TESTAR APK

```bash
# Instalar no dispositivo
adb install android/app/build/outputs/apk/release/app-release.apk
```

## 5️⃣ UPLOAD PLAY STORE

1. Acessar [Google Play Console](https://play.google.com/console)
2. Criar novo app
3. Upload do `app-release.aab`
4. Preencher informações
5. Publicar

## ⚠️ IMPORTANTE - BACKUP

### GUARDAR COM SEGURANÇA:
- ✅ `sipapp-release.keystore` (arquivo)
- ✅ Senha do keystore
- ✅ Alias: sipapp-key-alias
- ✅ Senha da key

### ❌ SE PERDER:
- Não consegue mais atualizar o app
- Precisa publicar como novo app
- Perde todos os usuários/reviews

### 💾 ONDE GUARDAR:
- Cofre de senhas (1Password, LastPass)
- Backup em nuvem criptografado
- Pendrive em local seguro
- **NUNCA no Git!**

## ✅ CHECKLIST

- [ ] Keystore criado
- [ ] gradle.properties configurado
- [ ] Senhas anotadas em local seguro
- [ ] Backup do keystore feito
- [ ] APK de release testado
- [ ] AAB gerado para Play Store

## 🎯 PRONTO!

Agora você pode:
- ✅ Gerar builds de release
- ✅ Publicar na Play Store
- ✅ Atualizar o app no futuro

**Keystore configurado com sucesso!** 🚀
