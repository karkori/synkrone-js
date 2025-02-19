import { Middleware } from "./middleware";
import { Store } from "./store";
import { SyncMode } from "./syncMode";
import { PersistenceType } from "./persistenceType";

export interface StoreConfig<T extends Record<string, any>> {
  name: string;
  state: T;

  persist?: PersistenceType;
  sync?: SyncMode;

  history?: {
    enabled: boolean;
    size?: number;
  };

  devtools?: {
    enabled: boolean;
    logActions?: boolean;
    logState?: boolean;
    highlightChanges?: boolean;
    showHistory?: boolean;
  };

  middlewares?: Middleware<T>[];

  actions?: Record<string, (store: Store<T>, ...args: any[]) => void | Promise<void>>;

  onInit?: (store: Store<T>) => void | Promise<void>;
  onDestroy?: (store: Store<T>) => void | Promise<void>;
}
