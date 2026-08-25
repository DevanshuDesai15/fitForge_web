import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSSO } from '@clerk/expo';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
type MakeRedirect = (options: { scheme: string; path: string }) => string;
type StartSSO = (options: { strategy: 'oauth_google'; redirectUrl: string }) => Promise<{ createdSessionId?: string | null; setActive?: (options: { session: string }) => Promise<unknown> }>;

export function googleRedirectUri(makeRedirectUri: MakeRedirect = AuthSession.makeRedirectUri) { return makeRedirectUri({ scheme: 'fitforge', path: 'oauth-callback' }); }
export function createGoogleAuthController(startSSOFlow: StartSSO, redirect: () => string = googleRedirectUri) {
  return async () => {
    try {
      const result = await startSSOFlow({ strategy: 'oauth_google', redirectUrl: redirect() });
      if (!result.createdSessionId || !result.setActive) return 'incomplete' as const;
      await result.setActive({ session: result.createdSessionId });
      return 'complete' as const;
    } catch (error) {
      if ((error as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return 'cancelled' as const;
      throw error;
    }
  };
}

export function useGoogleAuth() {
  const { startSSOFlow } = useSSO();
  useEffect(() => { if (Platform.OS !== 'android') return; void WebBrowser.warmUpAsync(); return () => { void WebBrowser.coolDownAsync(); }; }, []);
  return createGoogleAuthController(startSSOFlow as StartSSO);
}
