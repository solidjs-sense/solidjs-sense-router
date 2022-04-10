# solidjs-sense-router

一个浑然天成的路由器

## 安装

`npm install solidjs-sense-router` 或 `yarn add solidjs-sense-router`

## 使用

示例:

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

组件:

- `<Router ...props />`
  - props:
    - `children`: `JSX.Element`
    - `url`: 当前的 url，在服务端渲染模式必须传
    - `defaultBase`: 默认的 base (默认值: `''`)

- `<Link ...props />`
    - props: 和 `a` 标签的 props 相同 并且多了:
        - `replace`: 是否替换当前的 url (默认值: `false`)
        - `state`: 当前的 url 的 state (默认值: `undefined`)
        - `queryParams?`: `Record<string, string>` 当前地址的查询参数
        - `activeClass?`: 当前路由和 `href` 匹配，则添加 `activeClass` 类名到 `a` 标签上
- `<Outlet />` 嵌套子路由

Hooks:

- `useRoutes(route: RouteDefinition | RouteDefinition[])`
  > 返回 `Routes`

- `useLoading(): Accessor<boolean>`
  > 当前页面是否正在加载

- `useLocation(): { url: Accessor<URL>; fullUrl: Accessor<URL>; base: Accessor<string>; state: Accessor<any>; }`
  > 返回 `url`, `fullUrl`, `base`, `state`

- `useNavigator(): { navigate, newBase }`
  - `navigate(...)`: 导航到指定的 url
  - `newBase(...)`: 设置新的 base

- `useQueryParams()`
  > 返回当前地址的查询参数

- `useRouteParams()`
  > 返回当前的路由参数

- `useMatch(path: string): boolean`
  > 如果 `path` 匹配当前路由，则返回 `true`

工具函数:

- `matchRoute(path: string, route: string): { match: boolean; params: Record<string, string> }`
  - `match`: 如果 `path` 匹配 `route`，则为 `true`
  - `params`: 匹配的路由参数

