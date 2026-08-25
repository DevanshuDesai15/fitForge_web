import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Spinner, colors } from '@/design-system';
import { gateDestination, type GateArea } from '../model/auth-policy';
import { useAuthBootstrap } from '../providers/AuthBootstrapProvider';

export function AuthGate({ area, children }: { area: GateArea; children: ReactNode }) {
  const { clerkLoaded, signedIn, profileStatus } = useAuthBootstrap();
  const waiting = !clerkLoaded || (signedIn && (profileStatus === 'unknown' || profileStatus === 'loading'));
  if (waiting) return <View accessibilityLabel="Loading your FitForge account" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.canvas }}><Spinner size={32} /></View>;
  const destination = gateDestination(area, { clerkLoaded, signedIn, profile: profileStatus });
  if (destination) return <Redirect href={destination} />;
  return children;
}
