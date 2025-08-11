// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from '@mui/material';
import { theme } from './theme/theme';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';

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

// Wrapper component to handle conditional styling
function AppWrapper({ children }) {
  const { currentUser } = useAuth();

  return (
    <div style={{
      backgroundColor: '#121212',
      minHeight: '100vh',
      paddingBottom: currentUser ? '56px' : '0', // Only add padding for authenticated users with navigation
    }}>
      {children}
    </div>
  );
}

// Import API testing utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/apiTester.js');
  import('./utils/testBackgroundTimer.js');
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
                  <>
                    <Workout />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/workout/start" element={
                <ProtectedRoute>
                  <>
                    <StartWorkout />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/workout/library" element={
                <ProtectedRoute>
                  <>
                    <ExerciseLibrary />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/workout/exercise/:id" element={
                <ProtectedRoute>
                  <>
                    <ExerciseDetail />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/workout/templates" element={
                <ProtectedRoute>
                  <>
                    <WorkoutTemplates />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />
              <Route path="/workout/quick-add" element={
                <ProtectedRoute>
                  <>
                    <QuickAdd />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />

              {/* History route */}
              <Route path="/history" element={
                <ProtectedRoute>
                  <>
                    <History />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />

              {/* Progress route */}
              <Route path="/progress" element={
                <ProtectedRoute>
                  <>
                    <Progress />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />

              {/* Exercise Manager route */}
              <Route path="/exercise-manager" element={
                <ProtectedRoute>
                  <>
                    <ExerciseManager />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />

              {/* Profile route */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <>
                    <Profile />
                    <Navigation />
                  </>
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