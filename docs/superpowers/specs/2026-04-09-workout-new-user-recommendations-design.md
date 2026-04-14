# Workout New-User Recommendations Design

## Summary

Replace the current placeholder `AI Recommended Workout` behavior on the Workout page with three real beginner starter workouts for new users. These fallback cards should appear in the `Recommended for You` section when the user does not yet have meaningful recommendation data. Each card must be backed by a real exercise list and should open a workout-details preview instead of sending the user directly into a blank `Start Workout` screen.

## Goals

- Ensure new users never see an empty or misleading workout recommendation.
- Show three complete beginner-friendly starter workouts that still fit the product's AI recommendation language.
- Make card clicks open a details preview first, not the workout execution screen.
- Allow users to either start the recommended workout as-is or edit it before starting.
- Keep the experience usable on both desktop and mobile.

## Non-Goals

- Building a true personalized recommendation engine in this change.
- Persisting starter workouts into the database before the user chooses one.
- Redesigning the entire Workout page layout.
- Changing the behavior of existing real program/day recommendations for returning users.

## Behavior

### New user fallback state

When the user has no real recommendation to show, the `Recommended for You` section should render three starter workout cards instead of the current placeholder `AI Recommended Workout`.

These cards should:

- look like AI-recommended picks
- contain real workout metadata
- contain real exercises
- show a beginner-friendly duration of about `60 min`
- remain usable even if the user has no programs, no completed workouts, and no templates

### Returning user state

When the app can derive real recommendation cards from the user's programs or workout progress, keep the current recommendation logic for those cards.

The starter fallback should only fill the empty state rather than replace valid recommendation data.

### Card click behavior

Clicking a starter recommendation card should no longer navigate directly to `/workout/start`.

Instead, it should open a workout-details preview that shows:

- workout title
- short description or focus
- estimated duration
- difficulty
- exercise count
- full exercise preview list

The preview must provide two clear actions:

- `Start Workout`
- `Edit Workout`

### Start and edit flow

- `Start Workout` should navigate to `/workout/start` with the starter workout's exercises already populated.
- `Edit Workout` should also navigate to `/workout/start` with the same workout prefilled, but in a state that lets the user modify the workout before beginning.

The important product change is that neither path should land on a blank start screen.

## Starter Workout Catalog

The fallback catalog should contain exactly three starter workouts for this iteration:

1. `Full Body Foundation`
2. `Upper Body Basics`
3. `Lower Body & Core Basics`

Each workout should include a realistic beginner set of exercises and an estimated duration of roughly one hour.

The specific exercise mix should be simple, familiar, and low-risk for beginners. The data can live in the frontend as a local preset catalog for now, as long as each starter workout includes:

- stable id
- title
- category/focus
- `60 min` estimated duration
- `Beginner` difficulty
- exercise objects compatible with the start-workout flow

## Architecture

### Data source

- Add a local starter-workout preset source under the Workout page area.
- Keep this data separate from user-created programs and templates.
- Convert these presets into the same shape expected by the recommendation cards and start-workout route.

### Recommendation assembly

- `WorkoutsTab.jsx` should remain the owner of recommendation-card assembly.
- The existing recommendation calculation should keep returning real program/day recommendations when they exist.
- When recommendation output is empty or insufficient for a brand-new user, inject the three starter workouts as fallback recommendation cards.

### Preview state

- Introduce local UI state in `WorkoutsTab.jsx` for the selected recommended workout preview.
- Render a dedicated preview dialog/component instead of overloading the existing start-workout route.
- Keep the preview component focused on presentation and action callbacks.

### Route state

- Reuse the existing `/workout/start` route state pattern so starter workouts enter the workout screen fully populated.
- Add only the minimum extra route-state flag needed to distinguish `start immediately` versus `edit before start` if the current screen requires that distinction.

## UI Design

### Recommendation cards

- Keep the current card visual language so the starter cards feel native to the Workout page.
- Keep the `AI Pick` treatment for these cards.
- Make the card copy sound like a starter recommendation rather than a deeply personalized prescription.
- Show duration, exercise count, difficulty, and category clearly.

### Workout preview

- Use a modal/dialog treatment consistent with the app's current modal styling.
- Show the exercise list in a scannable vertical layout.
- On mobile, keep the preview compact, scrollable, and easy to dismiss.
- The primary CTA should be `Start Workout`.
- The secondary CTA should be `Edit Workout`.

## Error Handling

- If starter workout data is malformed, do not render a broken fallback card; skip that card.
- If all starter presets are invalid, show the existing empty-state message instead of inventing content.
- If navigation to `/workout/start` fails due to missing payload shape, tests should catch it before ship.

## Testing

### Recommendation behavior

- New user with no real recommendations: three starter AI cards render.
- Returning user with real recommendation data: real recommendation cards still render.
- Starter fallback is not duplicated on top of valid program/day recommendations.

### Interaction behavior

- Clicking a starter card opens the workout preview instead of navigating immediately.
- The preview shows the workout exercises.
- Clicking `Start Workout` passes populated starter workout data into `/workout/start`.
- Clicking `Edit Workout` also passes populated starter workout data into `/workout/start` in editable mode.

### Regression coverage

- Existing program/day recommendation cards still navigate correctly.
- No recommendation path should send the user to an empty start-workout screen.

## Implementation Notes

- Prefer a small dedicated component such as `WorkoutRecommendationPreviewDialog` if that keeps `WorkoutsTab.jsx` from growing further.
- Keep starter-workout data colocated with the Workout feature, not in a global constants area.
- Reuse existing helper functions for route state where possible instead of creating a second start-workout payload shape.
