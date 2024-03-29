import { batch, createMemo, createSignal, JSX, onCleanup, useContext } from 'solid-js';
import { RouteContext, RouterContext } from '../hook';
import { api } from '../api';
import { baseRegex, formatURL, joinBase, trimBase } from '../util';
import { KeepAliveElement, LeaveCallback, RouteDefinition, RouteState } from '../types';

export const WrapRoutes = (props: { children: JSX.Element }) => {
  const parentContext = useContext(RouteContext);
  const [childContext, setChildContext] = createSignal<RouteState | undefined>();
  const [route, setRoute] = createSignal<RouteDefinition | undefined>();
  let leaveCallbacks: LeaveCallback[] = [];
  const context = {
    parentContext,
    route,
    setRoute,
    childContext,
    setChildContext,
    get leaveCallbacks() {
      return leaveCallbacks;
    },
    setLeaveCallbacks: (cb: LeaveCallback) => leaveCallbacks.push(cb),
    clearLeaveCallbacks: () => (leaveCallbacks = []),
  };

  parentContext?.setChildContext(context);
  onCleanup(() => {
    parentContext?.setChildContext(undefined);
  });

  return <RouteContext.Provider value={context}>{props.children}</RouteContext.Provider>;
};

export const Router = (props: { url?: string; defaultBase?: string; children: JSX.Element; maxKeepAlive?: number }) => {
  console.assert(
    api.isClient || (!api.isClient && !!props.url),
    'Router must be initialized with a url in server mode',
  );

  const [routes, setRoutes] = createSignal<RouteDefinition[]>([]);
  const [pending, setPending] = createSignal(false);
  const [base, setBase] = createSignal(props.defaultBase ?? '');
  const [state, setState] = createSignal<any>(api.state);
  const [keepAliveElements, setKeepAliveElements] = createSignal<KeepAliveElement[]>([]);
  const defaultUrl = formatURL({ url: props.url ? props.url : api.href! });
  const maxKeepAlive = createMemo(() => props.maxKeepAlive);

  if (base() && baseRegex(base()).test(defaultUrl.pathname)) {
    defaultUrl.pathname = trimBase(base(), defaultUrl);
  }
  const [url, setUrl] = createSignal<URL>(defaultUrl);

  const onPopstate = (session: { url: string; base: string; state?: any }) => {
    if (session) {
      batch(() => {
        setUrl(new URL(session.url));
        setBase(session.base);
        setState(session.state);
      });
    }
  };

  api.onPopstate(onPopstate);

  onCleanup(() => {
    api.unPopState(onPopstate);
    api.removeSession();
  });

  // update state
  api.replaceState(
    joinBase(base(), defaultUrl),
    {
      url: url().toString(),
      base: base(),
      state: state(),
    },
    state(),
  );

  return (
    <RouterContext.Provider
      value={{
        routes,
        setRoutes,
        pending,
        setPending,
        base,
        setBase,
        url,
        setUrl,
        state,
        setState,
        keepAlive: {
          maxKeepAlive,
          keepAliveElements,
          setKeepAliveElements,
          insertKeepAliveElement: (element: KeepAliveElement) => {
            const max = maxKeepAlive();
            setKeepAliveElements((pre) => {
              if (max !== undefined && pre.length >= max) {
                const unMountedOverflowEls = pre.filter((el) => el.unMounted).slice(max - pre.length - 1);
                unMountedOverflowEls.forEach((unEl) => unEl.dispose());
                return [element, ...pre.filter((el) => !unMountedOverflowEls.find((unEl) => unEl.id === el.id))];
              }
              return [element, ...pre];
            });
          },
          removeKeepAliveElement: (id: string) => {
            const element = keepAliveElements().find((el) => el.id === id);
            if (!element) {
              return;
            }
            element.dispose();
            setKeepAliveElements((pre) => pre.filter((el) => el.id !== id));
          },
        },
      }}
    >
      <WrapRoutes>{props.children}</WrapRoutes>
    </RouterContext.Provider>
  );
};
