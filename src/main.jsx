import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create a client
const queryClient = new QueryClient();

// Set up Gemini test functions for debugging (dev only)
if (import.meta.env.DEV) {
  import('./utils/geminiTest').then(m => m.setupGeminiConsoleTest())
  import('./utils/testAIFixes').then(m => m.setupAIFixesTest())
  import('./utils/geminiSetupTest').then(m => m.setupGeminiSetupTest())
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key in .env.local')
}

// Wrapper to provide React Router context to Clerk
function ClerkProviderWithRouter({ children }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      {children}
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProviderWithRouter>
        <QueryClientProvider client={queryClient}>
          <App />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </ClerkProviderWithRouter>
    </BrowserRouter>
  </StrictMode>,
)
