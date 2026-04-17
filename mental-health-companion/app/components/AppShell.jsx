'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  House,
  LogOut,
  Menu,
  MessageCircle,
  Smile,
  User,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client.js';

const navLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: House },
  { label: 'Mood Tracker', href: '/mood-tracker', icon: Smile },
  { label: 'Journal', href: '/journal', icon: BookOpen },
  { label: 'Chat with Serenity', href: '/chat', icon: MessageCircle },
  { label: 'Profile', href: '/profile', icon: User },
];

const hiddenShellRoutes = ['/login', '/signup'];

function isActiveLink(pathname, href) {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname.startsWith(href);
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('User');
  const [avatarUrl, setAvatarUrl] = useState('');

  const hideShell = hiddenShellRoutes.includes(pathname);

  useEffect(() => {
    if (hideShell) return;

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const fallbackName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      setUserName(fallbackName);

      const { data } = await supabase
        .from('profiles')
        .select('full_name,name,avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (data?.full_name || data?.name) {
        setUserName(data.full_name || data.name);
      }
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    }

    loadUser();
  }, [hideShell, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1A1A2E]">
      <header className="sticky top-0 z-30 border-b border-[#DCE6F2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-[#1A73E8] hover:bg-[#EAF3FE] lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A73E8] text-sm font-bold text-white">
                S
              </div>
              <span className="text-lg font-semibold text-[#1A1A2E]">Serenity</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-[#1A73E8] transition hover:bg-[#EAF3FE]"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <Link href="/profile" className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[#EAF3FE]">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#DDF3EF] text-sm font-semibold text-[#1A73E8]">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl">
        <div
          className={`fixed inset-0 z-40 bg-black/30 transition lg:hidden ${
            sidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed left-0 top-0 z-50 h-full w-72 border-r border-[#DCE6F2] bg-white p-4 shadow-xl transition-transform lg:sticky lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:shadow-none ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-base font-semibold text-[#1A73E8]">Menu</p>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-xl p-2 text-[#1A73E8] hover:bg-[#EAF3FE]"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActiveLink(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                    active ? 'bg-[#00BFA5] text-white' : 'text-[#1A1A2E] hover:bg-[#EAF9F6]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
