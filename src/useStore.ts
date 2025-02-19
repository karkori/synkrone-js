import { useSyncExternalStore } from "react";
import { Store, UseStoreReturn } from "./types";
import { SynkroneStore } from "./store";

export function useStore<T extends Record<string, any>, R=T>(
  store: Store<T> | SynkroneStore<T>,
  selector?: (state: T) => R
): UseStoreReturn<T, R> {
  const state = useSyncExternalStore(
    store.subscribe,
    () => selector ? selector(store.get()) : store.get()
  );

  return {
    state,
    getState: (key) => (key ? store.get(key) : store.get()),
    set: store.set,
    replace: store.replace,
    actions: store.actions,
    subscribe: store.subscribe,
    onChange: store.onChange,
  };
}


