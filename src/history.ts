export class HistoryManager<T extends object> {
  private history: T[] = [];
  private future: T[] = [];
  private historySize: number;
  private currentState: T;

  constructor(initialState: T, historySize = 50) {
    this.currentState = structuredClone(initialState);
    this.historySize = historySize;
  }

  saveState(newState: T) {
    // Evita guardar el mismo estado dos veces seguidas
    if (JSON.stringify(newState) === JSON.stringify(this.currentState)) {
      return;
    }

    if (this.history.length >= this.historySize) {
      this.history.shift(); // 🔥 Limitar tamaño del historial
    }

    this.history.push(structuredClone(this.currentState)); // 🔥 Guardamos el estado actual antes de cambiarlo
    this.currentState = structuredClone(newState); // 🔥 Actualizamos el estado actual
    this.future = []; // 🔥 Limpiamos el redo al hacer una nueva acción
  }

  undo(): T | null {
    if (this.history.length > 0) {
      this.future.push(structuredClone(this.currentState)); // 🔥 Guardamos el estado actual en redo
      this.currentState = this.history.pop()!; // 🔥 Volvemos al estado anterior
      return structuredClone(this.currentState);
    }
    return null;
  }

  redo(): T | null {
    if (this.future.length > 0) {
      this.history.push(structuredClone(this.currentState)); // 🔥 Guardamos el estado actual en undo
      this.currentState = this.future.pop()!; // 🔥 Volvemos al estado futuro
      return structuredClone(this.currentState);
    }
    return null;
  }
}
