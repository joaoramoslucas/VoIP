import { s as s } from './s';

import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, PermissionsAndroid, Alert } from 'react-native';

import { useSipStore } from '../../state/sip/sipStore';
import { RootStackParams } from '../../app/RootStackParams';
import type { SipTransport } from '../../services/sip/sipTypes';

type Navigation = NativeStackNavigationProp<RootStackParams, 'SipLogin'>;

export const SipLoginScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const { registration, actions, lastUsedCredentials } = useSipStore();

    const [sipDomainInput, setSipDomainInput] = useState(lastUsedCredentials?.sipDomain ?? 'sip.linphone.org');
    const [usernameInput, setUsernameInput] = useState(lastUsedCredentials?.username ?? '');
    const [passwordInput, setPasswordInput] = useState(lastUsedCredentials?.password ?? '');
    const [transport, setTransport] = useState<SipTransport>(lastUsedCredentials?.transport ?? 'tcp');
    const [isRegistering, setIsRegistering] = useState(false);

    const canSubmit = useMemo(() => {
        return sipDomainInput.trim().length > 0 && usernameInput.trim().length > 0 && !isRegistering;
    }, [sipDomainInput, usernameInput, isRegistering]);

    // Auto-login ao montar
    useEffect(() => {
        let cancelled = false;
        const tryAutoLogin = async () => {
            setIsRegistering(true);
            const success = await actions.autoLogin();
            if (cancelled) return;
            if (!success) {
                setIsRegistering(false);
            }
            // Se success, o useEffect de registration.state vai navegar
        };
        tryAutoLogin();
        return () => { cancelled = true; };
    }, []);

    // Observar o estado de registro e navegar quando 'ok'
    const wasRegisteringRef = useRef(false);

    useEffect(() => {
        if (!isRegistering) return;
        wasRegisteringRef.current = true;
    }, [isRegistering]);

    useEffect(() => {
        if (!wasRegisteringRef.current) return;

        if (registration.state === 'ok') {
            wasRegisteringRef.current = false;
            setIsRegistering(false);
            navigation.replace('SipDialer');
        } else if (registration.state === 'failed') {
            wasRegisteringRef.current = false;
            setIsRegistering(false);
        }
    }, [registration.state, navigation]);

    const handleRegisterPress = async () => {
        if (!canSubmit) return;

        // Solicitar permissões antes de registrar
        if (Platform.OS === 'android') {
            // Permissão de microfone (obrigatória)
            const micPermission = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: 'Permissão de Microfone',
                    message: 'O app precisa do microfone para realizar e receber chamadas SIP.',
                    buttonPositive: 'Permitir',
                    buttonNegative: 'Negar',
                },
            );

            if (micPermission !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert(
                    'Permissão necessária',
                    'Sem acesso ao microfone não é possível fazer chamadas. Habilite nas configurações do dispositivo.',
                );
                return;
            }

            // Permissão de notificações (Android 13+)
            if (Number(Platform.Version) >= 33) {
                try {
                    await PermissionsAndroid.request(
                        'android.permission.POST_NOTIFICATIONS' as any,
                        {
                            title: 'Permissão de Notificações',
                            message: 'O app precisa de notificações para alertar sobre chamadas recebidas.',
                            buttonPositive: 'Permitir',
                            buttonNegative: 'Negar',
                        },
                    );
                } catch (_) { }
            }
        }

        setIsRegistering(true);

        try {
            await actions.registerAccount({
                sipDomain: sipDomainInput.trim(),
                username: usernameInput.trim(),
                password: passwordInput,
                transport,
            });
        } catch {
            setIsRegistering(false);
        }
    };

    const renderTransportChip = (value: SipTransport, label: string) => {
        const isActive = transport === value;
        return (
            <TouchableOpacity
                onPress={() => setTransport(value)}
                style={[s.chip, isActive && s.chipActive]}
                activeOpacity={0.8}
            >
                <Text style={[s.chipText, isActive && s.chipTextActive]}>{label}</Text>
            </TouchableOpacity>
        );
    };

    const getStatusColor = () => {
        switch (registration.state) {
            case 'ok': return '#20D17A';
            case 'failed': return '#FF4D4D';
            case 'progress': return '#FFB020';
            default: return '#AAB6D3';
        }
    };

    return (
        <KeyboardAvoidingView
            style={s.screen}
            behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
            <Text style={s.title}>Entrar no SIP</Text>
            <Text style={s.subtitle}>Configure domínio, usuário e transporte.</Text>

            <View style={s.card}>
                <Text style={s.label}>Domínio / Servidor SIP</Text>
                <TextInput
                    style={s.input}
                    autoCapitalize="none"
                    value={sipDomainInput}
                    editable={!isRegistering}
                    placeholderTextColor="#66739A"
                    placeholder="ex: sip.domain.com"
                    onChangeText={setSipDomainInput}
                />

                <Text style={s.label}>Usuário / Ramal</Text>
                <TextInput
                    style={s.input}
                    value={usernameInput}
                    autoCapitalize="none"
                    placeholder="ex: 1001"
                    editable={!isRegistering}
                    placeholderTextColor="#66739A"
                    onChangeText={setUsernameInput}
                />

                <Text style={s.label}>Senha</Text>
                <TextInput
                    secureTextEntry
                    style={s.input}
                    autoCapitalize="none"
                    value={passwordInput}
                    editable={!isRegistering}
                    onChangeText={setPasswordInput}
                    placeholderTextColor="#66739A"
                    placeholder="(opcional em alguns servidores)"
                />

                <Text style={s.label}>Transporte</Text>
                <View style={s.row}>
                    {renderTransportChip('tcp', 'TCP')}
                    {renderTransportChip('udp', 'UDP')}
                    {renderTransportChip('tls', 'TLS')}
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={!canSubmit}
                    onPress={handleRegisterPress}
                    style={[s.button, { opacity: canSubmit ? 1 : 0.5 }]}
                >
                    {isRegistering ? (
                        <ActivityIndicator color="#EAF0FF" size="small" />
                    ) : (
                        <Text style={s.buttonText}>Registrar</Text>
                    )}
                </TouchableOpacity>

                <Text style={[s.statusLine, { color: getStatusColor() }]}>
                    Registro: {registration.state} — {registration.message}
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};