export function serializeState<T>(state: T) {
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