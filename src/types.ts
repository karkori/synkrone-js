// Representa un objeto de estado genérico
export type StateObject = Record<string, any>;

// Tipos de persistencia soportados
export type PersistenceType = "localStorage" | "sessionStorage" | "indexedDB" | "none";

// Tipos de middleware (antes y después de una acción)
export type Middleware<T extends StateObject> = (state: T, action: string, args: any[]) => void;

// Define las opciones al crear un Store
export interface StoreOptions {
  persist?: PersistenceType;
  sync?: boolean;
  historySize?: number;
}

// Define la interfaz del Store principal
export interface Store<T extends StateObject> {
  getState(): T;
  subscribe(listener: () => void): () => void;
  undo(): void;
  redo(): void;
}
