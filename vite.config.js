import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: true,
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
