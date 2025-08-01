import { getExpressions,getMotions } from "./model-loader.js";
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
    const regex = /<([^>]*)>|(\[[^\]]*\])/g;
    const removedValues: RemovedValue[] = [];
    let lastIndex = 0;
    const allExpressions = await getExpressions(defaultModel);
    const allMotions = await getMotions(defaultModel);
    const cleanedText = text.replace(regex, (match, p1, p2, offset) => {
        let cleanValue = '';
        let type = ''
        if (p1) { // Si es un patrón con <>
            cleanValue = p1;
        } else if (p2) { // Si es un patrón con []
            cleanValue = p2.slice(1, -1); // Eliminar los corchetes
        }
        if (allExpressions && allExpressions.get(cleanValue)) {
            type = 'expression';
        } else if (allMotions && allMotions.get(cleanValue)) {
            type = 'motion';
        }
        removedValues.push({ value: match, position: offset, cleanValue, type: type as 'expression' | 'motion' | undefined });
        lastIndex = offset + match.length;
        return '';
    });

    return { cleanedText, removedValues };
}
export { cleanTextAndGetRemovedValues }
/* // Ejemplo de uso
const textoOriginal1 = "¡Estoy genial, gracias por preguntar! Siempre lista para una buena charla. ¿Y tú, cómo te encuentras hoy? <f01> <idle>";
const textoOriginal2 = "¡Estoy genial, gracias por preguntar! Siempre lista para una buena charla. ¿Y tú, cómo te encuentras hoy? [f01] [idle]";

const result1 = cleanTextAndGetRemovedValues(textoOriginal1);
const result2 = cleanTextAndGetRemovedValues(textoOriginal2);

console.log('Texto original:', textoOriginal1);
console.log('Texto limpio:', result1.cleanedText);
console.log('Valores eliminados con detalles:', result1.removedValues);

console.log('Texto original:', textoOriginal2);
console.log('Texto limpio:', result2.cleanedText);
console.log('Valores eliminados con detalles:', result2.removedValues); */