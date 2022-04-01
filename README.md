# solid-sense-router

The SolidJs Router that make sense.

## Installation

`npm install solid-sense-router` or `yarn add solid-sense-router`

## Usage

``` typescriptreact
import { render } from 'solid-js/web';
import { useNavigator, useRouter } from "solid-sense-router";

const routes = [
  {
    path: "/",
    component: lazy(() => import("./home")),
  },
  {
    path: "/about",
    component: lazy(() => import("./about")),
  },
];

const App: Component = () => {
  const Routers = useRouter(routes);
  return (
    <Router>
      <Routers />
    </Router>
  );
};

render(() => <App />, document.getElementById('root') as HTMLElement);
```
