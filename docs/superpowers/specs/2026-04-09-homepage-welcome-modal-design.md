# Homepage Welcome Modal Design

## Summary

Replace the current full-width `WelcomeHeader` banner on the Home page with a dismissible floating welcome modal that preserves the app's existing dark olive visual language. The modal appears every time the user lands on Home from another route and every time the Home page is refreshed. Closing the modal hides it only for the current stay on Home.

## Goals

- Preserve the current greeting content, streak messaging, and action buttons.
- Make the greeting feel like an entry prompt rather than a permanent top bar.
- Keep dismissal lightweight and temporary.
- Ensure the modal feels intentional on desktop and compact on mobile.

## Non-Goals

- Persisting dismissal state across refreshes, sessions, or routes.
- Introducing a blocking overlay that prevents the user from interacting with the rest of Home.
- Changing the greeting logic, streak calculation, or action destinations.

## Architecture

### Component structure

- Introduce a new `WelcomeModal` component under `src/pages/Home/components/`.
- Keep `Home.jsx` responsible for whether the modal is shown.
- Remove the existing full-width banner usage from the Home layout.

### State ownership

- `Home.jsx` initializes local state such as `isWelcomeModalOpen` to `true` on mount.
- Clicking the close button sets the local state to `false`.
- Because the state lives only inside the mounted Home page, the modal naturally reappears when:
  - the user navigates away and then returns to Home
  - the page is refreshed

This matches the approved behavior without adding local storage, query params, or global state.

## UI Design

### Desktop

- Render the modal near the top of the Home content area, visually floating above the dashboard content.
- Use the app's existing theme: dark olive surface, subtle lime accent, rounded corners, soft border, and elevated shadow.
- Include:
  - greeting headline with emoji
  - streak sentence
  - italic helper message
  - primary `Log Workout` button
  - secondary `Start Training` button
  - small close button in the top-right corner
- The modal should read as dismissible and temporary, but not like a native browser dialog.

### Mobile

- Keep the modal centered horizontally with a width that respects viewport padding.
- Reduce headline size, internal padding, and action spacing.
- Stack the action buttons vertically if horizontal space becomes cramped.
- Keep the close button reachable and visually separate from the headline.
- Avoid covering the entire screen; the underlying page should still be visible around the modal.

### Interaction model

- The modal is a floating card, not a blocking modal dialog with a scrim.
- The user can close it immediately or ignore it and continue scrolling/interacting.
- Action buttons keep their current behavior:
  - `Log Workout` opens the quick-add workout flow
  - `Start Training` navigates to the workout page

## Layout Integration

- Remove the dedicated full-width welcome hero section from the Home layout.
- Preserve consistent spacing at the top of the Home content so the modal has room to float without colliding with the next section.
- Adjust the top margin of the first content section if needed so the modal and content do not visually overlap awkwardly on smaller screens.

## Error Handling

- If profile or stats data are still loading, the modal still renders using the same safe fallback data already used by Home.
- If user profile data are unavailable, continue falling back to username/email-derived display name.
- No new async behavior is introduced for the modal itself.

## Testing

### Component behavior

- Add or update Home page tests to verify:
  - the welcome modal renders on initial Home mount
  - clicking the close button hides the modal
  - the modal is visible again on a fresh render

### Responsive confidence

- Verify the modal content remains readable in narrow mobile widths.
- Confirm buttons remain reachable and do not overflow the modal container.

## Implementation Notes

- Prefer reusing the current button handlers and greeting props shape from `WelcomeHeader`.
- Either migrate the existing JSX styling into the new component or extract shared styling patterns only if that reduces duplication cleanly.
- Keep the implementation localized to the Home page unless a broader shared modal pattern is clearly justified during coding.
