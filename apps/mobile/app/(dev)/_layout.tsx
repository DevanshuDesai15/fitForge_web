import { Redirect, Stack } from 'expo-router';
export default function DevLayout() { if (!__DEV__) return <Redirect href="/+not-found" />; return <Stack screenOptions={{ headerShown: false, presentation: 'modal' }} />; }
