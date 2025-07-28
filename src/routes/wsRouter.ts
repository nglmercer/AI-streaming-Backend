// routes/wsRouter.ts

import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { handleInputEvent } from './wshandler/inputMSG.js'; // Asumimos que este archivo existe y exporta la función
import { parseClientMessage, sendMessage } from '../ws/wsUtils.js';
import type { InputEvent } from '../ws/types.ts';

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
      const message = parseClientMessage(rawData);

      // Si el mensaje no tiene el formato esperado, lo ignoramos.
      if (!message) {
        sendMessage(ws, 'error', 'Formato de mensaje inválido.');
        return;
      }

      // 4. Enrutamos manualmente basado en la propiedad `type`.
      switch (message.type) {
        case 'text-input':
          console.log(`➡️ Evento "${message.type}" recibido con payload:`, message.text);
          try {
            if (!message.text) return;
            const inputEvent: InputEvent = { type: 'text-input', text: message.text };
            const responsePayload = await handleInputEvent(inputEvent);

            console.log('⬅️ Enviando respuesta "full-text"');
            
            // 5. Enviamos la respuesta usando nuestra utilidad.
            //    Si el cliente envió un `requestId`, lo incluimos en la respuesta
            //    para que pueda identificarla. Esto reemplaza el patrón request/resolve.
            sendMessage(ws, 'full-text', responsePayload, message.requestId);

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
          console.warn(`⚠️ Evento desconocido recibido: "${message.type}"`);
          sendMessage(
            ws,
            'error',
            `Evento '${message.type}' no soportado.`,
            message.requestId
          );
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