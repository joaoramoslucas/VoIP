import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { s as s } from './s';
import { useSipStore } from '../../state/sip/sipStore';
import { getIsIncomingCall, getIsInCall } from '../../services/sip/sipSelectors';

export const CallScreen: React.FC = () => {
    const navigation = useNavigation();
    const { call, actions } = useSipStore();

    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(false);

    const isIncomingCall = useMemo(() => getIsIncomingCall(call), [call]);
    const isInCall = useMemo(() => getIsInCall(call), [call]);

    const handleToggleMute = async () => {
        const nextMutedValue = !isMuted;
        setIsMuted(nextMutedValue);
        await actions.setMuted(nextMutedValue);
    };

    const handleToggleSpeaker = async () => {
        const nextSpeakerValue = !isSpeakerEnabled;
        setIsSpeakerEnabled(nextSpeakerValue);
        await actions.setSpeakerEnabled(nextSpeakerValue);
    };

    const handleHangUp = async () => {
        await actions.hangUp();
        navigation.goBack();
    };

    const handleAccept = async () => {
        await actions.acceptCall();
    };

    const handleDecline = async () => {
        await actions.declineCall();
        navigation.goBack();
    };

    return (
        <View style={s.screen}>
            <View style={s.header}>
                <Text style={s.title}>Chamada</Text>
                <Text style={s.subtitle}>Controle de áudio e estado.</Text>
            </View>

            <View style={s.centerCard}>
                <Text style={s.remoteText}>{call.remoteUri ?? 'Desconhecido'}</Text>
                <Text style={s.stateText}>
                    Estado: {call.state} — {call.message}
                </Text>

                {isIncomingCall ? (
                    <View style={s.incomingRow}>
                        <TouchableOpacity onPress={handleAccept} style={s.acceptButton} activeOpacity={0.85}>
                            <Text style={s.controlText}>Atender</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleDecline} style={s.declineButton} activeOpacity={0.85}>
                            <Text style={s.controlText}>Recusar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <View style={s.controlsRow}>
                            <TouchableOpacity onPress={handleToggleMute} style={s.controlButton} activeOpacity={0.85}>
                                <Text style={s.controlText}>{isMuted ? 'Mute: ON' : 'Mute: OFF'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={handleToggleSpeaker} style={s.controlButton} activeOpacity={0.85}>
                                <Text style={s.controlText}>{isSpeakerEnabled ? 'Speaker: ON' : 'Speaker: OFF'}</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleHangUp}
                            style={[s.endButton, { opacity: isInCall ? 1 : 0.6 }]}
                            activeOpacity={0.85}
                            disabled={!isInCall}
                        >
                            <Text style={s.controlText}>Desligar</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
};