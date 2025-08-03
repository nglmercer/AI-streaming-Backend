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
   * MODIFICADO: Ahora mantiene las expresiones junto con el texto circundante.
   */
  addChunk(chunk: string): string[] {
    this.buffer += chunk;
    const completeTexts: string[] = [];

    if (this.hasIncompleteExpression()) {
      return []; // Esperar más datos si hay una expresión incompleta al final
    }

    // CAMBIO PRINCIPAL: Buscar puntos de corte que NO dividan expresiones del texto
    const safeBreakPoint = this.findSafeBreakPointWithExpressions();

    if (safeBreakPoint === -1) {
      return []; // No hay un punto de corte seguro, mantener todo en el buffer
    }

    const textToProcess = this.buffer.slice(0, safeBreakPoint);
    this.buffer = this.buffer.slice(safeBreakPoint);

    // CAMBIO: No procesar como chunks separados, mantener como unidad
    if (textToProcess.trim()) {
      completeTexts.push(textToProcess);
    }

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
    
    const result = this.buffer;
    this.buffer = '';
    return [result]; // Devolver como una sola unidad
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
   * NUEVO: Busca puntos de corte que mantengan las expresiones junto con el texto.
   * Evita cortar entre una expresión y el texto que la rodea.
   */
  private findSafeBreakPointWithExpressions(): number {
    if (this.buffer.length < this.minLengthToSplit) {
      return -1;
    }

    // Encontrar todas las expresiones en el buffer
    const expressions = [...this.buffer.matchAll(this.expressionPattern)];
    
    // Si no hay expresiones, usar el método original
    if (expressions.length === 0) {
      return this.findBasicSafeBreakPoint();
    }

    // Buscar un punto de corte que no esté demasiado cerca de una expresión
    for (let i = this.buffer.length - 1; i >= this.minLengthToSplit; i--) {
      if (this.safeBreakChars.has(this.buffer[i])) {
        // Verificar que no estamos cortando muy cerca de una expresión
        if (this.isGoodBreakPoint(i, expressions)) {
          return i + 1;
        }
      }
    }

    return -1;
  }

  /**
   * Verifica si un punto de corte es bueno considerando las expresiones.
   */
  private isGoodBreakPoint(breakPoint: number, expressions: RegExpMatchArray[]): boolean {
    const proximityThreshold = 5; // Caracteres mínimos antes/después de una expresión
    
    for (const expression of expressions) {
      const exprStart = expression.index!;
      const exprEnd = exprStart + expression[0].length;
      
      // No cortar muy cerca del inicio o final de una expresión
      if (Math.abs(breakPoint - exprStart) < proximityThreshold || 
          Math.abs(breakPoint - exprEnd) < proximityThreshold) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Método original de búsqueda de puntos de corte (como respaldo).
   */
  private findBasicSafeBreakPoint(): number {
    if (this.buffer.length < this.minLengthToSplit) {
      return -1;
    }
    
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      if (this.safeBreakChars.has(this.buffer[i])) {
        return i + 1;
      }
    }

    return -1;
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