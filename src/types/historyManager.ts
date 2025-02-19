export interface IHistoryManager<T> {
    saveState(newState: T): void;
    undo(): T | null;
    redo(): T | null;
    canUndo(): boolean;
    canRedo(): boolean;
    getHistory(): T[];
    getFuture(): T[];
    jumpTo(index: number): T | null;
  }
  