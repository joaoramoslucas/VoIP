/**
 * 🔒 LOGGER SEGURO
 * 
 * Remove dados sensíveis dos logs em produção.
 * Mantém logs completos apenas em desenvolvimento.
 */

const isDev = __DEV__;

/**
 * Sanitiza mensagens removendo dados sensíveis
 */
const sanitize = (message: string): string => {
    if (isDev) return message; // Em dev, mostrar tudo
    
    return message
        // Remover senhas
        .replace(/password[=:]\s*\S+/gi, 'password=***')
        .replace(/pwd[=:]\s*\S+/gi, 'pwd=***')
        .replace(/pass[=:]\s*\S+/gi, 'pass=***')
        
        // Remover tokens
        .replace(/token[=:]\s*\S+/gi, 'token=***')
        .replace(/bearer\s+\S+/gi, 'bearer ***')
        .replace(/authorization[=:]\s*\S+/gi, 'authorization=***')
        
        // Remover chaves de API
        .replace(/api[_-]?key[=:]\s*\S+/gi, 'api_key=***')
        .replace(/secret[=:]\s*\S+/gi, 'secret=***')
        
        // Remover números de telefone (formato internacional)
        .replace(/\+?\d{10,15}/g, '+***')
        
        // Remover emails
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '***@***.***')
        
        // Remover IPs
        .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '***.***.***.***');
};

/**
 * Sanitiza objetos removendo campos sensíveis
 */
const sanitizeObject = (obj: any): any => {
    if (isDev) return obj; // Em dev, mostrar tudo
    
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const sanitized: any = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
        const lowerKey = key.toLowerCase();
        
        // Campos sensíveis
        if (
            lowerKey.includes('password') ||
            lowerKey.includes('token') ||
            lowerKey.includes('secret') ||
            lowerKey.includes('key') ||
            lowerKey.includes('auth')
        ) {
            sanitized[key] = '***';
        } else if (typeof obj[key] === 'object') {
            sanitized[key] = sanitizeObject(obj[key]);
        } else {
            sanitized[key] = obj[key];
        }
    }
    
    return sanitized;
};

/**
 * Logger seguro
 */
export const secureLog = {
    /**
     * Log de informação
     */
    info: (tag: string, message: string, data?: any) => {
        const sanitizedMessage = sanitize(message);
        const sanitizedData = data ? sanitizeObject(data) : undefined;
        
        if (isDev) {
            console.log(`[${tag}] ${sanitizedMessage}`, sanitizedData || '');
        } else {
            // Em produção, logar apenas se necessário
            // Pode enviar para serviço de analytics aqui
        }
    },
    
    /**
     * Log de aviso
     */
    warn: (tag: string, message: string, data?: any) => {
        const sanitizedMessage = sanitize(message);
        const sanitizedData = data ? sanitizeObject(data) : undefined;
        
        console.warn(`[${tag}] ${sanitizedMessage}`, sanitizedData || '');
    },
    
    /**
     * Log de erro (sempre loga, mas sanitizado)
     */
    error: (tag: string, message: string, error?: any) => {
        const sanitizedMessage = sanitize(message);
        
        if (error instanceof Error) {
            console.error(`[${tag}] ${sanitizedMessage}`, {
                name: error.name,
                message: sanitize(error.message),
                // Stack trace apenas em dev
                stack: isDev ? error.stack : undefined,
            });
        } else {
            console.error(`[${tag}] ${sanitizedMessage}`, sanitizeObject(error));
        }
    },
    
    /**
     * Log de debug (apenas em desenvolvimento)
     */
    debug: (tag: string, message: string, data?: any) => {
        if (isDev) {
            console.debug(`[${tag}] ${message}`, data || '');
        }
    },
    
    /**
     * Log de sucesso
     */
    success: (tag: string, message: string) => {
        const sanitizedMessage = sanitize(message);
        console.log(`[${tag}] ✅ ${sanitizedMessage}`);
    },
};

/**
 * Exemplo de uso:
 * 
 * // ❌ ANTES (INSEGURO):
 * console.log('Login:', { username, password, token });
 * 
 * // ✅ DEPOIS (SEGURO):
 * secureLog.info('Login', 'Tentativa de login', { username, password, token });
 * // Output em produção: [Login] Tentativa de login { username: 'joao', password: '***', token: '***' }
 */
