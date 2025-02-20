import { Store, SyncMode } from "./types";

export class SyncManager<T extends Record<string, any>> {
  private channel?: BroadcastChannel;
  private storeKey: string;
  private lastState: string;
  private mode: SyncMode;

  constructor(
    storeKey: string,
    mode: SyncMode,
    private store: Store<T>
  ) {
    this.storeKey = storeKey;
    this.mode = mode;
    this.lastState = "";

    if (this.mode === SyncMode.BROADCAST) {
      this.setupBroadcastChannel();
    }

    this.storageEventListener();
  }

  broadcast(state: T) {
    if (!this.channel || this.mode !== SyncMode.BROADCAST) return;

    try {
      const clonedState = JSON.parse(JSON.stringify(state));
      const serializedState = JSON.stringify(clonedState);
      if (serializedState !== this.lastState) {
        this.channel.postMessage({ newState: clonedState });
        this.lastState = serializedState;
      }
    } catch (error) {
      console.error(
        "❌ Error al enviar el estado por BroadcastChannel:",
        error
      );
    }
  }

  private handleMessage = (event: MessageEvent) => {
    const { newState } = event.data;

    if (JSON.stringify(newState) !== this.lastState) {
      this.lastState = JSON.stringify(newState);
      this.store.set(newState);
    }
  };

  setMode(mode: SyncMode) {
    this.mode = mode;

    if (mode === SyncMode.BROADCAST) {
        this.channel?.close(); 
        this.setupBroadcastChannel(); 
        this.broadcast(this.store.get()); 
        localStorage.setItem("synkrone_sync_status", "enabled"); 
        localStorage.setItem("synkrone_sync_status", "disabled"); 
        this.channel?.close();
        this.channel = undefined;
    }
}

private setupBroadcastChannel() {
    this.channel = new BroadcastChannel(`synkrone_${this.storeKey}`);
    this.channel.onmessage = (event) => this.handleMessage(event);
}

private storageEventListener() : void{
  window.addEventListener("storage", (event) => {
    if (event.key === "synkrone_sync_status" && event.newValue === "enabled") {
        this.setupBroadcastChannel();
    }
  });
}

  close() {
    this.channel?.close();
  }
}
