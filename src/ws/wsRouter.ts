// routes/wsRouter.ts
import type { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { handleEvents } from './handler/Events.js';
import { emitterConfig } from '../config.js';
/**
 * Crea y adjunta un servidor WebSocket nativo al servidor HTTP.
 * @param httpServer La instancia del servidor HTTP de Node.js
 */
export default function createWsRouter(httpServer: HttpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/client-ws' });

  wss.on('connection', (ws: WebSocket) => {
    emitterConfig.on('ERROR', (data: any) => {
      ws.send(JSON.stringify({
        event: 'ERROR',
        data
      }))
    })
    console.log('✅ Cliente WebSocket conectado (vía ws nativo)');
    ws.on('message', async (rawData) => {
      handleEvents(ws,rawData);
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