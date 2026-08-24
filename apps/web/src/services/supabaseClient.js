import { createClient } from "@supabase/supabase-js";

let supabaseClient = null;
let tokenProvider = null;

const resolveAccessToken = async () => {
  if (!tokenProvider) return null;
  return tokenProvider();
};

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      { accessToken: resolveAccessToken }
    );
  }

  return supabaseClient;
}

export function setSupabaseTokenProvider(provider) {
  tokenProvider = typeof provider === "function" ? provider : null;

  return () => {
    if (tokenProvider === provider) {
      tokenProvider = null;
    }
  };
}
