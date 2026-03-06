import { s } from './s';

import { sipClient } from '../voip/SipClient';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { PermissionsAndroid, Platform } from 'react-native';

export function SipDebugScreen() {
    const [sipDomain, setSipDomain] = useState('sip.seudominio.com');
    const [username, setUsername] = useState('1001');
    const [password, setPassword] = useState('senha');
    const [callTo, setCallTo] = useState('1002');
    const [transport, setTransport] = useState<'udp' | 'tcp' | 'tls'>('udp');

    const [logs, setLogs] = useState<string[]>([]);
    const pushLog = (line: string) => setLogs(prev => [`${new Date().toLocaleTimeString()} - ${line}`, ...prev]);

    const ensureMicPermission = async (): Promise<boolean> => {
        if (Platform.OS !== 'android') return true;

        const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Permissão de microfone',
                message: 'Precisamos do microfone para realizar chamadas SIP.',
                buttonPositive: 'OK',
                buttonNegative: 'Cancelar',
            },
        );

        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        if (!granted) pushLog('MIC: permissão negada');
        return granted;
    };

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                await sipClient.initialize();
                if (mounted) pushLog('initialize() OK');
            } catch (e: any) {
                if (mounted) pushLog(`initialize() ERROR: ${e?.message ?? String(e)}`);
            }
        })();

        const subReg = sipClient.on('onRegistrationState', p => pushLog(`REG: ${p.state} ${p.message ?? ''}`));
        const subCall = sipClient.on('onCallState', p => pushLog(`CALL: ${p.state} ${p.message ?? ''}`));
        const subIncoming = sipClient.on('onIncomingCall', p => pushLog(`INCOMING FROM: ${p.from}`));

        return () => {
            mounted = false;
            subReg.remove();
            subCall.remove();
            subIncoming.remove();
        };
    }, []);

    return (
        <View style={s.container}>
            <Text style={s.title}>SIP Debug</Text>
            <Text style={s.label}>Transport</Text>

            <View style={s.row}>
                <TouchableOpacity
                    style={[s.button, transport === 'udp' ? null : s.secondary]}
                    onPress={() => setTransport('udp')}
                >
                    <Text style={s.buttonText}>UDP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.button, transport === 'tcp' ? null : s.secondary]}
                    onPress={() => setTransport('tcp')}
                >
                    <Text style={s.buttonText}>TCP</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.button, transport === 'tls' ? null : s.secondary]}
                    onPress={() => setTransport('tls')}
                >
                    <Text style={s.buttonText}>TLS</Text>
                </TouchableOpacity>
            </View>

            <View style={s.card}>
                <Text style={s.label}>Domain</Text>
                <TextInput style={s.input} value={sipDomain} onChangeText={setSipDomain} autoCapitalize="none" />

                <Text style={s.label}>Username/Ramal</Text>
                <TextInput style={s.input} value={username} onChangeText={setUsername} autoCapitalize="none" />

                <Text style={s.label}>Password</Text>
                <TextInput style={s.input} value={password} onChangeText={setPassword} autoCapitalize="none" secureTextEntry />

                <View style={s.row}>
                    <TouchableOpacity
                        style={s.button}
                        onPress={async () => {
                            const hasMicPermission = await ensureMicPermission();
                            if (!hasMicPermission) return;

                            pushLog(`register()... transport=${transport}`);
                            await sipClient.register({ sipDomain, username, password, transport });
                        }}
                    >
                        <Text style={s.buttonText}>Registrar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[s.button, s.secondary]}
                        onPress={async () => {
                            pushLog('unregister()...');
                            await sipClient.unregister();
                        }}
                    >
                        <Text style={s.buttonText}>Desregistrar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={s.card}>
                <Text style={s.label}>Ligar para</Text>
                <TextInput style={s.input} value={callTo} onChangeText={setCallTo} autoCapitalize="none" />

                <View style={s.row}>
                    <TouchableOpacity
                        style={s.button}
                        onPress={async () => {
                            const hasMicPermission = await ensureMicPermission();
                            if (!hasMicPermission) return;

                            pushLog(`startCall(${callTo})...`);
                            await sipClient.startCall({ to: callTo });
                        }}
                    >
                        <Text style={s.buttonText}>Ligar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[s.button, s.danger]}
                        onPress={async () => {
                            pushLog('hangup()...');
                            await sipClient.hangup();
                        }}
                    >
                        <Text style={s.buttonText}>Desligar</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[s.card, { flex: 1 }]}>
                <Text style={s.label}>Logs</Text>
                <ScrollView>
                    {logs.map((l, i) => (
                        <Text key={String(i)} style={s.logLine}>{l}</Text>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}
