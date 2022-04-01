type PopStateCb = (...params: any[]) => void;

class Api {
  // is client side
  isClient = typeof window !== 'undefined';
  // register session
  private session?: () => any;
  // origin PopStateEvent descriptor getter
  private getEvtState?: () => any;
  // onPopState listener
  private popStateCbs: Array<[PopStateCb, PopStateCb]> = [];

  get href() {
    return this.isClient ? location.href : undefined;
  }

  get state() {
    if (!this.isClient) {
      return;
    }
    return history.state;
  }

  constructor() {
    if (!this.isClient) {
      return;
    }
    this.getEvtState = Object.getOwnPropertyDescriptor(PopStateEvent.prototype, 'state')!.get!;

    // return user's state
    [History, PopStateEvent].forEach((cls: typeof History | typeof PopStateEvent) => {
      const getState = Object.getOwnPropertyDescriptor(cls.prototype, 'state')!.get!;

      Object.defineProperty(cls.prototype, 'state', {
        configurable: true,
        enumerable: true,
        get() {
          return getState.call(this)?.state;
        },
        set: undefined,
      });
    });

    // add session state
    (['pushState', 'replaceState'] as ['pushState', 'replaceState']).forEach((name) => {
      const func = history[name];
      history[name] = (state: any, unused: string, url?: string | URL | null) => {
        const session = this.session?.();
        func.call(history, { session, state }, unused, url);
      };
    });
  }

  registerSession(session: () => any) {
    this.session = session;
  }

  removeSession() {
    this.session = undefined;
  }

  pushState = (state: any, url: string | URL) => {
    if (!api.isClient) return;
    history.pushState(state, '', url);
  };

  replaceState = (state: any, url: string | URL) => {
    if (!api.isClient) return;
    history.replaceState(state, '', url);
  };

  onPopstate = (cb: (session: any) => void) => {
    if (!api.isClient) return;

    const newCb = (event: PopStateEvent) => {
      const state = this.getEvtState!.call(event);
      const session = state.session;
      if (session) {
        cb(session);
      }
    };
    window.addEventListener('popstate', newCb);
    this.popStateCbs.push([cb, newCb]);
  };

  unPopState = (cb: (session: any) => void) => {
    if (!api.isClient) return;

    const idx = this.popStateCbs.findIndex(([f]) => f === cb);
    if (idx === -1) return;

    window.removeEventListener('popstate', this.popStateCbs[idx][1]);
    this.popStateCbs.splice(idx, 1);
  };
}

export const api = new Api();
