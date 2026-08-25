export type AuthErrorPresentation = {
  code?: string;
  field?: string;
  message: string;
  rateLimited: boolean;
};

type ClerkErrorShape = {
  code?: string;
  message?: string;
  longMessage?: string;
  meta?: { paramName?: string };
};

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function clerkError(value: unknown): AuthErrorPresentation {
  const container = value as { errors?: ClerkErrorShape[]; message?: string } | null;
  const detail = container?.errors?.[0];
  const code = detail?.code;
  return {
    ...(code ? { code } : {}),
    ...(detail?.meta?.paramName ? { field: detail.meta.paramName } : {}),
    message: detail?.longMessage ?? detail?.message ?? container?.message ?? 'Authentication could not be completed.',
    rateLimited: code === 'too_many_requests' || code?.includes('rate_limit') === true,
  };
}
