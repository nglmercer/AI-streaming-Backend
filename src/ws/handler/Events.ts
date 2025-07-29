import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { textResponse,streamResponse,memory } from '../../ai/ai_response.js'; // Asumimos que este archivo existe y exporta la función
import { parseClientMessage, sendMessage } from '../wsUtils.js';
import type { InputEvent,ClientMessage,ErrorPayload,InputEventWs } from '../types.js';
import { textToSpeech,processAudioChunkToBase64 } from './speechTTS.js';
import { cleanTextAndGetRemovedValues } from '../../tools/cleantext.js';

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

        default:
          console.log('❌ Evento desconocido recibido:', clientMessage);
      }
}
async function textInput(message:InputEventWs,ws:WebSocket) {
            try {
            if (!message.text) return;
            const inputEvent: InputEvent = { type: 'text-input', text: message.text };
            const streamPayload = await streamResponse(inputEvent);
            if (!streamPayload) return;
            let full_text = '';

            for await (const payload of streamPayload) {
              full_text += payload;
              sendMessage(ws, 'full-text', payload, message.requestId);
              if (!payload || payload.length <= 2) continue;
              const {cleanedText, removedValues} = await cleanTextAndGetRemovedValues(payload);
              const resultTTS = await textToSpeech(cleanedText,'es-PE-CamilaNeural',{
                'format': 'audio-24khz-48kbitrate-mono-mp3',
              })
              sendMessage(ws,'audio',{
                audio:resultTTS.toBase64(),
                type: 'audio',
                text: payload,
                payload:removedValues
              })
            }
            memory.addUserMessage(message.text);
            memory.addAIMessage(full_text);
            console.log("full_text",full_text)
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
export { handleEvents }