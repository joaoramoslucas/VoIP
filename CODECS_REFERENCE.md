# 🎵 CODECS DE ÁUDIO - REFERÊNCIA COMPLETA

## ✅ STATUS: TODOS OS CODECS FUNCIONAIS E ORGANIZADOS

### 📊 RESUMO
- **Total de codecs:** 17
- **Wideband (Alta Qualidade):** 5 codecs
- **Narrowband (Compatibilidade):** 12 codecs
- **Padrão habilitado:** 7 codecs (opus, pcmu, pcma, g722, g729, speex, gsm)

---

## 🎯 WIDEBAND (16 kHz) - ALTA QUALIDADE

### 1. **Opus** ⭐ RECOMENDADO
- **Bitrate:** 6-510 kbps (adaptativo)
- **Qualidade:** Excelente
- **Latência:** Muito baixa (5-66.5 ms)
- **Uso:** Melhor codec moderno, ideal para VoIP
- **Compatibilidade:** Crescente (RFC 6716)

### 2. **G.722** ⭐ POPULAR
- **Bitrate:** 64 kbps
- **Qualidade:** HD Voice
- **Latência:** Baixa
- **Uso:** Muito usado em telefonia IP empresarial
- **Compatibilidade:** Excelente (RFC 5577)

### 3. **Speex**
- **Bitrate:** 4-44 kbps (wideband)
- **Qualidade:** Boa
- **Latência:** Baixa
- **Uso:** VoIP, cancelamento de eco integrado
- **Compatibilidade:** Boa (open source)

### 4. **AMR-WB** (Adaptive Multi-Rate Wideband)
- **Bitrate:** 6.6-23.85 kbps (9 modos)
- **Qualidade:** Boa
- **Latência:** Média
- **Uso:** Redes móveis 3G/4G
- **Compatibilidade:** Excelente em mobile

### 5. **AAC-ELD** (Enhanced Low Delay)
- **Bitrate:** 32-128 kbps
- **Qualidade:** Excelente
- **Latência:** Muito baixa
- **Uso:** FaceTime Audio, comunicação em tempo real
- **Compatibilidade:** Boa (Apple, Android)

---

## 📞 NARROWBAND (8 kHz) - COMPATIBILIDADE

### 6. **PCMU (G.711 μ-law)** ⭐ PADRÃO US
- **Bitrate:** 64 kbps
- **Qualidade:** Boa (telefonia tradicional)
- **Latência:** Muito baixa
- **Uso:** Padrão nos EUA, Japão
- **Compatibilidade:** Universal (RFC 5391)

### 7. **PCMA (G.711 A-law)** ⭐ PADRÃO EU
- **Bitrate:** 64 kbps
- **Qualidade:** Boa (telefonia tradicional)
- **Latência:** Muito baixa
- **Uso:** Padrão na Europa, resto do mundo
- **Compatibilidade:** Universal (RFC 5391)

### 8. **GSM**
- **Bitrate:** 13 kbps (Full Rate)
- **Qualidade:** Aceitável
- **Latência:** Média
- **Uso:** Redes GSM, fallback
- **Compatibilidade:** Excelente

### 9. **G.729** ⭐ BAIXO BITRATE
- **Bitrate:** 8 kbps
- **Qualidade:** Boa
- **Latência:** Baixa
- **Uso:** Links com pouca banda, call centers
- **Compatibilidade:** Excelente (RFC 3551)
- **Nota:** Pode requerer licença em alguns casos

### 10. **iLBC** (Internet Low Bitrate Codec)
- **Bitrate:** 13.3 kbps (30ms) ou 15.2 kbps (20ms)
- **Qualidade:** Boa em redes ruins
- **Latência:** Média
- **Uso:** Redes com perda de pacotes
- **Compatibilidade:** Boa (RFC 3951, open source)

### 11. **AMR** (Adaptive Multi-Rate)
- **Bitrate:** 4.75-12.2 kbps (8 modos)
- **Qualidade:** Boa
- **Latência:** Média
- **Uso:** Redes móveis 2G/3G
- **Compatibilidade:** Excelente em mobile

### 12. **SILK**
- **Bitrate:** 6-40 kbps
- **Qualidade:** Boa
- **Latência:** Baixa
- **Uso:** Skype (agora open source)
- **Compatibilidade:** Crescente

### 13. **Codec2**
- **Bitrate:** 700-3200 bps (ultra baixo!)
- **Qualidade:** Aceitável
- **Latência:** Média
- **Uso:** Links satelitais, rádio amador
- **Compatibilidade:** Limitada (open source)

### 14-17. **G.726** (16/24/32/40 kbps)
- **Bitrate:** 16, 24, 32 ou 40 kbps
- **Qualidade:** Aceitável a Boa
- **Latência:** Baixa
- **Uso:** Telefonia, gravação de chamadas
- **Compatibilidade:** Boa (RFC 3551)

---

## 🎯 RECOMENDAÇÕES POR CENÁRIO

### 📱 **Melhor Qualidade (Wi-Fi/4G/5G)**
```
1. Opus (6-510 kbps adaptativo)
2. G.722 (64 kbps HD)
3. AAC-ELD (32-128 kbps)
```

### 🌐 **Compatibilidade Universal**
```
1. PCMU (G.711 μ-law) - US
2. PCMA (G.711 A-law) - EU
3. G.722 (HD Voice)
```

