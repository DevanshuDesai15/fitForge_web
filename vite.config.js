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
      "import.meta.env.VITE_FIREBASE_API_KEY": JSON.stringify(
        env.VITE_FIREBASE_API_KEY
      ),
      "import.meta.env.VITE_FIREBASE_AUTH_DOMAIN": JSON.stringify(
        env.VITE_FIREBASE_AUTH_DOMAIN
      ),
      "import.meta.env.VITE_FIREBASE_PROJECT_ID": JSON.stringify(
        env.VITE_FIREBASE_PROJECT_ID
      ),
      "import.meta.env.VITE_FIREBASE_STORAGE_BUCKET": JSON.stringify(
        env.VITE_FIREBASE_STORAGE_BUCKET
      ),
      "import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(
        env.VITE_FIREBASE_MESSAGING_SENDER_ID
      ),
      "import.meta.env.VITE_FIREBASE_APP_ID": JSON.stringify(
        env.VITE_FIREBASE_APP_ID
      ),
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
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            'vendor-mui': ['@mui/material', '@mui/system'],
            'vendor-recharts': ['recharts'],
            'vendor-ai': ['@google/generative-ai'],
          },
        },
      },
    },
    // Strip console.log/warn/error and debugger statements in production builds
    ...(mode === "production" && {
      esbuild: {
        drop: ["console", "debugger"],
      },
    }),
  };
});
