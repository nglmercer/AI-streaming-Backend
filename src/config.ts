import { DataStorage, JSONFile } from 'json-obj-manager';
import { providerKeys, type ProviderType } from './ai/factory.js';
import path from 'path';

const configPath = path.join(process.cwd(), 'temp', 'config.json');
const storage = new DataStorage<DefaultConfig>(new JSONFile(configPath));

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
    model: 'gemini-2.5-flash',
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

async function initConfig() {
    let existConfig = await storage.load('config');
    if (!existConfig) {
        await storage.save('config', defaultConfig);
        existConfig = defaultConfig;
    }
    return existConfig;
}

export async function getConfig(): Promise<DefaultConfig> {
    let config = await storage.load('config');
    if (!config) {
        config = await initConfig();
    }
    return config;
}

// Opción 1: Obtener solo la API key de un proveedor específico
export async function getApiKey(provider: ProviderType): Promise<string> {
    const config = await getConfig();
    const apiKeyField = PROVIDER_TO_API_KEY_MAP[provider];
    return config[apiKeyField] as string;
}

// Opción 2: Obtener todas las API keys con información de disponibilidad
export async function getAllApiKeys() {
    const config = await getConfig();
    
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

export async function updateConfig(data: Partial<DefaultConfig>) {
    const currentConfig = await getConfig();
    const newConfig = {
        ...currentConfig,
        ...data,
    };
    await storage.save('config', newConfig);
    return newConfig;
}

// Ejemplos de uso:
// const googleApiKey = await getApiKey('google');
// const allKeys = await getAllApiKeys();
// const availableProviders = await getAvailableProviders();
// const hasGoogleKey = await hasApiKey('google');