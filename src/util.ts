import { Route, RouteDefinition, UrlParams } from './types';

export const flatRoutes = (routes: RouteDefinition[], parentPath?: string): Route[] => {
  return routes.reduce<Route[]>((acc, cur) => {
    const { path, component, children } = cur;
    const route: Route = {
      path: `${parentPath ? parentPath + '/' : ''}${path}`,
      component,
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

// /routeName/:param/*all
// /routeName/:param?
export const matchRoute = (pathname: string, route: string): { match: boolean; params: Record<string, string> } => {
  const routeParts = route.split('/');
  const pathParts = pathname.split('/');
  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    if (routePart[0] === ':' && (pathParts[i] || routePart[routePart.length - 1] === '?')) {
      params[routePart.replace(/^:|\?$/g, '')] = pathParts[i];
    } else if (routePart[0] === '*') {
      params[routePart.slice(1)] = pathParts.slice(i).join('/');
      break;
    } else if (routePart !== pathParts[i]) {
      return { match: false, params: {} };
    }
  }
  return {
    match: true,
    params,
  };
};
