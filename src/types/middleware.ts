import { Store } from "./store";

export type Middleware<T extends Record<string, any>> = (
  store: Store<T>,
  actionName: string,
  args: any[],
  next: () => void
) => void | Promise<void>;