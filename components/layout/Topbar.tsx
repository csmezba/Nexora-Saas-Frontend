'use client';

import React, { useState } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { checkBackendConnection, getBackendUrl } from '@/lib/graphql-client';
import {
  Menu,
  Search,
  Bell,
  Sparkles,
  Command,
  Server,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function Topbar() {
  const pathname = usePathname();
  const params = useParams();
  const { toggleSidebar, setCommandPaletteOpen } = useAppStore();
  const { user, selectedOrgSlug } = useAuthStore();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'checking'>('online');

  // Breadcrumb path parts formatting
  const pathParts = pathname.split('/').filter(Boolean);
  const sectionName = pathParts[1] || 'dashboard';

  const notifications = [
    { id: 1, title: 'Task assigned to you', time: '5m ago', unread: true },
    { id: 2, title: 'Support Ticket #104 resolved', time: '1h ago', unread: true },
    { id: 3, title: 'Weekly AI Workspace summary ready', time: '3h ago', unread: false },
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 text-slate-100 font-sans sticky top-0 z-30">
      {/* Left section: Toggle Sidebar & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-all duration-200 active:scale-95 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-slate-400 font-semibold">/dashboard</span>
          {selectedOrgSlug && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-[10px] font-semibold">
              /{selectedOrgSlug}
            </span>
          )}
          {sectionName !== 'dashboard' && (
            <>
              <span className="text-slate-600">/</span>
              <span className="font-bold text-indigo-400 uppercase tracking-wider text-[11px]">
                {sectionName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right section: Search trigger, Backend Health Pill, Notifications */}
      <div className="flex items-center gap-3">
        {/* Backend Health Badge */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-[11px] font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300">Backend Connected</span>
        </div>

        {/* Global Search Button */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 hover:border-slate-600 hover:text-white border border-slate-700 text-slate-300 text-xs font-sans cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline-block">Search workspace</span>
          <kbd className="px-1.5 py-0.5 bg-slate-900 rounded text-[10px] font-mono text-slate-400 border border-slate-800">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50 animate-in fade-in duration-100">
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800">
                <span className="font-bold text-xs text-slate-200">Notifications</span>
                <span className="text-[10px] text-indigo-400 font-mono">3 unread</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs font-sans space-y-0.5 cursor-pointer transition-all duration-150 hover:translate-x-1"
                  >
                    <p className="font-semibold text-slate-200 text-[11px]">{n.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
