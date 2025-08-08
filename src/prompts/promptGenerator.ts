// Import JSON configurations
import basePrompt from './scheme/basePrompt.json' with { type: 'json' };
import styleRules from './scheme/styleRules.json' with { type: 'json' };
import miliConfig from './characters/mili.json' with { type: 'json' };
import lunaConfig from './characters/luna.json' with { type: 'json' };
import exactConfig from './characters/exact.json' with { type: 'json' };

// Types
interface Template {
  template: string;
}

interface CharacterConfig {
  [key: string]: string;
}

// Character registry - easily extensible
const AVAILABLE_CHARACTERS: Record<string, CharacterConfig> = {
  mili: miliConfig,
  luna: lunaConfig,
  exact: exactConfig,
  // Add new characters here easily
} as const;

// Get available character names for validation
export const getAvailableCharacters = (): string[] => {
  return Object.keys(AVAILABLE_CHARACTERS);
};

// Function to replace placeholders in the template
function generatePrompt(
  template: Template, 
  config: CharacterConfig, 
  humanName = 'User'
): string {
  let prompt = template.template;
  
  // Replace character-specific placeholders
  Object.keys(config).forEach(key => {
    prompt = prompt.replace(`{${key}}`, config[key]);
  });
  
  // Replace common placeholders
  prompt = prompt.replace('{human_name}', humanName);
  prompt = prompt.replace('{style_rules}', JSON.stringify(styleRules.dialogue_rules));
  
  return prompt;
}

// Main function to get character prompt by name
export function getCharacterPrompt(
  characterName: string, 
  humanName = 'User'
): string {
  const config = AVAILABLE_CHARACTERS[characterName.toLowerCase()];
  
  if (!config) {
    return `Character "${characterName}" not found. Available characters: ${getAvailableCharacters().join(', ')}`;
  }
  
  return generatePrompt(basePrompt, config, humanName);
}

// Function for group conversations
export function generateGroupPrompt(
  mainCharacter: string,
  humanName: string, 
  otherAIs: string[] = []
): string {
  const config = AVAILABLE_CHARACTERS[mainCharacter.toLowerCase()];
  
  if (!config) {
    return `Character "${mainCharacter}" not found. Available characters: ${getAvailableCharacters().join(', ')}`;
  }
  
  const groupIntro = otherAIs.length > 0 
    ? `In a group chat with ${humanName} and AIs: ${otherAIs.join(', ')}. `
    : '';
    
  return groupIntro + generatePrompt(basePrompt, config, humanName);
}

// Utility function to get multiple character prompts at once
export function getMultipleCharacterPrompts(
  characterNames: string[],
  humanName = 'User'
): Record<string, string> {
  const prompts: Record<string, string> = {};
  
  characterNames.forEach(name => {
    try {
      prompts[name] = getCharacterPrompt(name, humanName);
    } catch (error) {
      console.warn(`Skipping invalid character: ${name}`);
    }
  });
  
  return prompts;
}

// Convenience function for backwards compatibility
export function getAllCharacterPrompts(humanName = 'User'): Record<string, string> {
  return getMultipleCharacterPrompts(getAvailableCharacters(), humanName);
}

// Export for legacy compatibility (optional)
export const charactersPrompt = {
  // Legacy exports
  lunaPrompt: getCharacterPrompt('luna'),
  exactPrompt: getCharacterPrompt('exact'), // Fixed typo from 'exac' to 'exact'
  miliPrompt: getCharacterPrompt('mili'),
  
  // New functions
  getCharacterPrompt,
  generateGroupPrompt,
  getAvailableCharacters,
  getMultipleCharacterPrompts,
  getAllCharacterPrompts
};

// Example usage:
/*
// Get a single character prompt
const miliPrompt = getCharacterPrompt('mili', 'John');

// Get multiple character prompts
const prompts = getMultipleCharacterPrompts(['mili', 'luna'], 'John');

// Create group conversation
const groupPrompt = generateGroupPrompt('mili', 'John', ['luna', 'exact']);

// Get all available characters
const availableChars = getAvailableCharacters();
console.log('Available characters:', availableChars);

// Dynamic character selection
function createPromptForUser(characterName: string, userName: string) {
  try {
    return getCharacterPrompt(characterName, userName);
  } catch (error) {
    console.error(error.message);
    return null;
  }
}
*/