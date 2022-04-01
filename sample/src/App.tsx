import { Component, createSignal, lazy } from "solid-js";
import { useLoading, useNavigator, useRouter } from "../../src/hook";
import { Router } from "../../src/router";
import { RouteDefinition } from "../../src/types";
import './App.css'
import { api } from "../../src/api";

const routes: RouteDefinition[] = [
  {
    path: "/",
    component: lazy(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return import("./home");
    }),
  },
  {
    path: "/about",
    component: lazy(() => import("./about")),
  },
];

const App: Component = () => {
  const Routers = useRouter(routes);
  const navigator = useNavigator();
  const currentUrl = api.href !== undefined ? new URL(api.href): undefined
  const [base, setBase] = createSignal(
    currentUrl && ['/zh', '/en'].indexOf(currentUrl.pathname) !== -1 ? currentUrl.pathname : ''
  )
  const loading = useLoading()
  return (
    <div>
      <button
        onclick={() =>
          navigator.navigate({
            url: "/",
          })
        }
      >
        home button
      </button>
      <button
        onclick={() => {
          navigator.navigate({
            url: "/about",
          })
        }}
      >
        about button
      </button>
      <button onclick={() => setBase(base() === '/zh' ? '/en' : '/zh')}>
        change base
      </button>
      <Routers base={base()}/>
      <div
        class="loading"
        classList={{
          'loading-start': loading(),
          'loading-done': !loading()
        }}
      >
      </div>
    </div>
  );
};

export default () => {
  return (
    <Router>
      <App />
    </Router>
  )
};
