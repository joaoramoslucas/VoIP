import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, Animated, StatusBar,
    PermissionsAndroid, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParams } from '../../app/RootStackParams';
import { multiAccountStorage } from '../../services/storage/credentialStorage';
import { useSipStore } from '../../state/sip/sipStore';
import { navigateToCall } from '../../app/navigationRef';

type Nav = NativeStackNavigationProp<RootStackParams, 'Splash'>;

const PERMISSIONS_STEPS = [
    '🎤  Acesso ao microfone',
    '🔔  Notificações de chamadas',
    '👥  Acesso aos contatos',
];

export const SplashScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { actions, call } = useSipStore();

    // Use a ref so async callbacks always read the LATEST call.state
    // (avoids stale closure bug in setTimeout)
    const callStateRef = useRef(call.state);
    useEffect(() => { callStateRef.current = call.state; }, [call.state]);

    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.7)).current;
    const barWidth = useRef(new Animated.Value(0)).current;

    const [step, setStep] = useState(0);
    const [statusMsg, setStatusMsg] = useState('Iniciando...');

    useEffect(() => {
        // If there's already an active call (rare: app barely woke with state set),
        // skip animation and go straight to DrawerHome.
        // Note: IncomingCallNavigator will handle navigating to CallScreen.
        if (call.state === 'incoming' || call.state === 'connected') {
            proceedToApp(true);
            return;
        }

        // Normal startup: logo animation first, then permissions
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start(() => {
            requestPermissionsAndProceed();
        });
    }, []);

    const animateProgress = (to: number) => {
        Animated.timing(barWidth, {
            toValue: to,
            duration: 400,
            useNativeDriver: false,
        }).start();
    };

    const requestPermissionsAndProceed = async () => {
        if (Platform.OS !== 'android') {
            await proceed();
            return;
        }

        // Step 1: Microphone
        setStep(1);
        setStatusMsg(PERMISSIONS_STEPS[0]);
        animateProgress(0.33);
        await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Permissão de Microfone',
                message: 'O SipApp precisa do microfone para fazer e receber chamadas de voz.',
                buttonPositive: 'Permitir',
                buttonNegative: 'Agora não',
            }
        );

        // Step 2: Notifications
        setStep(2);
        setStatusMsg(PERMISSIONS_STEPS[1]);
        animateProgress(0.66);
        if (Number(Platform.Version) >= 33) {
            try {
                await PermissionsAndroid.request(
                    'android.permission.POST_NOTIFICATIONS' as any,
                    {
                        title: 'Notificações de Chamadas',
                        message: 'Para alertar sobre chamadas recebidas mesmo com o app fechado.',
                        buttonPositive: 'Permitir',
                        buttonNegative: 'Agora não',
                    }
                );
            } catch (_) { }
        }

        // Step 3: Contacts
        setStep(3);
        setStatusMsg(PERMISSIONS_STEPS[2]);
        animateProgress(1);
        await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
            {
                title: 'Acesso aos Contatos',
                message: 'Para exibir seus contatos do telefone na aba de contatos.',
                buttonPositive: 'Permitir',
                buttonNegative: 'Agora não',
            }
        );

        await proceed();
    };

    const proceed = async () => {
        setStatusMsg('Verificando conta...');
        const active = await multiAccountStorage.getActive();
        if (active) {
            const ok = await actions.autoLogin();
            if (ok) {
                // Give SIP stack 1.2s to emit any pending call state (from postDelayed in SipNativeModule).
                // IncomingCallNavigator will navigate to Call once it sees the connected state.
                setTimeout(() => proceedToApp(false), 1200);
                return;
            }
        }
        navigation.replace('Login');
    };

    // Navigate to DrawerHome. IncomingCallNavigator handles navigating to Call.
    const proceedToApp = async (fast: boolean) => {
        if (!fast) {
            const active = await multiAccountStorage.getActive();
            if (!active) {
                navigation.replace('Login');
                return;
            }
        }
        navigation.replace('DrawerHome');
        // After DrawerHome mounts, check (via ref, not stale closure) if call is active
        // and trigger navigateToCall as a backup in case IncomingCallNavigator missed it
        setTimeout(() => {
            const state = callStateRef.current;
            if (state === 'incoming' || state === 'connected') {
                navigateToCall();
            }
        }, 500);
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#090E14" />

            {/* Logo */}
            <Animated.View
                style={[
                    styles.logoWrap,
                    { opacity: logoOpacity, transform: [{ scale: logoScale }] },
                ]}
            >
                <View style={styles.logoCircle}>
                    <Text style={styles.logoIcon}>📞</Text>
                </View>
                <Text style={styles.appName}>SipApp</Text>
                <Text style={styles.tagline}>Comunicação VoIP profissional</Text>
            </Animated.View>

            {/* Progress */}
            <View style={styles.progressSection}>
                {step > 0 && (
                    <>
                        <Text style={styles.statusMsg}>{statusMsg}</Text>
                        <View style={styles.progressTrack}>
                            <Animated.View
                                style={[
                                    styles.progressBar,
                                    {
                                        width: barWidth.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: ['0%', '100%'],
                                        }),
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.stepText}>{step} / 3</Text>
                    </>
                )}
            </View>

            {/* Version */}
            <Text style={styles.version}>v1.0.0</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#090E14',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoWrap: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1A2D4A',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#4F8CFF',
        shadowColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 12,
    },
    logoIcon: { fontSize: 44 },
    appName: {
        fontSize: 34,
        fontWeight: '800',
        color: '#EAF0FF',
        letterSpacing: 2,
    },
    tagline: {
        fontSize: 14,
        color: '#4A5878',
        marginTop: 8,
        letterSpacing: 0.5,
    },
    progressSection: {
        width: '80%',
        alignItems: 'center',
        paddingBottom: 60,
        minHeight: 80,
    },
    statusMsg: {
        color: '#6B7A99',
        fontSize: 14,
        marginBottom: 14,
    },
    progressTrack: {
        width: '100%',
        height: 4,
        backgroundColor: '#1A2536',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4F8CFF',
        borderRadius: 2,
    },
    stepText: {
        color: '#4A5878',
        fontSize: 12,
        marginTop: 8,
    },
    version: {
        position: 'absolute',
        bottom: 24,
        color: '#2A3548',
        fontSize: 12,
    },
});
