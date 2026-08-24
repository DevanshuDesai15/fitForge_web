export function safeCapture(posthog, eventName, properties = {}) {
  try {
    posthog?.capture?.(eventName, properties);
  } catch (error) {
    console.warn(`PostHog capture failed for ${eventName}:`, error);
  }
}

export function identifyUser(posthog, user) {
  if (!posthog || !user?.id) {
    return;
  }

  try {
    posthog.identify(user.id, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName || user.firstName,
    });
  } catch (error) {
    console.warn('PostHog identify failed:', error);
  }
}

export function resetAnalytics(posthog) {
  try {
    posthog?.reset?.();
  } catch (error) {
    console.warn('PostHog reset failed:', error);
  }
}
