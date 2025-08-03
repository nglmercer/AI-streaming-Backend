import { WebSocket, type RawData } from 'ws';
import { streamResponse, memory } from '../../ai/ai_response.js';
import { parseClientMessage, sendMessage } from '../wsUtils.js';
import type { InputEvent, ClientMessage, InputEventWs } from '../types.js';
import { textToSpeech } from './speechTTS.js';
import { cleanTextAndGetRemovedValues } from '../../tools/cleantext.js';
import { TTS_Config } from '../../config.js';
import { getImageFiles } from '../../tools/assets.js';
import { markAsRead } from '../../tools/messageQueue.js';
import { getOrCreateBuffer, deleteBufferForConnection } from '../../tools/chunkbuffer.js';

async function handleEvents(ws: WebSocket, rawData: RawData) {
  const clientMessage = parseClientMessage(rawData);
  if (!clientMessage) {
    sendMessage(ws, 'error', { message: 'Formato de mensaje inválido.' });
    return;
  }

  switch (clientMessage.type) {
    case 'text-input':
      await textInput(clientMessage as InputEventWs, ws);
      break;
    case 'fetch-backgrounds':
      await fetchBackgrounds(ws);
      break;
    default:
      sendMessage(ws, 'error', { message: `Evento desconocido: ${clientMessage.type}` });
  }
}

async function textInput(message: InputEventWs, ws: WebSocket) {
  const buffer = getOrCreateBuffer(ws);
  try {
    if (!message.text) return;
    
    const inputEvent: InputEvent = { type: 'text-input', text: message.text, id: message.id };
    const streamPayload = await streamResponse(inputEvent);
    
    if (!streamPayload) return;
    
    let full_text = '';
    
    sendMessage(ws, 'full-text', 'thinking');
    markAsRead(message.id);
    
    for await (const chunk of streamPayload) {
      if (!chunk) continue;
      
      full_text += chunk;
      
      // El buffer ahora devuelve textos completos con sus expresiones
      const completeTexts = buffer.addChunk(chunk);
      
      for (const completeText of completeTexts) {
        await processCompleteTextWithExpressions(completeText, ws, message.requestId);
      }
    }
    
    // Procesar cualquier texto restante en el buffer
    const finalTexts = buffer.flush();
    for (const finalText of finalTexts) {
      await processCompleteTextWithExpressions(finalText, ws, message.requestId);
    }
    
    memory.addUserMessage(message.text);
    memory.addAIMessage(full_text);
    console.log("response", full_text);
    sendMessage(ws, 'complete', { message });
    
  } catch (error: any) {
    buffer.clear();
    sendMessage(
      ws,
      'error',
      { message: error.message || 'Error interno del servidor', originalEvent: 'text-input' },
      message.requestId
    );
  }
}

/**
 * NUEVA FUNCIÓN: Procesa texto manteniendo las expresiones sincronizadas con el audio.
 */
async function processCompleteTextWithExpressions(completeText: string, ws: WebSocket, requestId?: string) {
  // Siempre enviar el texto completo (con expresiones) para mostrar al usuario
  sendMessage(ws, 'full-text', completeText, requestId);
  
  if (completeText.length <= 2) return;
  
  try {
    // Limpiar el texto y obtener las expresiones
    const { cleanedText, removedValues } = await cleanTextAndGetRemovedValues(completeText);    
    // CAMBIO PRINCIPAL: Procesar audio y expresiones como una unidad
    if (cleanedText.trim() || removedValues.length > 0) {
      let audioData = null;
      
      // Solo generar audio si hay texto limpio
      if (cleanedText.trim()) {
        try {
          const resultTTS = await textToSpeech(cleanedText, TTS_Config.voice, TTS_Config.options);
          audioData = resultTTS.toBase64();
        } catch (ttsError) {
          console.warn('Error generando TTS:', ttsError);
          // Continuar sin audio, pero mantener las expresiones
        }
      }
      
      // ENVIAR AUDIO Y EXPRESIONES JUNTOS
      sendMessage(ws, 'audio', {
        audio: audioData,
        type: audioData ? 'audio' : 'expressions-only',//implement expressions-only
        text: completeText, // Texto original con expresiones
        cleanText: cleanedText, // Texto limpio para referencia
        payload: removedValues // Expresiones a aplicar
      }, requestId);
      
    }
  } catch (cleanError) {
    console.warn('Error al procesar texto:', cleanError);
    // En caso de error, enviar al menos el texto sin procesar
    sendMessage(ws, 'full-text', completeText, requestId);
  }
}

async function fetchBackgrounds(ws: WebSocket) {
  sendMessage(ws, 'background-files', {
    files: getImageFiles()
  });
}

function handleConnectionClose(ws: WebSocket) {
  deleteBufferForConnection(ws);
}

export { handleEvents, handleConnectionClose };
/*
console.log("🖼️ Archivos de fondo disponibles:", getImageFiles());
// next EVENTIMPLEMENTATIONS
const newServerEvents = {
  'text-input': true,
  'audio': true,
  'complete': true, //send if event is processed
  'ERROR': true, //send ERRORS
  'full-text': true, //send full text
  'fetch-backgrounds': true,
  'fetch-configs': false,
  'fetch-history-list': false,
  'create-new-hits': false,
}

const newClientEvents = {
  'background-files': true, //{files:BackgroundFile[]}
  'set-model-and-conf': false, //{ conf_name?: string, conf_uid?: string, client_uid?: string, model_info?: ModelInfo }
}
*/