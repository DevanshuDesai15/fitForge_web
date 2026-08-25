import { View } from 'react-native';
import { Spinner, colors } from '@/design-system';
export default function OAuthCallbackRoute() { return <View accessibilityLabel="Finishing Google sign in" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface.canvas }}><Spinner size={32} /></View>; }
