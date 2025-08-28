import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Set up Gemini test functions for debugging
import { setupGeminiConsoleTest } from './utils/geminiTest'
import { setupAIFixesTest } from './utils/testAIFixes'
import { setupGeminiSetupTest } from './utils/geminiSetupTest'
setupGeminiConsoleTest()
setupAIFixesTest()
setupGeminiSetupTest()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
