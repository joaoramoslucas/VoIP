import AsyncStorage from '@react-native-async-storage/async-storage';

const CODECS_KEY = '@sipapp_selected_codecs';

export type CodecInfo = {
    id: string;
    name: string;
    description: string;
    category: 'wideband' | 'narrowband';
};

export const AVAILABLE_CODECS: CodecInfo[] = [
    // Wideband (Alta Qualidade)
    { id: 'opus', name: 'Opus', description: 'Melhor codec moderno (6-510 kbps)', category: 'wideband' },
    { id: 'speex', name: 'Speex', description: 'Wideband (4-44 kbps)', category: 'wideband' },
    { id: 'g722', name: 'G.722', description: 'HD voice (64 kbps)', category: 'wideband' },
    { id: 'amr-wb', name: 'AMR-WB', description: 'AMR Wideband (6.6-23.85 kbps)', category: 'wideband' },
    { id: 'aac-eld', name: 'AAC-ELD', description: 'AAC Enhanced Low Delay', category: 'wideband' },
    
    // Narrowband (Compatibilidade)
    { id: 'pcmu', name: 'PCMU (G.711 μ-law)', description: 'Padrão US (64 kbps)', category: 'narrowband' },
    { id: 'pcma', name: 'PCMA (G.711 A-law)', description: 'Padrão EU (64 kbps)', category: 'narrowband' },
    { id: 'gsm', name: 'GSM', description: 'GSM Full Rate (13 kbps)', category: 'narrowband' },
    { id: 'ilbc', name: 'iLBC', description: 'Redes ruins (13.3/15.2 kbps)', category: 'narrowband' },
    { id: 'g729', name: 'G.729', description: 'Baixo bitrate (8 kbps)', category: 'narrowband' },
    { id: 'amr', name: 'AMR', description: 'Adaptive Multi-Rate NB (4.75-12.2 kbps)', category: 'narrowband' },
    { id: 'silk', name: 'SILK', description: 'Skype codec (6-40 kbps)', category: 'narrowband' },
    { id: 'codec2', name: 'Codec2', description: 'Ultra low bitrate (700-3200 bps)', category: 'narrowband' },
    { id: 'g726-16', name: 'G.726-16', description: '16 kbps', category: 'narrowband' },
    { id: 'g726-24', name: 'G.726-24', description: '24 kbps', category: 'narrowband' },
    { id: 'g726-32', name: 'G.726-32', description: '32 kbps', category: 'narrowband' },
    { id: 'g726-40', name: 'G.726-40', description: '40 kbps', category: 'narrowband' },
];

// Codecs padrão (os mais comuns)
const DEFAULT_CODECS = ['opus', 'pcmu', 'pcma', 'g722', 'g729', 'speex', 'gsm'];

export const codecStorage = {
    async load(): Promise<string[]> {
        const json = await AsyncStorage.getItem(CODECS_KEY);
        if (!json) return DEFAULT_CODECS;
        try {
            return JSON.parse(json);
        } catch {
            return DEFAULT_CODECS;
        }
    },

    async save(codecs: string[]): Promise<void> {
        await AsyncStorage.setItem(CODECS_KEY, JSON.stringify(codecs));
    },

    async reset(): Promise<void> {
        await AsyncStorage.removeItem(CODECS_KEY);
    },
};
