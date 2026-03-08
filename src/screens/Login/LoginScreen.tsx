import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ActivityIndicator,
    PermissionsAndroid, ScrollView, StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParams } from '../../app/RootStackParams';
import { useSipStore } from '../../state/sip/sipStore';

type Nav = NativeStackNavigationProp<RootStackParams, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { registration, actions, lastUsedCredentials } = useSipStore();

    const [username, setUsername] = useState(lastUsedCredentials?.username ?? '');
    const [password, setPassword] = useState(lastUsedCredentials?.password ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const wasLoadingRef = useRef(false);

    // Auto-login is handled by SplashScreen before reaching Login
    // This screen is only shown when no account exists or user explicitly adds account

    // Watch for registration success/failure
    useEffect(() => {
        if (isLoading) wasLoadingRef.current = true;
    }, [isLoading]);

    useEffect(() => {
        if (!wasLoadingRef.current) return;
        if (registration.state === 'ok') {
            wasLoadingRef.current = false;
            setIsLoading(false);
            setError('');
            navigation.replace('DrawerHome');
        } else if (registration.state === 'failed') {
            wasLoadingRef.current = false;
            setIsLoading(false);
            setError('Falha no registro. Verifique suas credenciais.');
        }
    }, [registration.state, navigation]);

    const canSubmit = useMemo(
        () => username.trim().length > 0 && !isLoading,
        [username, isLoading]
    );

    const handleLogin = async () => {
        if (!canSubmit) return;
        setError('');

        if (Platform.OS === 'android') {
            await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
                title: 'Permissão de Microfone',
                message: 'O app precisa do microfone para chamadas SIP.',
                buttonPositive: 'Permitir',
                buttonNegative: 'Negar',
            });
            if (Number(Platform.Version) >= 33) {
                try {
                    await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any, {
                        title: 'Permissão de Notificações',
                        message: 'Para alertar sobre chamadas recebidas.',
                        buttonPositive: 'Permitir',
                        buttonNegative: 'Negar',
                    });
                } catch (_) { }
            }
        }

        setIsLoading(true);
        try {
            const saved = lastUsedCredentials;
            await actions.registerAccount({
                sipDomain: saved?.sipDomain ?? 'sip.linphone.org',
                username: username.trim(),
                password,
                transport: saved?.transport ?? 'tcp',
            });
        } catch {
            setIsLoading(false);
            setError('Erro ao conectar. Tente novamente.');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0B0F14" />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoIcon}>📞</Text>
                    </View>
                    <Text style={styles.appName}>SipApp</Text>
                    <Text style={styles.tagline}>Seu telefone VoIP profissional</Text>
                </View>

                {/* Form */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Entrar</Text>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Usuário SIP</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="ex: joao ou 1001"
                            placeholderTextColor="#4A5568"
                            autoCapitalize="none"
                            autoCorrect={false}
                            editable={!isLoading}
                            returnKeyType="next"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Senha</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Sua senha SIP"
                            placeholderTextColor="#4A5568"
                            secureTextEntry
                            editable={!isLoading}
                            returnKeyType="done"
                            onSubmitEditing={handleLogin}
                        />
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.loginBtn, { opacity: canSubmit ? 1 : 0.5 }]}
                        onPress={handleLogin}
                        disabled={!canSubmit}
                        activeOpacity={0.85}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginBtnText}>Entrar</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* SIP Config link */}
                <TouchableOpacity
                    style={styles.configLink}
                    onPress={() => navigation.navigate('SipConfig')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.configLinkText}>⚙️  Configurar servidor SIP</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0B0F14',
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 80,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1A2D4A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#4F8CFF',
        shadowColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
    },
    logoIcon: { fontSize: 36 },
    appName: {
        fontSize: 30,
        fontWeight: '800',
        color: '#EAF0FF',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 14,
        color: '#6B7A99',
        marginTop: 6,
    },
    card: {
        backgroundColor: '#121822',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1E2D47',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#EAF0FF',
        marginBottom: 20,
    },
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7A99',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        height: 50,
        backgroundColor: '#0E141D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1E2D47',
        paddingHorizontal: 16,
        color: '#EAF0FF',
        fontSize: 15,
    },
    errorBox: {
        backgroundColor: '#2D1A1A',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FF4D4D40',
    },
    errorText: {
        color: '#FF4D4D',
        fontSize: 13,
        fontWeight: '600',
    },
    loginBtn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: '#4F8CFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        shadowColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    configLink: {
        alignSelf: 'center',
        marginTop: 24,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    configLinkText: {
        color: '#4F8CFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
