// Character types for API responses and requests

export interface CharacterConfig {
  name: string;
  personality: string;
  background: string;
  speaking_style: string;
  interests?: string[];
  special_abilities?: string;
  catchphrase?: string;
  [key: string]: any; // Allow additional custom fields
}

export interface CreateCharacterRequest {
  name: string;
  config: CharacterConfig;
}

export interface UpdateCharacterRequest {
  config: CharacterConfig;
}

export interface CharacterResponse {
  success: boolean;
  data?: {
    name: string;
    config: CharacterConfig;
    path?: string;
  };
  message?: string;
  error?: string;
}

export interface CharactersListResponse {
  success: boolean;
  data?: string[];
  count?: number;
  error?: string;
}

export interface PromptResponse {
  success: boolean;
  data?: {
    character: string;
    humanName: string;
    prompt: string;
  };
  error?: string;
}

export interface MultiplePromptsRequest {
  characters: string[];
  humanName?: string;
}

export interface MultiplePromptsResponse {
  success: boolean;
  data?: Record<string, string>;
  requested?: string[];
  generated?: string[];
  humanName?: string;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  available?: string[];
}

// Validation helpers
export const isValidCharacterConfig = (config: any): config is CharacterConfig => {
  return (
    typeof config === 'object' &&
    config !== null &&
    !Array.isArray(config) &&
    typeof config.name === 'string' &&
    typeof config.personality === 'string' &&
    typeof config.background === 'string' &&
    typeof config.speaking_style === 'string'
  );
};

export const isValidCreateRequest = (body: any): body is CreateCharacterRequest => {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof body.name === 'string' &&
    body.name.trim().length > 0 &&
    isValidCharacterConfig(body.config)
  );
};

export const isValidUpdateRequest = (body: any): body is UpdateCharacterRequest => {
  return (
    typeof body === 'object' &&
    body !== null &&
    isValidCharacterConfig(body.config)
  );
};