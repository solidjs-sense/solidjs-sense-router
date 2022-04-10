import { Accessor, Component, JSX } from 'solid-js';

export type LazyComponent = Component<any> & {
  preload: () => Promise<{
    default: Component<any>;
  }>;
};

export type RouterComponent = JSX.FunctionElement | LazyComponent;

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

export interface RouterState {
  pending: Accessor<boolean>;
  setPending: (pending: boolean) => void;
  url: Accessor<URL>;
  setUrl: (url: URL) => void;
  base: Accessor<string>;
  setBase: (base: string) => void;
  state: Accessor<any>;
  setState: (state: any) => void;
}

export interface RouteState {
  route: Accessor<RouteDefinition | undefined>;
  setRoute: (route: RouteDefinition | undefined) => void;
  parentContext?: RouteState;
  childContext: Accessor<RouteState | undefined>;
  setChildContext: (state: RouteState | undefined) => void;
}

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  state?: any;
  replace?: boolean;
  queryParams?: Record<string, string>;
  activeClass?: string;
}

export interface Session {
  url: string;
  base: string;
  state?: any;
}
