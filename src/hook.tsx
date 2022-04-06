import { batch, createContext, createEffect, createSignal, useContext, useTransition, createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { api } from './api';
import { LazyComponent, RouteDefinition, RouterComponent, RouteState, UrlParams } from './types';
import { baseRegex, flatRoutes, formatURL, joinBase, matchRoute, trimBase } from './util';

export const RouteContext = createContext<RouteState>();

export const useRouteState = () => {
  const state = useContext(RouteContext);
  console.assert(!!state, 'Router Hook function must be used within a <Router> component');
  return state!;
};

export const setRoutePending = (pending: boolean) => {
  useRouteState().setPending(pending);
};

export const setRoute = (route?: string) => {
  useRouteState().setRoute(route);
};

export const setRouteBase = (base: string) => {
  useRouteState().setBase(base);
};

export const setRouteUrl = (url: URL) => {
  useRouteState().setUrl(url);
};

export const setRouteState = (state: any) => {
  useRouteState().setState(state);
};

export const setRouteParams = (params: Record<string, string>) => {
  useRouteState().setRouteParams(params);
};

export const useRouteParams = () => {
  return useRouteState().routeParams;
};

export const useMatch = (path: string | (() => string)) => {
  return createMemo(() => {
    const route = useRouteState().route();
    if (!route) {
      return false;
    }
    return matchRoute(typeof path === 'function' ? path() : path, route).match;
  });
};

export const useQueryParams = () => {
  return createMemo(() => {
    const state = useRouteState();
    const url = state.url();
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      params[k] = v;
    });
    return params;
  });
};

export const useLoading = () => {
  return useRouteState().pending;
};

export const useLocation = () => {
  const state = useRouteState();
  return {
    // does not include base
    url: state.url,
    // include base
    fullUrl: createMemo(() => {
      return joinBase(state.base(), state.url());
    }),
    base: state.base,
    state: state.state,
  };
};

const navigate = (params: UrlParams) => {
  const { url, base, state } = useLocation();

  const newURL = formatURL(params, url());

  newURL.pathname = trimBase(base(), newURL);

  batch(() => {
    setRouteUrl(newURL);
    setRouteState(params.state);
  });

  const displayUrl = joinBase(base(), new URL(newURL));

  const backSession = {
    url: newURL.toString(),
    base: base(),
    state: state(),
  };

  !params.replace
    ? api.pushState(displayUrl, backSession, params.state)
    : api.replaceState(displayUrl, backSession, params.state);
};

const newBase = (base: string, replace?: boolean) => {
  const location = useLocation();
  const oldBase = location.base();

  if (base === oldBase) {
    return;
  }

  const url = new URL(location.url());

  if (!oldBase && base && baseRegex(base).test(url.pathname)) {
    url.pathname = trimBase(base, url);
  }

  batch(() => {
    setRouteUrl(url);
    setRouteBase(base);
    setRouteState(undefined);
  });

  const displayUrl = joinBase(base, url);
  const backSession = {
    url: url.toString(),
    base,
    state: undefined,
  };

  !replace ? api.pushState(displayUrl, backSession) : api.replaceState(displayUrl, backSession);
};

export const useNavigator = () => {
  return {
    navigate,
    newBase,
  };
};

export const useRoutes = (route: RouteDefinition | RouteDefinition[]) => {
  return () => {
    const [, start] = useTransition();
    const [router, setRouter] = createSignal<RouterComponent | undefined>();
    const location = useLocation();
    const routes = flatRoutes(([] as RouteDefinition[]).concat(route));

    createEffect(() => {
      const url = location.url();
      let routeParams: Record<string, string> = {};
      const route = routes.find((route) => {
        const { match, params } = matchRoute(url.pathname, route.path);
        routeParams = params;
        return match;
      });

      if ((route?.component as LazyComponent)?.preload) {
        setRoutePending(true);
        (route?.component as LazyComponent)
          ?.preload()
          .catch(() => {
            // noop
          })
          .finally(() => {
            setRoutePending(false);
          });
      }

      start(() => {
        batch(() => {
          setRouteParams(routeParams);
          setRoute(route?.path);
          setRouter(() => route?.component);
        });
      });
    });

    return <Dynamic component={router()} />;
  };
};
