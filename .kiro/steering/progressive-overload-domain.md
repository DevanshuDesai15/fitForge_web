# FitForge Progressive Overload Domain

## Domain Overview

The Progressive Overload Domain is the core fitness methodology implemented in FitForge, focusing on systematic strength progression through incremental increases in training load. This domain encompasses workout progression algorithms, personal record tracking, plateau detection, and AI-driven training recommendations.

## Current Application Architecture

### Frontend Stack

- **Framework**: React 18 + Vite for fast development and hot reloading
- **UI Library**: Material-UI (MUI) v6.3.1 with custom dark theme
- **State Management**: React Context API for authentication and global state
- **Routing**: React Router DOM v7.1.1 for SPA navigation
- **Design Philosophy**: Mobile-first responsive design with bottom navigation

### Backend & Data Layer

- **Authentication**: Firebase Auth (email/password + Google OAuth)
- **Database**: Firestore for real-time data synchronization
- **External APIs**: wger Exercise Database (800+ exercises, no API key required)
- **Performance**: Background Web Worker timer, Wake Lock API for uninterrupted workouts

## Data Architecture

### Core Collections Structure

```
Firestore Database:
├── users/{userId}
│   ├── profile: { name, email, preferences, units }
│   ├── settings: { notifications, theme, privacy }
│   └── personalRecords: { [exerciseId]: { weight, reps, date, volume } }
├── workouts/{workoutId}
│   ├── userId: string
│   ├── date: timestamp
│   ├── duration: number (minutes)
│   ├── exercises: Array<ExerciseSession>
│   └── totalVolume: number (kg)
├── exercises/{exerciseId}
│   ├── bodyPart: string ("chest", "legs", "shoulders", etc.)
│   ├── equipment: string ("barbell", "dumbbell", "body weight")
│   ├── gifUrl: string (demonstration video URL)
│   ├── name: string
│   ├── target: string (primary muscle)
│   ├── type: string ("api" | "custom")
│   └── instructions: Array<string>
└── goals/{goalId}
    ├── userId: string
    ├── exerciseId: string
    ├── targetWeight: number
    ├── currentWeight: number
    ├── targetDate: timestamp
    └── progressPercentage: number (calculated)
```

### Exercise Data Structure (wger API Integration)

```javascript
// Standard exercise object from wger API
{
  bodyPart: "waist",           // Primary body part trained
  equipment: "body weight",    // Required equipment
  gifUrl: "https://...",       // Exercise demonstration
  name: "3/4 sit-up",         // Exercise name
  target: "abs",              // Primary muscle target
  type: "api",                // Source indicator
  instructions: [             // Step-by-step instructions
    "Lie on your back...",
    "Contract your abs..."
  ]
}
```

### User Workout Data Patterns

```javascript
// Personal Record tracking pattern
personalRecords: {
  "shoulder-press": {
    weight: 75,        // kg
    reps: 8,
    sets: 3,
    date: "2024-01-15",
    volume: 1800       // total kg lifted (75 × 8 × 3)
  },
  "chest-press": {
    weight: 65,
    reps: 10,
    sets: 3,
    date: "2024-01-14",
    volume: 1950
  }
}

// Workout session structure
workoutSession: {
  id: "workout_20240115_001",
  userId: "user123",
  date: "2024-01-15T10:30:00Z",
  duration: 65,         // minutes
  exercises: [
    {
      exerciseId: "shoulder-press",
      sets: [
        { weight: 70, reps: 10, restTime: 90 },
        { weight: 72.5, reps: 8, restTime: 90 },
        { weight: 75, reps: 6, restTime: 120 }
      ],
      totalVolume: 1695,
      personalRecord: true  // Flag if any set was a PR
    }
  ],
  totalVolume: 3850,
  completed: true
}
```

## Progressive Overload Methodology

### Core Principles Implementation

#### 1. **Compound Movement Progression**

