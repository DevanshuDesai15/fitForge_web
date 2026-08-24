export type MobileEnv = {
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: string;
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
  EXPO_PUBLIC_API_BASE_URL: string;
};

const keys = [
  'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_API_BASE_URL',
] as const;

export function parseMobileEnv(source: Record<string, string | undefined>): MobileEnv {
  const missing = keys.filter((key) => !source[key]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing mobile environment variables: ${missing.join(', ')}`);
  }

  const supabaseKey = source.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  if (/service[_-]?role|secret/i.test(supabaseKey)) {
    throw new Error('Do not expose a privileged Supabase key in the mobile application');
  }

  return Object.fromEntries(keys.map((key) => [key, source[key]!])) as MobileEnv;
}

export function getMobileEnv(): MobileEnv {
  return parseMobileEnv(process.env);
}
