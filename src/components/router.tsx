import { batch, createSignal, JSX, onCleanup, useContext } from 'solid-js';
import { RouteContext, RouterContext } from '../hook';
import { api } from '../api';
import { baseRegex, joinBase, trimBase } from '../util';
import { RouteDefinition, RouteState } from '../types';

export const WrapRoutes = (props: { children: JSX.Element }) => {
  const parentContext = useContext(RouteContext);
  const [childContext, setChildContext] = createSignal<RouteState | undefined>();
  const [route, setRoute] = createSignal<RouteDefinition | undefined>();
  const context = {
    parentContext,
    route,
    setRoute,
    childContext,
    setChildContext,
  };

  parentContext?.setChildContext(context);
  onCleanup(() => {
    parentContext?.setChildContext(undefined);
  });

  return <RouteContext.Provider value={context}>{props.children}</RouteContext.Provider>;
};

export const Router = (props: { url?: string; defaultBase?: string; children: JSX.Element }) => {
  console.assert(
    api.isClient || (!api.isClient && !!props.url),
    'Router must be initialized with a url in server mode',
  );

  const [routes, setRoutes] = createSignal<RouteDefinition[]>([]);
  const [pending, setPending] = createSignal(false);
  const [base, setBase] = createSignal(props.defaultBase ?? '');
  const [state, setState] = createSignal<any>(api.state);
  const defaultUrl = new URL(props.url ? props.url : api.href!);

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
      }}
    >
      <WrapRoutes>{props.children}</WrapRoutes>
    </RouterContext.Provider>
  );
};
