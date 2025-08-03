// types/ws.ts

/**
 * Representa un mensaje genérico enviado desde el cliente al servidor.
 * @template T El tipo de dato del payload.
 */
export interface ClientMessage<T = any> {
  /** El nombre del evento que el cliente emite. Ej: 'send-message', 'user-typing' */
  type: string;
  /** La carga de datos asociada al evento. */
  payload: T;
  /** Un ID opcional para que el servidor pueda responder a una petición específica. */
  requestId?: string;
  
}

/**
 * Representa un mensaje genérico enviado desde el servidor al cliente.
 * @template T El tipo de dato del payload.
 */
export interface ServerMessage<T = any> {
  /** El nombre del evento que el servidor emite. Ej: 'new-message', 'error' */
  event: string;
  /** La carga de datos asociada al evento. */
  payload: T;
  /** Si este mensaje es una respuesta, contiene el `requestId` de la petición original. */
  inReplyTo?: string;
}

// --- Ejemplos de Payloads Específicos (para mayor seguridad de tipos) ---

/** Payload para cuando un cliente envía un mensaje de texto. */
export interface ClientSendMessagePayload {
  text: string;
}

/** Payload para cuando el servidor reenvía un nuevo mensaje a todos los clientes. */
export interface ServerNewMessagePayload {
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

/** Payload para cuando el servidor responde con un error. */
export interface ErrorPayload {
  message: string;
  code?: string; // Ej: 'INVALID_FORMAT', 'FORBIDDEN'
}
export interface InputEvent {
  type: 'text-input';
  text: string;
  id?: string | string[];
}
export type InputEventWs = ClientMessage<{ text: string }> & InputEvent;