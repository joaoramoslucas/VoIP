import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Alert, Modal, Animated, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { multiAccountStorage, StoredAccount } from '../../services/storage/secureCredentialStorage';
import { useSipStore } from '../../state/sip/sipStore';
import { getIsRegistered } from '../../services/sip/sipSelectors';
import { RootStackParams } from '../RootStackParams';

type Nav = NativeStackNavigationProp<RootStackParams>;

const DRAWER_WIDTH = 300;
const { width: SCREEN_W } = Dimensions.get('window');

type Props = {
    visible: boolean;
    onClose: () => void;
};

export const DrawerPanel: React.FC<Props> = ({ visible, onClose }) => {
    const navigation = useNavigation<Nav>();
    const { registration, actions } = useSipStore();
    const isRegistered = getIsRegistered(registration);

    const [accounts, setAccounts] = useState<StoredAccount[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    const loadAccounts = useCallback(async () => {
        const all = await multiAccountStorage.loadAll();
        const id = await multiAccountStorage.getActiveId();
        setAccounts(all);
        setActiveId(id);
    }, []);

    useEffect(() => {
        if (visible) {
            loadAccounts();
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 70,
                    friction: 12,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleSwitchAccount = async (account: StoredAccount) => {
        if (account.id === activeId) { onClose(); return; }
        await multiAccountStorage.setActive(account.id);
        setActiveId(account.id);
        try { await actions.registerAccount(account); } catch { }
        onClose();
    };

    const handleRemoveAccount = (account: StoredAccount) => {
        Alert.alert(
            'Remover conta',
            `Remover ${account.displayName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Remover',
                    style: 'destructive',
                    onPress: async () => {
                        await multiAccountStorage.remove(account.id);
                        await loadAccounts();
                    },
                },
            ]
        );
    };

    const handleAddAccount = () => {
        onClose();
        setTimeout(() => navigation.navigate('Login'), 300);
    };

    const handleSettings = () => {
        onClose();
        setTimeout(() => navigation.navigate('SipConfig'), 300);
    };

    const handleLogout = async () => {
        await multiAccountStorage.clearAll();
        onClose();
        setTimeout(() => navigation.navigate('Login'), 300);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.container}>
                {/* Dark overlay */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.overlay, { opacity: overlayAnim }]} />
                </TouchableWithoutFeedback>

                {/* Sliding panel */}
                <Animated.View style={[styles.panel, { transform: [{ translateX: slideAnim }] }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLogo}>
                            <View style={styles.logoCircle}>
                                <Icon name="call" size={18} color="#EAF0FF" />
                            </View>
                            <Text style={styles.appName}>SipApp</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Icon name="close" size={20} color="#6B7A99" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                        <Text style={styles.sectionLabel}>Contas SIP</Text>

                        {accounts.length === 0 ? (
                            <Text style={styles.noAccountsText}>Nenhuma conta configurada</Text>
                        ) : (
                            accounts.map(acc => {
                                const isActive = acc.id === activeId;
                                const isConnected = isActive && isRegistered;
                                return (
                                    <TouchableOpacity
                                        key={acc.id}
                                        style={[styles.accountRow, isActive && styles.accountRowActive]}
                                        onPress={() => handleSwitchAccount(acc)}
                                        onLongPress={() => handleRemoveAccount(acc)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.accountAvatar, isActive && styles.accountAvatarActive]}>
                                            <Text style={styles.accountInitial}>
                                                {acc.username.slice(0, 1).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.accountInfo}>
                                            <Text style={styles.accountName}>{acc.username}</Text>
                                            <Text style={styles.accountDomain}>{acc.sipDomain}</Text>
                                        </View>
                                        <View style={styles.accountStatus}>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: isConnected ? '#20D17A' : isActive ? '#FFB020' : '#3A4A60' }
                                            ]} />
                                            <Text style={[
                                                styles.statusLabel,
                                                { color: isConnected ? '#20D17A' : isActive ? '#FFB020' : '#3A4A60' }
                                            ]}>
                                                {isConnected ? 'Conectado' : isActive ? 'Conectando' : 'Inativo'}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}

                        <TouchableOpacity style={styles.addAccountBtn} onPress={handleAddAccount} activeOpacity={0.8}>
                            <Icon name="add-circle-outline" size={24} color="#4F8CFF" />
                            <Text style={styles.addAccountText}>Adicionar conta</Text>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.menuItem} onPress={handleSettings} activeOpacity={0.8}>
                            <View style={styles.menuItemIconContainer}>
                                <Icon name="settings-outline" size={20} color="#6B7A99" />
                            </View>
                            <Text style={styles.menuItemText}>Configurações SIP</Text>
                            <Icon name="chevron-forward" size={18} color="#3A4A60" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutItem} onPress={handleLogout} activeOpacity={0.7}>
                            <View style={styles.logoutIconContainer}>
                                <Icon name="log-out-outline" size={20} color="#FF4757" />
                            </View>
                            <Text style={styles.logoutText}>Desconectar</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'row',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    panel: {
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: '#0D1117',
        borderRightWidth: 1,
        borderRightColor: '#1E2D47',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1E2D47',
    },
    headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    logoCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A2D4A',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4F8CFF50',
    },
    logoIcon: { fontSize: 18 },
    appName: { fontSize: 18, fontWeight: '800', color: '#EAF0FF' },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1A2536',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: { color: '#6B7A99', fontSize: 14 },
    scroll: { flex: 1 },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4A5878',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    noAccountsText: { color: '#4A5878', fontSize: 13, paddingHorizontal: 20, paddingBottom: 12 },
    accountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 10,
        marginBottom: 4,
        borderRadius: 14,
    },
    accountRowActive: {
        backgroundColor: '#121E30',
        borderWidth: 1,
        borderColor: '#1E3A5F',
    },
    accountAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A2536',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#2A3A54',
    },
    accountAvatarActive: { backgroundColor: '#1A2D4A', borderColor: '#4F8CFF60' },
    accountInitial: { fontSize: 16, fontWeight: '800', color: '#EAF0FF' },
    accountInfo: { flex: 1 },
    accountName: { fontSize: 15, fontWeight: '700', color: '#EAF0FF' },
    accountDomain: { fontSize: 12, color: '#6B7A99', marginTop: 2 },
    accountStatus: { alignItems: 'flex-end', gap: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: { fontSize: 10, fontWeight: '700' },
    addAccountBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    addAccountIcon: { fontSize: 22, color: '#4F8CFF' },
    addAccountText: { fontSize: 15, fontWeight: '700', color: '#4F8CFF' },
    divider: {
        height: 1,
        backgroundColor: '#1E2D47',
        marginHorizontal: 20,
        marginVertical: 4,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 10,
        marginBottom: 4,
        borderRadius: 12,
        gap: 12,
    },
    menuItemIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#1A2536',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#2A3A54',
    },
    menuItemIcon: { fontSize: 18, color: '#6B7A99' },
    menuItemText: { flex: 1, fontSize: 15, color: '#AAB6D3', fontWeight: '600' },
    menuItemChevron: { fontSize: 20, color: '#3A4A60' },
    logoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 10,
        marginTop: 8,
        marginBottom: 20,
        borderRadius: 12,
        backgroundColor: '#1A0F10',
        borderWidth: 1,
        borderColor: '#3A1F23',
        gap: 12,
    },
    logoutIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#2A1418',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FF475730',
    },
    logoutText: {
        flex: 1,
        fontSize: 15,
        color: '#FF4757',
        fontWeight: '700',
    },
});
