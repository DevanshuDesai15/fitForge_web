export function makeRedirectUri({ scheme, path }: { scheme: string; path: string }) { return `${scheme}://${path}`; }
