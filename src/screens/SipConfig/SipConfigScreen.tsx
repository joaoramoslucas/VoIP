import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StatusBar, StyleSheet, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';

import { useSipStore } from '../../state/sip/sipStore';
import { RootStackParams } from '../../app/RootStackParams';
import type { SipTransport } from '../../services/sip/sipTypes';
import { AVAILABLE_CODECS, codecStorage } from '../../services/storage/codecStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Nav = NativeStackNavigationProp<RootStackParams, 'SipConfig'>;

export const SipConfigScreen: React.FC = () => {
    const navigation = useNavigation<Nav>();
    const route = useRoute<any>();
    const { lastUsedCredentials, actions } = useSipStore();
    const isPreLogin = route.params?.preLogin ?? false;

    const [domain, setDomain] = useState(lastUsedCredentials?.sipDomain ?? '');
    const [transport, setTransport] = useState<SipTransport>(lastUsedCredentials?.transport ?? 'tcp');
    const [port, setPort] = useState('');
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [selectedCodecs, setSelectedCodecs] = useState<string[]>([]);
    const [showCodecs, setShowCodecs] = useState(false);

    useEffect(() => {
        loadCodecs();
    }, []);

    const loadCodecs = async () => {
        const codecs = await codecStorage.load();
        setSelectedCodecs(codecs);
    };

    const toggleCodec = (codecId: string) => {
        setSelectedCodecs(prev => {
            if (prev.includes(codecId)) {
                return prev.filter(id => id !== codecId);
            } else {
                return [...prev, codecId];
            }
        });
    };

    const selectAllCodecs = () => {
        setSelectedCodecs(AVAILABLE_CODECS.map(c => c.id));
    };

    const deselectAllCodecs = () => {
        setSelectedCodecs([]);
    };

    const handleSave = async () => {
        if (!domain.trim()) {
            setError('Digite o domínio do servidor SIP');
            return;
        }

        // Salva codecs
        await codecStorage.save(selectedCodecs);
        
        // Salva configuração SIP
        await AsyncStorage.setItem('@sipapp_sip_config', JSON.stringify({
            sipDomain: domain.trim(),
            transport,
        }));
        
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            navigation.goBack();
        }, 1500);
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
                    Configure o servidor SIP. Essas configurações serão usadas no próximo login.
                </Text>

                <View style={styles.card}>
                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Domínio / IP do Servidor *</Text>
                        <TextInput
                            value={domain}
                            autoCorrect={false}
                            style={styles.input}
                            autoCapitalize="none"
                            onChangeText={setDomain}
                            placeholderTextColor="#4A5568"
                            placeholder="ex: sip.empresa.com ou 192.168.1.100"
                        />
                    </View>

                    <View style={styles.fieldGroup}>
                        <Text style={styles.label}>Transporte *</Text>
                        <View style={styles.chipRow}>
                            <TransportChip value="tcp" label="TCP" />
                            <TransportChip value="udp" label="UDP" />
                            <TransportChip value="tls" label="TLS (Seguro)" />
                        </View>
                        <Text style={styles.hint}>
                            TCP: Mais estável | UDP: Mais rápido | TLS: Criptografado
                        </Text>
                    </View>
                </View>

                {error ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Info box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoTitle}>ℹ️ Informações</Text>
                    <Text style={styles.infoText}>
                        • Porta padrão: 5060 (TCP/UDP) ou 5061 (TLS){"\n"}
                        • Portas customizadas: use sip.empresa.com:5080{"\n"}
                        • Para testes: sip.linphone.org
                    </Text>
                </View>

                {/* Codecs Section - Only after login */}
                {!isPreLogin && (
                    <>
                        <TouchableOpacity
                    style={styles.codecsHeader}
                    onPress={() => setShowCodecs(!showCodecs)}
                    activeOpacity={0.8}
                >
                    <View style={styles.codecsHeaderLeft}>
                        <Icon name="musical-notes" size={20} color="#4F8CFF" />
                        <Text style={styles.codecsHeaderTitle}>Codecs de Áudio</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{selectedCodecs.length}</Text>
                        </View>
                    </View>
                    <Icon name={showCodecs ? "chevron-up" : "chevron-down"} size={20} color="#6B7A99" />
                </TouchableOpacity>

                {showCodecs && (
                    <View style={styles.codecsCard}>
                        <View style={styles.codecsActions}>
                            <TouchableOpacity onPress={selectAllCodecs} style={styles.codecsActionBtn}>
                                <Text style={styles.codecsActionText}>Selecionar Todos</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={deselectAllCodecs} style={styles.codecsActionBtn}>
                                <Text style={styles.codecsActionText}>Limpar</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Wideband */}
                        <Text style={styles.codecCategory}>🎵 Alta Qualidade (Wideband)</Text>
                        {AVAILABLE_CODECS.filter(c => c.category === 'wideband').map(codec => (
                            <TouchableOpacity
                                key={codec.id}
                                style={styles.codecRow}
                                onPress={() => toggleCodec(codec.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.codecInfo}>
                                    <Text style={styles.codecName}>{codec.name}</Text>
                                    <Text style={styles.codecDesc}>{codec.description}</Text>
                                </View>
                                <Switch
                                    value={selectedCodecs.includes(codec.id)}
                                    onValueChange={() => toggleCodec(codec.id)}
                                    trackColor={{ false: '#1E2D47', true: '#4F8CFF' }}
                                    thumbColor={selectedCodecs.includes(codec.id) ? '#fff' : '#6B7A99'}
                                />
                            </TouchableOpacity>
                        ))}

                        {/* Narrowband */}
                        <Text style={[styles.codecCategory, { marginTop: 16 }]}>📞 Compatibilidade (Narrowband)</Text>
                        {AVAILABLE_CODECS.filter(c => c.category === 'narrowband').map(codec => (
                            <TouchableOpacity
                                key={codec.id}
                                style={styles.codecRow}
                                onPress={() => toggleCodec(codec.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.codecInfo}>
                                    <Text style={styles.codecName}>{codec.name}</Text>
                                    <Text style={styles.codecDesc}>{codec.description}</Text>
                                </View>
                                <Switch
                                    value={selectedCodecs.includes(codec.id)}
                                    onValueChange={() => toggleCodec(codec.id)}
                                    trackColor={{ false: '#1E2D47', true: '#4F8CFF' }}
                                    thumbColor={selectedCodecs.includes(codec.id) ? '#fff' : '#6B7A99'}
                                />
                            </TouchableOpacity>
                        ))}

                        <View style={styles.codecsHint}>
                            <Text style={styles.codecsHintText}>
                                💡 Selecione os codecs que seu servidor SIP suporta. Quanto mais codecs, maior a compatibilidade.
                            </Text>
                        </View>
                    </View>
                )}
                    </>
                )}

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
    hint: {
        fontSize: 11,
        marginTop: 8,
        color: '#6B7A99',
        fontStyle: 'italic',
    },
    errorBox: {
        padding: 12,
        borderWidth: 1,
        borderRadius: 10,
        marginBottom: 12,
        borderColor: '#FF4D4D40',
        backgroundColor: '#2D1A1A',
    },
    errorText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FF4D4D',
    },
    saveBtn: {
        height: 52,
        marginTop: 32,
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
    codecsHeader: {
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#1E2D47',
        justifyContent: 'space-between',
        backgroundColor: '#121822',
    },
    codecsHeaderLeft: {
        gap: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    codecsHeaderTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#EAF0FF',
    },
    badge: {
        minWidth: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F8CFF',
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    codecsCard: {
        padding: 16,
        marginTop: 8,
        borderWidth: 1,
        borderRadius: 14,
        borderColor: '#1E2D47',
        backgroundColor: '#121822',
    },
    codecsActions: {
        gap: 8,
        marginBottom: 16,
        flexDirection: 'row',
    },
    codecsActionBtn: {
        flex: 1,
        height: 36,
        borderWidth: 1,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: '#1E2D47',
        backgroundColor: '#0E141D',
    },
    codecsActionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4F8CFF',
    },
    codecCategory: {
        fontSize: 13,
        marginBottom: 12,
        fontWeight: '700',
        color: '#6B7A99',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    codecRow: {
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#1E2D47',
        justifyContent: 'space-between',
        backgroundColor: '#0E141D',
    },
    codecInfo: {
        flex: 1,
        marginRight: 12,
    },
    codecName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EAF0FF',
        marginBottom: 2,
    },
    codecDesc: {
        fontSize: 11,
        color: '#6B7A99',
    },
    codecsHint: {
        padding: 12,
        marginTop: 12,
        borderRadius: 10,
        backgroundColor: '#0F1E30',
    },
    codecsHintText: {
        fontSize: 12,
        lineHeight: 16,
        color: '#6B7A99',
    },
});
