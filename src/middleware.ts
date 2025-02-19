import { Middleware, Store } from "./types";

export class MiddlewareManager<T extends object> {
  private middlewares: Middleware<T>[] = [];

  use(middleware: Middleware<T>) {
    this.middlewares.push(middleware);
  }

  async run(
    store: Store<T>,
    actionName: string,
    args: any[],
    next: () => void
  ) {
    let index = -1;
    const runner = async () => {
      index++;
      if (index < this.middlewares.length) {
        await this.middlewares[index](store, actionName, args, runner);
      } else {
        next();
      }
    };
    await runner();
  }
}
