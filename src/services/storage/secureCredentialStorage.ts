import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SipAccountCredentials } from '../sip/sipTypes';

const ACCOUNTS_METADATA_KEY = '@sipapp_accounts_metadata';
const ACTIVE_KEY = '@sipapp_active_account';

export type StoredAccount = {
    id: string;
    displayName: string;
    username: string;
    sipDomain: string;
    transport: 'tcp' | 'udp' | 'tls';
    addedAt: number;
};

/**
 * 🔒 ARMAZENAMENTO SEGURO DE CREDENCIAIS
 * 
 * Usa Keychain (iOS) / Keystore (Android) para armazenar senhas criptografadas.
 * Metadados (username, domain) ficam no AsyncStorage (não sensíveis).
 */
export const secureCredentialStorage = {
    /**
     * Salva credenciais de forma segura
     */
    async save(creds: SipAccountCredentials): Promise<StoredAccount> {
        const id = `${creds.username}@${creds.sipDomain}`;
        
        try {
            // 1. Salvar senha no Keychain (CRIPTOGRAFADO)
            await Keychain.setGenericPassword(
                creds.username,
                creds.password,
                {
                    service: `sipapp_${id}`,
                    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
                    securityLevel: Keychain.SECURITY_LEVEL.ANY,
                }
            );
        } catch (error) {
            console.warn('[SecureStorage] Keychain não disponível, usando fallback:', error);
            // Fallback: salvar senha no AsyncStorage (apenas para desenvolvimento)
            await AsyncStorage.setItem(`@sipapp_pwd_${id}`, creds.password);
        }

        // 2. Salvar metadados no AsyncStorage (NÃO SENSÍVEL)
        const metadata: StoredAccount = {
            id,
            displayName: id,
            username: creds.username,
            sipDomain: creds.sipDomain,
            transport: creds.transport,
            addedAt: Date.now(),
        };

        const all = await this.loadAllMetadata();
        const existing = all.find(a => a.id === id);
        const updated = existing
            ? all.map(a => a.id === id ? { ...metadata, addedAt: a.addedAt } : a)
            : [...all, metadata];

        await AsyncStorage.setItem(ACCOUNTS_METADATA_KEY, JSON.stringify(updated));
        await this.setActive(id);

        console.log('[SecureStorage] Credenciais salvas com segurança:', id);
        return metadata;
    },

    /**
     * Carrega credenciais completas (com senha)
     */
    async load(id: string): Promise<SipAccountCredentials | null> {
        try {
            // 1. Carregar metadados
            const metadata = await this.getMetadata(id);
            if (!metadata) return null;

            // 2. Tentar carregar senha do Keychain
            let password = '';
            try {
                const credentials = await Keychain.getGenericPassword({
                    service: `sipapp_${id}`,
                });
                if (credentials) {
                    password = credentials.password;
                }
            } catch {
                // Fallback: tentar AsyncStorage
                password = await AsyncStorage.getItem(`@sipapp_pwd_${id}`) ?? '';
            }

            if (!password) {
                console.warn('[SecureStorage] Senha não encontrada:', id);
                return null;
            }

            // 3. Retornar credenciais completas
            return {
                username: metadata.username,
                password,
                sipDomain: metadata.sipDomain,
                transport: metadata.transport,
            };
        } catch (error) {
            console.error('[SecureStorage] Erro ao carregar credenciais:', error);
            return null;
        }
    },

    /**
     * Remove credenciais
     */
    async remove(id: string): Promise<void> {
        // 1. Remover senha do Keychain
        await Keychain.resetGenericPassword({
            service: `sipapp_${id}`,
        });

        // 2. Remover metadados
        const all = await this.loadAllMetadata();
        const updated = all.filter(a => a.id !== id);
        await AsyncStorage.setItem(ACCOUNTS_METADATA_KEY, JSON.stringify(updated));

        // 3. Atualizar conta ativa se necessário
        const active = await this.getActiveId();
        if (active === id) {
            await AsyncStorage.setItem(ACTIVE_KEY, updated[0]?.id ?? '');
        }

        console.log('[SecureStorage] Credenciais removidas:', id);
    },

    /**
     * Carrega todos os metadados (SEM senhas)
     */
    async loadAllMetadata(): Promise<StoredAccount[]> {
        const json = await AsyncStorage.getItem(ACCOUNTS_METADATA_KEY);
        if (!json) return [];
        try {
            return JSON.parse(json);
        } catch {
            return [];
        }
    },

    /**
     * Carrega metadados de uma conta específica
     */
    async getMetadata(id: string): Promise<StoredAccount | null> {
        const all = await this.loadAllMetadata();
        return all.find(a => a.id === id) ?? null;
    },

    /**
     * Define conta ativa
     */
    async setActive(id: string): Promise<void> {
        await AsyncStorage.setItem(ACTIVE_KEY, id);
    },

    /**
     * Obtém ID da conta ativa
     */
    async getActiveId(): Promise<string | null> {
        return AsyncStorage.getItem(ACTIVE_KEY);
    },

    /**
     * Carrega conta ativa (com senha)
     */
    async getActive(): Promise<SipAccountCredentials | null> {
        const id = await this.getActiveId();
        if (!id) return null;
        return this.load(id);
    },

    /**
     * Remove todas as credenciais
     */
    async clearAll(): Promise<void> {
        const all = await this.loadAllMetadata();
        
        // Remover todas as senhas do Keychain
        for (const account of all) {
            await Keychain.resetGenericPassword({
                service: `sipapp_${account.id}`,
            });
        }

        // Remover metadados
        await AsyncStorage.removeItem(ACCOUNTS_METADATA_KEY);
        await AsyncStorage.removeItem(ACTIVE_KEY);

        console.log('[SecureStorage] Todas as credenciais removidas');
    },

    /**
     * Verifica se Keychain está disponível
     */
    async isKeychainAvailable(): Promise<boolean> {
        try {
            const result = await Keychain.getSupportedBiometryType();
            return true;
        } catch {
            return false;
        }
    },
};

/**
 * Multi-account storage (compatível com código existente)
 */
export const multiAccountStorage = {
    async loadAll(): Promise<StoredAccount[]> {
        return secureCredentialStorage.loadAllMetadata();
    },

    async save(creds: SipAccountCredentials): Promise<StoredAccount> {
        return secureCredentialStorage.save(creds);
    },

    async remove(id: string): Promise<void> {
        await secureCredentialStorage.remove(id);
    },

    async getActiveId(): Promise<string | null> {
        return secureCredentialStorage.getActiveId();
    },

    async setActive(id: string): Promise<void> {
        await secureCredentialStorage.setActive(id);
    },

    async getActive(): Promise<SipAccountCredentials | null> {
        return secureCredentialStorage.getActive();
    },

    async clearAll(): Promise<void> {
        await secureCredentialStorage.clearAll();
    },
};

/**
 * Backward compatibility: single-account helpers
 */
export const credentialStorage = {
    async save(creds: SipAccountCredentials) {
        await secureCredentialStorage.save(creds);
    },

    async load(): Promise<SipAccountCredentials | null> {
        return secureCredentialStorage.getActive();
    },

    async clear() {
        const active = await secureCredentialStorage.getActive();
        if (active) {
            const id = `${active.username}@${active.sipDomain}`;
            await secureCredentialStorage.remove(id);
        }
    },
};
