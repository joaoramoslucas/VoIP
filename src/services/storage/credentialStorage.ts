import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SipAccountCredentials } from '../sip/sipTypes';

const ACCOUNTS_KEY = '@sipapp_accounts';
const ACTIVE_KEY = '@sipapp_active_account';

export type StoredAccount = SipAccountCredentials & {
    id: string;
    displayName: string; // e.g. "joao@sip.linphone.org"
    addedAt: number;
};

export const multiAccountStorage = {
    async loadAll(): Promise<StoredAccount[]> {
        const json = await AsyncStorage.getItem(ACCOUNTS_KEY);
        if (!json) return [];
        try { return JSON.parse(json); } catch { return []; }
    },

    async save(creds: SipAccountCredentials): Promise<StoredAccount> {
        const all = await this.loadAll();
        const id = `${creds.username}@${creds.sipDomain}`;
        const existing = all.find(a => a.id === id);
        const account: StoredAccount = {
            ...creds,
            id,
            displayName: id,
            addedAt: existing?.addedAt ?? Date.now(),
        };
        const updated = existing
            ? all.map(a => a.id === id ? account : a)
            : [...all, account];
        await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
        await this.setActive(id);
        return account;
    },

    async remove(id: string): Promise<void> {
        const all = await this.loadAll();
        const updated = all.filter(a => a.id !== id);
        await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
        const active = await this.getActiveId();
        if (active === id) {
            await AsyncStorage.setItem(ACTIVE_KEY, updated[0]?.id ?? '');
        }
    },

    async getActiveId(): Promise<string | null> {
        return AsyncStorage.getItem(ACTIVE_KEY);
    },

    async setActive(id: string): Promise<void> {
        await AsyncStorage.setItem(ACTIVE_KEY, id);
    },

    async getActive(): Promise<StoredAccount | null> {
        const id = await this.getActiveId();
        if (!id) return null;
        const all = await this.loadAll();
        return all.find(a => a.id === id) ?? null;
    },

    async clearAll(): Promise<void> {
        await AsyncStorage.removeItem(ACCOUNTS_KEY);
        await AsyncStorage.removeItem(ACTIVE_KEY);
    },
};

// Backward compat: single-account helpers
export const credentialStorage = {
    async save(creds: SipAccountCredentials) {
        await multiAccountStorage.save(creds);
    },
    async load(): Promise<SipAccountCredentials | null> {
        return multiAccountStorage.getActive();
    },
    async clear() {
        const active = await multiAccountStorage.getActive();
        if (active) await multiAccountStorage.remove(active.id);
    },
};
