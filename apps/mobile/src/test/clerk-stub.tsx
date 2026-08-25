import type { ReactNode } from 'react';
export function ClerkProvider({ children }: { children: ReactNode }) { return children; }
export function useAuth() { return { isLoaded: true, isSignedIn: false, userId: null, getToken: async () => null, signOut: async () => undefined }; }
export function useUser() { return { user: null, isLoaded: true }; }
export function useSignIn() { return { signIn: null, errors: {}, fetchStatus: 'idle' }; }
export function useSignUp() { return { signUp: null, errors: {}, fetchStatus: 'idle' }; }
export function useSSO() { return { startSSOFlow: async () => ({}) }; }
