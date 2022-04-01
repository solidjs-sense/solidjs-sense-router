import { Component, createSignal, lazy, onCleanup } from 'solid-js';
import { useLoading, useNavigator, useRouter } from '../../src/hook';
import { Router } from '../../src/router';
import { RouteDefinition } from '../../src/types';
import './App.scss';
import { api } from '../../src/api';

const routes: RouteDefinition[] = [
  {
    path: '/',
    component: lazy(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return import('./home');
    }),
  },
  {
    path: '/about',
    component: lazy(() => import('./about')),
  },
];

const App: Component = () => {
  const bases = ['/zh', '/en'];
  const Routers = useRouter(routes);
  const navigator = useNavigator();
  const currentUrl = api.href !== undefined ? new URL(api.href) : undefined;
  const currentBase = currentUrl && bases.find((p) => currentUrl.pathname.startsWith(p));
  const [base, setBase] = createSignal(currentBase || '');
  const loading = useLoading();

  const urlChange = () => {
    const url = new URL(window.location.href);
    const currentBase = bases.find((p) => url.pathname.startsWith(p));
    if (currentBase && currentBase !== base()) {
      setBase(currentBase);
    }
  };

  window.addEventListener('popstate', urlChange);

  onCleanup(() => {
    window.removeEventListener('popstate', urlChange);
  });

  return (
    <div>
      <button
        onclick={() =>
          navigator.navigate({
            url: '/',
          })
        }
      >
        home button
      </button>
      <button
        onclick={() => {
          navigator.navigate({
            url: '/about',
          });
        }}
      >
        about button
      </button>
      <button onclick={() => setBase(base() === '/zh' ? '/en' : '/zh')}>change base</button>
      <Routers base={base()} />
      <div
        class="loading"
        classList={{
          start: loading(),
          done: !loading(),
        }}
      ></div>
    </div>
  );
};

export default () => {
  return (
    <Router>
      <App />
    </Router>
  );
};
