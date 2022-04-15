import { batch, createContext, createEffect, createSignal, useContext, createMemo, ErrorBoundary } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { api } from './api';
import {
  LazyComponent,
  RouteConfig,
  RouteDefinition,
  RouterComponent,
  RouterState,
  RouteState,
  UrlParams,
} from './types';
import { baseRegex, formatURL, joinBase, matchRoute, matchRoutes, trimBase } from './util';

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
    const routeConfig = useRouteState().routeConfig();
    if (!routeConfig) {
      return {};
    }

    const { url } = useLocation();
    const { match, params } = matchRoute(url().pathname, routeConfig.path);

    if (match) {
      return params;
    }

    return {};
  });
};

export const useMatch = (path: string | (() => string)) => {
  return createMemo(() => {
    let currentState: RouteState | undefined = useRouteState();
    while (currentState.parentContext) {
      currentState = currentState.parentContext;
    }
    while (currentState) {
      const routeConfig = currentState.routeConfig();
      if (!routeConfig) {
        return false;
      }
      if (matchRoute(typeof path === 'function' ? path() : path, routeConfig.path).match) {
        return true;
      }
      currentState = currentState.childContext();
    }
    return false;
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

const useRouteConfigs = (configs: RouteConfig[]) => {
  return () => {
    const routerState = useRouterState();
    const routeState = useRouteState();
    const location = useLocation();
    const navigator = useNavigator();
    const [router, setRouter] = createSignal<RouterComponent | undefined>();
    let reset: undefined | (() => void);

    createEffect(() => {
      const url = location.url();
      const routeConfig = configs.find((rut) => {
        return matchRoutes(url.pathname, rut);
      });

      reset?.();
      reset = undefined;

      if (routeConfig?.redirectTo) {
        return navigator.navigate({
          url: routeConfig.redirectTo,
          replace: true,
        });
      }

      const resolve = (canLoad: boolean) => {
        if (canLoad) {
          if (routeConfig && !routeConfig.isLoaded && (routeConfig.component as LazyComponent)?.preload) {
            routerState.setPending(true);
            (routeConfig?.component as LazyComponent)
              ?.preload()
              .catch(() => {
                // noop
              })
              .finally(() => {
                routeConfig.isLoaded = true;
                routerState.setPending(false);
              });
          }
          batch(() => {
            routeState.setRouteConfig(routeConfig);
            setRouter(() => routeConfig?.component);
          });
        } else {
          batch(() => {
            routeState.setRouteConfig(undefined);
            setRouter(undefined);
          });
        }
      };

      const canLoad = (routeConfig?.canLoad || (() => true))(location, routeConfig!);
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
  const configs = ([] as RouteDefinition[]).concat(route).map((r) => {
    return {
      ...r,
      isLoaded: false,
    };
  });
  return useRouteConfigs(configs);
};