```javascript
// Weight progression for compound movements
const compoundProgressionRules = {
  minimumIncrease: 2.5, // kg
  standardIncrease: 5.0, // kg
  exercises: [
    "bench-press",
    "shoulder-press",
    "squat",
    "deadlift",
    "overhead-press",
  ],
  progressionTrigger: {
    condition: "completing_target_reps",
    sets: 3,
    reps: 10,
    successRate: 1.0, // Must complete all sets
  },
};
```

#### 2. **Isolation Movement Progression**

```javascript
// Weight progression for isolation movements
const isolationProgressionRules = {
  minimumIncrease: 1.0, // kg
  standardIncrease: 2.5, // kg
  exercises: [
    "bicep-curls",
    "tricep-extensions",
    "lateral-raises",
    "leg-curls",
    "calf-raises",
  ],
  progressionTrigger: {
    condition: "completing_target_reps",
    sets: 3,
    reps: 12,
    successRate: 1.0,
  },
};
```

#### 3. **Rep Progression Strategy**

```javascript
// When weight progression isn't available
const repProgressionStrategy = {
  pattern: [
    { week: 1, targetReps: "8-10" },
    { week: 2, targetReps: "10-12" },
    { week: 3, targetReps: "12-15" },
    { week: 4, targetReps: "8-10", weightIncrease: true },
  ],
  deloadCondition: "stagnant_for_3_sessions",
};
```

#### 4. **Plateau Detection & Deload Protocol**

```javascript
// Algorithm for detecting training plateaus
const plateauDetection = {
  criteria: {
    noProgressFor: 3, // sessions
    sameWeight: true,
    sameOrFewerReps: true,
    timeframe: "2_weeks",
  },
  deloadProtocol: {
    weightReduction: 0.1, // 10% reduction
    volumeReduction: 0.15, // 15% reduction
    duration: "1_week",
  },
};
```

## Firebase Integration Patterns

### Current Collections Schema

```
users/{userId}              ← Profile, preferences, settings
workouts/{workoutId}        ← Completed workout sessions
exercises/{exerciseId}      ← Exercise library (API + custom)
goals/{goalId}             ← User-defined fitness goals
```

### Proposed AI Enhancement Collections

```
aiSuggestions/{userId}      ← ML-driven workout recommendations
├── nextWorkout: Object     ← Suggested exercises and loads
├── progressionPlan: Array  ← 4-week progression strategy
├── plateauAlerts: Array    ← Detected stagnation warnings
└── lastUpdated: timestamp

progressionPlans/{userId}   ← Structured training periodization
├── currentPhase: string    ← "strength", "hypertrophy", "deload"
├── weeklyPlan: Array       ← 7-day workout structure
├── monthlyGoals: Object    ← Target metrics for the month
└── adaptations: Array      ← Historical plan modifications

plateauDetection/{userId}   ← Performance monitoring
├── exercises: Object       ← Per-exercise stagnation tracking
│   └── {exerciseId}: {
│       lastProgress: timestamp,
│       stalledSessions: number,
│       suggestedAction: string
│     }
└── overallTrend: string    ← "improving", "maintaining", "declining"
```

### Firestore Real-time Patterns

```javascript
// Real-time workout session updates
const workoutListener = onSnapshot(doc(db, "workouts", workoutId), (doc) => {
  if (doc.exists()) {
    updateWorkoutState(doc.data());
    checkForPersonalRecords(doc.data());
    triggerProgressCalculation();
  }
});

// Personal record detection and celebration
const detectPersonalRecord = (newSet, exerciseHistory) => {
  const currentPR = exerciseHistory.personalRecord;
  const newVolume = newSet.weight * newSet.reps;
  const currentVolume = currentPR.weight * currentPR.reps;

  return newVolume > currentVolume;
};
```

## Material-UI Component Architecture

### Design System

