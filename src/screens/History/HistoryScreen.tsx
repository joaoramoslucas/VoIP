import React, { useState } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useSipStore } from '../../state/sip/sipStore';

export type CallHistoryEntry = {
    id: string;
    remoteUri: string;
    direction: 'incoming' | 'outgoing' | 'missed';
    startedAt: number;
    durationSeconds: number;
};

// Simple in-memory history — will be wired to store later
let _history: CallHistoryEntry[] = [];

export const callHistory = {
    add(entry: Omit<CallHistoryEntry, 'id'>) {
        _history = [{ ...entry, id: Date.now().toString() }, ..._history.slice(0, 99)];
    },
    get() { return _history; },
};

const getInitials = (uri: string) => {
    const name = uri.replace(/^sip:/i, '').split('@')[0];
    if (/^\d+$/.test(name)) return name.slice(-2);
    return name.slice(0, 2).toUpperCase();
};

const formatDuration = (secs: number) => {
    if (secs < 10) return 'Perdida';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const DIRECTION_CONFIG = {
    incoming: { icon: '↙', color: '#20D17A', label: 'Recebida' },
    outgoing: { icon: '↗', color: '#4F8CFF', label: 'Realizada' },
    missed: { icon: '↙', color: '#FF4D4D', label: 'Perdida' },
};

const AVATAR_COLORS = ['#4F8CFF', '#20D17A', '#FFB020', '#FF4D4D', '#A78BFA', '#34D399'];
const getAvatarColor = (uri: string) => AVATAR_COLORS[uri.length % AVATAR_COLORS.length];

export const HistoryScreen: React.FC = () => {
    const { actions } = useSipStore();
    const [history, setHistory] = useState<CallHistoryEntry[]>(callHistory.get());

    const refresh = () => setHistory([...callHistory.get()]);

    const handleCallBack = async (uri: string) => {
        await actions.startCall(uri);
    };

    const renderItem = ({ item }: { item: CallHistoryEntry }) => {
        const dir = DIRECTION_CONFIG[item.direction];
        const initials = getInitials(item.remoteUri);
        const color = getAvatarColor(item.remoteUri);

        return (
            <TouchableOpacity
                style={styles.row}
                onPress={() => handleCallBack(item.remoteUri)}
                activeOpacity={0.75}
            >
                <View style={[styles.avatar, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                    <Text style={[styles.avatarText, { color }]}>{initials}</Text>
                </View>

                <View style={styles.info}>
                    <View style={styles.infoTop}>
                        <Text style={styles.name} numberOfLines={1}>
                            {item.remoteUri.replace(/^sip:/i, '')}
                        </Text>
                        <Text style={styles.timeText}>{formatTime(item.startedAt)}</Text>
                    </View>
                    <View style={styles.infoBottom}>
                        <Text style={[styles.dirIcon, { color: dir.color }]}>{dir.icon}</Text>
                        <Text style={[styles.dirLabel, { color: dir.color }]}>{dir.label}</Text>
                        <Text style={styles.duration}> · {formatDuration(item.durationSeconds)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="light-content" backgroundColor="#0B0F14" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Histórico</Text>
                <TouchableOpacity onPress={refresh} style={styles.refreshBtn}>
                    <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={history}
                keyExtractor={i => i.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>Sem histórico</Text>
                        <Text style={styles.emptyText}>Suas chamadas aparecerão aqui.</Text>
                    </View>
                }
            />
        </View>
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
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#EAF0FF' },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A2536',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshIcon: { color: '#4F8CFF', fontSize: 20, fontWeight: '700' },
    list: { padding: 16 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121822',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#1E2D47',
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginRight: 14,
        flexShrink: 0,
    },
    avatarText: { fontSize: 15, fontWeight: '800' },
    info: { flex: 1 },
    infoTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: { fontSize: 15, fontWeight: '700', color: '#EAF0FF', flex: 1, marginRight: 8 },
    timeText: { fontSize: 12, color: '#6B7A99', flexShrink: 0 },
    infoBottom: { flexDirection: 'row', alignItems: 'center' },
    dirIcon: { fontSize: 13, fontWeight: '900', marginRight: 3 },
    dirLabel: { fontSize: 12, fontWeight: '600' },
    duration: { fontSize: 12, color: '#6B7A99' },
    separator: { height: 8 },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyIcon: { fontSize: 48, marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#EAF0FF', marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6B7A99', textAlign: 'center' },
});
