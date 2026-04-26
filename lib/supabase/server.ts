import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isBypass, createMockClient } from './mock';

export function createClient() {
  if (isBypass()) return createMockClient();

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — middleware handles refresh
          }
        },
      },
    }
  );
}
