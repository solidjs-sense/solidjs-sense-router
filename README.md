# solidjs-sense-router

The SolidJS Router that make sense.

## Installation

`npm install solidjs-sense-router` or `yarn add solidjs-sense-router`

## Usage

Sample:

``` jsx
import { Component, lazy } from "solid-js";
import { render } from 'solid-js/web';
import { useRoutes, RouteDefinition } from "solidjs-sense-router";

const routes: RouteDefinition[] = [
  {
    path: "/",
    component: lazy(() => import("./pages/home")),
  },
  {
    path: "/product",
    redirectTo: '/good'
  },
  {
    path: "/good",
    component: lazy(() => import("./pages/good")),
    children: [
      {
        path: "/food",
        component: lazy(() => import("./pages/good/food")),
      },
      {
        path: "/fruit",
        component: lazy(() => import("./pages/good/fruit")),
      },
    ],
    prefetch: true;
    canLoad: () => {
       ...
       return true;
    }
  },
  {
    path: "/news/:id?",
    component: lazy(() => import("./pages/news")),
  },
  {
    path: "/*all",
    component: lazy(() => import("./pages/not-found")),
  },
];

const App: Component = () => {
  const Routes = useRoutes(routes);
  return (
    <Router>
      <Routes />
    </Router>
  );
};

render(() => <App />, document.getElementById('root') as HTMLElement);
```

## API

Components:

- `<Router ...props />`
  - props:
    - `children`: `JSX.Element`
    - `url`: current url (must be set in server mode)
    - `defaultBase`: default base url (default: `''`)

- `<Link ...props />`
    - props: same as `a` tag and more have:
        - `replace`: if true, replace current url (default: `false`)
        - `state`: state object to push in history (default: `undefined`)
        - `queryParams?`: `Record<string, string>` query params
        - `activeClass?`: class name witch will be added to `a` tag when link's `href` is match by current route
        - `prefetch?`: 'immediate' | 'visible' | 'hover' | 'none'
          - `immediate`: prefetch when link is rendered
          - `visible`: prefetch when link is visible
          - `hover`: prefetch when mouse is over link
          - `none`: don't prefetch
- `<Outlet />` nest child

Hooks:

- `useRoutes(route: RouteDefinition | RouteDefinition[])`
  > return `Routes`

- `useLoading(): Accessor<boolean>`
  > if page is loading

- `useLocation(): { url: Accessor<URL>; fullUrl: Accessor<URL>; base: Accessor<string>; state: Accessor<any>; }`
  > return `url`, `fullUrl`, `base`, `state`

- `useNavigator(): { navigate, newBase }`
  - `navigate(...)`: navigate to new route
  - `newBase(...)`: change base of url

- `useQueryParams()`
  > return query params

- `useRouteParams()`
  > return route params

- `useCurrentMatch(path: string): RouteDefinition | undefined`
  > return current route match by `path`

- `useMatch(path: string): RouteDefinition | undefined`
  > return route match by `path`

- `usePrefetch(path: string | string[]): prefetch route match by path`

- `useRouteAction(): [Accessor<ActionType>, Accessor<number>]` return route action (forward/backward) and current route number which start from `0`
  - `ActionType`: `forward` | `backward` current route is forward or backward

- `onRouteLeave((action: ActionType, length: number) => Promise<any>)`
  - current route page will unMount until callback's Promise resolve, so you can do some page effects before page leave

Utils:

- `matchRoute(path: string, route: string): { match: boolean; params: Record<string, string> }`
  - `match`: true if `path` is match by `route`
  - `params`: route params match by `route`

