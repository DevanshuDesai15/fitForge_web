export function useRouter() { return { push: () => undefined, replace: () => undefined, back: () => undefined }; }
export function Redirect() { return null; }
export function Stack({ children }: { children?: React.ReactNode }) { return children; }
Stack.Screen = function Screen() { return null; };
