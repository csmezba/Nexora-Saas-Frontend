'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Building2,
  Inbox,
  Ticket,
  BookOpen,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
  CreditCard,
  Plus,
  Command,
  X,
} from 'lucide-react';

export default function CommandPalette() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = (params?.organizationSlug as string) || 'acme';

  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Keyboard shortcut Cmd/Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const navigateTo = (path: string) => {
    router.push(`/${orgSlug}/${path}`);
    setCommandPaletteOpen(false);
    setSearchTerm('');
  };

  const navItems = [
    { title: 'Dashboard', path: 'dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { title: 'Projects', path: 'projects', icon: FolderKanban, category: 'Navigation' },
    { title: 'Tasks & Kanban', path: 'tasks', icon: CheckSquare, category: 'Navigation' },
    { title: 'Teams & Workload', path: 'teams', icon: Users, category: 'Navigation' },
    { title: 'Customers CRM', path: 'customers', icon: Building2, category: 'Navigation' },
    { title: 'Support Inbox', path: 'inbox', icon: Inbox, category: 'Navigation' },
    { title: 'Support Tickets', path: 'tickets', icon: Ticket, category: 'Navigation' },
    { title: 'Knowledge Base', path: 'knowledge', icon: BookOpen, category: 'Navigation' },
    { title: 'AI Assistant', path: 'ai', icon: Sparkles, category: 'Navigation' },
    { title: 'Analytics', path: 'analytics', icon: BarChart3, category: 'Navigation' },
    { title: 'Integrations', path: 'integrations', icon: SlidersHorizontal, category: 'Navigation' },
    { title: 'Billing & Plans', path: 'billing', icon: CreditCard, category: 'Navigation' },
    { title: 'Organization Settings', path: 'settings', icon: SlidersHorizontal, category: 'Navigation' },
  ];

  const filteredItems = navItems.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-800">
          <Search className="w-4 h-4 text-slate-400 mr-2.5" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type a command or search workspace..."
            className="w-full py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          <div className="px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
            Navigation & Commands
          </div>

          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              No matching pages or actions found for "{searchTerm}"
            </div>
          ) : (
            filteredItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigateTo(item.path)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium hover:bg-slate-800 text-slate-300 hover:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                    <span>{item.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                    /{orgSlug}/{item.path}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">↵</kbd> select
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3 text-slate-400" />
            <span>K to toggle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
