import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: new URL('./src/', import.meta.url).pathname },
      { find: /^react-native$/, replacement: new URL('./src/test/react-native-stub.tsx', import.meta.url).pathname },
      { find: /^lucide-react-native$/, replacement: new URL('./src/test/lucide-stub.tsx', import.meta.url).pathname },
      { find: /^react-native-svg$/, replacement: new URL('./src/test/svg-stub.tsx', import.meta.url).pathname },
      { find: /^react-native-safe-area-context$/, replacement: new URL('./src/test/safe-area-stub.tsx', import.meta.url).pathname },
      { find: /^expo-secure-store$/, replacement: new URL('./src/test/secure-store-stub.ts', import.meta.url).pathname },
      { find: /^@clerk\/expo$/, replacement: new URL('./src/test/clerk-stub.tsx', import.meta.url).pathname },
      { find: /^expo-auth-session$/, replacement: new URL('./src/test/auth-session-stub.ts', import.meta.url).pathname },
      { find: /^expo-web-browser$/, replacement: new URL('./src/test/web-browser-stub.ts', import.meta.url).pathname },
      { find: /^expo-router$/, replacement: new URL('./src/test/expo-router-stub.tsx', import.meta.url).pathname },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    server: { deps: { inline: ['react-native'] } },
  },
});
