import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import type { ReactNode } from 'react';
import { getMobileEnv } from '@/config/env';
import { AuthBootstrapProvider } from './AuthBootstrapProvider';
import { PendingVerificationProvider } from '../store/pending-verification';
import { DataProvider } from '@/data/providers/DataProvider';

export function AuthProviders({ children }: { children: ReactNode }) {
  const { EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY } = getMobileEnv();
  return <ClerkProvider publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}><PendingVerificationProvider><AuthBootstrapProvider><DataProvider>{children}</DataProvider></AuthBootstrapProvider></PendingVerificationProvider></ClerkProvider>;
}
