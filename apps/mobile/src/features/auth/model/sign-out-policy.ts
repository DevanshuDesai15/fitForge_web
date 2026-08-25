export type SignOutDecision = 'confirm' | 'proceed';

export function signOutDecision(pendingCount: number, acknowledged: boolean): SignOutDecision {
  return pendingCount > 0 && !acknowledged ? 'confirm' : 'proceed';
}

export async function performSignOut({ pendingCount, acknowledged, signOut, clearPartition }: { pendingCount: number; acknowledged: boolean; signOut: () => Promise<unknown>; clearPartition: () => Promise<unknown> }) {
  const decision = signOutDecision(pendingCount, acknowledged);
  if (decision === 'confirm') return decision;
  await signOut();
  await clearPartition();
  return decision;
}
