import { createBrowserClient } from '@supabase/ssr';
import { isBypass, createMockClient } from './mock';

export function createClient() {
  if (isBypass()) return createMockClient();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
