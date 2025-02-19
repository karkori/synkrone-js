import { useSyncExternalStore } from "react";
import { StateObject, Store } from "./types";

export function useStore<T extends StateObject, R>(
  store: Store<T>,
  selector?: (state: T) => R
): R | T {
  return useSyncExternalStore(
    store.subscribe,
    () => (selector ? selector(store.getState()) : store.getState())
  );
}
