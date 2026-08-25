import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: new URL('./src/test/react-native-stub.tsx', import.meta.url).pathname },
      { find: /^lucide-react-native$/, replacement: new URL('./src/test/lucide-stub.tsx', import.meta.url).pathname },
      { find: /^react-native-svg$/, replacement: new URL('./src/test/svg-stub.tsx', import.meta.url).pathname },
      { find: /^react-native-safe-area-context$/, replacement: new URL('./src/test/safe-area-stub.tsx', import.meta.url).pathname },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    server: { deps: { inline: ['react-native'] } },
  },
});
