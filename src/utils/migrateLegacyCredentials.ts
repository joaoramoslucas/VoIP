import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureCredentialStorage } from '../services/storage/secureCredentialStorage';

const OLD_ACCOUNTS_KEY = '@sipapp_accounts';
const MIGRATION_FLAG = '@sipapp_migration_completed';

/**
 * 🔄 MIGRAÇÃO DE CREDENCIAIS LEGADAS
 * 
 * Migra senhas do AsyncStorage (texto plano) para Keychain (criptografado).
 * Executa apenas uma vez.
 */
export const migrateLegacyCredentials = async (): Promise<void> => {
    try {
        // Verificar se migração já foi feita
        const migrationCompleted = await AsyncStorage.getItem(MIGRATION_FLAG);
        if (migrationCompleted === 'true') {
            console.log('[Migration] ✅ Migração já foi concluída anteriormente');
            return;
        }

        console.log('[Migration] 🔄 Iniciando migração de credenciais...');

        // 1. Carregar credenciais antigas do AsyncStorage
        const oldJson = await AsyncStorage.getItem(OLD_ACCOUNTS_KEY);
        
        if (!oldJson) {
            console.log('[Migration] ℹ️ Nenhuma credencial antiga encontrada');
            await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
            return;
        }

        let oldAccounts: any[] = [];
        try {
            oldAccounts = JSON.parse(oldJson);
        } catch (error) {
            console.error('[Migration] ❌ Erro ao parsear credenciais antigas:', error);
            await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
            return;
        }

        if (!Array.isArray(oldAccounts) || oldAccounts.length === 0) {
            console.log('[Migration] ℹ️ Nenhuma conta para migrar');
            await AsyncStorage.setItem(MIGRATION_FLAG, 'true');
            return;
        }

        console.log(`[Migration] 📦 Encontradas ${oldAccounts.length} conta(s) para migrar`);

        // 2. Migrar cada conta para o Keychain
        let successCount = 0;
        let errorCount = 0;

        for (const account of oldAccounts) {
            try {
                // Validar dados da conta
                if (!account.username || !account.password || !account.sipDomain) {
                    console.warn('[Migration] ⚠️ Conta inválida, pulando:', account.id);
                    errorCount++;
                    continue;
                }

                // Salvar no Keychain
                await secureCredentialStorage.save({
                    username: account.username,
                    password: account.password,
                    sipDomain: account.sipDomain,
                    transport: account.transport || 'tcp',
                });

                console.log(`[Migration] ✅ Migrado: ${account.username}@${account.sipDomain}`);
                successCount++;
            } catch (error) {
                console.error(`[Migration] ❌ Erro ao migrar ${account.username}:`, error);
                errorCount++;
            }
        }

        // 3. REMOVER credenciais antigas do AsyncStorage (IMPORTANTE!)
        await AsyncStorage.removeItem(OLD_ACCOUNTS_KEY);
        console.log('[Migration] 🗑️ Credenciais antigas removidas do AsyncStorage');

        // 4. Marcar migração como concluída
        await AsyncStorage.setItem(MIGRATION_FLAG, 'true');

        // 5. Log final
        console.log('[Migration] ✅ Migração concluída!');
        console.log(`[Migration] 📊 Sucesso: ${successCount} | Erros: ${errorCount}`);

        if (errorCount > 0) {
            console.warn(`[Migration] ⚠️ ${errorCount} conta(s) não puderam ser migradas`);
        }

    } catch (error) {
        console.error('[Migration] ❌ Erro crítico na migração:', error);
        // Não marcar como concluída para tentar novamente na próxima vez
    }
};

/**
 * Força uma nova migração (útil para debug)
 */
export const resetMigration = async (): Promise<void> => {
    await AsyncStorage.removeItem(MIGRATION_FLAG);
    console.log('[Migration] 🔄 Flag de migração resetada');
};

/**
 * Verifica se migração foi concluída
 */
export const isMigrationCompleted = async (): Promise<boolean> => {
    const flag = await AsyncStorage.getItem(MIGRATION_FLAG);
    return flag === 'true';
};
