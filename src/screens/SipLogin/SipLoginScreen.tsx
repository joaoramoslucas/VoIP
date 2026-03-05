import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParams } from '../../app/RootStackParams';
import { s as s } from './s';
import { useSipStore } from '../../state/sip/sipStore';
import type { SipTransport } from '../../services/sip/sipTypes';

type Navigation = NativeStackNavigationProp<RootStackParams, 'SipLogin'>;

export const SipLoginScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const { registration, actions, lastUsedCredentials } = useSipStore();

    const [sipDomainInput, setSipDomainInput] = useState(lastUsedCredentials?.sipDomain ?? 'sip.linphone.org');
    const [usernameInput, setUsernameInput] = useState(lastUsedCredentials?.username ?? '');
    const [passwordInput, setPasswordInput] = useState(lastUsedCredentials?.password ?? '');
    const [transport, setTransport] = useState<SipTransport>(lastUsedCredentials?.transport ?? 'tcp');

    const canSubmit = useMemo(() => {
        return sipDomainInput.trim().length > 0 && usernameInput.trim().length > 0;
    }, [sipDomainInput, usernameInput]);

    const handleRegisterPress = async () => {
        if (!canSubmit) return;

        await actions.registerAccount({
            sipDomain: sipDomainInput.trim(),
            username: usernameInput.trim(),
            password: passwordInput,
            transport,
        });

        // mudar pra navegar só quando registration.state === 'ok'
        navigation.replace('Dialer');
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
                    value={sipDomainInput}
                    onChangeText={setSipDomainInput}
                    placeholder="ex: sip.domain.com"
                    placeholderTextColor="#66739A"
                    autoCapitalize="none"
                    style={s.input}
                />

                <Text style={s.label}>Usuário / Ramal</Text>
                <TextInput
                    value={usernameInput}
                    onChangeText={setUsernameInput}
                    placeholder="ex: 1001"
                    placeholderTextColor="#66739A"
                    autoCapitalize="none"
                    style={s.input}
                />

                <Text style={s.label}>Senha</Text>
                <TextInput
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                    placeholder="(opcional em alguns servidores)"
                    placeholderTextColor="#66739A"
                    secureTextEntry
                    autoCapitalize="none"
                    style={s.input}
                />

                <Text style={s.label}>Transporte</Text>
                <View style={s.row}>
                    {renderTransportChip('tcp', 'TCP')}
                    {renderTransportChip('udp', 'UDP')}
                    {renderTransportChip('tls', 'TLS')}
                </View>

                <TouchableOpacity
                    onPress={handleRegisterPress}
                    style={[s.button, { opacity: canSubmit ? 1 : 0.5 }]}
                    disabled={!canSubmit}
                    activeOpacity={0.85}
                >
                    <Text style={s.buttonText}>Registrar</Text>
                </TouchableOpacity>

                <Text style={s.statusLine}>
                    Registro: {registration.state} — {registration.message}
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};