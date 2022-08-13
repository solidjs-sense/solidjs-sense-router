import { Accessor, batch, createRoot, createSignal } from 'solid-js';
import { Session } from './types';

type PopStateCb = (...params: any[]) => void;

export type ActionType = 'forward' | 'backward';

type ActionData = {
  length: number;
  direction: ActionType;
};

class Api {
  // is client side
  isClient = typeof window !== 'undefined';
  // history action
  private action: {
    length: Accessor<number>;
    direction: Accessor<ActionType>;
    setData: (action: { length: number; direction: ActionType }) => void;
    value: ActionData;
  };
  // register session
  private session?: Session;
  // origin PopStateEvent descriptor getter
  private getEvtState?: () => any;
  // onPopState listener
  private popStateCbs: Array<[PopStateCb, PopStateCb]> = [];

  get length() {
    return this.action.length;
  }

  get direction() {
    return this.action.direction;
  }

  get href() {
    return this.isClient ? location.href : undefined;
  }

  get state() {
    if (!this.isClient) {
      return;
    }
    return history.state;
  }

  get IntersectionObserver() {
    if (!this.isClient) {
      return;
    }
    return window.IntersectionObserver;
  }

  constructor() {
    this.action = createRoot(() => {
      const res = this.state?.action || {
        length: 0,
        direction: 'forward',
      };
      const [length, setIdx] = createSignal<number>(res.length);
      const [direction, setDirection] = createSignal<ActionType>(res.direction);
      return {
        length,
        direction,
        setData: (data: ActionData) => {
          batch(() => {
            setIdx(data.length);
            setDirection(data.direction);
          });
        },
        get value() {
          return {
            length: length(),
            direction: direction(),
          };
        },
      };
    });

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
        this.action.setData({
          length: this.length() + (name === 'pushState' ? 1 : 0),
          direction: name === 'pushState' ? 'forward' : this.direction(),
        });
        func.call(history, { session: this.session, action: this.action.value, state }, unused, url);
        this.session = undefined;
      };
    });
  }

  registerSession(session: Session) {
    this.session = session;
  }

  removeSession() {
    this.session = undefined;
  }

  pushState = (url: string | URL, backSession: Session, state?: any) => {
    if (!api.isClient) return;
    this.registerSession(backSession);
    history.pushState(state, '', url);
  };

  replaceState = (url: string | URL, backSession: Session, state?: any) => {
    if (!api.isClient) return;
    this.registerSession(backSession);
    history.replaceState(state, '', url);
  };

  onPopstate = (cb: (session: any) => void) => {
    if (!api.isClient) return;

    const newCb = (event: PopStateEvent) => {
      const state = this.getEvtState!.call(event);
      const { session, action } = state || {};
      this.action.setData({
        direction: action.length < this.length() ? 'backward' : 'forward',
        length: action.length,
      });
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
