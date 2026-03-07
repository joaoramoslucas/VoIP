import React, { useCallback, useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Alert,
} from 'react-native';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { multiAccountStorage, StoredAccount } from '../../services/storage/credentialStorage';
import { useSipStore } from '../../state/sip/sipStore';
import { getIsRegistered } from '../../services/sip/sipSelectors';
import { RootStackParams } from '../RootStackParams';

type Nav = NativeStackNavigationProp<RootStackParams>;

export const DrawerContent: React.FC<DrawerContentComponentProps> = ({ navigation: drawerNav }) => {
    const navigation = useNavigation<Nav>();
    const { registration, actions, lastUsedCredentials } = useSipStore();
    const isRegistered = getIsRegistered(registration);

    const [accounts, setAccounts] = useState<StoredAccount[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);

    const loadAccounts = useCallback(async () => {
        const all = await multiAccountStorage.loadAll();
        const id = await multiAccountStorage.getActiveId();
        setAccounts(all);
        setActiveId(id);
    }, []);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    const handleSwitchAccount = async (account: StoredAccount) => {
        if (account.id === activeId) return;
        await multiAccountStorage.setActive(account.id);
        setActiveId(account.id);
        try {
            await actions.registerAccount(account);
        } catch { }
        drawerNav.closeDrawer();
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
        drawerNav.closeDrawer();
        navigation.navigate('Login');
    };

    const handleSettings = () => {
        drawerNav.closeDrawer();
        navigation.navigate('SipConfig');
    };

    return (
        <View style={styles.drawer}>
            {/* Header */}
            <View style={styles.drawerHeader}>
                <View style={styles.appLogoRow}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoIcon}>📞</Text>
                    </View>
                    <Text style={styles.appName}>SipApp</Text>
                </View>
                <TouchableOpacity onPress={() => drawerNav.closeDrawer()} style={styles.closeBtn}>
                    <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Accounts */}
                <Text style={styles.sectionLabel}>Contas SIP</Text>

                {accounts.length === 0 ? (
                    <View style={styles.noAccounts}>
                        <Text style={styles.noAccountsText}>Nenhuma conta configurada</Text>
                    </View>
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

                {/* Add account */}
                <TouchableOpacity style={styles.addAccountBtn} onPress={handleAddAccount} activeOpacity={0.8}>
                    <Text style={styles.addAccountIcon}>⊕</Text>
                    <Text style={styles.addAccountText}>Adicionar conta</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                {/* Menu items */}
                <TouchableOpacity style={styles.menuItem} onPress={handleSettings} activeOpacity={0.8}>
                    <Text style={styles.menuItemIcon}>⚙</Text>
                    <Text style={styles.menuItemText}>Configurações SIP</Text>
                    <Text style={styles.menuItemChevron}>›</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    drawer: {
        flex: 1,
        backgroundColor: '#0D1117',
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 52,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1E2D47',
    },
    appLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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

    noAccounts: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    noAccountsText: { color: '#4A5878', fontSize: 13 },

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
    accountAvatarActive: {
        backgroundColor: '#1A2D4A',
        borderColor: '#4F8CFF60',
    },
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 14,
    },
    menuItemIcon: { fontSize: 18, color: '#6B7A99' },
    menuItemText: { flex: 1, fontSize: 15, color: '#AAB6D3', fontWeight: '600' },
    menuItemChevron: { fontSize: 20, color: '#3A4A60' },
});
