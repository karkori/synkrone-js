import { SyncMode } from "./types";

export class SyncManager<T extends object> {
  private channel: BroadcastChannel | null = null;
  private key: string;
  private mode: SyncMode;
  private lastReceivedState: string = "";
  private listeners = new Set<(state: T) => void>();

  constructor(key: string, mode: SyncMode) {
    this.key = key;
    this.mode = mode;

    if (mode === SyncMode.BROADCAST || mode === SyncMode.ALL) {
      this.channel = new BroadcastChannel(key);
    }

    if (mode === SyncMode.STORAGE || mode === SyncMode.ALL) {
      window.addEventListener("storage", this.handleStorageChange);
    }
  }

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === this.key && event.newValue) {
      const newState = JSON.parse(event.newValue);
      this.receiveState(newState);
    }
  };

  listen(callback: (state: T) => void) {
    this.listeners.add(callback);
    if (this.channel) {
      this.channel.onmessage = (event) => {
        this.receiveState(event.data);
      };
    }
  }

  private receiveState(state: T) {
    const serializedState = JSON.stringify(state);
    if (serializedState === this.lastReceivedState) return;
    this.lastReceivedState = serializedState;
    this.listeners.forEach((callback) => callback(state));
  }

  broadcast(state: T) {
    try {
      const cleanState = this.serializeState(state);
      const serializedState = JSON.stringify(cleanState);
      if (serializedState === this.lastReceivedState) return;
      this.lastReceivedState = serializedState;

      if (this.channel) {
        this.channel.postMessage(cleanState);
      }
      if (this.mode === SyncMode.STORAGE || this.mode === SyncMode.ALL) {
        localStorage.setItem(this.key, serializedState);
      }
    } catch (error) {
      console.error("Error al clonar el estado antes de enviarlo:", error);
    }
  }

  private serializeState(state: T) {
    return JSON.parse(
      JSON.stringify(state, (key, value) => {
        if (typeof value === "function") return undefined;
        if (value instanceof Map) return Array.from(value.entries());
        if (value instanceof Set) return Array.from(value);
        if (value instanceof Date) return value.toISOString();
        return value;
      })
    );
  }
}