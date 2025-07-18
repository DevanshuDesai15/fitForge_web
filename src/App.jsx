// App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

// Import API testing utilities in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/apiTester.js');
}

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <div style={{
            backgroundColor: '#121212',
            minHeight: '100vh',
            paddingBottom: '56px' // Height of bottom navigation
          }}>
            <Routes>
              {/* Auth routes */}
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />

              {/* Main routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <>
                    <Home />
                    <Navigation />
                  </>
                </ProtectedRoute>
              } />

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

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;