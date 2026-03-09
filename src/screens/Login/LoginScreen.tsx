import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSipStore } from '../../state/sip/sipStore';
import { RootStackParams } from '../../app/RootStackParams';
import { PermissionsManager } from '../../utils/PermissionsManager';

type Nav = NativeStackNavigationProp<RootStackParams, 'Login'>;

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { registration, actions, lastUsedCredentials } = useSipStore();

    const wasLoadingRef = useRef(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState(lastUsedCredentials?.username ?? '');
    const [password, setPassword] = useState(lastUsedCredentials?.password ?? '');

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
                        <Icon name="call" size={36} color="#EAF0FF" />
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
                            value={username}
                            autoCorrect={false}
                            style={styles.input}
                            returnKeyType="next"
                            autoCapitalize="none"
                            editable={!isLoading}
                            onChangeText={setUsername}
                            placeholder="ex: joao ou 1001"
                            placeholderTextColor="#4A5568"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Senha</Text>
                        <TextInput
                            secureTextEntry
                            value={password}
                            style={styles.input}
                            returnKeyType="done"
                            editable={!isLoading}
                            onChangeText={setPassword}
                            placeholder="Sua senha SIP"
                            onSubmitEditing={handleLogin}
                            placeholderTextColor="#4A5568"
                        />
                    </View>

                    {error ? (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={handleLogin}
                        disabled={!canSubmit}
                        style={[styles.loginBtn, { opacity: canSubmit ? 1 : 0.5 }]}
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
                    activeOpacity={0.7}
                    style={styles.configLink}
                    onPress={() => navigation.navigate('SipConfig')}
                >
                    <Icon name="settings-outline" size={16} color="#4F8CFF" />
                    <Text style={styles.configLinkText}>Configurar servidor SIP</Text>
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
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    logoSection: {
        marginTop: 80,
        marginBottom: 40,
        alignItems: 'center',
    },
    logoCircle: {
        width: 80,
        height: 80,
        elevation: 8,
        borderWidth: 2,
        marginBottom: 16,
        shadowRadius: 16,
        borderRadius: 40,
        shadowOpacity: 0.5,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#4F8CFF',
        shadowColor: '#4F8CFF',
        backgroundColor: '#1A2D4A',
        shadowOffset: { width: 0, height: 0 },
    },
    logoIcon: {
        fontSize: 36,
    },
    appName: {
        fontSize: 30,
        letterSpacing: 1,
        fontWeight: '800',
        color: '#EAF0FF',
    },
    tagline: {
        fontSize: 14,
        marginTop: 6,
        color: '#6B7A99',
    },
    card: {
        padding: 24,
        borderWidth: 1,
        borderRadius: 20,
        borderColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    cardTitle: {
        fontSize: 20,
        marginBottom: 20,
        fontWeight: '700',
        color: '#EAF0FF',
    },
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
        color: '#6B7A99',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    input: {
        height: 50,
        fontSize: 15,
        borderWidth: 1,
        borderRadius: 12,
        color: '#EAF0FF',
        paddingHorizontal: 16,
        borderColor: '#1E2D47',
        backgroundColor: '#0E141D',
    },
    errorBox: {
        padding: 12,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 12,
        borderColor: '#FF4D4D40',
        backgroundColor: '#2D1A1A',
    },
    errorText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF4D4D',
    },
    loginBtn: {
        height: 52,
        marginTop: 4,
        elevation: 6,
        shadowRadius: 12,
        borderRadius: 14,
        shadowOpacity: 0.4,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F8CFF',
        backgroundColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 4 },
    },
    loginBtnText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    configLink: {
        gap: 8,
        marginTop: 24,
        paddingVertical: 8,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    configLinkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F8CFF',
    },
});
