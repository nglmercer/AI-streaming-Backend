// src/ai/factory.ts
import {
  createOpenAI,
  type OpenAIProviderSettings,
} from '@ai-sdk/openai';
import {
  createAnthropic,
  type AnthropicProviderSettings,
} from '@ai-sdk/anthropic';
import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProvider,
} from '@ai-sdk/google';
import {
  createDeepSeek,
  type DeepSeekProviderSettings,
} from '@ai-sdk/deepseek';
import { createMistral,type MistralProviderSettings } from '@ai-sdk/mistral';
import { type LanguageModel } from 'ai';
import { type ModelConfig } from './config.js';
import { emitterConfig } from '../config.js';
// Mapeo de strings a las funciones creadoras de proveedores
export const providerCreatorMap = {
  openai: createOpenAI,
  anthropic: createAnthropic,
  google: createGoogleGenerativeAI,
  deepseek: createDeepSeek,
  mistral: createMistral,
} as const;
export type ProviderType = keyof typeof providerCreatorMap;
export const providerKeys = Object.keys(providerCreatorMap) as ProviderType[];
// Un tipo de unión que representa todas las posibles configuraciones de proveedor.
// Nos ayuda a decirle a TypeScript que el objeto { apiKey } es válido.
type AnyProviderSettings = OpenAIProviderSettings &
  AnthropicProviderSettings &
  GoogleGenerativeAIProvider &
  DeepSeekProviderSettings &
  MistralProviderSettings;

/**
 * Caché para almacenar las instancias de los modelos ya creados.
 * La clave es una combinación del proveedor, modelo y si se usa una clave API específica.
 */
const modelInstances = new Map<string, LanguageModel>();

export function buildModel({
  provider,
  model,
  apiKey,
}: ModelConfig): LanguageModel {
  // La clave del caché debe ser única para una combinación de proveedor, modelo y clave API.
  // Si apiKey es undefined, significa que se usarán las variables de entorno.
  if (!provider || !model || !apiKey) {
    if (typeof emitterConfig.emit !== 'function') {
      throw new Error('Provider, model y apiKey son requeridos');
    }
    emitterConfig.emit('ERROR',{
      message: 'Provider, model y apiKey son requeridos',
      required: ['provider','model','apiKey'],
      raw: {
        provider,
        model,
        apiKey,
      }
    })
  }
  const cacheKey = `${provider}:${model}:${apiKey ?? 'env_key'}`;

  // 1. Revisa si la instancia del modelo ya existe en el caché
  if (modelInstances.has(cacheKey)) {
    console.log(`[Factory] Devolviendo instancia cacheada para: ${cacheKey}`);
    return modelInstances.get(cacheKey)!;
  }

  // 2. Si no existe, crea una nueva instancia
  console.log(`[Factory] Creando nueva instancia para: ${cacheKey}`,{provider,model,apiKey});
  const createProvider = providerCreatorMap[provider as keyof typeof providerCreatorMap];
  if (!createProvider) {
    throw new Error(`Provider "${provider}" no soportado`);
  }

  // ---- LA LÓGICA CLAVE CORREGIDA ----
  // a. Crea una instancia del proveedor, pasándole la apiKey para su configuración.
  //    Si apiKey es undefined, el proveedor buscará la variable de entorno por defecto.
  const providerInstance = createProvider({ apiKey } as AnyProviderSettings);

  // b. Usa la instancia del proveedor para obtener el modelo específico,
  //    pasándole el nombre del modelo y los ajustes de la llamada (settings).
  const newModelInstance = providerInstance(model);
  // ------------------------------------

  // 3. Guárdala en el caché para futuros usos
  modelInstances.set(cacheKey, newModelInstance as LanguageModel);

  return newModelInstance as LanguageModel;
}
type OpenAIChatModelId = 'o1' | 'o1-2024-12-17' | 'o1-mini' | 'o1-mini-2024-09-12' | 'o1-preview' | 'o1-preview-2024-09-12' | 'o3-mini' | 'o3-mini-2025-01-31' | 'o3' | 'o3-2025-04-16' | 'o4-mini' | 'o4-mini-2025-04-16' | 'gpt-4.1' | 'gpt-4.1-2025-04-14' | 'gpt-4.1-mini' | 'gpt-4.1-mini-2025-04-14' | 'gpt-4.1-nano' | 'gpt-4.1-nano-2025-04-14' | 'gpt-4o' | 'gpt-4o-2024-05-13' | 'gpt-4o-2024-08-06' | 'gpt-4o-2024-11-20' | 'gpt-4o-audio-preview' | 'gpt-4o-audio-preview-2024-10-01' | 'gpt-4o-audio-preview-2024-12-17' | 'gpt-4o-search-preview' | 'gpt-4o-search-preview-2025-03-11' | 'gpt-4o-mini-search-preview' | 'gpt-4o-mini-search-preview-2025-03-11' | 'gpt-4o-mini' | 'gpt-4o-mini-2024-07-18' | 'gpt-4-turbo' | 'gpt-4-turbo-2024-04-09' | 'gpt-4-turbo-preview' | 'gpt-4-0125-preview' | 'gpt-4-1106-preview' | 'gpt-4' | 'gpt-4-0613' | 'gpt-4.5-preview' | 'gpt-4.5-preview-2025-02-27' | 'gpt-3.5-turbo-0125' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-1106' | 'chatgpt-4o-latest' | (string & {});
type AnthropicMessagesModelId = 'claude-4-opus-20250514' | 'claude-4-sonnet-20250514' | 'claude-3-7-sonnet-20250219' | 'claude-3-5-sonnet-latest' | 'claude-3-5-sonnet-20241022' | 'claude-3-5-sonnet-20240620' | 'claude-3-5-haiku-latest' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-latest' | 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' | (string & {});
type GoogleGenerativeAIModelId = 'gemini-1.5-flash' | 'gemini-1.5-flash-latest' | 'gemini-1.5-flash-001' | 'gemini-1.5-flash-002' | 'gemini-1.5-flash-8b' | 'gemini-1.5-flash-8b-latest' | 'gemini-1.5-flash-8b-001' | 'gemini-1.5-pro' | 'gemini-1.5-pro-latest' | 'gemini-1.5-pro-001' | 'gemini-1.5-pro-002' | 'gemini-2.0-flash' | 'gemini-2.0-flash-001' | 'gemini-2.0-flash-live-001' | 'gemini-2.0-flash-lite' | 'gemini-2.0-pro-exp-02-05' | 'gemini-2.0-flash-thinking-exp-01-21' | 'gemini-2.0-flash-exp' | 'gemini-2.5-pro' | 'gemini-2.5-flash' | 'gemini-2.5-pro-exp-03-25' | 'gemini-2.5-pro-preview-05-06' | 'gemini-2.5-flash-preview-04-17' | 'gemini-exp-1206' | 'gemma-3-27b-it' | 'learnlm-1.5-pro-experimental' | (string & {});
type DeepSeekChatModelId = 'deepseek-chat' | 'deepseek-reasoner' | (string & {});

