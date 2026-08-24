import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'FitForge',
  slug: 'fitforge-mobile',
  scheme: 'fitforge',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  runtimeVersion: { policy: 'appVersion' },
  ios: { bundleIdentifier: 'com.devanshudesai.fitforge' },
  android: { package: 'com.devanshudesai.fitforge' },
  plugins: ['expo-router', 'expo-secure-store', 'expo-sqlite'],
  experiments: { typedRoutes: true },
};

export default config;
