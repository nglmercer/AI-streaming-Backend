// utils/wsUtils.ts

import { WebSocket } from 'ws';
import type { RawData } from 'ws';
import type { ClientMessage, ServerMessage } from './types.ts';

/**
 * Parsea de forma segura un mensaje entrante de un cliente WebSocket.
 * Espera que el mensaje sea un string JSON con formato ClientMessage.
 * @param message El dato crudo recibido del socket.
 * @returns El objeto ClientMessage parseado, o null si el formato es inválido.
 */
export function parseClientMessage(message: RawData): ClientMessage | null {
  try {
    const dataString = message.toString('utf-8');
    const parsedData = JSON.parse(dataString);

    // Validación básica de la estructura del mensaje
    if (parsedData && typeof parsedData.event === 'string' && 'text' in parsedData) {
      return parsedData as ClientMessage;
    }
    return parsedData;
  } catch (error) {
    console.error('Error al parsear mensaje JSON del cliente:', error);
    return null;
  }
}

/**
 * Envía un mensaje estructurado y tipado a un cliente WebSocket.
 * @param ws La instancia del WebSocket del cliente.
 * @param event El nombre del evento a emitir.
 * @param text La carga de datos a enviar.
 * @param inReplyTo (Opcional) El ID de la petición del cliente a la que se responde.
 */
export function sendMessage(ws: WebSocket, event: string, payload: any, inReplyTo?: string): void {
  // Asegurarse de que el socket está abierto antes de intentar enviar.
  if (ws.readyState !== WebSocket.OPEN) {
    console.warn('Intento de enviar mensaje a un socket no abierto.');
    return;
  }

  const message: ServerMessage = { event,payload, text:payload, inReplyTo };
  ws.send(JSON.stringify(message));
}