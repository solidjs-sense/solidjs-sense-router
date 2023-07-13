import { createEffect, createMemo, mergeProps, onCleanup, splitProps } from 'solid-js';
import { useCurrentMatch, useNavigator, useLocation, useMatch, prefetchRoutes, PrefetchState } from '../hook';
import { api } from '../api';
import { joinBase } from '../util';
import { LazyComponent, LinkProps, RouteDefinition } from '../types';

let observer: IntersectionObserver | undefined;
let observerCbs: Map<HTMLAnchorElement, () => void> | undefined;

export const Link = (props: LinkProps) => {
  const defaultProps = mergeProps({ prefetch: 'visible' }, props);
  const [linkProps, aProps] = splitProps(defaultProps, [
    'disabled',
    'state',
    'onClick',
    'onclick',
    'replace',
    'queryParams',
    'activeClass',
    'prefetch',
  ]);
  const navigator = useNavigator();
  const location = useLocation();
  let refAnchor: HTMLAnchorElement | undefined;

  const url = createMemo(() => new URL(aProps.href ?? '', location.url()));
  const urlPathname = createMemo(() => url().pathname);

  const classList = createMemo(() => {
    return linkProps.activeClass
      ? {
          [linkProps.activeClass]: !!useCurrentMatch(urlPathname()),
          ...(aProps.classList || {}),
        }
      : { ...(aProps.classList || {}) };
  });

  const href = createMemo(() => {
    const newURL = joinBase(location.base(), url());
    const params = linkProps.queryParams;
    if (params) {
      Object.keys(params).forEach((key) => {
        newURL.searchParams.set(key, params[key]);
      });
    }
    return newURL.href.replace(newURL.origin, '');
  });

  const click = (
    e: MouseEvent & {
      currentTarget: HTMLAnchorElement;
      target: Element;
    },
  ) => {
    const { onClick, onclick, disabled } = linkProps;
    if (disabled) {
      e.preventDefault();
      return;
    }
    [onClick, onclick].forEach((clickCb) => {
      if (typeof clickCb === 'function') {
        clickCb(e);
      } else if (clickCb && clickCb[0] && typeof clickCb[0] === 'function') {
        clickCb[0](clickCb[1], e);
      }
    });
    if (aProps.target === '_blank') {
      return;
    }
    e.preventDefault();
    navigator.navigate({
      url: url(),
      state: linkProps.state,
      replace: linkProps.replace,
      queryParams: linkProps.queryParams,
    });
  };

  const ref = (el: HTMLAnchorElement) => {
    if (aProps.ref && typeof aProps.ref === 'function') {
      aProps.ref(el);
    } else if (aProps.ref) {
      aProps.ref = el;
    }
    refAnchor = el;
  };

  const preload = (r: RouteDefinition) => {
    const uniquePath = `${r.id || ''}${r.path}`;
    if (!prefetchRoutes[uniquePath]) {
      prefetchRoutes[uniquePath] = PrefetchState.Pending;
      (r.component as LazyComponent | undefined)
        ?.preload?.()
        .then(() => {
          prefetchRoutes[uniquePath] = PrefetchState.Loaded;
        })
        .catch(() => {
          prefetchRoutes[uniquePath] = PrefetchState.Loaded;
        });
    }
  };

  let onMouseEnter: (() => void) | undefined;
  const removeOnMouseEnter = () => {
    if (onMouseEnter) {
      refAnchor?.removeEventListener('mouseenter', onMouseEnter);
      onMouseEnter = undefined;
    }
  };

  const removeObserver = () => {
    if (refAnchor) {
      observerCbs?.delete(refAnchor);
      observer?.unobserve(refAnchor);
    }
  };

  createEffect(() => {
    if (!api.isClient) {
      return;
    }

    if (!observerCbs) {
      observerCbs = new Map();
    }

    if (!observer) {
      observer = new api.IntersectionObserver!((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }
          observerCbs!.get(entry.target as HTMLAnchorElement)?.();
        });
      });
    }

    removeObserver();
    removeOnMouseEnter();

    const matches = useMatch(urlPathname());

    if (matches.every((match) => !(match.component as LazyComponent | undefined)?.preload)) {
      return;
    }

    const preloadMatches = () => {
      matches.forEach((match) => {
        preload(match);
        let p = match.parentRoute;
        while (p) {
          preload(p);
          p = p.parentRoute;
        }
      });
    };

    if (linkProps.prefetch === 'hover' && refAnchor) {
      onMouseEnter = () => {
        preloadMatches();
      };
      refAnchor.addEventListener('mouseenter', onMouseEnter);
    } else if (linkProps.prefetch === 'immediate') {
      preloadMatches();
    } else if (linkProps.prefetch === 'visible' && refAnchor) {
      observerCbs.set(refAnchor, () => {
        preloadMatches();
        removeObserver();
      });
      observer.observe(refAnchor);
    }
  });

  onCleanup(() => {
    removeObserver();
    removeOnMouseEnter();
  });

  return (
    <a {...aProps} ref={ref} href={href()} onclick={click} classList={classList()}>
      {props.children}
    </a>
  );
};
