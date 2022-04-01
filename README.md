# solidjs-sense-router

The SolidJs Router that make sense.

## Installation

`npm install solidjs-sense-router` or `yarn add solidjs-sense-router`

## Usage

``` typescriptreact
import { render } from 'solid-js/web';
import { useNavigator, useRouter } from "solidjs-sense-router";

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
