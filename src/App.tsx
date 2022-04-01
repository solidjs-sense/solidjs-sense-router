import { Component, createSignal, lazy } from "solid-js";
import { useNavigator, useRouter } from "./hook";
import { Router } from "./router";
import { RouteDefinition } from "./types";

const routes: RouteDefinition[] = [
  {
    path: "/",
    component: lazy(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
  const [base, setBase] = createSignal('/zh')
  return (
    <Router>
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
            setBase('/en')
            navigator.navigate({
              url: "/about",
            })
          }}
        >
          about button
        </button>
        <button onclick={() => {
          setBase(base() === '/zh' ? '/en' : '/zh')
        }}>change base</button>
        <Routers base={base()}/>
        <div class="loading"></div>
      </div>
    </Router>
  );
};

export default App;
