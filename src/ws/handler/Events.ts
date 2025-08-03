import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { textResponse,streamResponse,memory } from '../../ai/ai_response.js'; // Asumimos que este archivo existe y exporta la función
import { parseClientMessage, sendMessage } from '../wsUtils.js';
import type { InputEvent,ClientMessage,ErrorPayload,InputEventWs } from '../types.js';
import { textToSpeech,processAudioChunkToBase64 } from './speechTTS.js';
import { cleanTextAndGetRemovedValues } from '../../tools/cleantext.js';
import { getConfig,TTS_Config } from '../../config.js';
import { getImageFiles } from '../../tools/assets.js';
async function handleEvents(ws: WebSocket, rawData: RawData) {
          const clientMessage  = parseClientMessage(rawData);
      if (!clientMessage) {
          sendMessage(ws, 'error', { message: 'Formato de mensaje inválido.' });
          return;
        }
      switch (clientMessage.type) {
        case 'text-input':
          const message = clientMessage as InputEventWs;
          console.log(`➡️ Evento "${message.type}" recibido con payload:`, message.text);
          textInput(message,ws);
          break;
        case 'fetch-backgrounds':
          fetchBackgrounds(ws);
          break;
        default:
          console.log('❌ Evento desconocido recibido:', clientMessage);
      }
}
async function textInput(message:InputEventWs,ws:WebSocket) {
            try {
            if (!message.text) return;
            const inputEvent: InputEvent = { type: 'text-input', text: message.text,id:message.id  };
            const startTime = performance.now();
            const streamPayload = await streamResponse(inputEvent);
            const endTime = performance.now();
            console.log("time",endTime - startTime,{
              endTime,
              startTime
            })
            if (!streamPayload) return;
            let full_text = '';
            sendMessage(ws,'full-text','thinking')
            for await (const payload of streamPayload) {
              full_text += payload;
              sendMessage(ws, 'full-text', payload, message.requestId);
              if (!payload || payload.length <= 2) continue;
              const {cleanedText, removedValues} = await cleanTextAndGetRemovedValues(payload);
              const resultTTS = await textToSpeech(cleanedText,TTS_Config.voice,TTS_Config.options);
              sendMessage(ws,'audio',{
                audio:resultTTS.toBase64(),
                type: 'audio',
                text: payload,
                payload:removedValues
              })
            }
            memory.addUserMessage(message.text);
            memory.addAIMessage(full_text);
            console.log("full_text",full_text);
            sendMessage<InputEventWs>(ws,'complete',message)
          } catch (error: any) {
            console.error(`❌ Error procesando "${message.type}":`, error);

            sendMessage(
              ws, 
              'error',
              { message: error.message || 'Error interno del servidor', originalEvent: 'text-input' },
              message.requestId
            );
          }
}
async function fetchBackgrounds(ws:WebSocket) {
  sendMessage(ws,'background-files',{
    files:getImageFiles()
  })
}
console.log("getImageFiles()",getImageFiles())
// next EVENTIMPLEMENTATIONS
const newServerEvents = {
  'text-input': true,
  'audio':true,
  'complete':true,//send if event is proccessed
  'ERROR': true,//send ERRORS
  'full-text':true,//send full text
  'fetch-backgrounds': true,
  'fetch-configs':false,
  'fetch-history-list':false,
  'create-new-hits':false,
}
const newClientEvents = {
  'background-files': true,//{files:BackgroundFile[]}
  'set-model-and-conf':false,//{ conf_name?: string, conf_uid?: string, client_uid?: string, model_info?: ModelInfo }
}
export { handleEvents }