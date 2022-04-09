import { batch, createContext, createEffect, createSignal, useContext, createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { api } from './api';
import { LazyComponent, RouteDefinition, RouterComponent, RouterState, RouteState, UrlParams } from './types';
import { baseRegex, flatRoutes, formatURL, joinBase, matchRoute, trimBase } from './util';

export const RouterContext = createContext<RouterState>();

export const RouteContext = createContext<RouteState>();

export const useRouterState = () => {
  const state = useContext(RouterContext);
  console.assert(!!state, 'Router Hook function must be used within a <Router> component');
  return state!;
};

export const useRouteState = () => {
  const state = useContext(RouteContext);
  console.assert(!!state, 'Router Hook function must be used within a <Router> component');
  return state!;
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
    const state = useRouterState();
    const url = state.url();
    const params: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      params[k] = v;
    });
    return params;
  });
};

export const useLoading = () => {
  return useRouterState().pending;
};

export const useLocation = () => {
  const state = useRouterState();
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

const navigate = (routerState: RouterState, location: ReturnType<typeof useLocation>, params: UrlParams) => {
  const { url, base, state } = location;

  const newURL = formatURL(params, url());

  newURL.pathname = trimBase(base(), newURL);

  batch(() => {
    routerState.setUrl(newURL);
    routerState.setState(params.state);
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

const newBase = (
  routerState: RouterState,
  location: ReturnType<typeof useLocation>,
  base: string,
  replace?: boolean,
) => {
  const oldBase = location.base();

  if (base === oldBase) {
    return;
  }

  const url = new URL(location.url());

  if (!oldBase && base && baseRegex(base).test(url.pathname)) {
    url.pathname = trimBase(base, url);
  }

  batch(() => {
    routerState.setUrl(url);
    routerState.setBase(base);
    routerState.setState(undefined);
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
  const location = useLocation();
  const routerState = useRouterState();

  return {
    navigate: (params: UrlParams) => {
      navigate(routerState, location, params);
    },
    newBase: (base: string, replace?: boolean) => {
      newBase(routerState, location, base, replace);
    },
  };
};

export const useRoutes = (route: RouteDefinition | RouteDefinition[]) => {
  return () => {
    const routerState = useRouterState();
    const routeState = useRouteState();
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
        routerState.setPending(true);
        (route?.component as LazyComponent)
          ?.preload()
          .catch(() => {
            // noop
          })
          .finally(() => {
            routerState.setPending(false);
          });
      }

      batch(() => {
        routeState.setRoute(route?.path);
        routeState.setRouteParams(routeParams);
        setRouter(() => route?.component);
      });
    });

    return <Dynamic component={router()} />;
  };
};
