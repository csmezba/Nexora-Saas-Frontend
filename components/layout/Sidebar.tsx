'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import TenantSwitcher from './TenantSwitcher';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  UserCheck,
  Building2,
  Inbox,
  Ticket,
  BookOpen,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  CreditCard,
  Settings,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  Command,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, accessToken, logout } = useAuthStore();
  const { sidebarOpen, setCommandPaletteOpen, theme, toggleTheme } = useAppStore();

  const handleLogout = () => {
    logout();
    queryClient.clear();
    router.push('/login');
  };

  const navGroups = [
    {
      group: 'Workspace',
      items: [
        { label: 'Dashboard', path: `/dashboard`, icon: LayoutDashboard },
        { label: 'Members', path: `/dashboard/members`, icon: UserCheck },
      ],
    },
    {
      group: 'Productivity',
      items: [
        { label: 'Projects', path: `/dashboard/projects`, icon: FolderKanban },
        { label: 'Tasks & Kanban', path: `/dashboard/tasks`, icon: CheckSquare },
        { label: 'Teams & Workload', path: `/dashboard/teams`, icon: Users },
      ],
    },
    {
      group: 'CRM & Support',
      items: [
        { label: 'Customers CRM', path: `/dashboard/customers`, icon: Building2 },
        { label: 'Support Inbox', path: `/dashboard/inbox`, icon: Inbox },
        { label: 'Support Tickets', path: `/dashboard/tickets`, icon: Ticket },
      ],
    },
    {
      group: 'Knowledge & AI',
      items: [
        { label: 'Knowledge Base', path: `/dashboard/knowledge`, icon: BookOpen },
        { label: 'AI Workspace', path: `/dashboard/ai`, icon: Sparkles, badge: 'AI' },
      ],
    },
    {
      group: 'Administration',
      items: [
        { label: 'Analytics', path: `/dashboard/analytics`, icon: BarChart3 },
        { label: 'Integrations', path: `/dashboard/integrations`, icon: SlidersHorizontal },
        { label: 'Billing & Plans', path: `/dashboard/billing`, icon: CreditCard },
        { label: 'Settings', path: `/dashboard/settings`, icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 transition-all font-sans ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="p-3 space-y-4 overflow-y-auto">
        {/* Tenant Switcher */}
        <TenantSwitcher />

        {/* Global Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 cursor-pointer text-xs font-mono transition-all duration-200 hover:bg-slate-900"
        >
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-slate-400" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-[10px] text-slate-300">
            ⌘K
          </kbd>
        </button>

        {/* Navigation Sections */}
        <nav className="space-y-4 pt-1">
          {navGroups.map((group) => (
            <div key={group.group} className="space-y-1">
              <div className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                {group.group}
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname === item.path || pathname.startsWith(item.path + '/');
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all duration-200 hover:translate-x-0.5 active:scale-[0.98] ${
                      isActive
                        ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                          isActive ? 'text-indigo-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer User Section */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center font-mono">
              {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden text-xs">
              <p className="font-semibold text-slate-200 truncate">{user?.fullName || 'User Profile'}</p>
              <p className="text-[10px] text-slate-500 font-mono truncate">{user?.email || 'Logged In'}</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        {accessToken && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/50 hover:border-rose-800/60 border border-slate-700 text-slate-400 hover:text-rose-300 text-xs font-medium cursor-pointer transition-all duration-200 active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