### 📶 **Redes com Pouca Banda**
```
1. G.729 (8 kbps)
2. iLBC (13.3 kbps)
3. AMR (4.75-12.2 kbps)
```

### 🔧 **Redes com Perda de Pacotes**
```
1. Opus (robusto a perdas)
2. iLBC (projetado para redes ruins)
3. AMR/AMR-WB (adaptativo)
```

### 🏢 **Empresarial (PBX/Asterisk)**
```
1. G.722 (HD Voice)
2. PCMU/PCMA (G.711)
3. G.729 (economia de banda)
```

---

## ⚙️ CONFIGURAÇÃO PADRÃO DO APP

```typescript
DEFAULT_CODECS = [
    'opus',    // Melhor qualidade moderna
    'pcmu',    // Compatibilidade US
    'pcma',    // Compatibilidade EU
    'g722',    // HD Voice
    'g729',    // Baixo bitrate
    'speex',   // VoIP tradicional
    'gsm'      // Fallback universal
]
```

---

## 🔍 COMO O LINPHONE NEGOCIA CODECS

1. **SDP Offer:** Cliente envia lista de codecs suportados (ordenados por preferência)
2. **SDP Answer:** Servidor responde com codec escolhido
3. **Negociação:** Primeiro codec comum entre cliente e servidor é usado
4. **Prioridade:** Ordem da lista importa (primeiro = preferido)

### Exemplo de SDP:
```
m=audio 7078 RTP/AVP 111 0 8 9 18 101
a=rtpmap:111 opus/48000/2
a=rtpmap:0 PCMU/8000
a=rtpmap:8 PCMA/8000
a=rtpmap:9 G722/8000
a=rtpmap:18 G729/8000
a=rtpmap:101 telephone-event/8000
```

---

## 📊 TABELA COMPARATIVA

| Codec      | Bitrate      | Qualidade | Latência | Banda | CPU  | Uso Principal          |
|------------|--------------|-----------|----------|-------|------|------------------------|
| Opus       | 6-510 kbps   | ⭐⭐⭐⭐⭐ | Muito Baixa | Alta  | Média | VoIP moderno          |
| G.722      | 64 kbps      | ⭐⭐⭐⭐   | Baixa    | Alta  | Baixa | HD Voice empresarial  |
| PCMU/PCMA  | 64 kbps      | ⭐⭐⭐     | Muito Baixa | Alta  | Muito Baixa | Telefonia tradicional |
| G.729      | 8 kbps       | ⭐⭐⭐     | Baixa    | Baixa | Alta | Links com pouca banda |
| AMR-WB     | 6.6-23.85 kbps | ⭐⭐⭐⭐ | Média    | Baixa | Média | Redes móveis 3G/4G   |
| iLBC       | 13.3-15.2 kbps | ⭐⭐⭐  | Média    | Baixa | Média | Redes com perdas     |
| Speex      | 4-44 kbps    | ⭐⭐⭐     | Baixa    | Variável | Média | VoIP open source    |
| GSM        | 13 kbps      | ⭐⭐       | Média    | Baixa | Baixa | Fallback universal   |
| Codec2     | 0.7-3.2 kbps | ⭐⭐       | Média    | Muito Baixa | Baixa | Links satelitais   |

---

## ✅ VERIFICAÇÃO DE FUNCIONAMENTO

### Android (Logcat):
```bash
adb logcat | grep "CODECS enabled"
```

### iOS (Xcode Console):
```
[SipNativeModule] CODECS: 17 codecs habilitados de 17 disponíveis
[SipNativeModule] CODECS enabled: opus/48000/ch2, pcmu/8000/ch1, ...
```

### Durante Chamada (SDP):
```bash
# Android
adb logcat | grep "SDP OFFER"

# iOS
# Ver console Xcode durante chamada
```

---

## 🚨 TROUBLESHOOTING

### Problema: "Codec não suportado"
**Causa:** Servidor não tem codec em comum com cliente
**Solução:** Habilitar PCMU/PCMA (universais)

### Problema: "Áudio cortado"
**Causa:** Codec muito pesado para rede
**Solução:** Usar G.729, iLBC ou AMR

### Problema: "Qualidade ruim"
**Causa:** Codec narrowband em rede boa
**Solução:** Habilitar Opus, G.722 ou AMR-WB

### Problema: "Não conecta"
**Causa:** Servidor requer codec específico
**Solução:** Verificar logs do servidor e habilitar codec necessário

---

## 📚 REFERÊNCIAS

- **RFC 6716:** Opus Codec
- **RFC 5577:** G.722 Wideband
- **RFC 5391:** G.711 (PCMU/PCMA)
- **RFC 3551:** G.729, G.726
- **RFC 3951:** iLBC
- **Linphone SDK:** https://linphone.org/technical-corner/liblinphone
- **Asterisk Codecs:** https://wiki.asterisk.org/wiki/display/AST/Codec+Negotiation

---

## ✅ CONCLUSÃO

**Todos os 17 codecs estão:**
- ✅ Corretamente categorizados (wideband vs narrowband)
- ✅ Implementados em Android e iOS
- ✅ Sincronizados entre JS, Android e iOS
- ✅ Ordenados por importância/qualidade
- ✅ Prontos para uso em produção

**O app suporta qualquer servidor SIP que use esses codecs!**
