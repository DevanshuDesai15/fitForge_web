# Previous Session Display During Workout

**Date:** 2026-06-11  
**Status:** Approved

## Problem

During an active workout, users have no way to see what weights and reps they used for the current exercise in their previous session. They must rely on memory or leave the app to check history.

## Solution

Show a collapsible "Last session" row inside `ModernWorkoutExercise`, positioned between the Target Sets/Reps box and the "Log Set N" label. Tapping the row reveals the sets from the most recent completed workout that included this exercise.

## Data Flow

1. **`StartWorkout.jsx`** fires one Supabase query after exercises are loaded:
   - Table: `workouts`
   - Filter: `user_id = currentUser.uid`, `completed = true`
   - Order: `completed_at DESC`
   - Limit: 10
   - Select: `exercises, completed_at`

2. From the 10 rows, build a lookup map:
   ```js
   { [exerciseName]: sets[] }
   ```
   For each exercise name, use the sets from the most recent workout row that contained it.

3. Pass `previousSetsMap[exercises[currentExerciseIndex]?.name]` as the `previousSets` prop to `ModernWorkoutExercise`.

## Component Changes

### `StartWorkout.jsx`
- Add state: `previousSetsMap` (object, default `{}`)
- Add `useEffect` (depends on `exercises`, `currentUser`, `supabase`):
  - Skips if `exercises` is empty or user is not authenticated
  - Queries Supabase as described above
  - On success: builds map and sets state
  - On error: logs warning, leaves map as `{}` (silent degradation)
- Pass `previousSets={previousSetsMap[exercises[currentExerciseIndex]?.name]}` to `ModernWorkoutExercise`

### `ModernWorkoutExercise.jsx`
- Add prop: `previousSets` (optional array of `{reps, weight}`)
- Add local state: `showPrevious` (boolean, default `false`)
- New UI block rendered between Target Sets/Reps box and "Log Set N" label:
  - If `previousSets` is `undefined` or `null`: render nothing
  - Otherwise: render a tappable `"▸ Last session"` row
  - On tap: toggle `showPrevious`
  - MUI `Collapse` reveals a compact per-set list: `"Set 1: 10 reps @ 60 lbs"`
  - Uses the `weightUnit` prop already available for correct unit label

## Error Handling

| Scenario | Behavior |
|---|---|
| Query fails | `previousSetsMap` stays `{}`, row not shown |
| Exercise never done before | `previousSets` is `undefined`, row not shown |
| Last session had no completed sets | `previousSets` is `[]`, row shows "No sets recorded" |
| User not authenticated | Effect skips, row not shown |

## Constraints

- No loading spinner — data is supplementary; if absent, UI is unaffected
- No new hooks, no new files — changes confined to two existing files
- Exercise matching is by `exercise.name` (string equality), consistent with how exercises are identified in `mapWorkoutToDb`
- Only strength exercises show set data; cardio exercises are skipped (no `sets` array)
