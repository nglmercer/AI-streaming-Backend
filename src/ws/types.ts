// models/wsEvents.ts

/**
 * Representa un mensaje enviado desde el cliente al servidor.
 */
export interface ClientMessage {
  type: string;      // El nombre del evento, ej: 'text-input'
  payload: any;       // La carga de datos del mensaje
  text?: string;
  requestId?: string; // ID opcional para seguir una petición/respuesta
}

/**
 * Representa un mensaje enviado desde el servidor al cliente.
 */
export interface ServerMessage {
  event: string;      // El nombre del evento, ej: 'full-text', 'error'
  text?: string;
  payload?: any;       // La carga de datos
  inReplyTo?: string; // El ID de la petición original a la que se responde
}

/**
 * Define la forma del evento que espera el manejador de lógica.
 */
export interface InputEvent {
  type: 'text-input';
  text: string;
}