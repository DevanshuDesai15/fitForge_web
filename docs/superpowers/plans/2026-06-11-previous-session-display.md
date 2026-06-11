# Previous Session Display During Workout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a collapsible "Last session" row in the active-workout exercise card so users can see the weights and reps they used for this exercise in their most recent completed workout.

**Architecture:** A pure helper function `buildPreviousSetsMap` (exported from `StartWorkout.jsx`) takes the last 10 completed workouts from Supabase and returns a lookup map `{ [exerciseName]: sets[] }`. `StartWorkout.jsx` fetches this data once on mount and passes the relevant slice as a `previousSets` prop to `ModernWorkoutExercise`. The component renders a collapsible MUI `Collapse` block between the Stats Bar and the Strength logging section.

**Tech Stack:** React 18, MUI (`Collapse`), lucide-react (`ChevronRight`), Supabase JS client, Vitest

---

## File Map

| File | Change |
|---|---|
| `src/pages/Workout/StartWorkout.jsx` | Export `buildPreviousSetsMap`; add `previousSetsMap` state + fetch effect; pass `previousSets` prop |
| `src/pages/Workout/components/ModernWorkoutExercise.jsx` | Export `formatPreviousSet`; add `previousSets` prop + `showPrevious` state + collapsible UI block |
| `src/pages/Workout/__tests__/StartWorkout.test.jsx` | Add tests for `buildPreviousSetsMap` |
| `src/pages/Workout/__tests__/cardioHelpers.test.js` | Add tests for `formatPreviousSet` |

---

### Task 1: Export and test `buildPreviousSetsMap` in `StartWorkout.jsx`

**Files:**
- Modify: `src/pages/Workout/__tests__/StartWorkout.test.jsx`
- Modify: `src/pages/Workout/StartWorkout.jsx`

- [ ] **Step 1: Write the failing tests**

Append to `src/pages/Workout/__tests__/StartWorkout.test.jsx`:

```js
import { buildPreviousSetsMap } from '../StartWorkout';

describe('buildPreviousSetsMap', () => {
  it('returns empty object for empty input', () => {
    expect(buildPreviousSetsMap([])).toEqual({});
  });

  it('returns empty object for null input', () => {
    expect(buildPreviousSetsMap(null)).toEqual({});
  });

  it('maps exercise name to sets from the most recent workout', () => {
    const rows = [
      {
        completed_at: '2026-06-10T10:00:00Z',
        exercises: [
          { name: 'Bench Press', exercise_type: 'strength', sets: [{ reps: 10, weight: '60' }] },
        ],
      },
    ];
    expect(buildPreviousSetsMap(rows)).toEqual({
      'Bench Press': [{ reps: 10, weight: '60' }],
    });
  });

  it('uses the first (most recent) row when exercise appears in multiple workouts', () => {
    const rows = [
      {
        completed_at: '2026-06-10T10:00:00Z',
        exercises: [{ name: 'Squat', exercise_type: 'strength', sets: [{ reps: 5, weight: '100' }] }],
      },
      {
        completed_at: '2026-06-03T10:00:00Z',
        exercises: [{ name: 'Squat', exercise_type: 'strength', sets: [{ reps: 5, weight: '90' }] }],
      },
    ];
    expect(buildPreviousSetsMap(rows)['Squat']).toEqual([{ reps: 5, weight: '100' }]);
  });

  it('skips cardio exercises', () => {
    const rows = [
      {
        exercises: [{ name: 'Running', exercise_type: 'cardio', cardio: {} }],
      },
    ];
    expect(buildPreviousSetsMap(rows)).toEqual({});
  });

  it('skips exercises without a sets array', () => {
    const rows = [
      {
        exercises: [{ name: 'Plank', exercise_type: 'strength' }],
      },
    ];
    expect(buildPreviousSetsMap(rows)).toEqual({});
  });

  it('builds map across multiple exercises in one workout', () => {
    const rows = [
      {
        exercises: [
          { name: 'Bench Press', exercise_type: 'strength', sets: [{ reps: 10, weight: '60' }] },
          { name: 'Tricep Pushdown', exercise_type: 'strength', sets: [{ reps: 12, weight: '30' }] },
        ],
      },
    ];
    const map = buildPreviousSetsMap(rows);
    expect(map['Bench Press']).toEqual([{ reps: 10, weight: '60' }]);
    expect(map['Tricep Pushdown']).toEqual([{ reps: 12, weight: '30' }]);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/pages/Workout/__tests__/StartWorkout.test.jsx
```

