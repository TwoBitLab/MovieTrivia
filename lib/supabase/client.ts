import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 *
 * TODO: Replace with generated types once DB is provisioned:
 *   npx supabase gen types typescript --linked > lib/supabase/database.types.ts
 *   Then: createBrowserClient<Database>(...)
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
