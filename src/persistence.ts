export type PersistenceType = "localStorage" | "sessionStorage" | "indexedDB" | "none";

export class PersistenceManager<T extends object> {
  private storageType: PersistenceType;
  private dbName = "synkroneDB";

  constructor(storageType: PersistenceType) {
    this.storageType = storageType;
  }

  saveState(key: string, state: T) {
    if (this.storageType === "none") return;

    const serializedState = JSON.stringify(state);

    if (this.storageType === "localStorage") {
      localStorage.setItem(key, serializedState);
    } else if (this.storageType === "sessionStorage") {
      sessionStorage.setItem(key, serializedState);
    } else if (this.storageType === "indexedDB") {
      this.saveToIndexedDB(key, state);
    }
  }

  loadState(key: string): Promise<T | null> {
    if (this.storageType === "none") return Promise.resolve(null);

    if (this.storageType === "localStorage") {
      return Promise.resolve(JSON.parse(localStorage.getItem(key) || "null"));
    } else if (this.storageType === "sessionStorage") {
      return Promise.resolve(JSON.parse(sessionStorage.getItem(key) || "null"));
    } else if (this.storageType === "indexedDB") {
      return this.loadFromIndexedDB(key);
    }

    return Promise.resolve(null);
  }

  private saveToIndexedDB(key: string, state: T) {
    const request = indexedDB.open(this.dbName, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("store");
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("store", "readwrite");
      tx.objectStore("store").put(state, key);
    };
  }

  private loadFromIndexedDB(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("store", "readonly");
        const store = tx.objectStore("store");
        const getRequest = store.get(key);
        getRequest.onsuccess = () => resolve(getRequest.result ?? null);
      };
    });
  }
}
