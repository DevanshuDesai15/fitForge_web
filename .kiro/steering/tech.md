# FitForge - Technical Stack

## Build System & Development

- **Build Tool**: Vite 6.0.5 for fast development and production builds
- **Package Manager**: npm (package-lock.json present)
- **Node Version**: Requires Node.js v18 or higher

## Frontend Stack

- **Framework**: React 18.3.1 with functional components and hooks
- **Language**: JavaScript (ES6+) with JSX
- **UI Library**: Material-UI (MUI) 6.3.1 with custom dark theme
- **Routing**: React Router DOM v7.1.1
- **State Management**: React Context API (no Redux)
- **Styling**: MUI theming system with custom color palette and gradients

## Backend & Services

- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Database**: Firestore for real-time data synchronization
- **Hosting**: Firebase Hosting with SPA routing configuration
- **External API**: wger Exercise Database (free, no API key required)

## Key Dependencies

- **Icons**: React Icons (Material Design icons)
- **Date Handling**: date-fns for date manipulation
- **Animations**: Lottie React for animations
- **Styling**: Emotion (MUI's styling solution)

## Development Tools

- **Linting**: ESLint with React plugins and hooks rules
- **Code Style**: Modern ES6+ with React best practices
- **Environment**: Vite environment variables (VITE\_ prefix)

## Common Commands

```bash
# Development
npm run dev          # Start development server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Firebase Deployment
firebase login       # Authenticate with Firebase
firebase deploy      # Deploy to Firebase Hosting
```

## Environment Setup

Required environment variables in `.env`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Performance Features

- **Background Timer**: Web Worker-based timer for workout sessions
- **Wake Lock**: Keeps screen awake during workouts (when supported)
- **Offline Support**: Service worker for offline functionality
- **Real-time Sync**: Firestore real-time updates across devices
