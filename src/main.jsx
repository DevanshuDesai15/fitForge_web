import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

// Create a client
const queryClient = new QueryClient();

// Set up AI debug helpers in development only
if (import.meta.env.DEV) {
  import('./utils/testAIFixes').then(m => m.setupAIFixesTest())
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
const SENTRY_ENVIRONMENT =
  import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key in .env.local')
}

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: import.meta.env.DEV ? 1 : 0.2,
  })
}

if (POSTHOG_KEY) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    persistence: 'localStorage',
    loaded: (client) => {
      if (import.meta.env.DEV) {
        client.debug()
      }
    },
  })
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

ClerkProviderWithRouter.propTypes = {
  children: PropTypes.node.isRequired,
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProviderWithRouter>
        <QueryClientProvider client={queryClient}>
          <PostHogProvider client={posthog}>
            <App />
            <ReactQueryDevtools initialIsOpen={false} />
          </PostHogProvider>
        </QueryClientProvider>
      </ClerkProviderWithRouter>
    </BrowserRouter>
  </StrictMode>,
)
