// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme/theme';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Main components
import Home from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import Workout from './components/Workout';
import History from './components/History';
import Progress from './components/Progress';
import ExerciseManager from './components/ExerciseManager';

// Workout sub-components
import StartWorkout from './components/workout/StartWorkout';
import ExerciseLibrary from './components/workout/ExerciseLibrary';
import WorkoutTemplates from './components/workout/WorkoutTemplates';
import QuickAdd from './components/workout/QuickAdd';
import ExerciseDetail from './components/workout/ExerciseDetail';
import TimerTest from './components/test/TimerTest';
import CalendarTest from './components/test/CalendarTest';
import LandingPage from './components/LandingPage';
import PublicRoute from './components/PublicRoute';
import DefaultRoute from './components/DefaultRoute';
import ErrorBoundary from './components/ErrorBoundary';

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
if (process.env.NODE_ENV === 'development') {
  import('./utils/apiTester.js');
  // import('./utils/testBackgroundTimer.js');
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppWrapper>
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
                    <ErrorBoundary>
                      <History />
                    </ErrorBoundary>
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

              {/* Test routes for debugging */}
              <Route path="/test-timer" element={<TimerTest />} />
              <Route path="/test-calendar" element={<CalendarTest />} />

              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppWrapper>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;