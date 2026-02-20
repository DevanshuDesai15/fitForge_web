import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Set up Gemini test functions for debugging (dev only)
if (import.meta.env.DEV) {
  import('./utils/geminiTest').then(m => m.setupGeminiConsoleTest())
  import('./utils/testAIFixes').then(m => m.setupAIFixesTest())
  import('./utils/geminiSetupTest').then(m => m.setupGeminiSetupTest())
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
