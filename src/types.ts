import { Accessor, Component, JSX } from 'solid-js';
import { useLocation } from './hook';

export type LazyComponent = Component<any> & {
  preload: () => Promise<{
    default: Component<any>;
  }>;
};

export type RouterComponent = JSX.FunctionElement | LazyComponent;

export interface Route {
  path: string;
  component?: RouterComponent;
  canLoad?: (location: ReturnType<typeof useLocation>, route: RouteDefinition) => Promise<boolean> | boolean;
  redirectTo?: string;
}

export type RouteDefinition = Route & {
  children?: RouteDefinition[];
};

export type RouteConfig = RouteDefinition & {
  isLoaded?: boolean;
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
  routeConfig: Accessor<RouteConfig | undefined>;
  setRouteConfig: (route: RouteConfig | undefined) => void;
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
