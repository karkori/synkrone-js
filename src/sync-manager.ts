import { Store, SyncMode } from "./types";

export class SyncManager<T extends Record<string, any>> {
  private channel?: BroadcastChannel;
  private storeKey: string;
  private listeners = new Set<(state: T) => void>();
  private lastState: string;

  constructor(storeKey: string, syncMode: SyncMode, private store: Store<T>) {
    this.storeKey = storeKey;

    if (syncMode === SyncMode.BROADCAST || syncMode === SyncMode.ALL) {
      this.channel = new BroadcastChannel(`synkrone_${storeKey}`);
      this.channel.onmessage = (event) => this.handleMessage(event, store);
    }

    this.lastState = "";
  }

  broadcast(state: T) {
    if (!this.channel) return;

    try {
      const clonedState = JSON.parse(JSON.stringify(state));

      const serializedState = JSON.stringify(clonedState);
      if (serializedState !== this.lastState) {
        this.channel.postMessage({ newState: clonedState });
        this.lastState = serializedState;
      }
    } catch (error) {
      console.error("❌ Error al enviar el estado por BroadcastChannel:", error);
    }
  }

  private handleMessage = (event: MessageEvent, store: Store<T>) => {
    const { newState } = event.data;

    if (JSON.stringify(newState) !== this.lastState) {
      this.lastState = JSON.stringify(newState);

      store.set(newState);
    }
  };

  listen(callback: (state: T) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  close() {
    this.channel?.close();
  }
}
