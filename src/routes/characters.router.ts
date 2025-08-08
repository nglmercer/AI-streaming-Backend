import { Hono } from 'hono';
import { readFile, writeFile, access } from 'fs/promises';
import { join } from 'path';
import { 
  getAvailableCharacters, 
  getCharacterPrompt, 
  getMultipleCharacterPrompts,
  getAllCharacterPrompts 
} from '../prompts/promptGenerator.js';
import {
  type CharacterConfig,
  type CreateCharacterRequest,
  type UpdateCharacterRequest,
  type MultiplePromptsRequest,
  isValidCharacterConfig,
  isValidCreateRequest,
  isValidUpdateRequest
} from '../types/characters.js';

const router = new Hono();
const CHARACTERS_PATH = join(process.cwd(), 'src/prompts/characters');

// Helper function to get character file path
const getCharacterPath = (characterName: string): string => {
  return join(CHARACTERS_PATH, `${characterName.toLowerCase()}.json`);
};

// Helper function to check if character exists
const characterExists = async (characterName: string): Promise<boolean> => {
  try {
    await access(getCharacterPath(characterName));
    return true;
  } catch {
    return false;
  }
};

// GET /characters → Get all available characters
router.get('/', async (c) => {
  try {
    const characters = getAvailableCharacters();
    return c.json({
      success: true,
      data: characters,
      count: characters.length
    });
  } catch (error) {
    console.error('Error getting characters:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get characters' 
    }, 500);
  }
});

// GET /characters/:name → Get specific character config
router.get('/:name', async (c) => {
  try {
    const characterName = c.req.param('name');
    const filePath = getCharacterPath(characterName);
    
    if (!(await characterExists(characterName))) {
      return c.json({
        success: false,
        error: `Character "${characterName}" not found`,
        available: getAvailableCharacters()
      }, 404);
    }

    const fileContent = await readFile(filePath, 'utf-8');
    const characterConfig = JSON.parse(fileContent);
    
    return c.json({
      success: true,
      data: {
        name: characterName,
        config: characterConfig
      }
    });
  } catch (error) {
    console.error('Error getting character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get character' 
    }, 500);
  }
});

// GET /characters/:name/prompt → Get generated prompt for character
router.get('/:name/prompt', async (c) => {
  try {
    const characterName = c.req.param('name');
    const humanName = c.req.query('humanName') || 'User';
    
    const prompt = getCharacterPrompt(characterName, humanName);
    
    return c.json({
      success: true,
      data: {
        character: characterName,
        humanName,
        prompt
      }
    });
  } catch (error) {
    console.error('Error generating prompt:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate prompt' 
    }, 400);
  }
});

// POST /characters → Create new character
router.post('/', async (c) => {
  try {
    const body = await c.req.json();
    
    if (!isValidCreateRequest(body)) {
      return c.json({
        success: false,
        error: 'Invalid request. Name and valid config are required'
      }, 400);
    }

    const { name, config } = body as CreateCharacterRequest;
    const characterName = name.toLowerCase();
    
    if (await characterExists(characterName)) {
      return c.json({
        success: false,
        error: `Character "${characterName}" already exists`
      }, 409);
    }

    const filePath = getCharacterPath(characterName);
    await writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
    
    return c.json({
      success: true,
      message: `Character "${characterName}" created successfully`,
      data: {
        name: characterName,
        config,
        path: filePath
      }
    }, 201);
  } catch (error) {
    console.error('Error creating character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create character' 
    }, 500);
  }
});

// PUT /characters/:name → Update existing character
router.put('/:name', async (c) => {
  try {
    const characterName = c.req.param('name').toLowerCase();
    const body = await c.req.json();
    
    if (!isValidUpdateRequest(body)) {
      return c.json({
        success: false,
        error: 'Invalid request. Valid config is required'
      }, 400);
    }

    if (!(await characterExists(characterName))) {
      return c.json({
        success: false,
        error: `Character "${characterName}" not found`,
        available: getAvailableCharacters()
      }, 404);
    }

    const { config } = body as UpdateCharacterRequest;

    const filePath = getCharacterPath(characterName);
    await writeFile(filePath, JSON.stringify(config, null, 2), 'utf-8');
    
    return c.json({
      success: true,
      message: `Character "${characterName}" updated successfully`,
      data: {
        name: characterName,
        config
      }
    });
  } catch (error) {
    console.error('Error updating character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update character' 
    }, 500);
  }
});

// PATCH /characters/:name → Partially update character
router.patch('/:name', async (c) => {
  try {
    const characterName = c.req.param('name').toLowerCase();
    const body = await c.req.json();
    
    if (!(await characterExists(characterName))) {
      return c.json({
        success: false,
        error: `Character "${characterName}" not found`,
        available: getAvailableCharacters()
      }, 404);
    }

    const filePath = getCharacterPath(characterName);
    const currentContent = await readFile(filePath, 'utf-8');
    const currentConfig = JSON.parse(currentContent);
    
    // Merge current config with new data
    const updatedConfig = { ...currentConfig, ...body };
    
    await writeFile(filePath, JSON.stringify(updatedConfig, null, 2), 'utf-8');
    
    return c.json({
      success: true,
      message: `Character "${characterName}" partially updated`,
      data: {
        name: characterName,
        config: updatedConfig,
        updated_fields: Object.keys(body)
      }
    });
  } catch (error) {
    console.error('Error patching character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update character' 
    }, 500);
  }
});

// DELETE /characters/:name → Delete character
router.delete('/:name', async (c) => {
  try {
    const characterName = c.req.param('name').toLowerCase();
    
    if (!(await characterExists(characterName))) {
      return c.json({
        success: false,
        error: `Character "${characterName}" not found`,
        available: getAvailableCharacters()
      }, 404);
    }

    const filePath = getCharacterPath(characterName);
    const { unlink } = await import('fs/promises');
    await unlink(filePath);
    
    return c.json({
      success: true,
      message: `Character "${characterName}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting character:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to delete character' 
    }, 500);
  }
});

// GET /characters/prompts/all → Get all character prompts
router.get('/prompts/all', async (c) => {
  try {
    const humanName = c.req.query('humanName') || 'User';
    const prompts = getAllCharacterPrompts(humanName);
    
    return c.json({
      success: true,
      data: prompts,
      humanName
    });
  } catch (error) {
    console.error('Error getting all prompts:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get prompts' 
    }, 500);
  }
});

// POST /characters/prompts/multiple → Get multiple character prompts
router.post('/prompts/multiple', async (c) => {
  try {
    const body = await c.req.json() as MultiplePromptsRequest;
    const { characters, humanName = 'User' } = body;
    
    if (!Array.isArray(characters)) {
      return c.json({
        success: false,
        error: 'Characters must be an array'
      }, 400);
    }

    const prompts = getMultipleCharacterPrompts(characters, humanName);
    
    return c.json({
      success: true,
      data: prompts,
      requested: characters,
      generated: Object.keys(prompts),
      humanName
    });
  } catch (error) {
    console.error('Error getting multiple prompts:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get prompts' 
    }, 500);
  }
});

export default router;