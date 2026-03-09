import { s } from './s';
import Icon from 'react-native-vector-icons/Ionicons';

import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';

import { useSipStore } from '../../state/sip/sipStore';
import { getIsIncomingCall, getIsInCall } from '../../services/sip/sipSelectors';

/** Extrai iniciais de um SIP URI ou nome */
const getInitials = (uri: string | null): string => {
    if (!uri) return '?';
    // Remove sip: prefix e @domain
    const cleaned = uri.replace(/^sip:/i, '').split('@')[0];
    if (!cleaned) return '?';
    // Se for número, pega últimos 2 dígitos
    if (/^\d+$/.test(cleaned)) return cleaned.slice(-2);
    // Se for nome, pega iniciais
    return cleaned.slice(0, 2).toUpperCase();
};

/** Formata nome de exibição do SIP URI */
const getDisplayName = (uri: string | null): string => {
    if (!uri) return 'Desconhecido';
    return uri.replace(/^sip:/i, '');
};

/** Formata segundos em mm:ss */
const formatTimer = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

/** Traduz estado da chamada */
const getStatusText = (state: string): string => {
    switch (state) {
        case 'incoming': return 'Chamada recebida...';
        case 'outgoing': return 'Chamando...';
        case 'connected': return 'Em chamada';
        case 'ended': return 'Chamada encerrada';
        case 'error': return 'Erro na chamada';
        case 'ringing': return 'Tocando...';
        default: return state;
    }
};

