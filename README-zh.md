# solidjs-sense-router

一个简单合理的路由器

## 安装

`npm install solidjs-sense-router` 或 `yarn add solidjs-sense-router`

**为什么不 [solid-router](https://github.com/solidjs/solid-router)**

请看 https://github.com/solidjs/solid-router/issues/64 和本库提供的 `newBase` api

## 使用

示例:

``` jsx
import { Component, lazy } from "solid-js";
import { render } from 'solid-js/web';
import { useNavigator, useRouter, RouteDefinition } from "solidjs-sense-router";

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

组件:

- `<Router ...props />`
  - props:
    - `children`: `JSX.Element`
    - `url`: 当前的 url，在服务端渲染模式必须传
    - `defaultBase`: 默认的 base (默认值: `''`)
    - `maxKeepAlive`: 最大 keepAlive 数量, 默认无限制

- `<Link ...props />`
    - props: 和 `a` 标签的 props 相同 并且多了:
        - `replace`: 是否替换当前的 url (默认值: `false`)
        - `state`: 当前的 url 的 state (默认值: `undefined`)
        - `queryParams?`: `Record<string, string>` 当前地址的查询参数
        - `activeClass?`: 当前路由和 `href` 匹配，则添加 `activeClass` 类名到 `a` 标签上
        - `prefetch?`: 'immediate' | 'visible' | 'hover' | 'none'
          - `immediate`: 当 `Link` 渲染后立即开始预加载
          - `visible`: 当 `Link` 在可视区域内时开始预加载
          - `hover`: 当 `Link` 鼠标悬停时开始预加载
          - `none`: 不预加载
- `<Outlet />` 嵌套子路由
- `<KeepAlive ...props />` 在父组件 unMounted 后缓存组件状态, 复用 signals 和 DOM elements. idea from [solid-keep-alive](https://github.com/JulianSoto/solid-keep-alive)
    - props:
        - `children`: `JSX.Element`
        - `id`: 唯一 id
        - `onShow` 当要显示的时候调用
        - `onHide` 当要隐藏的时候调用

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

- `useCurrentMatch(path: string): RouteDefinition | undefined`
  > 返回当前的匹配的路由

- `useMatch(path: string): RouteDefinition[]`
  > 返回匹配的路由

- `usePrefetch(path: string | string[]): 预加载匹配 path 的路由`

- `useRouteAction(): [Accessor<ActionType>, Accessor<number>]` 返回路由动作（前进/后退）和当前路由数，路由数从 `0` 开始
  - `ActionType`: `forward` | `backward` 当前的路由是前进还是后退

- `onRouteLeave((action: ActionType, length: number) => Promise<any>)`
  - 当前路由页面会在回调函数返回的 Promise resolve 之后卸载，可以用来做页面卸载特效

工具函数:

- `matchRoute(path: string, route: string): { match: boolean; params: Record<string, string> }`
  - `match`: 如果 `path` 匹配 `route`，则为 `true`
  - `params`: 匹配的路由参数

