import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { Spinner, colors } from '@/design-system';
import { authDestination } from '@/features/auth/model/auth-policy';
import { useAuthBootstrap } from '@/features/auth/providers/AuthBootstrapProvider';
export default function IndexRoute() { const state = useAuthBootstrap(); const destination = authDestination({ clerkLoaded: state.clerkLoaded, signedIn: state.signedIn, profile: state.profileStatus }); return destination ? <Redirect href={destination} /> : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.canvas }}><Spinner size={32} /></View>; }
