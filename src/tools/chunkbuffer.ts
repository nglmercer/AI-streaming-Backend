import { WebSocket } from 'ws';

export class ChunkBuffer {
  private buffer: string = '';

  // Patrones de expresiones definidos como propiedades inmutables
  private readonly expressionPattern = /<[^>]*>|\[[^\]]*\]/g;
  private readonly incompleteExpressionPattern = /<[^>]*$|\[[^\]]*$/;
  
  // Parámetros configurables como propiedades de la clase
  private readonly minLengthToSplit = 20;
  private readonly safeBreakChars = new Set([' ', '\n', '\t', '.', ',', '!', '?', ';', ':']);

  /**
   * Agrega un trozo de texto al buffer y devuelve los textos completos que se pueden procesar.
   */
  addChunk(chunk: string): string[] {
    this.buffer += chunk;
    const completeTexts: string[] = [];

    if (this.hasIncompleteExpression()) {
      return []; // Esperar más datos si hay una expresión incompleta al final
    }

    const safeBreakPoint = this.findSafeBreakPoint();

    if (safeBreakPoint === -1) {
      return []; // No hay un punto de corte seguro, mantener todo en el buffer
    }

    const textToProcess = this.buffer.slice(0, safeBreakPoint);
    this.buffer = this.buffer.slice(safeBreakPoint);

    const processedTexts = this.processText(textToProcess);
    completeTexts.push(...processedTexts);

    return completeTexts;
  }

  /**
   * Procesa y devuelve todo el contenido restante en el buffer.
   * Ideal para usar al final de un stream.
   */
  flush(): string[] {
    if (!this.buffer.trim()) {
      this.buffer = '';
      return [];
    }
    
    const results = this.processText(this.buffer);
    this.buffer = '';
    return results;
  }
  
  /**
   * Limpia el buffer sin procesar su contenido.
   */
  clear(): void {
    this.buffer = '';
  }

  /**
   * Devuelve el contenido actual del buffer sin procesarlo ni limpiarlo.
   */
  getBufferContent(): string {
    return this.buffer;
  }

  /**
   * Busca el último punto de corte seguro (espacio, puntuación) en el buffer.
   * Es más simple y robusto que la versión original.
   */
  private findSafeBreakPoint(): number {
    if (this.buffer.length < this.minLengthToSplit) {
      return -1;
    }
    
    // Busca hacia atrás desde el final para encontrar el último carácter seguro
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      if (this.safeBreakChars.has(this.buffer[i])) {
        return i + 1; // Incluye el carácter de corte
      }
    }

    return -1; // No se encontró ningún punto de corte seguro
  }

  /**
   * Divide un texto en segmentos normales y "expresiones" especiales.
   */
  private processText(text: string): string[] {
    if (!text.trim()) return [];

    const results: string[] = [];
    let lastIndex = 0;
    const matches = [...text.matchAll(this.expressionPattern)];

    if (matches.length === 0) {
      return [text]; // Optimización: si no hay expresiones, devolver el texto tal cual.
    }

    for (const match of matches) {
      const matchIndex = match.index!;
      const matchText = match[0];

      if (matchIndex > lastIndex) {
        results.push(text.slice(lastIndex, matchIndex));
      }
      
      results.push(matchText);
      lastIndex = matchIndex + matchText.length;
    }

    if (lastIndex < text.length) {
      results.push(text.slice(lastIndex));
    }

    // Filtra cadenas vacías que podrían resultar del split
    return results.filter(s => s.length > 0);
  }

  /**
   * Comprueba si el buffer termina con una expresión incompleta.
   */
  private hasIncompleteExpression(): boolean {
    return this.incompleteExpressionPattern.test(this.buffer);
  }
}

// --- Gestión de Buffers por Conexión ---

const connectionBuffers = new WeakMap<WebSocket, ChunkBuffer>();

/**
 * Obtiene el buffer existente para una conexión WebSocket o crea uno nuevo.
 * El uso de WeakMap previene fugas de memoria.
 */
export function getOrCreateBuffer(ws: WebSocket): ChunkBuffer {
  if (!connectionBuffers.has(ws)) {
    connectionBuffers.set(ws, new ChunkBuffer());
  }
  return connectionBuffers.get(ws)!;
}
export function deleteBufferForConnection(ws: WebSocket): void {
  connectionBuffers.delete(ws);
}