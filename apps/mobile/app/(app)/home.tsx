import { router } from 'expo-router';
import { Button, Card, IconButton, Textarea } from '@/design-system';
import { Screen } from '@/features/app-shell/Screen';
import { routes } from '@/navigation/routes';
export default function HomeRoute() { return <Screen eyebrow="TODAY" title="Home" action={<IconButton icon="user" label="Open profile" onPress={() => router.push(routes.profile)} />}><Card tone="accent"><Textarea label="Foundation status" value="The app shell is ready. Dashboard data arrives in Phase 6." editable={false} /></Card><Button onPress={() => router.push(routes.gallery(__DEV__))}>Open component gallery</Button></Screen>; }
