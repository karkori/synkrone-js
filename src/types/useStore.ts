import { Store } from "./store";

export interface UseStoreReturn<T extends Record<string, any>, R = T> {
  state: R;
  getState<K extends keyof T>(key?: K): K extends undefined ? T : T[K];
  set(newState: Partial<T>): void;
  actions: Store<T>["actions"];
  subscribe(listener: (state: T) => void): () => void;
  onChange<K extends keyof T>(key: K, listener: (value: T[K]) => void): () => void;
}
