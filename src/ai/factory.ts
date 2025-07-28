// factory.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { deepseek } from '@ai-sdk/deepseek';
import { type ModelConfig } from './config.js';

// Mapeo simple provider -> instancia
const providerMap = {
  openai,
  anthropic,
  google,
  deepseek
  // agrega más según instales
} as const;

export function buildModel({ provider, model,apiKey, ...settings }: ModelConfig) {
  const sdk = providerMap[provider as keyof typeof providerMap];
  if (!sdk) throw new Error(`Provider "${provider}" no soportado`);
  return sdk(model, settings);
}