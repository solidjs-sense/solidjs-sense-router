import { createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { getRoutes, useRouteState } from '../hook';
import { flatRouteChildren } from '../util';
import { WrapRoutes } from './router';

export const Outlet = () => {
  const state = useRouteState();
  const comp = createMemo(() => {
    const route = state!.route();
    if (route?.children) {
      return getRoutes(flatRouteChildren(route.children, route.path));
    }
    return undefined;
  });
  return (
    <WrapRoutes>
      <Dynamic component={comp()} />
    </WrapRoutes>
  );
};
