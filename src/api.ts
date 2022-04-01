export const api = {
  isClient: typeof window !== 'undefined',
  get href() {
    return this.isClient ? window.location.href : '';
  },
  pushState: (state: any, url: string | URL) => {
    if (!api.isClient) return;
    window.history.pushState(state, '', url);
  },
  replaceState: (state: any, url: string | URL) => {
    if (!api.isClient) return;
    window.history.replaceState(state, '', url);
  },
  onPopstate: (cb: (event: PopStateEvent) => void) => {
    if (!api.isClient) return;
    window.addEventListener('popstate', cb);
  },
  unPopState: (cb: (event: PopStateEvent) => void) => {
    if (!api.isClient) return;
    window.removeEventListener('popstate', cb);
  }
}
