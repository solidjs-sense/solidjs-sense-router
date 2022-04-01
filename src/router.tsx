import { batch, createMemo, createSignal, JSX, onCleanup } from 'solid-js';
import { RouteContext, useMatch, useNavigator } from './hook';
import { api } from './api';
import { baseRegex, joinBase, trimBase } from './util';
import { useLocation } from './hook';

export const Router = (props: { url?: string; defaultBase?: string; children: JSX.Element }) => {
  console.assert(
    api.isClient || (!api.isClient && !!props.url),
    'Router must be initialized with a url in server mode',
  );

  const [route, setRoute] = createSignal<string | undefined>();
  const [routeParams, setRouteParams] = createSignal<Record<string, string>>({});
  const [pending, setPending] = createSignal(false);
  const [base, setBase] = createSignal(props.defaultBase ?? '');
  const [state, setState] = createSignal<any>(api.state);
  const defaultUrl = new URL(props.url ? props.url : api.href!);

  if (base() && baseRegex(base()).test(defaultUrl.pathname)) {
    defaultUrl.pathname = trimBase(base(), defaultUrl);
  }
  const [url, setUrl] = createSignal<URL>(defaultUrl);

  api.registerSession(() => {
    return {
      url: url().toString(),
      base: base(),
      state: state(),
    };
  });

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
  api.replaceState(state(), joinBase(base(), defaultUrl));

  return (
    <RouteContext.Provider
      value={{
        route,
        setRoute,
        pending,
        setPending,
        base,
        setBase,
        url,
        setUrl,
        state,
        setState,
        routeParams,
        setRouteParams,
      }}
    >
      {props.children}
    </RouteContext.Provider>
  );
};

export const Link = (props: {
  href: string;
  target?: '_blank';
  rel?: string;
  queryParams?: Record<string, string>;
  activeClass?: string;
  children: JSX.Element;
}) => {
  const location = useLocation();
  const url = createMemo(() => new URL(props.href, location.url()));

  const classList = createMemo(() => {
    return props.activeClass
      ? {
          [props.activeClass]: useMatch(url().pathname)(),
        }
      : {};
  });

  const href = createMemo(() => {
    const newURL = joinBase(location.base(), url());
    const params = props.queryParams;
    if (params) {
      Object.keys(params).forEach((key) => {
        newURL.searchParams.set(key, params[key]);
      });
    }
    return newURL.href.replace(newURL.origin, '');
  });

  const click = (e: Event) => {
    if (props.target) {
      return false;
    }
    e.preventDefault();
    useNavigator().navigate({
      url: props.href,
      queryParams: props.queryParams,
    });
  };

  return (
    <a href={href()} onclick={click} rel={props.rel} target={props.target} classList={classList()}>
      {props.children}
    </a>
  );
};
