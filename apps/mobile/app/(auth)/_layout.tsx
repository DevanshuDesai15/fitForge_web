import { Stack } from 'expo-router';
import { AuthGate } from '@/features/auth/components/AuthGate';
export default function AuthLayout() { return <AuthGate area="auth"><Stack screenOptions={{ headerShown: false }} /></AuthGate>; }
