import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { ClerkProvider } from '@clerk/clerk-react'

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
)
