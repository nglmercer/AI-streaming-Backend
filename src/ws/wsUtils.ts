// utils/wsUtils.ts

import { WebSocket,type RawData } from 'ws';
import type { ClientMessage, ServerMessage } from '../types/ws.js';

/**
 * Parsea de forma segura un mensaje entrante de un cliente WebSocket.
 * Valida que el mensaje sea un string JSON con la estructura de `ClientMessage`.
 *
 * @param message El dato crudo (RawData) recibido del socket.
 * @returns El objeto `ClientMessage` parseado, o `null` si el formato es inválido o hay un error.
 */
export function parseClientMessage(message: RawData, valid = true): ClientMessage | null {
  try {
    const dataString = message.toString('utf-8');
    const parsedData = JSON.parse(dataString);
    
    // Validación más estricta de la estructura del mensaje
    if (
      parsedData &&
      typeof parsedData.type === 'string' &&
      !(valid && 'payload' in parsedData)
    ) {
      // El objeto cumple con la estructura mínima de ClientMessage
      return parsedData as ClientMessage;
    }

    console.warn('Mensaje de cliente con formato inválido recibido:', dataString);
    return null;
  } catch (error) {
    console.error('Error al parsear mensaje JSON del cliente:', error);
    return null;
  }
}

/**
 * Envía un mensaje estructurado y tipado a un cliente WebSocket.
 * La función es genérica para permitir un `payload` fuertemente tipado.
 *
 * @template T El tipo del payload que se enviará.
 * @param ws La instancia del WebSocket del cliente.
 * @param event El nombre del evento a emitir (ej: 'new-message', 'error').
 * @param payload La carga de datos a enviar.
 * @param inReplyTo (Opcional) El ID de la petición del cliente a la que se responde.
 * @param extend (Opcional) Si es `true`, el payload se extiende en el objeto raíz.
 */
export function sendMessage<T extends Record<string, unknown | any> = Record<string, unknown | any>>(
  ws: WebSocket,
  event: string,
  payload: T | string,
  inReplyTo?: string,
  extend = true
): void {
  if (ws.readyState !== WebSocket.OPEN) {
    console.warn('Intento de enviar mensaje a un socket no abierto.');
    return;
  }

  const baseMessage: { event: string; inReplyTo?: string } = {
    event,
    ...(inReplyTo !== undefined && { inReplyTo }),
  };

  const message = extend && typeof payload === 'object'
    ? { ...baseMessage, ...payload }
    : { ...baseMessage, payload };

  ws.send(JSON.stringify(message));
}