import { HistoryManager } from "./history";
import { PersistenceManager } from "./persistence";
import { SyncManager } from "./sync";
import { PersistenceType, Store, StoreConfig, SyncMode } from "./types";

export class SynkroneStore<T extends Record<string, any>> implements Store<T> {
  private initialState: T;
  private state: T;
  private listeners = new Set<(state: T) => void>();
  private propertyListeners = new Map<keyof T, Set<(value: any) => void>>();
  private persistence: PersistenceManager<T>;
  private sync: SyncManager<T>;
  history?: HistoryManager<T>;
  private key: string;
  public actions: Record<string, (...args: any[]) => void | Promise<void>> = {};

  constructor(config: StoreConfig<T>) {
    this.initialState = structuredClone(config.state);
    this.key = config.name;
    this.persistence = new PersistenceManager<T>(
      config.persist ?? PersistenceType.NONE
    );
    this.sync = new SyncManager<T>(this.key, config.sync ?? SyncMode.NONE);
    this.history = config.history?.enabled
      ? new HistoryManager<T>(
          structuredClone(config.state),
          config.history.size ?? 50
        )
      : undefined;

    this.state = new Proxy(structuredClone(config.state), {
      set: (target, key, value) => {
        target[key as keyof T] = value;
        this.notify();
        this.notifyProperty(key as keyof T, value);
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

    window.addEventListener("synkrone:update", (event: any) => {
      Object.assign(this.state, event.detail);
      this.notify();
    });

    if (config.actions) {
      this.actions = Object.keys(config.actions).reduce(
        (acc, key) => {
          acc[key] = (...args: any[]) => config.actions![key](this, ...args);
          return acc;
        },
        {} as Record<string, (...args: any[]) => void | Promise<void>>
      );
    }

    if (config.onInit) {
      config.onInit(this);
    }

    this.subscribe = this.subscribe.bind(this);
  }

  private async loadPersistedState() {
    const savedState = await this.persistence.loadState(this.key);
    if (savedState) {
      Object.assign(this.state, savedState);
      this.notify();
    }
  }

  get = <K extends keyof T>(key?: K): K extends undefined ? T : T[K] => {
    if (key) return this.state[key];
    return this.state as any;
  };

  set(newState: Partial<T>): void {
    this.state = { ...this.state, ...newState };
    this.notify();
    Object.keys(newState).forEach((key) => {
      const value = newState[key as keyof T];
      if (value !== undefined) {
        this.notifyProperty(key as keyof T, value);
      }
    });
    this.persistence.saveState(this.key, this.state);
    this.sync.broadcast(this.state);
  }

  replace(newState: T): void {
    Object.assign(this.state, structuredClone(newState));
    this.notify();
    this.persistence.saveState(this.key, this.state);
    this.sync.broadcast(this.state);
  }

  subscribe(listener: (state: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onChange<K extends keyof T>(
    key: K,
    listener: (value: T[K]) => void
  ): () => void {
    if (!this.propertyListeners.has(key)) {
      this.propertyListeners.set(key, new Set());
    }
    this.propertyListeners.get(key)!.add(listener);
    return () => this.propertyListeners.get(key)!.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private notifyProperty<K extends keyof T>(key: K, value: T[K]) {
    this.propertyListeners.get(key)?.forEach((listener) => listener(value));
  }

  reset(): void {
    this.state = { ...this.state, ...this.initialState };
    this.notify();
    this.persistence.saveState(this.key, this.state);
    this.sync.broadcast(this.state);
  }

  enableSync(): void {
    this.sync = new SyncManager<T>(this.key, SyncMode.ALL);
  }

  disableSync(): void {
    this.sync = new SyncManager<T>(this.key, SyncMode.NONE);
  }

  destroy(): void {
    window.removeEventListener("synkrone:update", this.notify);
    this.listeners.clear();
    this.propertyListeners.clear();
  }
}
