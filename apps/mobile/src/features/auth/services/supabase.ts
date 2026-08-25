import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

type Factory = (url: string, key: string, options: SupabaseClientOptions<'public'>) => SupabaseClient;

export function createMobileSupabaseClient({ url, publishableKey, getToken, factory = createClient as Factory }: {
  url: string;
  publishableKey: string;
  getToken: () => Promise<string | null>;
  factory?: Factory;
}) {
  if (/service[_-]?role|secret/i.test(publishableKey)) throw new Error('Do not expose a privileged Supabase key in mobile');
  return factory(url, publishableKey, { accessToken: getToken });
}
