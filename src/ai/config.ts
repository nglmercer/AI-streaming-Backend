// config.ts
export interface ModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  // cualquier otra opción que necesite el provider (apiKey, baseURL, etc.)
  [key: string]: unknown;
}

export const models = new Map<string, ModelConfig>();

// registro de un modelo “por defecto”
models.set('default', {
  provider: 'google',
  model: 'gemini-2.5-flash',
  apiKey: process.env.GEMINI_API_KEY
});

// Útil para inyectar dinámicamente más modelos
export function addModel(name: string, cfg: ModelConfig) {
  models.set(name, cfg);
}