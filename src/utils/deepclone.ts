export function deepClone<T>(obj: T): T {
    try {
      return structuredClone(obj);
    } catch {
      return JSON.parse(JSON.stringify(obj)); 
    }
  }