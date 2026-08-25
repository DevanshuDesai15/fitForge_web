import { router } from 'expo-router';
import { Button, Card } from '@/design-system';
import { Screen } from '@/features/app-shell/Screen';
import { routes } from '@/navigation/routes';
export default function WelcomeRoute() { return <Screen eyebrow="FORGE YOUR NEXT REP" title="FitForge"><Card tone="accent"><Button fullWidth onPress={() => router.push(routes.signIn)}>Sign in</Button><Button fullWidth variant="ghost" onPress={() => router.push(routes.signUp)}>Create account</Button></Card></Screen>; }
