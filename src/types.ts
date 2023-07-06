import { Accessor, Component, JSX } from 'solid-js';
import { ActionType } from './api';
import { useLocation } from './hook';

export type LazyComponent = Component<any> & {
  preload: () => Promise<{
    default: Component<any>;
  }>;
};

export type RouterComponent = JSX.FunctionElement | LazyComponent;

export type RouteDefinition = {
  path: string;
  id?: string;
  component?: RouterComponent;
  canLoad?: (location: ReturnType<typeof useLocation>, route: RouteDefinition) => Promise<boolean> | boolean;
  redirectTo?: string;
  prefetch?: boolean;
  children?: RouteDefinition[];
};

export type FlatRoute = RouteDefinition & { parentRoute?: FlatRoute };

export type UrlParams = {
  url: URL | string;
  queryParams?: Record<string, string | number>;
  hash?: string;
  replace?: boolean;
  state?: any;
};

export interface RouterState {
  routes: Accessor<RouteDefinition[]>;
  setRoutes: (routes: RouteDefinition[]) => void;
  pending: Accessor<boolean>;
  setPending: (pending: boolean) => void;
  url: Accessor<URL>;
  setUrl: (url: URL) => void;
  base: Accessor<string>;
  setBase: (base: string) => void;
  state: Accessor<any>;
  setState: (state: any) => void;
}

export type LeaveCallback = (action: ActionType, length: number) => Promise<any>;

export interface RouteState {
  route: Accessor<RouteDefinition | undefined>;
  setRoute: (route: RouteDefinition | undefined) => void;
  parentContext?: RouteState;
  childContext: Accessor<RouteState | undefined>;
  setChildContext: (state: RouteState | undefined) => void;
  leaveCallbacks: LeaveCallback[];
  setLeaveCallbacks: (cb: LeaveCallback) => void;
  clearLeaveCallbacks: () => void;
}

export interface LinkProps extends JSX.AnchorHTMLAttributes<HTMLAnchorElement> {
  disabled?: boolean;
  state?: any;
  replace?: boolean;
  queryParams?: Record<string, string>;
  activeClass?: string;
  /**
   * default: `visible`
   *
   * `immediate`: prefetch the route immediately
   *
   * `visible`: prefetch the route when the element is visible
   *
   * `hover`: prefetch the route when the element is hovered
   *
   * @type {('immediate' | 'visible' | 'hover')}
   * @memberof LinkProps
   */
  prefetch?: 'immediate' | 'visible' | 'hover' | 'none';
}

export interface Session {
  url: string;
  base: string;
  state?: any;
}
