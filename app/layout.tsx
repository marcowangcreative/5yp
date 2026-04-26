import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/logout-button';

export const metadata: Metadata = {
  title: '5 Year Plan',
  description: 'Marco + Jordan household plan dashboard',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900">
        {user && (
          <nav className="border-b border-stone-200 bg-white">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-lg font-light tracking-tight">
                  5-Year Plan
                </Link>
                <div className="flex gap-6 text-sm">
                  <Link href="/" className="text-stone-600 hover:text-stone-900 transition">Combined</Link>
                  <Link href="/marco" className="text-stone-600 hover:text-stone-900 transition">Marco</Link>
                  <Link href="/flowe" className="text-stone-600 hover:text-stone-900 transition">Flowe</Link>
                  <Link href="/milestones" className="text-stone-600 hover:text-stone-900 transition">Milestones</Link>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span>{user.email}</span>
                <LogoutButton />
              </div>
            </div>
          </nav>
        )}
        <main>{children}</main>
      </body>
    </html>
  );
}
