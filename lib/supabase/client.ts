import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em componentes do lado do cliente (Browser Client)
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-precia-project.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-anon-key";

  return createBrowserClient(supabaseUrl, supabaseKey);
}
