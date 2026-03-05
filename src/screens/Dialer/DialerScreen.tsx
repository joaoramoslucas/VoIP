import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParams } from '../../app/RootStackParams';
import { s as s } from './s';
import { useSipStore } from '../../state/sip/sipStore';
import { getIsRegistered } from '../../services/sip/sipSelectors';

type Navigation = NativeStackNavigationProp<RootStackParams, 'Dialer'>;

export const DialerScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const { registration, call, actions } = useSipStore();

    const [destinationInput, setDestinationInput] = useState('');

    const isRegistered = useMemo(() => getIsRegistered(registration), [registration]);
    const canCall = useMemo(() => isRegistered && destinationInput.trim().length > 0, [isRegistered, destinationInput]);

    const handleCallPress = async () => {
        if (!canCall) return;
        await actions.startCall(destinationInput.trim());
        navigation.navigate('Call');
    };

    const handleUnregisterPress = async () => {
        await actions.unregisterAccount();
    };

    return (
        <View style={s.screen}>
            <Text style={s.title}>Discador</Text>
            <Text style={s.subtitle}>Digite ramal/usuário SIP ou URI.</Text>

            <View style={s.card}>
                <TextInput
                    value={destinationInput}
                    onChangeText={setDestinationInput}
                    placeholder="ex: 1002 ou sip:1002@dominio.com"
                    placeholderTextColor="#66739A"
                    autoCapitalize="none"
                    style={s.input}
                />

                <View style={s.row}>
                    <TouchableOpacity
                        onPress={handleCallPress}
                        style={[s.buttonPrimary, { opacity: canCall ? 1 : 0.5 }]}
                        activeOpacity={0.85}
                        disabled={!canCall}
                    >
                        <Text style={s.buttonText}>Ligar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleUnregisterPress} style={s.buttonSecondary} activeOpacity={0.85}>
                        <Text style={s.buttonTextSecondary}>Sair</Text>
                    </TouchableOpacity>
                </View>

                <Text style={s.smallStatus}>
                    Registro: {registration.state} — {registration.message}
                </Text>
                <Text style={s.smallStatus}>
                    Call: {call.state} — {call.message}
                </Text>
            </View>
        </View>
    );
};