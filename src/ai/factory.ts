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
import { type LanguageModel,type LanguageModelV1 } from 'ai';
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
  modelInstances.set(cacheKey, newModelInstance as LanguageModelV1);

  return newModelInstance as LanguageModelV1;
}