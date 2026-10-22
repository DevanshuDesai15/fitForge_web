import { useEffect, useRef } from 'react';

// BrowserRouter has no "block leaving" API, so while `active` we keep one extra history entry on top
// of the current page. A back swipe pops that entry instead of leaving; we put it back and call
// `onBack` so the screen can ask what to do. In-app exits should navigate with { replace: true }
// while the guard is active, which swaps the extra entry for the destination instead of stacking.
let activeGuards = 0;

const pushGuardEntry = () => window.history.pushState({ ...window.history.state, ffGuard: true }, '');

export default function useBackGestureGuard(active, onBack) {
  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; });

  useEffect(() => {
    if (!active) return undefined;
    activeGuards += 1;
    // A reload keeps the entry's state, so don't stack a second one on top of it.
    if (!window.history.state?.ffGuard) pushGuardEntry();

    const onPop = () => {
      pushGuardEntry();
      onBackRef.current();
    };
    window.addEventListener('popstate', onPop);

    return () => {
      window.removeEventListener('popstate', onPop);
      activeGuards -= 1;
      // Deferred so an immediate re-activation (StrictMode remount) keeps the entry. If the page
      // navigated away the top entry is the destination, not ours, and there is nothing to remove.
      Promise.resolve().then(() => {
        if (activeGuards === 0 && window.history.state?.ffGuard) window.history.back();
      });
    };
  }, [active]);
}
