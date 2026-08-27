export const DOMAIN_PACKAGE = '@fitforge/domain' as const;

export type SyncFailureKind = 'blocked-auth' | 'retryable' | 'permanent';
type FailureLike = { status?: number; message?: string };

export function classifySyncFailure(failure: FailureLike): SyncFailureKind {
  if (failure.status === 401 || failure.status === 403) return 'blocked-auth';
  if (/unauthorized|forbidden|jwt|auth(?:entication)?|token.*expired/i.test(failure.message ?? '')) return 'blocked-auth';
  if (failure.status === 408 || failure.status === 429 || (failure.status !== undefined && failure.status >= 500)) return 'retryable';
  if (failure.status === undefined && /network|timeout|offline|fetch/i.test(failure.message ?? '')) return 'retryable';
  return 'permanent';
}