Expected: FAIL — `buildPreviousSetsMap is not a function` (or similar import error)

- [ ] **Step 3: Add `buildPreviousSetsMap` to `StartWorkout.jsx`**

Find the block of other exported pure functions near the top of `src/pages/Workout/StartWorkout.jsx` (alongside `buildWorkoutSaveExercises`, `resolveProgramWorkoutSelection`). Add after them:

```js
export function buildPreviousSetsMap(workoutRows) {
  const map = {};
  for (const row of (workoutRows || [])) {
    for (const exercise of (row.exercises || [])) {
      if (!exercise.name) continue;
      if (exercise.exercise_type === 'cardio') continue;
      if (!map[exercise.name] && Array.isArray(exercise.sets)) {
        map[exercise.name] = exercise.sets;
      }
    }
  }
  return map;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/pages/Workout/__tests__/StartWorkout.test.jsx
```

Expected: All `buildPreviousSetsMap` tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Workout/StartWorkout.jsx src/pages/Workout/__tests__/StartWorkout.test.jsx
git commit -m "feat: add buildPreviousSetsMap helper for previous session lookup"
```

---

### Task 2: Export and test `formatPreviousSet` in `ModernWorkoutExercise.jsx`

**Files:**
- Modify: `src/pages/Workout/__tests__/cardioHelpers.test.js`
- Modify: `src/pages/Workout/components/ModernWorkoutExercise.jsx`

- [ ] **Step 1: Write the failing tests**

Append to `src/pages/Workout/__tests__/cardioHelpers.test.js`:

```js
import { formatPreviousSet } from '../components/ModernWorkoutExercise';

