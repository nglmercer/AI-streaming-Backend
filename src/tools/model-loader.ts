// src/lib/model-loader.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { cwd } from 'process';
import { type Live2DModelSetting } from '../types/model.types.js';

/* -------------------------------------------------------------------------- */
/*                               IMPLEMENTATION                               */
/* -------------------------------------------------------------------------- */

const MODELS_DIR = join(cwd(), 'src', 'public', 'models');

/**
 * Lee y parsea el archivo de configuración de un modelo Live2D.
 * Soporta tanto v2 (*.model.json) como v3 (*.model3.json).
 *
 * @param modelName - Nombre de la carpeta que contiene al modelo.
 * @returns Objeto JSON con la configuración o `undefined` si falla.
 */
export async function getModel(modelName: string): Promise<Live2DModelSetting | undefined> {
  if (!modelName){
    return;
  }
  // Posibles rutas a probar (ordenados por prioridad)
  const candidates = [
    join(MODELS_DIR, modelName, `${modelName}.model3.json`), // v3
    join(MODELS_DIR, modelName, `${modelName}.model.json`)   // v2
  ];

  for (const filePath of candidates) {
    try {
      const raw = readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      // Ignorar y probar siguiente candidato
    }
  }
  // Nada encontrado
  return;
}

export async function getExpressions(modelName: string): Promise<Map<string, string> | undefined> {
  const model = await getModel(modelName);
  if (!model) return;

  const expressions = new Map<string, string>();

  if ('expressions' in model) {
    // Modelo v2
    for (const expr of model.expressions!) {
      expressions.set(expr.name, expr.file);
    }
  } else if ('FileReferences' in model) {
    // Modelo v3
    for (const expr of model.FileReferences.Expressions) {
      expressions.set(expr.Name, expr.File);
    }
  }

  return expressions;
}

/**
 * Obtiene todos los movimientos (Motions) de un modelo.
 * @param modelName - Nombre del modelo.
 * @returns Map con el nombre del movimiento como clave y un array de archivos como valor.
 */
export async function getMotions(modelName: string): Promise<Map<string, string[]> | undefined> {
  const model = await getModel(modelName);
  if (!model) return;

  const motions = new Map<string, string[]>();

  if ('motions' in model) {
    // Modelo v2
    for (const [motionName, entries] of Object.entries(model.motions)) {
      motions.set(motionName, entries.map(entry => entry.file));
    }
  } else if ('FileReferences' in model) {
    // Modelo v3
    for (const [motionName, entries] of Object.entries(model.FileReferences.Motions)) {
      motions.set(motionName, entries.map(entry => entry.File));
    }
  }

  return motions;
}
/**
 * Obtiene todas las expresiones de un modelo como un array.
 * @param modelName - El nombre del modelo.
 * @returns Un array de objetos con el nombre y archivo de cada expresión.
 */
export async function getAllExpressions(modelName: string): Promise<string[] | undefined> {
  const model = await getExpressions(modelName);
  if (!model) return [];

  return Array.from(model.keys());
}

/**
 * Obtiene todos los movimientos de un modelo como un array.
 * @param modelName - El nombre del modelo.
 * @returns Un array de objetos con el nombre y archivos de cada movimiento.
 */
export async function getAllMotions(modelName: string): Promise<string[] | undefined> {
  const model = await getMotions(modelName);
  if (!model) return [];

  return Array.from(model.keys());
}