// config.ts
export interface ModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  // cualquier otra opción que necesite el provider (apiKey, baseURL, etc.)
  [key: string]: unknown;
}

export const models = new Map<string, ModelConfig>();

// Útil para inyectar dinámicamente más modelos
export function addModel(name: string, cfg: ModelConfig) {
  models.set(name, cfg);
}