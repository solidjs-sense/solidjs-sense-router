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

export const formatURL = (params: UrlParams, oldURL: URL): URL => {
  const url = new URL(params.url, oldURL);

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
  const pathParts = pathname.split('/');

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
    } else if (routePart !== pathParts[i]) {
      return { match: false, params: {} };
    }
  }

  const m =
    routeParts.length === pathParts.length || (pathParts.length === routeParts.length - 1 && route.endsWith('?'));

  return {
    match: m,
    params: m ? params : {},
  };
};

export const matchRoutes = (pathname: string, route: RouteDefinition): RouteDefinition | undefined => {
  const routes = flatRoutes(([] as RouteDefinition[]).concat(route));

  for (let i = 0; i < routes.length; i++) {
    const route = routes[i];
    const { match } = matchRoute(pathname, route.path);
    if (match) {
      return route;
    }
  }

  return;
};
