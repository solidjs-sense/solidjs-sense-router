import { batch, createContext, createEffect, createSignal, useContext, createMemo, ErrorBoundary } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { api } from './api';
import { Outlet } from './components/outlet';
import { LazyComponent, RouteDefinition, RouterComponent, RouterState, RouteState, UrlParams } from './types';
import { baseRegex, flatRoutes, formatURL, joinBase, matchRoute, matchRoutes, trimBase } from './util';

export const prefetchRoutes: Record<string, boolean> = {};

export const RouterContext = createContext<RouterState>();

export const RouteContext = createContext<RouteState>();

export const useRouterState = () => {
  const state = useContext(RouterContext);
  console.assert(!!state, 'Router Hook function or Component must be used within a <Router> component');
  return state!;
};

export const useRouteState = () => {
  const state = useContext(RouteContext);
  console.assert(!!state, 'Router Hook function or Component must be used within a <Router> component');
  return state!;
};

export const useRouteParams = () => {
  return createMemo(() => {
    const route = useRouteState().route();
    if (!route) {
      return {};
    }

    const { url } = useLocation();
    const { match, params } = matchRoute(url().pathname, route.path);

    if (match) {
      return params;
    }

    return {};
  });
};

export const usePrefetch = (path: string | string[]) => {
  const paths = ([] as string[]).concat(path);
  paths.forEach((path) => {
    const route = useMatch(path);
    if (route && !prefetchRoutes[route.path]) {
      const comp = route.component as LazyComponent | undefined;
      if (comp?.preload) {
        comp
          .preload()
          .then(() => {
            prefetchRoutes[route.path] = true;
          })
          .catch(() => {
            prefetchRoutes[route.path] = true;
          });
      }
    }
  });
};

export const useMatch = (path: string | (() => string)): RouteDefinition | undefined => {
  const routes = useRouterState().routes();
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const match = matchRoutes(typeof path === 'function' ? path() : path, route);
    if (match) {
      return match;
    }
  }
};

export const useCurrentMatch = (path: string | (() => string)): RouteDefinition | undefined => {
  let currentState: RouteState | undefined = useRouteState();
  while (currentState.parentContext) {
    currentState = currentState.parentContext;
  }
  while (currentState) {
    const route = currentState.route();
    if (!route) {
      return;
    }
    if (matchRoute(typeof path === 'function' ? path() : path, route.path).match) {
      return route;
    }
    currentState = currentState.childContext();
  }
  return;
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

  const displayUrl = joinBase(base(), new URL(newURL));

  const backSession = {
    url: newURL.toString(),
    base: base(),
    state: state(),
  };

  !params.replace
    ? api.pushState(displayUrl, backSession, params.state)
    : api.replaceState(displayUrl, backSession, params.state);

  batch(() => {
    routerState.setUrl(newURL);
    routerState.setState(params.state);
  });
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

  const displayUrl = joinBase(base, url);
  const backSession = {
    url: url.toString(),
    base,
    state: undefined,
  };

  !replace ? api.pushState(displayUrl, backSession) : api.replaceState(displayUrl, backSession);

  batch(() => {
    routerState.setUrl(url);
    routerState.setBase(base);
    routerState.setState(undefined);
  });
};

export const useNavigator = () => {
  const location = useLocation();
  const routerState = useRouterState();

  function navFunc(params: UrlParams): void;
  function navFunc(url: string, params?: Omit<UrlParams, 'url'>): void;
  function navFunc(url: string | UrlParams, params?: Omit<UrlParams, 'url'>) {
    const newParams = {
      ...(typeof url === 'string' ? { url } : url),
      ...(params || {}),
    };
    navigate(routerState, location, newParams);
  }

  return {
    navigate: navFunc,
    newBase: (base: string, replace?: boolean) => {
      newBase(routerState, location, base, replace);
    },
  };
};

export const getRoutes = (routes: RouteDefinition[]) => {
  return () => {
    const routerState = useRouterState();
    const routeState = useRouteState();
    const location = useLocation();
    const navigator = useNavigator();
    const [router, setRouter] = createSignal<RouterComponent | undefined>();
    let reset: undefined | (() => void);

    createEffect(() => {
      const url = location.url();
      const route = routes.find((rut) => {
        return matchRoutes(url.pathname, rut) !== undefined;
      });

      reset?.();
      reset = undefined;

      if (route?.redirectTo) {
        return navigator.navigate({
          url: route.redirectTo,
          replace: true,
        });
      }

      const resolve = (canLoad: boolean) => {
        if (canLoad) {
          if (route && !prefetchRoutes[route.path] && (route.component as LazyComponent)?.preload) {
            routerState.setPending(true);
            (route?.component as LazyComponent)
              ?.preload()
              .then(() => {
                prefetchRoutes[route.path] = true;
                routerState.setPending(false);
              })
              .catch(() => {
                prefetchRoutes[route.path] = true;
                routerState.setPending(false);
              });
          }
          batch(() => {
            routeState.setRoute(route);
            setRouter(() => route?.component);
          });
        } else {
          batch(() => {
            routeState.setRoute(undefined);
            setRouter(undefined);
          });
        }
      };

      const canLoad = (route?.canLoad || (() => true))(location, route!);
      if (canLoad instanceof Promise) {
        canLoad
          .catch((err) => {
            console.error(err);
            return false;
          })
          .then(resolve);
      } else {
        resolve(canLoad);
      }
    });

    const fallback = (err: Error, rst: () => void) => {
      console.error(err);
      reset = rst;
      return <></>;
    };

    return (
      <ErrorBoundary fallback={fallback}>
        <Dynamic component={router()} />
      </ErrorBoundary>
    );
  };
};

export const useRoutes = (route: RouteDefinition | RouteDefinition[]) => {
  const routes = ([] as RouteDefinition[]).concat(route).map<RouteDefinition>((route) => {
    if (route.component) {
      return route;
    }
    // match nest route in case parent route does not have component
    return {
      ...route,
      component: () => <Outlet />,
    };
  });
  const routerState = useRouterState();
  routerState.setRoutes(routes);

  // defer prefetch
  setTimeout(() => {
    flatRoutes(routes).forEach((route) => {
      const comp = route.component as LazyComponent | undefined;
      if (route.prefetch && comp?.preload) {
        comp
          .preload()
          .then(() => {
            prefetchRoutes[route.path] = true;
          })
          .catch(() => {
            prefetchRoutes[route.path] = true;
          });
      }
    });
  }, 0);

  return getRoutes(routes);
};
