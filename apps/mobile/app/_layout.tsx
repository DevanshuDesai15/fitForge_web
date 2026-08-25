import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold } from '@expo-google-fonts/archivo';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { colors } from '@/design-system';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ Archivo_400Regular, Archivo_500Medium, Archivo_600SemiBold, Archivo_700Bold, Archivo_800ExtraBold, JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_700Bold });
  useEffect(() => { if (loaded || error) void SplashScreen.hideAsync(); }, [loaded, error]);
  if (!loaded && !error) return null;
  if (error) return <View accessibilityLabel="FitForge could not load its fonts" style={{ flex: 1, backgroundColor: colors.surface.canvas }} />;
  return <><StatusBar style="light" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface.canvas } }}><Stack.Screen name="(auth)" /><Stack.Screen name="(app)" /><Stack.Screen name="(dev)" options={{ presentation: 'modal' }} /><Stack.Screen name="+not-found" /></Stack></>;
}
