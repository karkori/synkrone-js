import { IHistoryManager } from "./historyManager";

export interface Store<T extends Record<string, any>> {
    get<K extends keyof T>(key?: K): K extends undefined ? T : T[K];
    set(newState: Partial<T>): void;
    subscribe(listener: (state: T) => void): () => void;
    onChange<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void;
    actions: Record<string, (...args: any[]) => void | Promise<void>>;
    history?: IHistoryManager<T>;
    reset(): void;
    enableSync(): void;
    disableSync(): void;
    destroy(): void;
  }