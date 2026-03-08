import Icon from 'react-native-vector-icons/Ionicons';

import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet,
    StatusBar, ActivityIndicator, TextInput, PermissionsAndroid, Platform,
} from 'react-native';
import Contacts from 'react-native-contacts';

import { useSipStore } from '../../state/sip/sipStore';

type PhoneContact = {
    id: string;
    name: string;
    phone: string;
    color: string;
    initials: string;
};

const COLORS = [
    '#4F8CFF',
    '#20D17A',
    '#FFB020',
    '#FF4D4D',
    '#A78BFA',
    '#34D399',
    '#FB923C',
];
const getColor = (s: string) => COLORS[s.length % COLORS.length];

const getInitials = (name: string) => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, KeyboardAvoidingView } from 'react-native';

const MANUAL_CONTACTS_KEY = '@sipapp_manual_contacts';

type ManualContact = { id: string; name: string; phone: string };

const loadManualContacts = async (): Promise<ManualContact[]> => {
    const json = await AsyncStorage.getItem(MANUAL_CONTACTS_KEY);
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
};

const saveManualContacts = async (list: ManualContact[]) => {
    await AsyncStorage.setItem(MANUAL_CONTACTS_KEY, JSON.stringify(list));
};

export const ContactsScreen: React.FC = () => {
    const { actions } = useSipStore();
    const [contacts, setContacts] = useState<PhoneContact[]>([]);
    const [filtered, setFiltered] = useState<PhoneContact[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Add contact modal
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const buildList = async (manuals: ManualContact[], phone: PhoneContact[]) => {
        const manualMapped: PhoneContact[] = manuals.map(m => ({
            id: `manual_${m.id}`,
            name: m.name,
            phone: m.phone,
            initials: getInitials(m.name),
            color: getColor(m.name),
        }));
        const merged = [...manualMapped, ...phone].sort((a, b) => a.name.localeCompare(b.name));
        setContacts(merged);
        setFiltered(merged);
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const manuals = await loadManualContacts();
            try {
                if (Platform.OS === 'android') {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
                        {
                            title: 'Acesso aos Contatos',
                            message: 'O app precisa de acesso para mostrar seus contatos.',
                            buttonPositive: 'Permitir',
                            buttonNegative: 'Negar',
                        }
                    );
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        setPermissionDenied(true);
                        await buildList(manuals, []);
                        setLoading(false);
                        return;
                    }
                }

                const raw = await Contacts.getAll();
                const mapped: PhoneContact[] = raw
                    .filter(c => c.phoneNumbers.length > 0)
                    .map(c => {
                        const fullName = [c.givenName, c.familyName].filter(Boolean).join(' ') || 'Sem nome';
                        const phone = c.phoneNumbers[0]?.number ?? '';
                        return {
                            id: c.recordID,
                            name: fullName,
                            phone,
                            initials: getInitials(fullName),
                            color: getColor(fullName),
                        };
                    });
                await buildList(manuals, mapped);
            } catch (err) {
                console.warn('Contacts load error:', err);
                await buildList(manuals, []);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const q = search.toLowerCase();
        setFiltered(
            q
                ? contacts.filter(c =>
                    c.name.toLowerCase().includes(q) ||
                    c.phone.includes(q)
                )
                : contacts
        );
    }, [search, contacts]);

    const handleCall = async (phone: string) => {
        await actions.startCall(phone);
    };

    const handleAddContact = async () => {
        if (!newPhone.trim()) return;
        const manuals = await loadManualContacts();
        const newEntry: ManualContact = {
            id: Date.now().toString(),
            name: newName.trim() || newPhone.trim(),
            phone: newPhone.trim(),
        };
        const updated = [...manuals, newEntry];
        await saveManualContacts(updated);
        // Rebuild list
        const phonebooks = contacts.filter(c => !c.id.startsWith('manual_'));
        await buildList(updated, phonebooks);
        setNewName('');
        setNewPhone('');
        setShowAdd(false);
    };

    const renderItem = ({ item }: { item: PhoneContact }) => (
        <TouchableOpacity
            style={styles.row}
            onPress={() => handleCall(item.phone)}
            activeOpacity={0.75}
        >
            <View style={[styles.avatar, { backgroundColor: item.color + '22', borderColor: item.color + '55' }]}>
                <Text style={[styles.avatarText, { color: item.color }]}>{item.initials}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
            </View>
            <View style={styles.callBtn}>
                <Icon name="call" size={20} color="#EAF0FF" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#0B0F14" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Contatos</Text>
                {!loading && (
                    <Text style={styles.headerSub}>{filtered.length} contato{filtered.length !== 1 ? 's' : ''}</Text>
                )}
            </View>

            {!loading && (
                <View style={styles.searchBar}>
                    <Icon name="search-outline" size={20} color="#6B7A99" style={{ marginRight: 10 }} />
                    <TextInput
                        value={search}
                        autoCorrect={false}
                        autoCapitalize="none"
                        onChangeText={setSearch}
                        style={styles.searchInput}
                        placeholder="Buscar contato..."
                        placeholderTextColor="#3A4A60"
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Icon name="close-circle" size={20} color="#6B7A99" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#4F8CFF" size="large" />
                    <Text style={styles.loadingText}>Carregando contatos...</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={i => i.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={styles.sep} />}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Icon name="people-outline" size={52} color="#6B7A99" style={{ marginBottom: 16 }} />
                            <Text style={styles.emptyTitle}>Nenhum contato encontrado</Text>
                            <Text style={styles.emptyText}>
                                {search ? 'Tente outra busca.' : 'Toque em + para adicionar um contato SIP.'}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.85}
            >
                <Icon name="add" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Add Contact Modal */}
            <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.select({ ios: 'padding', android: 'padding' })}
                >
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Adicionar Contato SIP</Text>

                        <Text style={styles.modalLabel}>Nome (opcional)</Text>
                        <TextInput
                            value={newName}
                            autoCapitalize="words"
                            style={styles.modalInput}
                            onChangeText={setNewName}
                            placeholder="ex: João Silva"
                            placeholderTextColor="#3A4A60"
                        />

                        <Text style={styles.modalLabel}>Ramal / SIP URI *</Text>
                        <TextInput
                            value={newPhone}
                            autoCorrect={false}
                            autoCapitalize="none"
                            style={styles.modalInput}
                            onChangeText={setNewPhone}
                            placeholderTextColor="#3A4A60"
                            placeholder="ex: 1002 ou sip:usuario@servidor.com"
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => { setShowAdd(false); setNewName(''); setNewPhone(''); }}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddContact}
                                disabled={!newPhone.trim()}
                                style={[styles.modalSaveBtn, { opacity: newPhone.trim() ? 1 : 0.4 }]}
                            >
                                <Text style={styles.modalSaveText}>Salvar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#0B0F14'
    },
    header: {
        paddingTop: 52,
        paddingBottom: 12,
        borderBottomWidth: 1,
        paddingHorizontal: 24,
        borderBottomColor: '#1E2D47',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#EAF0FF',
    },
    headerSub: {
        fontSize: 13,
        color: '#6B7A99',
        marginTop: 2
    },
    searchBar: {
        gap: 8,
        margin: 16,
        borderWidth: 1,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    searchIcon: { fontSize: 16 },
    searchInput: {
        flex: 1,
        height: 46,
        fontSize: 15,
        color: '#EAF0FF',
    },
    clearSearch: {
        padding: 4,
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7A99',
    },
    list: {
        padding: 16
    },
    row: {
        padding: 14,
        borderWidth: 1,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    avatar: {
        width: 48,
        height: 48,
        flexShrink: 0,
        borderWidth: 1,
        marginRight: 14,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: '800'
    },
    info: {
        flex: 1
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EAF0FF',
    },
    phone: {
        fontSize: 13,
        marginTop: 2,
        color: '#6B7A99',
    },
    callBtn: {
        width: 40,
        height: 40,
        borderWidth: 1,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#4F8CFF40',
        backgroundColor: '#1A2D4A',
    },
    callIcon: {
        fontSize: 18,
    },
    sep: {
        height: 8,
    },
    center: {
        flex: 1,
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        marginBottom: 8,
        fontWeight: '700',
        color: '#EAF0FF',
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7A99',
        textAlign: 'center',
        paddingHorizontal: 40
    },
    loadingText: {
        fontSize: 14,
        marginTop: 12,
        color: '#6B7A99',
    },
    // FAB
    fab: {
        right: 24,
        width: 56,
        bottom: 24,
        height: 56,
        elevation: 10,
        shadowRadius: 14,
        borderRadius: 28,
        shadowOpacity: 0.45,
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F8CFF',
        backgroundColor: '#4F8CFF',
        shadowOffset: { width: 0, height: 6 },
    },
    fabIcon: {
        fontSize: 28,
        lineHeight: 32,
        color: '#fff',
        fontWeight: '300',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalCard: {
        padding: 24,
        paddingBottom: 36,
        borderTopWidth: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 24,
        fontWeight: '800',
        color: '#EAF0FF',
    },
    modalLabel: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
        color: '#6B7A99',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    modalInput: {
        height: 50,
        fontSize: 15,
        borderWidth: 1,
        borderRadius: 12,
        marginBottom: 16,
        color: '#EAF0FF',
        paddingHorizontal: 16,
        borderColor: '#1E2D47',
        backgroundColor: '#0E141D',
    },
    modalActions: {
        gap: 12,
        marginTop: 8,
        flexDirection: 'row',
    },
    modalCancelBtn: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#1E2D47',
        backgroundColor: '#1A2536',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#6B7A99',
    },
    modalSaveBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F8CFF',
    },
    modalSaveText: {
        fontSize: 15,
        color: '#fff',
        fontWeight: '700',
    },
});
