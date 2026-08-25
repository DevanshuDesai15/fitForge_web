import { BottomNav, type BottomNavItem } from '@/design-system/components/navigation';
import { useRouter } from 'expo-router';
import { routes } from '@/navigation/routes';

type AppTabsProps = {
  state: { index: number; routes: { name: string }[] };
  onNavigate: (name: string) => void;
};

const items: BottomNavItem[] = [{ value: 'home', label: 'Home', icon: 'home' }, { value: 'workouts', label: 'Workouts', icon: 'dumbbell' }, { value: 'history', label: 'History', icon: 'history' }, { value: 'progress', label: 'Progress', icon: 'line-chart' }];
export function AppTabs({ state, onNavigate }: AppTabsProps) { const router = useRouter(); const active = state.routes[state.index]?.name; return <BottomNav items={items} value={active} onChange={onNavigate} center={{ label: 'Start', icon: 'plus', onClick: () => router.push(routes.activeWorkout) }} />; }
