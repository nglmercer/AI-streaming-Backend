import { DataStorage, JSONFile } from 'json-obj-manager';
import path from 'path';
const configPath = path.join(process.cwd(),'temp','config.json');
const storage = new DataStorage<DefaulConfig>(new JSONFile(configPath));

export interface DefaulConfig {
    port: number;
    host: string;
    OPENAI_API_KEY: string;
    GEMINI_API_KEY: string;
    GOOGLE_GENERATIVE_AI_API_KEY: string;
    MISTRAL_API_KEY: string;
}

const defaultConfig: DefaulConfig = {
    port: 12393,
    host: 'localhost',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || '',
};

async function initConfig() {
    let existConfig = await storage.load('config');
    if (!existConfig) {
        await storage.save('config', defaultConfig);
        existConfig = defaultConfig;
    }
    return existConfig;
}

export async function getConfig(): Promise<DefaulConfig> {
    let config = await storage.load('config');
    if (!config) {
        config = await initConfig();
    }
    return config;
}

export async function updateConfig(data: Partial<DefaulConfig>) {
    const currentConfig = await getConfig();
    const newConfig = {
        ...currentConfig,
        ...data,
    };
    await storage.save('config', newConfig);
    return newConfig;
}