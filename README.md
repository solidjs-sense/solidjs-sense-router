# solidjs-sense-router

The SolidJS Router that make sense.

## Installation

`npm install solidjs-sense-router` or `yarn add solidjs-sense-router`

## Usage

Sample:

``` jsx
import { render } from 'solid-js/web';
import { useNavigator, useRouter } from "solidjs-sense-router";

const routes = [
  {
    path: "/",
    component: lazy(() => import("./pages/home")),
  },
  {
    path: "/news/:id?",
    component: lazy(() => import("./pages/news")),
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
    - props:
        - `children`: `JSX.Element`
        - `href`: `string`
        - `target?`: `_blank`
        - `rel?`: same as `a` tag
        - `queryParams?`: `Record<string, string>` query params
        - `activeClass?`: class name witch will be added to `a` tag when link's `href` is match by current route

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

- `useMatch(path: string): boolean`
  > return true if current route's path is match by `path`

Utils:

- `matchRoute(path: string, route: string): { match: boolean; params: Record<string, string> }`
  - `match`: true if `path` is match by `route`
  - `params`: route params match by `route`

