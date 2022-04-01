import {
  batch,
  createContext,
  createEffect,
  createSignal,
  onCleanup,
  untrack,
  useContext,
  useTransition,
  Suspense,
  createMemo,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { api } from './api';
import { RouteDefinition, RouterComponent, RouteState, UrlParams } from './types';
import { baseRegex, flatRoutes, formatURL, joinBase } from './util';

export const RouteContext = createContext<RouteState>();

export const useRouteState = () => {
  const state = useContext(RouteContext);
  console.assert(!!state, 'Router Hook function must be used within a <Router> component');
  return state!;
};

export const setRoutePending = (pending: boolean) => {
  useRouteState().setPending(pending);
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
  const { url, base } = useLocation();

  const newURL = formatURL(params, url());

  if (base() && newURL.pathname.startsWith(base())) {
    newURL.pathname = newURL.pathname.replace(baseRegex(base()), '/');
  }

  const displayUrl = joinBase(base(), new URL(newURL));

  !params.replace ? api.pushState(params.state, displayUrl) : api.replaceState(params.state, displayUrl);

  batch(() => {
    setRouteUrl(newURL);
    setRouteState(params.state);
  });
};

export const useNavigator = () => {
  return {
    navigate,
  };
};

export const useRouter = (route: RouteDefinition | RouteDefinition[]) => {
  return (props: { base?: string }) => {
    const [pending, start] = useTransition();
    const [router, setRouter] = createSignal<RouterComponent | undefined>();
    const location = useLocation();
    const routes = flatRoutes(([] as RouteDefinition[]).concat(route));

    // base change
    createEffect(() => {
      const newBase = props.base ?? '';
      const url = untrack(location.url);
      const oldBase = untrack(location.base);

      if (newBase) {
        if (!oldBase && url.pathname.startsWith(newBase)) {
          url.pathname = url.pathname.replace(baseRegex(newBase), '/');
        } else {
          api.pushState(undefined, joinBase(newBase, url));
        }
      }

      batch(() => {
        setRouteUrl(url);
        setRouteBase(newBase);
        setRouteState(undefined);
      });
    });

    const onPopstate = (evt: PopStateEvent) => {
      // api.href should not be undefined when popstate event is triggered
      const newURL = new URL(api.href!);
      const { base } = location;

      if (base() && newURL.pathname.startsWith(base())) {
        newURL.pathname = newURL.pathname.replace(baseRegex(base()), '/');
      }

      batch(() => {
        setRouteUrl(newURL);
        setRouteState(evt.state);
      });
    };

    api.onPopstate(onPopstate);

    onCleanup(() => {
      api.unPopState(onPopstate);
    });

    createEffect(() => {
      setRoutePending(pending());
    });

    createEffect(() => {
      const url = location.url();
      const route = routes.find((route) => {
        // TODO
        return route.path === url.pathname;
      });
      start(() => setRouter(route?.component ? () => route.component : undefined));
    });

    return (
      <Suspense>
        <Dynamic component={router()} />
      </Suspense>
    );
  };
};
