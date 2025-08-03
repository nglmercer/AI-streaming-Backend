import { getExpressions, getMotions } from "./model-loader.js";
import { getConfig } from "../config.js";

interface RemovedValue {
    value: string;
    position: number;
    cleanValue: string;
    type?: 'expression' | 'motion';
}

async function cleanTextAndGetRemovedValues(text: string): Promise<{ cleanedText: string; removedValues: RemovedValue[] }> {
    const config = await getConfig();
    const defaultModel = config.model2d;
   
    // Regex mejorado que maneja mejor los casos edge
    const regex = /<([^<>]*)>|\[([^\[\]]*)\]/g;
    const removedValues: RemovedValue[] = [];
   
    const allExpressions = await getExpressions(defaultModel);
    const allMotions = await getMotions(defaultModel);
   
    // Verificar si hay expression o movimientos incompletos
    const incompletePattern = /<[^>]*$|\[[^\]]*$/;
    if (incompletePattern.test(text)) {
        console.warn('Texto contiene expression incompletas:', text);
        // Retornar el texto sin procesar si hay expression incompletas
        return { cleanedText: text, removedValues: [] };
    }
   
    const cleanedText = text.replace(regex, (match, p1, p2, offset) => {
        let cleanValue = '';
        let type: 'expression' | 'motion' | undefined = undefined;
       
        if (p1 !== undefined) { // Patrón con <>
            cleanValue = p1.trim();
        } else if (p2 !== undefined) { // Patrón con []
            cleanValue = p2.trim();
        }
       
        // Verificar si es una expresión o movimiento válido
        if (allExpressions && allExpressions.has(cleanValue)) {
            type = 'expression';
        } else if (allMotions && allMotions.has(cleanValue)) {
            type = 'motion';
        }
       
        // Solo agregar a removedValues si es una expresión/movimiento válido
        if (type) {
            removedValues.push({
                value: match,
                position: offset,
                cleanValue,
                type
            });
            return ''; // Remover del texto para TTS
        } else {
            // Si no es válido, mantener el texto original
            console.warn(`Expresión/movimiento no reconocido: ${cleanValue}`);
            return match; // No remover del texto
        }
    });
   
    // Limpiar espacios extra que puedan haber quedado
    const finalCleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
/*     if (removedValues.length > 0) {
        console.log(`Proccess ${removedValues.length} expression:`, 
                   removedValues.map(rv => `${rv.type}: ${rv.cleanValue}`));
    } */
    
    return { cleanedText: finalCleanedText, removedValues };
}

// Función auxiliar para validar si un texto tiene expression completas
function hasCompleteExpressions(text: string): boolean {
    const incompletePattern = /<[^>]*$|\[[^\]]*$/;
    return !incompletePattern.test(text);
}

// Función auxiliar para detectar expression parciales al final del texto
function getPartialExpression(text: string): string | null {
    const partialMatch = text.match(/<[^>]*$|\[[^\]]*$/);
    return partialMatch ? partialMatch[0] : null;
}

// NUEVA: Función para verificar si un chunk tiene solo expression
function isExpressionOnly(text: string): boolean {
    const withoutExpressions = text.replace(/<[^>]*>|\[[^\]]*\]/g, '').trim();
    const hasExpressions = /<[^>]*>|\[[^\]]*\]/.test(text);
    return hasExpressions && withoutExpressions.length === 0;
}

export { 
    cleanTextAndGetRemovedValues, 
    hasCompleteExpressions, 
    getPartialExpression,
    isExpressionOnly 
};