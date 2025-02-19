export class SyncManager<T extends object> {
  private channel: BroadcastChannel | null = null;
  private key: string;
  private useStorage: boolean;
  private lastReceivedState: string = ""; // 🔥 Guardamos el último estado recibido

  constructor(key: string, enableSync: boolean) {
    this.key = key;
    this.useStorage = enableSync;

    if (enableSync) {
      this.channel = new BroadcastChannel(key);
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
    if (this.channel) {
      this.channel.onmessage = (event) => {
        this.receiveState(event.data, callback);
      };
    }
  }

  private receiveState(state: T, callback?: (state: T) => void) {
    const serializedState = JSON.stringify(state);

    // 🔥 Evitar procesar el estado si ya fue recibido
    if (serializedState === this.lastReceivedState) return;

    this.lastReceivedState = serializedState;

    // 🔥 Forzar la notificación del estado
    if (callback) {
      callback(state);
    } else {
      window.dispatchEvent(
        new CustomEvent("synkrone:update", { detail: state })
      );
    }
  }

  broadcast(state: T) {
    try {
      // 🔥 Convertimos el estado a un objeto limpio, eliminando referencias no clonables
      const cleanState = JSON.parse(
        JSON.stringify(state, (key, value) => {
          if (typeof value === "function") return undefined; // 🔥 Evita funciones
          if (value instanceof Map || value instanceof Set)
            return Array.from(value); // 🔥 Convierte Map/Set en arrays
          if (value instanceof Date) return value.toISOString(); // 🔥 Convierte Date a string ISO
          return value;
        })
      );

      const serializedState = JSON.stringify(cleanState);

      // 🔥 Si el estado no ha cambiado, no lo enviamos para evitar bucles
      if (serializedState === this.lastReceivedState) return;

      this.lastReceivedState = serializedState;

      if (this.channel) {
        this.channel.postMessage(cleanState);
      }
      if (this.useStorage) {
        localStorage.setItem(this.key, JSON.stringify(cleanState));
      }
    } catch (error) {
      console.error(
        "Error al clonar el estado antes de enviarlo a BroadcastChannel:",
        error
      );
      console.log("Estado que falló al clonar:", state);
    }
  }
}