describe('formatPreviousSet', () => {
  it('formats reps and weight in metric', () => {
    expect(formatPreviousSet({ reps: 10, weight: '60' }, 'kg')).toBe('10 reps @ 60 kg');
  });

  it('formats reps and weight in imperial', () => {
    expect(formatPreviousSet({ reps: 8, weight: '135' }, 'lbs')).toBe('8 reps @ 135 lbs');
  });

  it('shows 0 when weight is missing', () => {
    expect(formatPreviousSet({ reps: 10 }, 'kg')).toBe('10 reps @ 0 kg');
  });

  it('shows — when reps is missing', () => {
    expect(formatPreviousSet({ weight: '60' }, 'kg')).toBe('— reps @ 60 kg');
  });

  it('defaults weightUnit to kg', () => {
    expect(formatPreviousSet({ reps: 5, weight: '80' })).toBe('5 reps @ 80 kg');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/pages/Workout/__tests__/cardioHelpers.test.js
```

Expected: FAIL — `formatPreviousSet is not a function`

- [ ] **Step 3: Add `formatPreviousSet` to `ModernWorkoutExercise.jsx`**

Add after the existing `toStoredKm` export near the top of `src/pages/Workout/components/ModernWorkoutExercise.jsx` (after line ~30):

```js
export function formatPreviousSet(set, weightUnit = 'kg') {
  const reps = set.reps ?? '—';
  const weight = set.weight || '0';
  return `${reps} reps @ ${weight} ${weightUnit}`;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/pages/Workout/__tests__/cardioHelpers.test.js
```

Expected: All `formatPreviousSet` tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Workout/components/ModernWorkoutExercise.jsx src/pages/Workout/__tests__/cardioHelpers.test.js
git commit -m "feat: add formatPreviousSet helper for previous session display"
```

---

### Task 3: Fetch previous session data in `StartWorkout.jsx` and pass it as a prop

**Files:**
- Modify: `src/pages/Workout/StartWorkout.jsx`

- [ ] **Step 1: Add `previousSetsMap` state**

In `src/pages/Workout/StartWorkout.jsx`, inside the `StartWorkout` component, find the block of `useState` declarations (around where `bottomTab` is declared). Add one more:

```js
const [previousSetsMap, setPreviousSetsMap] = useState({});
```

- [ ] **Step 2: Add the fetch effect**

After the existing `useEffect` that ensures `targetSets` is initialized (the one with `exercisesNeedUpdate`), add:

```js
useEffect(() => {
  if (!currentUser?.uid) return;

  (async () => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('exercises, completed_at')
        .eq('user_id', currentUser.uid)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPreviousSetsMap(buildPreviousSetsMap(data || []));
    } catch (err) {
      console.warn('Could not load previous session data:', err);
    }
  })();
}, [currentUser?.uid]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Pass `previousSets` prop to `ModernWorkoutExercise`**

Find the `<ModernWorkoutExercise` render block (around line 900). Add one prop:

```jsx
<ModernWorkoutExercise
    exercise={exercises[currentExerciseIndex]}
    exerciseIndex={currentExerciseIndex}
    currentSetIndex={exercises[currentExerciseIndex].exercise_type === 'cardio' ? 0 : (exercises[currentExerciseIndex].sets?.findIndex(set => !set.completed) || 0)}
    onSetChange={handleSetChange}
    onCompleteSet={handleCompleteSet}
    onRemoveSet={handleRemoveCompletedSet}
    onAddExtraSet={handleAddExtraSet}
    onCardioChange={handleCardioChange}
    onCompleteCardio={handleCompleteCardio}
    weightUnit={weightUnit}
    aiTip="Solid set! Maintain or slightly increase weight."
    totalExercises={exercises.length}
    onPreviousExercise={handlePreviousExercise}
    onNextExercise={handleNextExercise}
    previousSets={previousSetsMap[exercises[currentExerciseIndex]?.name]}
/>
```

- [ ] **Step 4: Verify the app compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: Build completes with no errors (warnings about unused vars are fine).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Workout/StartWorkout.jsx
git commit -m "feat: fetch previous session data and pass to exercise card"
```

---

### Task 4: Add collapsible "Last session" UI to `ModernWorkoutExercise.jsx`

**Files:**
- Modify: `src/pages/Workout/components/ModernWorkoutExercise.jsx`

- [ ] **Step 1: Update imports**

In `src/pages/Workout/components/ModernWorkoutExercise.jsx`:

Change the MUI import line from:
```js
import { Box, Typography, Card, CardContent, Button, Chip, IconButton, TextField } from '@mui/material';
```
to:
```js
import { Box, Typography, Card, CardContent, Button, Chip, IconButton, TextField, Collapse } from '@mui/material';
```

Change the lucide-react import line from:
```js
import { Info, Minus, Plus, CheckCircle, X } from 'lucide-react';
```
to:
```js
import { Info, Minus, Plus, CheckCircle, X, ChevronRight } from 'lucide-react';
```

- [ ] **Step 2: Add `previousSets` prop and `showPrevious` state**

Inside the `ModernWorkoutExercise` component destructuring, add `previousSets`:

```js
const ModernWorkoutExercise = ({
    exercise,
    exerciseIndex,
    currentSetIndex,
    onSetChange,
    onCompleteSet,
    onRemoveSet,
    onAddExtraSet,
    onCardioChange,
    onCompleteCardio,
    weightUnit = 'kg',
    aiTip,
    totalExercises,
    onPreviousExercise,
    onNextExercise,
    previousSets,
}) => {
```

Add `showPrevious` state alongside the existing `distanceDisplay` state:

```js
const [distanceDisplay, setDistanceDisplay] = useState('');
const [showPrevious, setShowPrevious] = useState(false);
```

- [ ] **Step 3: Insert the "Last session" UI block**

Find the Stats Bar closing `</Box>` (the one wrapping Target Sets / Target Reps, around line 129). It looks like:

```jsx
                </Box>

                {/* ─── CARDIO SECTION ─── */}
```

Insert a new block between the Stats Bar `</Box>` and the `{/* ─── CARDIO SECTION ─── */}` comment:

```jsx
                </Box>

                {/* Last Session */}
                {!isCardio && previousSets != null && (
                    <Box sx={{ mb: 2 }}>
                        <Button
                            variant="text"
                            size="small"
                            onClick={() => setShowPrevious(prev => !prev)}
                            startIcon={
                                <ChevronRight
                                    size={14}
                                    style={{
                                        transform: showPrevious ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                    }}
                                />
                            }
                            sx={{ color: 'text.secondary', textTransform: 'none', p: 0, minWidth: 0 }}
                        >
                            Last session
                        </Button>
                        <Collapse in={showPrevious}>
                            <Box sx={{ pl: 0.5, pt: 0.5 }}>
                                {previousSets.length === 0 ? (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        No sets recorded
                                    </Typography>
                                ) : (
                                    previousSets.map((set, i) => (
                                        <Typography
                                            key={i}
                                            variant="caption"
                                            sx={{ color: 'text.secondary', display: 'block' }}
                                        >
                                            Set {i + 1}: {formatPreviousSet(set, weightUnit)}
                                        </Typography>
                                    ))
                                )}
                            </Box>
                        </Collapse>
                    </Box>
                )}

                {/* ─── CARDIO SECTION ─── */}
```

- [ ] **Step 4: Add `previousSets` to PropTypes**

Find the `ModernWorkoutExercise.propTypes` block at the bottom of the file and add:

```js
ModernWorkoutExercise.propTypes = {
    exercise: PropTypes.object.isRequired,
    exerciseIndex: PropTypes.number.isRequired,
    currentSetIndex: PropTypes.number.isRequired,
    onSetChange: PropTypes.func.isRequired,
    onCompleteSet: PropTypes.func.isRequired,
    onRemoveSet: PropTypes.func.isRequired,
    onAddExtraSet: PropTypes.func.isRequired,
    onCardioChange: PropTypes.func,
    onCompleteCardio: PropTypes.func,
    weightUnit: PropTypes.string,
    aiTip: PropTypes.string,
    totalExercises: PropTypes.number.isRequired,
    onPreviousExercise: PropTypes.func.isRequired,
    onNextExercise: PropTypes.func.isRequired,
    previousSets: PropTypes.arrayOf(PropTypes.shape({
        reps: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        weight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })),
};
```

- [ ] **Step 5: Run all tests and build**

```bash
npx vitest run src/pages/Workout/__tests__/
```

Expected: All tests PASS (no regressions)

```bash
npm run build 2>&1 | tail -20
```

Expected: Build completes with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Workout/components/ModernWorkoutExercise.jsx
git commit -m "feat: add collapsible previous session display to exercise card"
```

---

## Self-Review Checklist

- [x] **Spec coverage**
  - ✅ Collapsible "Last session" row in exercise card
  - ✅ Positioned between Stats Bar and Log Set section
  - ✅ Shows per-set detail when expanded: "Set 1: 10 reps @ 60 lbs"
  - ✅ Respects `weightUnit` prop for correct unit label
  - ✅ Hidden for cardio exercises
  - ✅ Hidden when exercise has never been done before (`previousSets` is `undefined`)
  - ✅ Shows "No sets recorded" when `previousSets` is `[]`
  - ✅ Single Supabase query for all exercises (LIMIT 10)
  - ✅ Silent degradation on query failure
  - ✅ No new files — only two existing components modified
- [x] **No placeholders** — all steps have complete code
- [x] **Type consistency** — `buildPreviousSetsMap` returns `{ [name]: sets[] }`, consumed as `previousSetsMap[name]`, received as `previousSets` — consistent across all 4 tasks
