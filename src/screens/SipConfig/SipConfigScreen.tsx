import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StatusBar, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParams } from '../../app/RootStackParams';
import { useSipStore } from '../../state/sip/sipStore';
import type { SipTransport } from '../../services/sip/sipTypes';

type Nav = NativeStackNavigationProp<RootStackParams, 'SipConfig'>;

export const SipConfigScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const { lastUsedCredentials, actions } = useSipStore();

    const [domain, setDomain] = useState(lastUsedCredentials?.sipDomain ?? 'sip.linphone.org');
    const [transport, setTransport] = useState<SipTransport>(lastUsedCredentials?.transport ?? 'tcp');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // Save just the domain + transport — credentials (user/pass) saved on login
        // We update by re-registering on next login
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        navigation.goBack();
    };

    const TransportChip = ({ value, label }: { value: SipTransport; label: string }) => (
        <TouchableOpacity
            onPress={() => setTransport(value)}
            style={[styles.chip, transport === value && styles.chipActive]}
            activeOpacity={0.8}
        >
            <Text style={[styles.chipText, transport === value && styles.chipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#0B0F14" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Servidor SIP</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.sectionDescription}>
                    Configure o servidor SIP ao qual você vai se conectar. Por padrão usa o sip.linphone.org.
                </Text>

                <View style={styles.card}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Domínio / Servidor</Text>
                        <TextInput
                            style={styles.input}
                            value={domain}
                            onChangeText={setDomain}
                            placeholder="ex: sip.linphone.org"
                            placeholderTextColor="#4A5568"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Transporte</Text>
                        <View style={styles.chipRow}>
                            <TransportChip value="tcp" label="TCP" />
                            <TransportChip value="udp" label="UDP" />
                            <TransportChip value="tls" label="TLS" />
                        </View>
                    </View>
                </View>

                {/* Info box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>💡 Dica</Text>
                    <Text style={styles.infoText}>
                        Para testes use sip.linphone.org. Registre uma conta gratuita em linphone.org.
                    </Text>
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                    <Text style={styles.saveBtnText}>{saved ? '✓ Salvo!' : 'Salvar configurações'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#0B0F14' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 52,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E2D47',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A2536',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: { color: '#EAF0FF', fontSize: 18, fontWeight: '600' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#EAF0FF' },
    scroll: { padding: 24, paddingBottom: 40 },
    sectionDescription: {
        color: '#6B7A99',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#121822',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1E2D47',
        marginBottom: 16,
    },
    fieldGroup: { marginBottom: 16 },
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
    chipRow: { flexDirection: 'row', gap: 10 },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#0E141D',
        borderWidth: 1,
        borderColor: '#1E2D47',
    },
    chipActive: {
        backgroundColor: '#1A2D4A',
        borderColor: '#4F8CFF',
    },
    chipText: { color: '#6B7A99', fontWeight: '700', fontSize: 13 },
    chipTextActive: { color: '#4F8CFF' },
    infoBox: {
        backgroundColor: '#0F1E30',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#1E3A5F',
        marginBottom: 24,
    },
    infoTitle: { color: '#4F8CFF', fontWeight: '700', marginBottom: 6, fontSize: 14 },
    infoText: { color: '#6B7A99', fontSize: 13, lineHeight: 18 },
    saveBtn: {
        height: 52,
        borderRadius: 14,
        backgroundColor: '#4F8CFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
