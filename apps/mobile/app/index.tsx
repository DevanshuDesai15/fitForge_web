import { Redirect } from 'expo-router';
import { routes } from '@/navigation/routes';
export default function IndexRoute() { return <Redirect href={routes.welcome} />; }