```javascript
// Custom theme configuration
const progressiveOverloadTheme = {
  palette: {
    mode: "dark",
    primary: {
      main: "#4ade80", // Green accent for progress indicators
      light: "#86efac",
      dark: "#22c55e",
    },
    secondary: {
      main: "#64748b", // Neutral for secondary actions
      light: "#94a3b8",
      dark: "#475569",
    },
    success: {
      main: "#10b981", // Personal record celebrations
    },
    warning: {
      main: "#f59e0b", // Plateau warnings
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        },
      },
    },
  },
};
```

### Component Patterns

#### 1. **Exercise Progress Cards**

```jsx
// Exercise progress display with progression indicators
<Card sx={{ mb: 2, position: "relative" }}>
  <CardContent>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">{exercise.name}</Typography>
      <Chip label={`+${progressionPercentage}%`} color="success" size="small" />
    </Box>
    <LinearProgress
      variant="determinate"
      value={goalProgress}
      sx={{ mt: 1, mb: 2 }}
    />
    <Typography variant="body2" color="text.secondary">
      Current: {currentWeight}kg × {currentReps} reps
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Target: {targetWeight}kg × {targetReps} reps
    </Typography>
  </CardContent>
</Card>
```

#### 2. **Bottom Navigation Structure**

```jsx
// 5-tab navigation optimized for progressive overload workflow
<BottomNavigation value={currentTab} onChange={handleTabChange}>
  <BottomNavigationAction label="Dashboard" icon={<HomeIcon />} value="home" />
  <BottomNavigationAction
    label="Workout"
    icon={<FitnessCenterIcon />}
    value="workout"
  />
  <BottomNavigationAction
    label="Progress"
    icon={<TrendingUpIcon />}
    value="progress"
  />
  <BottomNavigationAction
    label="History"
    icon={<HistoryIcon />}
    value="history"
  />
  <BottomNavigationAction
    label="Profile"
    icon={<PersonIcon />}
    value="profile"
  />
</BottomNavigation>
```

#### 3. **Floating Action Buttons for Primary Actions**

```jsx
// Context-aware FAB for starting workouts
<Fab
  color="primary"
  sx={{
    position: "fixed",
    bottom: 80, // Above bottom navigation
    right: 16,
    zIndex: 1000,
  }}
  onClick={startNewWorkout}
>
  <PlayArrowIcon />
</Fab>
```

## AI Enhancement Roadmap

### Phase 1: Basic Progression Intelligence

- Automatic weight progression suggestions
- Personal record detection and celebration
- Simple plateau identification

### Phase 2: Advanced Analytics

- Exercise performance trend analysis
- Workout intensity optimization
- Recovery time recommendations

### Phase 3: Machine Learning Integration

- Personalized progression algorithms
- Predictive plateau prevention
- Custom workout generation based on user patterns

## Key Metrics & KPIs

### User Engagement Metrics

- Average workout frequency per week
- Exercise progression rate (weight increases per month)
- Personal record achievement frequency
- Time spent in active workout sessions

### Progressive Overload Effectiveness

- Percentage of users achieving strength gains monthly
- Average weight progression across exercise categories
- Plateau recovery success rate
- Goal achievement percentage

### Technical Performance

- Real-time sync latency for workout updates
- Background timer accuracy during workouts
- Offline capability usage statistics
- API response times for exercise library searches

## Implementation Guidelines

### Development Priorities

1. **Data Consistency**: Ensure all workout data follows the established schema
2. **Real-time Updates**: Maintain live sync during active workout sessions
3. **Progressive Enhancement**: Build features that enhance without breaking existing workflows
4. **Mobile Optimization**: Prioritize touch-friendly interfaces and thumb-zone navigation

### Testing Strategies

- Unit tests for progression calculation algorithms
- Integration tests for Firebase real-time sync
- User acceptance testing for workout flow optimization
- Performance testing for large datasets (1000+ workouts)

This steering document serves as the comprehensive guide for implementing and enhancing FitForge's progressive overload capabilities, ensuring systematic strength progression for all users.
