import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      globals: true,
    },
    // Explicitly expose environment variables that start with VITE_
    define: {
      "import.meta.env.VITE_RAPIDAPI_KEY": JSON.stringify(
        env.VITE_RAPIDAPI_KEY
      ),
      "import.meta.env.VITE_RAPIDAPI_HOST": JSON.stringify(
        env.VITE_RAPIDAPI_HOST
      ),
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
