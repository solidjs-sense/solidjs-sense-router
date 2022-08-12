import { createEffect, createMemo, mergeProps, onCleanup, splitProps } from 'solid-js';
import { useCurrentMatch, useNavigator, useLocation, useMatch, prefetchRoutes } from '../hook';
import { api } from '../api';
import { joinBase } from '../util';
import { LazyComponent, LinkProps, RouteDefinition } from '../types';

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

  const classList = createMemo(() => {
    return linkProps.activeClass
      ? {
          [linkProps.activeClass]: !!useCurrentMatch(url().pathname),
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
    if (!prefetchRoutes[r.path]) {
      (r.component as LazyComponent)
        .preload?.()
        .then(() => {
          prefetchRoutes[r.path] = true;
        })
        .catch(() => {
          prefetchRoutes[r.path] = true;
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

  let observer: IntersectionObserver | undefined;
  const removeObserver = () => {
    if (observer) {
      observer.disconnect();
      observer = undefined;
    }
  };

  createEffect(() => {
    if (!api.isClient) {
      return;
    }

    if (linkProps.prefetch !== 'visible') {
      removeObserver();
    }

    const match = useMatch(url().pathname);

    if (!match || !(match.component as LazyComponent).preload) {
      return;
    }

    if (linkProps.prefetch === 'hover' && refAnchor) {
      removeOnMouseEnter();
      onMouseEnter = () => {
        preload(match);
      };
      refAnchor.addEventListener('mouseenter', onMouseEnter);
    } else if (linkProps.prefetch === 'immediate') {
      preload(match);
    } else if (linkProps.prefetch === 'visible' && refAnchor && !observer) {
      observer = new api.IntersectionObserver!((entries) => {
        entries.forEach((entry) => {
          if (entry.target === refAnchor && entry.isIntersecting) {
            preload(match);
            removeObserver();
          }
        });
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
