// True when FitForge was launched from the home screen (installed web app) rather than a browser tab.
// iOS Safari reports it through navigator.standalone; everything else through the display-mode query.
export function isInstalledApp() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)')?.matches === true || window.navigator.standalone === true;
}
