// src/tools/messageQueue.ts
// Cola de mensajes para un MCP (usada internamente por characterTools.ts)

export interface Message {
  id: string;               // UUID v4
  text: string;             // Contenido del mensaje
  isRead: boolean;          // Estado de lectura
  createdAt: Date;          // Momento de creación
  readAt?: Date;            // Momento en que se marcó como leído (opcional)
}

/**
 * Clase simple y liviana para gestionar una cola de mensajes FIFO
 * (First-In-First-Out). Los mensajes se pueden añadir y marcar como leídos.
 */
export class MessageQueue {
  private queue: Message[] = [];

  /**
   * Añade un nuevo mensaje a la cola.
   * @param text Contenido del mensaje
   * @returns El mensaje creado
   */
  add(text: string): Message {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      text,
      isRead: false,
      createdAt: new Date(),
    };
    this.queue.push(newMessage);
    return newMessage;
  }
  getNextUnread(isRed = true): Message | undefined {
    const msg = this.queue.find(m => !m.isRead);
    if (msg) {  
      msg.isRead = isRed;
      msg.readAt = new Date();
    }
    return msg;
  }
  /**
   * Marca un mensaje específico como leído.
   * @param id UUID del mensaje a marcar
   * @returns true si el mensaje fue encontrado y marcado; false en caso contrario
   */
  markAsRead(id: string): boolean {
    const msg = this.queue.find(m => m.id === id);
    if (!msg) return false;

    msg.isRead = true;
    msg.readAt = new Date();
    return true;
  }

  /**
   * Marca como leídos todos los mensajes que aún no lo están.
   * @returns Cantidad de mensajes marcados
   */
  markAllAsRead(): number {
    let count = 0;
    this.queue.forEach(msg => {
      if (!msg.isRead) {
        msg.isRead = true;
        msg.readAt = new Date();
        count++;
      }
    });
    return count;
  }

  /**
   * Devuelve una copia superficial (shallow copy) del array interno.
   * Útil para lecturas sin mutar la cola.
   */
  snapshot(): readonly Message[] {
    return [...this.queue];
  }

  /**
   * Devuelve solo los mensajes no leídos.
   */
  unread(): readonly Message[] {
    return this.queue.filter(m => !m.isRead);
  }

  /**
   * Devuelve la cantidad total de mensajes en la cola.
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Devuelve la cantidad de mensajes no leídos.
   */
  unreadSize(): number {
    return this.queue.filter(m => !m.isRead).length;
  }

  /**
   * Limpia todos los mensajes de la cola.
   */
  clear(): void {
    this.queue.length = 0;
  }
  getAll(): Message[] {
    return this.queue;
  }
}

// Instancia singleton para ser importada en characterTools.ts
export const messageQueue = new MessageQueue();