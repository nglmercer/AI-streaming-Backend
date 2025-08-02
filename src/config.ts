import { DataStorage, JSONFile } from 'json-obj-manager';
import { providerKeys, type ProviderType } from './ai/factory.js';
import { Emitter }from 'json-obj-manager'
import path from 'path';

export const emitterConfig = new Emitter();
const configPath = path.join(process.cwd(), 'temp', 'config.json');
const storage = new DataStorage<DefaultConfig>(new JSONFile(configPath),emitterConfig);

emitterConfig.on('change',(config)=>{
    console.log('config change',config);
})

export interface DefaultConfig {
    port: number;
    host: string;
    OPENAI_API_KEY: string;
    GEMINI_API_KEY: string;
    MISTRAL_API_KEY: string;
    DEEPSEEK_API_KEY: string;
    ANTHROPIC_API_KEY: string;
    provider: ProviderType;
    model: string;
    model2d: string;
}

const Provider_apikeys = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
}

export const defaultConfig: DefaultConfig = {
    port: 12393,
    host: 'localhost',
    ...Provider_apikeys,
    provider: 'google',
     model: process.env.MODEL || 'gemini-2.5-flash',
    model2d: 'shizuku',
};

// Mapeo de providers a sus respectivas claves de API
const PROVIDER_TO_API_KEY_MAP: Record<ProviderType, keyof DefaultConfig> = {
    google: 'GEMINI_API_KEY',
    openai: 'OPENAI_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    deepseek: 'DEEPSEEK_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY'
};


async function validateConfig(loadedConfig: Partial<DefaultConfig> | null): Promise<DefaultConfig> {
    const configFromFile = loadedConfig || {};
    let needsUpdate = false;
    const completeConfig = { ...defaultConfig, ...configFromFile };

    for (const key of Object.keys(defaultConfig)) {
        if (!(key in configFromFile)) {
            needsUpdate = true;
            break; 
        }
    }

    if (needsUpdate) {
        console.log('[Config Validator] Configuración incompleta detectada. Rellenando claves faltantes y guardando...');
        await storage.save('config', completeConfig);
    }
    
    return completeConfig;
}


async function initConfig() {
    console.log("Inicializando configuración...");
    const loadedConfig = await storage.load('config');
    const finalConfig = await validateConfig(loadedConfig);
    console.log("Configuración inicial cargada y validada.");
    return finalConfig;
}

initConfig();

/**
 * Obtiene la configuración de forma segura. Siempre devuelve un objeto completo
 * con todas las claves definidas en DefaultConfig.
 * @returns La configuración completa y validada.
 */
export async function getConfig(): Promise<DefaultConfig> {
    const loadedConfig = await storage.load('config');
    // Cada vez que se pide la configuración, se valida.
    // Esto garantiza que incluso si el archivo se edita mientras la app corre,
    // no obtendremos un objeto corrupto.
    return validateConfig(loadedConfig);
}

// =========================================================================
// El resto de las funciones no necesitan cambios, ya que todas dependen
// de `getConfig`, que ahora es 100% segura.
// =========================================================================

export async function updateConfig(data: Partial<DefaultConfig>) {
    // 1. getConfig() obtiene la configuración actual, ya validada y completa.
    const currentConfig = await getConfig();
    // 2. Se mezclan los nuevos datos.
    const newConfig = {
        ...currentConfig,
        ...data,
    };
    // 3. Se guarda el objeto completo.
    await storage.save('config', newConfig);
    return newConfig;
}

export async function resetConfig(): Promise<DefaultConfig> {
    console.log('[Config Validator] Reseteando configuración a valores por defecto...');
    // No es necesario validar aquí, ya que estamos forzando los valores por defecto.
    await storage.save('config', defaultConfig);
    return { ...defaultConfig };
}

// Opción 1: Obtener solo la API key de un proveedor específico
export async function getApiKey(provider: ProviderType): Promise<string> {
    const config = await getConfig(); // <-- Seguro y validado
    const apiKeyField = PROVIDER_TO_API_KEY_MAP[provider];
    return config[apiKeyField] as string;
}

// Opción 2: Obtener todas las API keys con información de disponibilidad
export async function getAllApiKeys() {
    const config = await getConfig(); // <-- Seguro y validado
    
    const apiKeyStatus = providerKeys.map((provider) => {
        const apiKeyField = PROVIDER_TO_API_KEY_MAP[provider];
        const apiKey = config[apiKeyField] as string;
        
        return {
            provider,
            apiKey,
            hasApiKey: Boolean(apiKey && apiKey.trim() !== ''),
            keyField: apiKeyField
        };
    });
    
    return apiKeyStatus;
}

// Opción 3: Obtener providers disponibles (que tienen API key configurada)
export async function getAvailableProviders(): Promise<ProviderType[]> {
    const allKeys = await getAllApiKeys();
    return allKeys
        .filter(item => item.hasApiKey)
        .map(item => item.provider);
}

// Opción 4: Verificar si un provider específico tiene API key configurada
export async function hasApiKey(provider: ProviderType): Promise<boolean> {
    const apiKey = await getApiKey(provider);
    return Boolean(apiKey && apiKey.trim() !== '');
}