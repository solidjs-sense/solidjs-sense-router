import { Accessor, Component, JSX } from 'solid-js';

export type RouterComponent =
  | JSX.FunctionElement
  | (Component<any> & {
      preload: () => Promise<{
        default: Component<any>;
      }>;
    });

export interface Route {
  path: string;
  component?: RouterComponent;
}

export type RouteDefinition = Route & {
  children?: RouteDefinition[];
};

export type UrlParams = {
  url: URL | string;
  queryParams?: Record<string, string | number>;
  hash?: string;
  replace?: boolean;
  state?: any;
};

export interface RouteState {
  route: Accessor<string | undefined>;
  setRoute: (route: string | undefined) => void;
  routeParams: Accessor<Record<string, string>>;
  setRouteParams: (params: Record<string, string>) => void;
  pending: Accessor<boolean>;
  setPending: (pending: boolean) => void;
  url: Accessor<URL>;
  setUrl: (url: URL) => void;
  base: Accessor<string>;
  setBase: (base: string) => void;
  state: Accessor<any>;
  setState: (state: any) => void;
}
