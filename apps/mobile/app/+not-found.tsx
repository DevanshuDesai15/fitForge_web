import { router } from 'expo-router';
import { Button, EmptyState } from '@/design-system';
import { Screen } from '@/features/app-shell/Screen';
export default function NotFoundRoute() { return <Screen><EmptyState title="Screen not found" body="This FitForge route is unavailable." action={<Button onPress={() => router.replace('/')}>Return home</Button>} /></Screen>; }
