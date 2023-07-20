import { createMemo, createRoot, getOwner, JSXElement, onCleanup, onMount, runWithOwner } from 'solid-js';
import { useKeepAlive } from '../hook';

export const KeepAlive = (props: { id: string; onShow?: () => void; onHide?: () => void; children: JSXElement }) => {
  const [keepAliveElements, { maxKeepAlive, insertKeepAliveElement, removeKeepAliveElement }] = useKeepAlive();
  const currentElement = createMemo(() => {
    return keepAliveElements().find((e) => e.id === props.id);
  });

  if (!currentElement()) {
    createRoot((dispose) => {
      insertKeepAliveElement({
        id: props.id,
        owner: getOwner(),
        children: props.children,
        dispose,
        unMounted: false,
      });
    });
  }

  onMount(() => {
    const currentEl = currentElement();
    if (currentEl) {
      currentEl.unMounted = false;
    }
    props.onShow?.();
  });

  onCleanup(() => {
    props.onHide?.();
    const currentEl = currentElement();
    if (!currentEl) {
      return;
    }
    currentEl.unMounted = true;
    const max = maxKeepAlive();
    const elements = keepAliveElements();
    if (max === undefined || elements.length <= max) {
      return;
    }
    const overflowElement = elements.slice(max).find((el) => el.id === props.id);
    if (overflowElement) {
      removeKeepAliveElement(overflowElement.id);
    }
  });

  return () => {
    const el = currentElement();
    return el?.owner && runWithOwner(el.owner, () => el.children);
  };
};
