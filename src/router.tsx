import { batch, createMemo, createSignal, JSX, onCleanup } from 'solid-js';
import { RouteContext, useMatch, useNavigator } from './hook';
import { api } from './api';
import { baseRegex, joinBase, trimBase } from './util';
import { useLocation } from './hook';
import { LinkProps } from './types';

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

export const Link = (props: LinkProps) => {
  const location = useLocation();
  const url = createMemo(() => new URL(props.href ?? '', location.url()));

  const classList = createMemo(() => {
    return props.activeClass
      ? {
          [props.activeClass]: useMatch(url().pathname)(),
          ...(props.classList || {}),
        }
      : { ...(props.classList || {}) };
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

  const click = (
    e: MouseEvent & {
      currentTarget: HTMLAnchorElement;
      target: Element;
    },
  ) => {
    const { onClick } = props;
    if (typeof onClick === 'function') {
      onClick(e);
    } else if (onClick && onClick[0] && typeof onClick[0] === 'function') {
      onClick[0](onClick[1], e);
    }
    if (props.target === '_blank') {
      return;
    }
    e.preventDefault();
    useNavigator().navigate({
      url: url(),
      state: props.state,
      replace: props.replace,
      queryParams: props.queryParams,
    });
  };

  return (
    <a {...props} href={href()} onclick={click} classList={classList()}>
      {props.children}
    </a>
  );
};
