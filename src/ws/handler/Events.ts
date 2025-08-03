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
      // Silenciosamente ignorar eventos desconocidos o enviar un error si es necesario
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
      
      // CORRECCIÓN 1: 'addChunk' ahora devuelve un array directamente
      const completeTexts = buffer.addChunk(chunk);
      
      for (const completeText of completeTexts) {
        await processCompleteText(completeText, ws, message.requestId);
      }
    }
    
    // CORRECCIÓN 2: 'flushAll' ahora se llama 'flush'
    const finalTexts = buffer.flush();
    for (const finalText of finalTexts) {
      await processCompleteText(finalText, ws, message.requestId);
    }
    
    memory.addUserMessage(message.text);
    memory.addAIMessage(full_text);
    console.log("response",full_text)
    sendMessage(ws, 'complete', { message });
    
  } catch (error: any) {
    buffer.clear(); // Limpiar el buffer en caso de error
    sendMessage(
      ws,
      'error',
      { message: error.message || 'Error interno del servidor', originalEvent: 'text-input' },
      message.requestId
    );
  }
}

async function processCompleteText(completeText: string, ws: WebSocket, requestId?: string) {
  sendMessage(ws, 'full-text', completeText, requestId);
  
  if (completeText.length <= 2) return;
  
  try {
    const { cleanedText, removedValues } = await cleanTextAndGetRemovedValues(completeText);
    
    if (cleanedText.trim()) {
      try {
        const resultTTS = await textToSpeech(cleanedText, TTS_Config.voice, TTS_Config.options);
        sendMessage(ws, 'audio', {
          audio: resultTTS.toBase64(),
          type: 'audio',
          text: completeText,
          payload: removedValues
        });
      } catch (ttsError) {
        // En caso de error de TTS, no se envía audio, pero el flujo continúa.
      }
    } else if (removedValues.length > 0) {
      sendMessage(ws, 'audio', {
        audio: null,
        //type: 'expression-only', implement in client
        text: completeText,
        payload: removedValues
      });
    }
  } catch (cleanError) {
     // Error al limpiar texto, se podría notificar pero por ahora es silencioso.
  }
}

async function fetchBackgrounds(ws: WebSocket) {
  sendMessage(ws, 'background-files', {
    files: getImageFiles()
  });
}

function handleConnectionClose(ws: WebSocket) {
  // CORRECCIÓN 3: Usar la nueva función para limpiar el buffer de forma segura.
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