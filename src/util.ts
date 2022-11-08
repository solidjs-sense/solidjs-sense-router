import { Route, RouteDefinition, UrlParams } from './types';

export const noop = () => {
  // noop
};

export const flatRouteChildren = (routes: RouteDefinition[], parentPath?: string): RouteDefinition[] => {
  return routes.map((route) => {
    return {
      ...route,
      path: `${parentPath || ''}${route.path}`,
    };
  });
};

export const flatRoutes = (routes: RouteDefinition[], parentPath?: string): RouteDefinition[] => {
  return routes.reduce<Route[]>((acc, cur) => {
    const { path, children } = cur;
    const route: RouteDefinition = {
      ...cur,
      path: `${parentPath || ''}${path}`,
    };
    acc.push(route);
    return children ? acc.concat(flatRoutes(children, route.path)) : acc;
  }, []);
};

export const formatURL = (params: UrlParams, oldURL?: URL): URL => {
  // NOTE
  // With IOS 14.0 and Safari 14.0
  // new URL('https:/xxxxx.com', undefined) will throw `Type error`
  const url = oldURL ? new URL(params.url, oldURL) : new URL(params.url);

  // remove tail end
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  url.hash = params.hash ?? url.hash;

  if (params.queryParams) {
    Object.keys(params.queryParams).forEach((key) => {
      url.searchParams.set(key, `${params.queryParams![key]}`);
    });
  }
  return url;
};

export const joinBase = (base: string | undefined, url: URL) => {
  const newURL = new URL(url);
  const pathname = newURL.pathname;
  newURL.pathname = `${base || ''}${!base || pathname !== '/' ? pathname : ''}`;
  return newURL;
};

export const baseRegex = (base: string) => new RegExp(`^${base}(/|$)`);

export const trimBase = (base: string, url: URL) => {
  if (base) {
    const regex = baseRegex(base);
    if (regex.test(url.pathname)) {
      return url.pathname.replace(regex, '/');
    }
  }
  return url.pathname;
};

export const matchRoute = (pathname: string, route: string) => {
  const params: Record<string, string> = {};
  const routeParts = route.split('/');
  const pathParts = (pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname).split('/');

  let i = 0;
  for (; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    if (routePart[0] === ':' && (pathParts[i] || routePart[routePart.length - 1] === '?')) {
      params[routePart.replace(/^:|\?$/g, '')] = pathParts[i];
    } else if (routePart[0] === '*') {
      params[routePart.slice(1)] = pathParts.slice(i).join('/');
      return {
        match: true,
        params,
      };
    } else if (pathParts[i] !== undefined && routePart !== pathParts[i]) {
      return { match: false, params: {} };
    }
  }

  const m =
    routeParts.length === pathParts.length || (pathParts.length === routeParts.length - 1 && route.endsWith('?'));

  return {
    match: m,
    params,
  };
};

export const matchRoutes = (pathname: string, route: RouteDefinition | RouteDefinition[]): RouteDefinition[] => {
  const result: RouteDefinition[] = [];
  const routes = flatRoutes(([] as RouteDefinition[]).concat(route));

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const { match } = matchRoute(pathname, route.path);
    if (match) {
      result.push(route);
    }
  }

  return result;
};

export class Mute {
  private running = 0;
  private queue: (() => void)[] = [];

  constructor(private total: number) {}

  require = () => {
    return new Promise<() => void>((resolve) => {
      const response = () => {
        this.running += 1;
        resolve(() => {
          this.running -= 1;
          if (this.queue.length && this.running < this.total) {
            this.queue.shift()!();
          }
        });
      };
      if (this.running >= this.total) {
        this.queue.push(response);
      } else {
        response();
      }
    });
  };
}
