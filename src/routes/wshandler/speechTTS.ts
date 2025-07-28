import { EdgeTTS,type SynthesisOptions } from "edge-tts-fork";
import type { RawData } from "ws";
async function textToSpeech(text:string,voice:string,options:SynthesisOptions) {
    try {
        const tts = new EdgeTTS();
        await tts.synthesize(text, voice, options);
        return tts;
    } catch (error) {
        throw error;
    }
}
// Esta función es correcta y muy útil para manejar los datos del stream.
function ensureBuffer(data: RawData): Buffer {
    if (Buffer.isBuffer(data)) {
        return data;
    }
    if (data instanceof ArrayBuffer) {
        return Buffer.from(data);
    }
    if (Array.isArray(data)) {
        // El stream puede enviar un array de Buffers
        return Buffer.concat(data as Uint8Array[]);
    }
    if (typeof data === 'string') {
        // Aunque es menos común para audio, es bueno tenerlo
        return Buffer.from(data, 'utf-8');
    }
    throw new Error(`Unsupported RawData type: ${typeof data}`);
}

/**
 * Procesa un chunk de datos crudos del stream.
 * Extrae los datos de audio y los convierte a Base64.
 * 
 * @param data El chunk de datos crudos recibido del stream.
 * @returns Una cadena Base64 con el audio del chunk, o una cadena vacía si el chunk no contiene audio.
 */
function processAudioChunkToBase64(data: RawData): string {
    // 1. Asegurarnos de que tenemos un Buffer unificado
    const buffer = ensureBuffer(data);

    // 2. Definir el encabezado que precede a los datos de audio (solo en el primer chunk)
    const needle = "Path:audio\r\n";
    const headerBuffer = Buffer.from(needle);
    
    let audioData: Buffer;

    // 3. Buscar el encabezado en el chunk actual
    const headerIndex = buffer.indexOf(headerBuffer);

    if (headerIndex !== -1) {
        // CASO A: Este es el primer chunk, contiene el encabezado.
        // Extraemos solo la parte del audio, que está DESPUÉS del encabezado.
        const audioStartIndex = headerIndex + headerBuffer.length;
        audioData = buffer.subarray(audioStartIndex);
    } else {
        // CASO B: Este es un chunk subsecuente, es 100% audio.
        // El buffer completo es nuestro audio.
        audioData = buffer;
    }

    // 4. Si hay datos de audio en este chunk, convertirlos a Base64.
    if (audioData.length > 0) {
        return audioData.toString('base64');
    }

    // 5. Si no hay audio en este chunk (ej. un chunk vacío o solo con metadatos), retornar una cadena vacía.
    return "";
}

export { textToSpeech,ensureBuffer,processAudioChunkToBase64 };