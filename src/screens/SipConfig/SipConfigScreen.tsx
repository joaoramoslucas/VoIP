import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StatusBar, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSipStore } from '../../state/sip/sipStore';
import { RootStackParams } from '../../app/RootStackParams';
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
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
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
                            value={domain}
                            autoCorrect={false}
                            style={styles.input}
                            autoCapitalize="none"
                            onChangeText={setDomain}
                            placeholderTextColor="#4A5568"
                            placeholder="ex: sip.linphone.org"
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
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#0B0F14' },
    header: {
        paddingTop: 52,
        paddingBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        borderBottomColor: '#1E2D47',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A2536',
    },
    backIcon: {
        fontSize: 18,
        fontWeight: '600',
        color: '#EAF0FF',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#EAF0FF',
    },
    scroll: {
        padding: 24,
        paddingBottom: 40,
    },
    sectionDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
        color: '#6B7A99',
    },
    card: {
        padding: 20,
        borderWidth: 1,
        borderRadius: 20,
        marginBottom: 16,
        borderColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    fieldGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
        letterSpacing: 0.5,
        color: '#6B7A99',
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
    chipRow: {
        gap: 10,
        flexDirection: 'row',
    },
    chip: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderColor: '#1E2D47',
        backgroundColor: '#0E141D',
    },
    chipActive: {
        borderColor: '#4F8CFF',
        backgroundColor: '#1A2D4A',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#6B7A99',
    },
    chipTextActive: {
        color: '#4F8CFF',
    },
    infoBox: {
        padding: 16,
        borderWidth: 1,
        borderRadius: 14,
        marginBottom: 24,
        borderColor: '#1E3A5F',
        backgroundColor: '#0F1E30',
    },
    infoTitle: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '700',
        color: '#4F8CFF',
    },
    infoText: {
        fontSize: 13,
        lineHeight: 18,
        color: '#6B7A99',
    },
    saveBtn: {
        height: 52,
        elevation: 6,
        borderRadius: 14,
        shadowRadius: 12,
        shadowOpacity: 0.4,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F8CFF',
        backgroundColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 4 },
    },
    saveBtnText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
    },
});
