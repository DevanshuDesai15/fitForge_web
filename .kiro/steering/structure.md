# FitForge - Project Structure & Conventions

## Folder Organization

```
src/
├── components/           # React components (main pages & UI)
│   ├── common/          # Reusable UI components
│   ├── test/            # Development/testing components
│   └── workout/         # Workout-specific components
├── contexts/            # React Context providers (AuthContext)
├── firebase/            # Firebase configuration and setup
├── hooks/               # Custom React hooks
├── services/            # API services and external integrations
├── theme/               # MUI theme configuration
└── utils/               # Helper functions and utilities
```

## Component Architecture

- **Page Components**: Top-level route components (Home.jsx, Profile.jsx, etc.)
- **Feature Components**: Domain-specific components in subfolders (workout/, common/)
- **Layout Components**: Navigation, routing wrappers (Navigation.jsx, ProtectedRoute.jsx)

## Naming Conventions

- **Files**: PascalCase for components (`Home.jsx`, `ExerciseManager.jsx`)
- **Folders**: camelCase for directories (`components/`, `utils/`)
- **Components**: PascalCase with descriptive names
- **Functions**: camelCase with verb-noun pattern (`fetchExercises`, `loadUserData`)

## Code Organization Patterns

### Component Structure

```jsx
// Imports (React, MUI, external libs, local imports)
import { useState, useEffect } from 'react';
import { Card, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

// Styled components (using MUI styled)
const StyledCard = styled(Card)(({ theme }) => ({...}));

// Main component with hooks at top
export default function ComponentName() {
    const [state, setState] = useState();
    const { currentUser } = useAuth();

    // Effects and handlers
    useEffect(() => {...}, []);

    // Render
    return (...);
}
```

### Service Layer Pattern

- API calls in `services/` directory
- Error handling and logging included
- Consistent return formats
- Cache management for external APIs

### Context Usage

- AuthContext for user authentication state
- Minimal context usage (no over-engineering)
- Context providers wrap entire app sections

## Routing Structure

- **Public Routes**: Landing, SignIn, SignUp (redirect if authenticated)
- **Protected Routes**: All main app functionality (require authentication)
- **Nested Routes**: Workout sub-features under `/workout/*`
- **Navigation**: Bottom navigation for authenticated users only

## Styling Conventions

- **Theme-based**: Use MUI theme colors and spacing
- **Styled Components**: MUI's `styled()` for custom components
- **Responsive**: Mobile-first design with Grid2 system
- **Dark Theme**: Custom dark color palette with gradients
- **Consistent Spacing**: Use theme spacing units

## Firebase Integration

### Firestore Collections

```
users/{userId} - User profiles and preferences
workouts/{workoutId} - Completed workout sessions
exercises/{exerciseId} - User's exercise logs
templates/{templateId} - Saved workout templates
```

### Security Rules

- User-scoped data access only
- Proper authentication checks
- Data validation at database level

## Development Conventions

- **Error Boundaries**: Wrap components that might fail
- **Loading States**: Show loading indicators for async operations
- **Error Handling**: User-friendly error messages
- **Console Logging**: Structured logging for debugging
- **Environment Variables**: Use VITE\_ prefix for client-side vars

## File Naming Patterns

- **Components**: `ComponentName.jsx`
- **Services**: `serviceName.js`
- **Utils**: `utilityName.js`
- **Hooks**: `useHookName.js`
- **Tests**: `ComponentName.test.jsx` (in test/ folders)
