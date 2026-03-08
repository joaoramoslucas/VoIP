import React, { useMemo, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { useSipStore } from '../../state/sip/sipStore';
import { DrawerPanel } from '../../app/navigation/DrawerPanel';
import { getIsRegistered } from '../../services/sip/sipSelectors';

export const DialerScreen: React.FC = () => {
    const { registration, actions } = useSipStore();
    const isRegistered = useMemo(() => getIsRegistered(registration), [registration]);

    const [dialInput, setDialInput] = useState('');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

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
                    activeOpacity={0.8}
                    style={styles.hamburgerBtn}
                    onPress={() => setDrawerOpen(true)}
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
                        value={dialInput}
                        autoCorrect={false}
                        style={styles.input}
                        returnKeyType="done"
                        autoCapitalize="none"
                        keyboardType="default"
                        onChangeText={setDialInput}
                        onSubmitEditing={handleCall}
                        placeholderTextColor="#3A4A60"
                        placeholder="ex: 1002 ou sip:joao@servidor.com"
                    />
                    {dialInput.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={() => setDialInput('')}
                        >
                            <Icon name="backspace-outline" size={18} color="#6B7A99" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    disabled={!canCall}
                    activeOpacity={0.8}
                    onPress={handleCall}
                    style={[styles.callBtn, { opacity: canCall ? 1 : 0.4 }]}
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
    screen: {
        flex: 1,
        backgroundColor: '#0B0F14',
    },
    header: {
        gap: 8,
        paddingTop: 52,
        flexWrap: 'wrap',
        paddingBottom: 16,
        flexDirection: 'row',
        borderBottomWidth: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        borderBottomColor: '#1E2D47',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#EAF0FF',
    },
    hamburgerBtn: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    headerCenter: {
        flex: 1,
        paddingHorizontal: 12,
    },
    statusBadge: {
        gap: 6,
        marginTop: 4,
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    headerButtons: {
        gap: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    reconnectBtn: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderColor: '#4F8CFF40',
        backgroundColor: '#1A2D4A',
    },
    reconnectText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4F8CFF',
    },
    logoutBtn: {
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderColor: '#FF4D4D40',
        backgroundColor: '#1A2536',
    },
    dialerArea: {
        flexGrow: 1,
        paddingTop: 80,
        paddingHorizontal: 24,
    },
    fieldLabel: {
        fontSize: 12,
        marginBottom: 10,
        fontWeight: '600',
        color: '#6B7A99',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputRow: {
        borderWidth: 1,
        paddingRight: 8,
        marginBottom: 20,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 18,
        fontWeight: '500',
        color: '#EAF0FF',
        paddingHorizontal: 18,
    },
    clearBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1E2D47',
    },
    clearIcon: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7A99',
    },
    callBtn: {
        gap: 10,
        height: 58,
        elevation: 8,
        shadowRadius: 14,
        borderRadius: 16,
        shadowOpacity: 0.35,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#20D17A',
        justifyContent: 'center',
        backgroundColor: '#20D17A',
        shadowOffset: { width: 0, height: 6 },
    },
    callBtnIcon: {
        fontSize: 22,
    },
    callBtnText: {
        fontSize: 17,
        color: '#fff',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    warningBox: {
        padding: 14,
        marginTop: 20,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: '#FF4D4D30',
        backgroundColor: '#2D1A1A',
    },
    warningText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF4D4D',
        textAlign: 'center',
    },
});