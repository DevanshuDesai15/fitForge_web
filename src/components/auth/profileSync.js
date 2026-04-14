export function buildProfileSyncPayload({ user, existingProfile }) {
  const clerkDisplayName = user?.fullName || user?.firstName || 'New Lifter';
  const existingDisplayName = existingProfile?.display_name;

  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || null,
    ...(existingDisplayName ? {} : { display_name: clerkDisplayName }),
  };
}
