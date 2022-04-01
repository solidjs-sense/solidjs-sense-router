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
