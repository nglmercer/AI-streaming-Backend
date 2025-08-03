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
    
    // Verificar si hay expresiones o movimientos incompletos
    const incompletePattern = /<[^>]*$|\[[^\]]*$/;
    if (incompletePattern.test(text)) {
        console.warn('Texto contiene expresiones incompletas:', text);
        // Retornar el texto sin procesar si hay expresiones incompletas
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
        } else {
            // Si no es válido, mantener el texto original
            console.warn(`Expresión/movimiento no reconocido: ${cleanValue}`);
            return match; // No remover del texto
        }
        
        return ''; // Remover del texto
    });
    
    // Limpiar espacios extra que puedan haber quedado
    const finalCleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    return { cleanedText: finalCleanedText, removedValues };
}

// Función auxiliar para validar si un texto tiene expresiones completas
function hasCompleteExpressions(text: string): boolean {
    const incompletePattern = /<[^>]*$|\[[^\]]*$/;
    return !incompletePattern.test(text);
}

// Función auxiliar para detectar expresiones parciales al final del texto
function getPartialExpression(text: string): string | null {
    const partialMatch = text.match(/<[^>]*$|\[[^\]]*$/);
    return partialMatch ? partialMatch[0] : null;
}

export { cleanTextAndGetRemovedValues, hasCompleteExpressions, getPartialExpression };

/* 
Ejemplos de uso y casos de prueba:

// Caso normal - expresiones completas
const texto1 = "¡Hola! <happy> ¿Cómo estás? [wave]";
// Resultado: cleanedText: "¡Hola!  ¿Cómo estás? ", removedValues: [<happy>, [wave]]

// Caso problemático - expresión incompleta
const texto2 = "¡Hola! <hap";
// Resultado: cleanedText: "¡Hola! <hap", removedValues: [] (no se procesa)

// Caso mixto
const texto3 = "Texto normal <happy> más texto [wav";
// Resultado: cleanedText: "Texto normal <happy> más texto [wav", removedValues: [] (no se procesa por expresión incompleta)

// Caso de chunks que se unen correctamente
const chunk1 = "Hola <hap";
const chunk2 = "py> mundo";
const textoCompleto = chunk1 + chunk2; // "Hola <happy> mundo"
// Resultado: cleanedText: "Hola  mundo", removedValues: [<happy>]
*/