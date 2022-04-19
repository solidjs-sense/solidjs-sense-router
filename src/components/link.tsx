import { createEffect, createMemo, mergeProps, onCleanup, splitProps } from 'solid-js';
import { useCurrentMatch, useNavigator, useLocation, useMatch } from '../hook';
import { api } from '../api';
import { joinBase } from '../util';
import { LazyComponent, LinkProps } from '../types';

export const Link = (props: LinkProps) => {
  const defaultProps = mergeProps({ prefetch: 'visible' }, props);
  const [linkProps, aProps] = splitProps(defaultProps, ['state', 'replace', 'queryParams', 'activeClass', 'prefetch']);
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
    const { onClick } = aProps;
    if (typeof onClick === 'function') {
      onClick(e);
    } else if (onClick && onClick[0] && typeof onClick[0] === 'function') {
      onClick[0](onClick[1], e);
    }
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

  const preload = (comp: LazyComponent) => {
    comp.preload().catch(() => {
      // noop
    });
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

    const comp = match?.component as LazyComponent | undefined;
    if (!comp?.preload) {
      return;
    }

    if (linkProps.prefetch === 'hover' && refAnchor) {
      removeOnMouseEnter();
      onMouseEnter = () => {
        preload(comp);
      };
      refAnchor.addEventListener('mouseenter', onMouseEnter);
    } else if (linkProps.prefetch === 'immediate') {
      preload(comp);
    } else if (linkProps.prefetch === 'visible' && refAnchor && !observer) {
      observer = new api.IntersectionObserver!((entries) => {
        entries.forEach((entry) => {
          if (entry.target === refAnchor && entry.isIntersecting) {
            preload(comp);
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
