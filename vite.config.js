import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const nodeMajorVersion = Number.parseInt(process.versions.node.split('.')[0], 10);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: true,
      // Node 25+ exposes its own Web Storage global. Disable it in test
      // workers so jsdom remains the browser-storage implementation.
      execArgv: nodeMajorVersion >= 25 ? ['--no-experimental-webstorage'] : [],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-mui': ['@mui/material', '@mui/system'],
            'vendor-recharts': ['recharts'],
          },
        },
      },
    },
    // Strip console.log/debug and debugger statements in production builds
    // Keep console.error and console.warn so real issues are still visible
    ...(mode === "production" && {
      esbuild: {
        drop: ["debugger"],
        pure: ["console.log", "console.debug"],
      },
    }),
  };
});
