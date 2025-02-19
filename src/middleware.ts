export type Middleware<T> = (
    state: T,
    actionName: string,
    args: any[],
    next: () => void
  ) => void;
  
  export class MiddlewareManager<T extends object> {
    private middlewares: Middleware<T>[] = [];
  
    use(middleware: Middleware<T>) {
      this.middlewares.push(middleware);
    }
  
    run(state: T, actionName: string, args: any[], next: () => void) {
      let index = -1;
      const runner = () => {
        index++;
        if (index < this.middlewares.length) {
          this.middlewares[index](state, actionName, args, runner);
        } else {
          next();
        }
      };
      runner();
    }
  }
  