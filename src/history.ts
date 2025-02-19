import { IHistoryManager } from "./types";

export class HistoryManager<T extends object> implements IHistoryManager<T> {
  private history: T[] = [];
  private future: T[] = [];
  private historySize: number;
  private currentState: T;

  constructor(initialState: T, historySize = 50) {
    this.currentState = structuredClone(initialState);
    this.historySize = historySize;
  }

  saveState(newState: T) {
    if (JSON.stringify(newState) === JSON.stringify(this.currentState)) {
      return;
    }

    if (this.history.length >= this.historySize) {
      this.history.shift();
    }

    this.history.push(structuredClone(this.currentState));
    this.currentState = structuredClone(newState);
    this.future = [];
  }

  undo(): T | null {
    if (this.history.length > 0) {
      this.future.push(structuredClone(this.currentState));
      this.currentState = this.history.pop()!;
      return structuredClone(this.currentState);
    }
    return null;
  }

  redo(): T | null {
    if (this.future.length > 0) {
      this.history.push(structuredClone(this.currentState));
      this.currentState = this.future.pop()!;
      return structuredClone(this.currentState);
    }
    return null;
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  getHistory(): T[] {
    return [...this.history];
  }

  getFuture(): T[] {
    return [...this.future];
  }

  jumpTo(index: number): T | null {
    if (index < 0 || index >= this.history.length) return null;
    this.future = [...this.history.slice(index), structuredClone(this.currentState), ...this.future];
    this.currentState = structuredClone(this.history[index]);
    this.history = this.history.slice(0, index);
    return structuredClone(this.currentState);
  }
}