export const CallScreen: React.FC = () => {
    const navigation = useNavigation();
    const { call, actions } = useSipStore();

    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [showKeypad, setShowKeypad] = useState(false);
    const callStartTimeRef = useRef<number | null>(null);

    const isIncomingCall = useMemo(() => getIsIncomingCall(call), [call]);
    const isInCall = useMemo(() => getIsInCall(call), [call]);

    // Timer de chamada
    useEffect(() => {
        if (call.state === 'connected') {
            if (!callStartTimeRef.current) {
                callStartTimeRef.current = Date.now();
            }
            const interval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - (callStartTimeRef.current ?? Date.now())) / 1000);
                setCallDuration(elapsed);
            }, 1000);
            return () => clearInterval(interval);
        } else if (call.state === 'ended' || call.state === 'error' || call.state === 'idle') {
            callStartTimeRef.current = null;
        }
    }, [call.state]);

    // Auto-voltar quando chamada termina
    useEffect(() => {
        if (call.state === 'ended' || call.state === 'error') {
            const timer = setTimeout(() => {
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    (navigation as any).navigate('DrawerHome');
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [call.state, navigation]);

    const handleToggleMute = async () => {
        const next = !isMuted;
        setIsMuted(next);
        await actions.setMuted(next);
    };

    const handleToggleSpeaker = async () => {
        const next = !isSpeakerEnabled;
        setIsSpeakerEnabled(next);
        await actions.setSpeakerEnabled(next);
    };

    const handleHangUp = async () => {
        await actions.hangUp();
    };

    const handleAccept = async () => {
        await actions.acceptCall();
    };

    const handleDecline = async () => {
        await actions.declineCall();
    };

    const handleDtmf = async (digit: string) => {
        await actions.sendDtmf(digit);
    };

    const initials = getInitials(call.remoteUri);
    const displayName = getDisplayName(call.remoteUri);
    const statusText = getStatusText(call.state);
    const isConnected = call.state === 'connected';
    const isEnded = call.state === 'ended' || call.state === 'error';

    return (
        <View style={s.screen}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Avatar + Info */}
            <View style={s.callerSection}>
                <View style={[
                    s.avatar,
                    isIncomingCall && s.avatarIncoming,
                    isConnected && s.avatarConnected,
                    isEnded && s.avatarEnded,
                ]}>
                    <Text style={s.avatarText}>{initials}</Text>
                </View>

                <Text style={s.callerName}>{displayName}</Text>

                <Text style={[
                    s.callStatus,
                    isConnected && s.callStatusConnected,
                    isEnded && s.callStatusEnded,
                ]}>
                    {statusText}
                </Text>

                {isConnected && (
                    <Text style={s.timerText}>{formatTimer(callDuration)}</Text>
                )}
            </View>

            {/* Botões */}
            <View style={s.bottomSection}>
                {isIncomingCall ? (
                    /* Chamada recebida: Atender / Recusar */
                    <View style={s.incomingActions}>
                        <View style={s.incomingActionItem}>
                            <TouchableOpacity
                                onPress={handleDecline}
                                style={s.declineCircle}
                                activeOpacity={0.8}
                            >
                                <Icon name="close" size={32} color="#FF4D4D" />
                            </TouchableOpacity>
                            <Text style={s.actionLabel}>Recusar</Text>
                        </View>

                        <View style={s.incomingActionItem}>
                            <TouchableOpacity
                                onPress={handleAccept}
                                style={s.acceptCircle}
                                activeOpacity={0.8}
                            >
                                <Icon name="call" size={30} color="#fff" />
                            </TouchableOpacity>
                            <Text style={s.actionLabel}>Atender</Text>
                        </View>
                    </View>
                ) : (
                    /* Em chamada: controles + desligar */
                    <>
                        <View style={s.controlGrid}>
                            <View style={s.controlItem}>
                                <TouchableOpacity
                                    onPress={handleToggleMute}
                                    style={[s.controlCircle, isMuted && s.controlCircleActive]}
                                    activeOpacity={0.8}
                                >
                                    <Icon name={isMuted ? "mic-off" : "mic"} size={26} color={isMuted ? "#fff" : "#AAB6D3"} />
                                </TouchableOpacity>
                                <Text style={s.controlLabel}>{isMuted ? 'Mudo' : 'Mute'}</Text>
                            </View>

                            <View style={s.controlItem}>
                                <TouchableOpacity
                                    onPress={handleToggleSpeaker}
                                    style={[s.controlCircle, isSpeakerEnabled && s.controlCircleActive]}
                                    activeOpacity={0.8}
                                >
                                    <Icon name={isSpeakerEnabled ? "volume-high" : "volume-medium"} size={26} color={isSpeakerEnabled ? "#fff" : "#AAB6D3"} />
                                </TouchableOpacity>
                                <Text style={s.controlLabel}>{isSpeakerEnabled ? 'Alto' : 'Speaker'}</Text>
                            </View>

                            <View style={s.controlItem}>
                                <TouchableOpacity
                                    onPress={() => setShowKeypad(!showKeypad)}
                                    style={[s.controlCircle, showKeypad && s.controlCircleActive]}
                                    activeOpacity={0.8}
                                >
                                    <Icon name="keypad" size={26} color={showKeypad ? "#fff" : "#AAB6D3"} />
                                </TouchableOpacity>
                                <Text style={s.controlLabel}>Teclado</Text>
                            </View>
                        </View>

                        {showKeypad && (
                            <View style={s.keypad}>
                                {[['1','2','3'],['4','5','6'],['7','8','9'],['*','0','#']].map((row, i) => (
                                    <View key={i} style={s.keypadRow}>
                                        {row.map(digit => (
                                            <TouchableOpacity
                                                key={digit}
                                                onPress={() => handleDtmf(digit)}
                                                style={s.keypadBtn}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={s.keypadText}>{digit}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={handleHangUp}
                            style={[s.hangupCircle, { opacity: isInCall || call.state === 'outgoing' ? 1 : 0.5 }]}
                            activeOpacity={0.8}
                            disabled={!isInCall && call.state !== 'outgoing'}
                        >
                            <Icon name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
                        </TouchableOpacity>
                        <Text style={s.hangupLabel}>Desligar</Text>
                    </>
                )}
            </View>
        </View>
    );
};