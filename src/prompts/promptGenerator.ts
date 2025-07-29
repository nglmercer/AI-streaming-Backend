// Import JSON configurations
import basePrompt from './scheme/basePrompt.json' with { type: 'json' };
import miliConfig from './characters/mili.json' with { type: 'json' };
import styleRules from './scheme/styleRules.json' with { type: 'json' };
import lunaConfig from './characters/luna.json' with { type: 'json' };
import exactConfig from './characters/exact.json' with { type: 'json' };
// Function to replace placeholders in the template
function generatePrompt(template:{template: string}, config:{[key: string]: string}, humanName = 'User') {
  let prompt = template.template;
  Object.keys(config).forEach(key => {
    prompt = prompt.replace(`{${key}}`, config[key]);
  });
  prompt = prompt.replace('{human_name}', humanName);
  prompt = prompt.replace('{style_rules}', JSON.stringify(styleRules.dialogue_rules));
  return prompt;
}

// Example usage for Mili
export const miliPrompt = generatePrompt(basePrompt, miliConfig);

// Example for group conversation
export function generateGroupPrompt(humanName: string, otherAIs: string[]) {
  const groupIntro = `In a group chat with ${humanName} and AIs: ${otherAIs.join(', ')}. `;
  return groupIntro + generatePrompt(basePrompt, miliConfig, humanName);
}
export const lunaPrompt = generatePrompt(basePrompt, lunaConfig);
export const exacPrompt = generatePrompt(basePrompt, exactConfig);
console.log("lunaPrompt", lunaPrompt);
console.log("miliPrompt", miliPrompt);