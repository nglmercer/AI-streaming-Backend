// routes/wsRouter.ts

import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { textResponse,streamResponse,memory } from '../ai/ai_response.js'; // Asumimos que este archivo existe y exporta la función
import { parseClientMessage, sendMessage } from '../ws/wsUtils.js';
import type { InputEvent,ClientMessage,ErrorPayload,InputEventWs } from '../ws/types.ts';
import { textToSpeech,processAudioChunkToBase64 } from './wshandler/speechTTS.js';
import { cleanTextAndGetRemovedValues } from '../tools/cleantext.js';
/**
 * Crea y adjunta un servidor WebSocket nativo al servidor HTTP.
 * @param httpServer La instancia del servidor HTTP de Node.js
 */
export default function createWsRouter(httpServer: HttpServer) {
  // 1. Crea el servidor WebSocket nativo y lo adjunta al servidor HTTP
  //    en la ruta especificada.
  const wss = new WebSocketServer({ server: httpServer, path: '/client-ws' });

  // 2. El evento 'connection' nos da el socket nativo `ws` y la petición `req`.
  wss.on('connection', (ws: WebSocket) => {
    console.log('✅ Cliente WebSocket conectado (vía ws nativo)');

    // 3. Escuchamos el evento 'message' para todos los mensajes entrantes.
    //    Nosotros nos encargamos del enrutamiento basado en el contenido.
    ws.on('message', async (rawData) => {
      const clientMessage  = parseClientMessage(rawData);

      // Si el mensaje no tiene el formato esperado, lo ignoramos.
   if (!clientMessage) {
      // Si el mensaje es inválido, enviar un error
      sendMessage(ws, 'error', { message: 'Formato de mensaje inválido.' });
      return;
    }

      // 4. Enrutamos manualmente basado en la propiedad `type`.
      switch (clientMessage.type) {
        case 'text-input':
          const message = clientMessage as InputEventWs;
          console.log(`➡️ Evento "${message.type}" recibido con payload:`, message.text);
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
            
            // Enviamos un mensaje de error específico al cliente,
            // referenciando su petición si es posible.
            sendMessage(
              ws, 
              'error',
              { message: error.message || 'Error interno del servidor', originalEvent: 'text-input' },
              message.requestId
            );
          }
          break;

        default:
          console.log('❌ Evento desconocido recibido:', clientMessage);
      }
    });

    ws.on('close', () => {
      console.log('🔻 Cliente WebSocket desconectado');
    });

    ws.on('error', (error: Error) => {
      console.error('❌ Error en el socket del cliente:', error);
    });
  });

  console.log('🚀 Servidor WebSocket nativo listo en /client-ws');
  return wss;
}