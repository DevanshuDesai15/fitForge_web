// App.jsx
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UnitsProvider } from './contexts/UnitsContext';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme/theme';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PublicRoute from './components/layout/PublicRoute';
import DefaultRoute from './components/layout/DefaultRoute';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingFallback from './components/common/LoadingFallback';
import SkipNavLink from './components/common/SkipNavLink';

// Lazy-loaded route components
const LandingPage = lazy(() => import('./pages/Landing/LandingPage'));
const SignIn = lazy(() => import('./pages/Auth/SignIn'));
const SignUp = lazy(() => import('./pages/Auth/SignUp'));
const Profile = lazy(() => import('./pages/Profile'));
const Workout = lazy(() => import('./components/Workout'));
const ExerciseHistory = lazy(() => import('./pages/History/ExerciseHistory'));
const Progress = lazy(() => import('./components/Progress'));
const ExerciseManager = lazy(() => import('./components/workout/ExerciseManager'));
const StartWorkout = lazy(() => import('./components/workout/StartWorkout'));
const ExerciseLibrary = lazy(() => import('./components/workout/ExerciseLibrary'));
const WorkoutTemplates = lazy(() => import('./components/workout/WorkoutTemplates'));
const QuickAdd = lazy(() => import('./components/workout/QuickAdd'));
const ExerciseDetail = lazy(() => import('./components/workout/ExerciseDetail'));

// Lazy-loaded test components (dev only)
const TimerTest = lazy(() => import('./components/test/TimerTest'));
const CalendarTest = lazy(() => import('./components/test/CalendarTest'));

// Wrapper component to handle conditional styling
function AppWrapper({ children }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface-a0)',
      minHeight: '100vh',
    }}>
      {children}
    </div>
  );
}

// Import API testing utilities in development
if (import.meta.env.DEV) {
  import('./utils/apiTester.js');
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <UnitsProvider>
            <AppWrapper>
              <SkipNavLink />
              <ErrorBoundary>
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    {/* Landing page - public route */}
                    <Route path="/landing" element={<LandingPage />} />

                    {/* Auth routes - redirect to app if already authenticated */}
                    <Route path="/signin" element={
                      <PublicRoute>
                        <SignIn />
                      </PublicRoute>
                    } />
                    <Route path="/signup" element={
                      <PublicRoute>
                        <SignUp />
                      </PublicRoute>
                    } />

                    {/* Default route - smart routing based on auth status */}
                    <Route path="/" element={<DefaultRoute />} />

                    {/* Workout routes */}
                    <Route path="/workout" element={
                      <ProtectedRoute>
                        <Layout>
                          <Workout />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/workout/start" element={
                      <ProtectedRoute>
                        <Layout>
                          <StartWorkout />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/workout/library" element={
                      <ProtectedRoute>
                        <Layout>
                          <ExerciseLibrary />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/workout/exercise/:id" element={
                      <ProtectedRoute>
                        <Layout>
                          <ExerciseDetail />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/workout/templates" element={
                      <ProtectedRoute>
                        <Layout>
                          <WorkoutTemplates />
                        </Layout>
                      </ProtectedRoute>
                    } />
                    <Route path="/workout/quick-add" element={
                      <ProtectedRoute>
                        <Layout>
                          <QuickAdd />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* History route */}
                    <Route path="/history" element={
                      <ProtectedRoute>
                        <Layout>
                          <ExerciseHistory />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Progress route */}
                    <Route path="/progress" element={
                      <ProtectedRoute>
                        <Layout>
                          <Progress />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Exercise Manager route */}
                    <Route path="/exercise-manager" element={
                      <ProtectedRoute>
                        <Layout>
                          <ExerciseManager />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Profile route */}
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    } />

                    {/* Test routes for debugging (dev only) */}
                    {import.meta.env.DEV && (
                      <>
                        <Route path="/test-timer" element={<TimerTest />} />
                        <Route path="/test-calendar" element={<CalendarTest />} />
                      </>
                    )}

                    {/* Catch all route - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </AppWrapper>
          </UnitsProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;