// en characterTools.ts

import { z } from 'zod';
import { tool } from 'ai';
import { getAllExpressions, getAllMotions } from '../tools/model-loader.js';
import { messageQueue } from './messageQueue.js';  
// Esto se debe ejecutar en un contexto async. Podrías envolverlo en una función async.
export async function getCharacterTools() {
    const availableExpressions = await getAllExpressions('shizuku');
    const availableMotions = await getAllMotions('shizuku');

    // Validación para asegurar que los arrays no estén vacíos para z.enum
    if (!availableExpressions || !availableMotions || availableExpressions.length === 0 || availableMotions.length === 0) {
        throw new Error("Expressions or motions list is empty.");
    }

    return {
        setExpression: tool({
            description: 'Usa esta herramienta para cambiar la expresión facial del personaje.',
            parameters: z.object({ // 'inputSchema' se renombra a 'parameters' en v4
                expressionName: z.enum(availableExpressions as [string, ...string[]])
                    .describe('El nombre de la expresión a mostrar.'),
            }),
            execute: async ({ expressionName }) => {
                console.log(`[TOOL CALL] El personaje ahora tiene la expresión: ${expressionName}`);
                return { success: true, expression: expressionName };
            },
        }),

        triggerMotion: tool({
            description: 'Usa esta herramienta para ejecutar un movimiento o animación corporal.',
            parameters: z.object({
                // CORRECCIÓN: Usar availableMotions en lugar de availableExpressions
                motionName: z.enum(availableMotions as [string, ...string[]])
                    .describe('El nombre del movimiento a ejecutar.'),
            }),
            execute: async ({ motionName }) => {
                console.log(`[TOOL CALL] El personaje está ejecutando el movimiento: ${motionName}`);
                return { success: true, motion: motionName };
            },
        }),
        // Dentro de getCharacterTools(), debajo de triggerMotion...

        addMessage: tool({
            description: 'Añade un mensaje a la cola interna del personaje.',
            parameters: z.object({
                text: z.string().describe('Contenido del mensaje.'),
            }),
            execute: async ({ text }) => {
                const msg = messageQueue.add(text);
                console.log(`[TOOL CALL] Mensaje añadido: ${msg.text} (id=${msg.id})`);
                return { success: true, messageId: msg.id };
            },
        }),

        markMessageAsRead: tool({
            description: 'Marca un mensaje específico como leído.',
            parameters: z.object({
                id: z.string().describe('UUID del mensaje a marcar como leído.'),
            }),
            execute: async ({ id }) => {
                const ok = messageQueue.markAsRead(id);
                console.log(`[TOOL CALL] Marcar como leído id=${id} -> ${ok ? 'OK' : 'NOT FOUND'}`);
                return { success: ok };
            },
        }),
        // Dentro de getCharacterTools(), junto a las demás herramientas...

        getNextMessage: tool({
            description: 'Obtiene el siguiente mensaje no leído y lo marca como leído automáticamente.',
            parameters: z.object({}), // Sin parámetros
            execute: async () => {
                const msg = messageQueue.getNextUnread();
                if (!msg) {
                console.log('[TOOL CALL] No hay mensajes sin leer.');
                return { success: false, message: null };
                }
                console.log(`[TOOL CALL] Mensaje leído: ${msg.text} (id=${msg.id})`);
                return { success: true, message: msg };
            },
        }),
    };
}