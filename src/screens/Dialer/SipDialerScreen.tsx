import React, { useMemo, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { DrawerPanel } from '../../app/navigation/DrawerPanel';
import { useSipStore } from '../../state/sip/sipStore';
import { getIsRegistered } from '../../services/sip/sipSelectors';

export const DialerScreen: React.FC = () => {
    const { registration, actions } = useSipStore();
    const isRegistered = useMemo(() => getIsRegistered(registration), [registration]);

    const [dialInput, setDialInput] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleCall = async () => {
        if (!dialInput.trim() || !isRegistered) return;
        await actions.startCall(dialInput.trim());
    };

    const handleReconnect = async () => {
        setIsConnecting(true);
        try {
            await actions.autoLogin();
        } finally {
            setIsConnecting(false);
        }
    };

    const statusColor = isRegistered
        ? '#20D17A'
        : registration.state === 'progress'
        ? '#FFB020'
        : '#FF4D4D';
    const statusText = isRegistered
        ? 'Conectado'
        : registration.state === 'progress'
        ? 'Conectando...'
        : 'Desconectado';

    const canCall = dialInput.trim().length > 0 && isRegistered;

    return (
        <KeyboardAvoidingView 
            style={styles.screen} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0B0F14" />

            <DrawerPanel visible={drawerOpen} onClose={() => setDrawerOpen(false)} />

            {/* Header stays fixed */}
            <View style={styles.header}>
                {/* Left: hamburger */}
                <TouchableOpacity
                    onPress={() => setDrawerOpen(true)}
                    style={styles.hamburgerBtn}
                    activeOpacity={0.8}
                >
                    <Icon name="menu-outline" size={28} color="#AAB6D3" />
                </TouchableOpacity>

                {/* Center: title + status */}
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Discador</Text>
                    <View style={styles.statusBadge}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                    </View>
                </View>

                <View style={styles.headerButtons}>
                    {!isRegistered && (
                        <TouchableOpacity
                            onPress={handleReconnect}
                            style={styles.reconnectBtn}
                            disabled={isConnecting || registration.state === 'progress'}
                            activeOpacity={0.8}
                        >
                            <Icon name="refresh-outline" size={16} color="#4F8CFF" style={{ marginRight: 6 }} />
                            <Text style={styles.reconnectText}>
                                {isConnecting ? '...' : 'Reconectar'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={() => actions.unregisterAccount()}
                        style={styles.logoutBtn}
                        activeOpacity={0.8}
                    >
                        <Icon name="power-outline" size={18} color="#FF4D4D" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main dialer area becomes scrollable so it shrinks properly */}
            <ScrollView 
                contentContainerStyle={styles.dialerArea}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.fieldLabel}>Ramal ou SIP URI</Text>

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        value={dialInput}
                        onChangeText={setDialInput}
                        placeholder="ex: 1002 ou sip:joao@servidor.com"
                        placeholderTextColor="#3A4A60"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="default"
                        returnKeyType="done"
                        onSubmitEditing={handleCall}
                    />
                    {dialInput.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setDialInput('')}
                            style={styles.clearBtn}
                        >
                            <Icon name="backspace-outline" size={18} color="#6B7A99" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.callBtn, { opacity: canCall ? 1 : 0.4 }]}
                    onPress={handleCall}
                    disabled={!canCall}
                    activeOpacity={0.8}
                >
                    <Icon name="call" size={22} color="#fff" />
                    <Text style={styles.callBtnText}>Ligar</Text>
                </TouchableOpacity>

                {!isRegistered && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            Você está desconectado. Reconecte para fazer chamadas.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#0B0F14' },
    header: {
        paddingTop: 52,
        paddingBottom: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1E2D47',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
    },
    title: { fontSize: 22, fontWeight: '800', color: '#EAF0FF' },
    hamburgerBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#121822',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#1E2D47',
    },
    headerCenter: {
        flex: 1,
        paddingHorizontal: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: '700' },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    reconnectBtn: {
        flexDirection: 'row',
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#1A2D4A',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#4F8CFF40',
        alignItems: 'center',
    },
    reconnectText: { color: '#4F8CFF', fontWeight: '700', fontSize: 13 },
    logoutBtn: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        backgroundColor: '#1A2536',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FF4D4D40',
        alignItems: 'center',
        justifyContent: 'center',
    },

    dialerArea: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    fieldLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7A99',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121822',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#1E2D47',
        marginBottom: 20,
        paddingRight: 8,
    },
    input: {
        flex: 1,
        height: 56,
        paddingHorizontal: 18,
        color: '#EAF0FF',
        fontSize: 18,
        fontWeight: '500',
    },
    clearBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1E2D47',
        alignItems: 'center',
        justifyContent: 'center',
    },
    clearIcon: { color: '#6B7A99', fontSize: 12, fontWeight: '700' },
    callBtn: {
        flexDirection: 'row',
        height: 58,
        borderRadius: 16,
        backgroundColor: '#20D17A',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#20D17A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
    callBtnIcon: { fontSize: 22 },
    callBtnText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.5,
    },
    warningBox: {
        marginTop: 20,
        backgroundColor: '#2D1A1A',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#FF4D4D30',
    },
    warningText: {
        color: '#FF4D4D',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
});