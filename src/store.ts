import { HistoryManager } from "./history";
import { PersistenceManager } from "./persistence";
import { SyncManager } from "./sync";
import { StateObject, Store, StoreOptions } from "./types";

export class StoreImpl<T extends StateObject> implements Store<T> {
  private state: T;
  private listeners = new Set<() => void>();
  private persistence: PersistenceManager<T>;
  private sync: SyncManager<T>;
  private history: HistoryManager<T>;
  private key: string;

  constructor(key: string, initialState: T, options?: StoreOptions) {
    this.key = key;
    this.persistence = new PersistenceManager<T>(options?.persist ?? "none");
    this.sync = new SyncManager<T>(this.key, options?.sync ?? false);
    this.history = new HistoryManager<T>(structuredClone(initialState), options?.historySize ?? 50);

    this.state = new Proxy(structuredClone(initialState), {
      set: (target, key, value) => {
        target[key as keyof T] = value;
        
        // 🔥 Guardar una copia limpia del estado en el historial
        this.history.saveState(structuredClone({ ...this.state }));
        
        this.notify();
        this.persistence.saveState(this.key, this.state);
        this.sync.broadcast(this.state);
        return true;
      },
    });

    this.loadPersistedState();
    this.sync.listen((newState) => {
      Object.assign(this.state, newState);
      this.notify();
    });
    
    // 🔥 Escuchar el evento de actualización
    window.addEventListener("synkrone:update", (event: any) => {
      Object.assign(this.state, event.detail);
      this.notify();
    });

    // 🔥 Enlazar métodos para evitar pérdida de contexto
    this.getState = this.getState.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
  }

  private async loadPersistedState() {
    const savedState = await this.persistence.loadState(this.key);
    if (savedState) {
      Object.assign(this.state, savedState);
      this.notify();
    }
  }

  getState(): T {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  undo() {
    const prevState = this.history.undo();
    if (prevState) {
      Object.keys(prevState).forEach((key) => {
        this.state[key as keyof T] = prevState[key as keyof T];
      });
      this.notify();
    }
  }
  
  redo() {
    const nextState = this.history.redo();
    if (nextState) {
      Object.keys(nextState).forEach((key) => {
        this.state[key as keyof T] = nextState[key as keyof T];
      });
      this.notify();
    }
  }
}