interface ModelList {
  openai: {
    models: OpenAIChatModelId[];
  }
  anthropic: {
    models: AnthropicMessagesModelId[];
  }
  google: {
    models: GoogleGenerativeAIModelId[];
  }
  deepseek: {
    models: DeepSeekChatModelId[];
  }

}
export const textmodelList: ModelList = {
  openai: {
    models: [
      'o1',
      'o1-2024-12-17',
      'o1-mini',
      'o1-mini-2024-09-12',
      'o1-preview',
      'o1-preview-2024-09-12',
      'o3-mini',
      'o3-mini-2025-01-31',
      'o3',
      'o3-2025-04-16',
      'o4-mini',
      'o4-mini-2025-04-16',
      'gpt-4.1',
      'gpt-4.1-2025-04-14',
      'gpt-4.1-mini',
    ]
  },
  anthropic: {
    models: [
      'claude-4-opus-20250514',
      'claude-4-sonnet-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-latest',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20240620',
      'claude-3-5-haiku-latest',
      'claude-3-5-haiku-20241022',
    ]
  },
  google: {
    models: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash-live-001',
      'gemini-2.0-flash-lite',
      'gemini-2.0-pro-exp-02-05',
      'gemini-2.0-flash-thinking-exp-01-21',
      'gemini-2.0-flash-exp',
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-pro-exp-03-25',
      'gemini-2.5-pro-preview-05-06',
      'gemini-2.5-flash-preview-04-17',
      'gemini-exp-1206',
      'gemma-3-27b-it',
      'learnlm-1.5-pro-experimental',
      'gemini-2.5-pro-exp-04-05',
    ]
  },
  deepseek: {
    models: [
      'deepseek-chat',
      'deepseek-reasoner',
    ]
  }
}
export const providertxtKeys = Object.keys(textmodelList) as (keyof ModelList)[];
//console.log("providertxtKeys",providertxtKeys, providerKeys)