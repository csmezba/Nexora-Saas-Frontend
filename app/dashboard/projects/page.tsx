'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  CheckSquare,
  Clock,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: 'ACTIVE' | 'PLANNING' | 'COMPLETED' | 'ARCHIVED';
  progress: number;
  membersCount: number;
  completedTasks: number;
  totalTasks: number;
  dueDate: string;
}

const INITIAL_PROJECTS: ProjectItem[] = [
  {
    id: 'proj_1',
    name: 'AI Platform Core',
    slug: 'ai-platform',
    description: 'Next-generation generative AI workflow engine & model integrations.',
    status: 'ACTIVE',
    progress: 75,
    membersCount: 8,
    completedTasks: 32,
    totalTasks: 40,
    dueDate: 'Oct 15, 2026',
  },
  {
    id: 'proj_2',
    name: 'Support Portal Redesign',
    slug: 'support-portal',
    description: 'Intercom-inspired 3-column support inbox & ticket resolution center.',
    status: 'ACTIVE',
    progress: 60,
    membersCount: 5,
    completedTasks: 18,
    totalTasks: 30,
    dueDate: 'Nov 01, 2026',
  },
  {
    id: 'proj_3',
    name: 'Stripe Billing & Subscriptions v3',
    slug: 'stripe-billing',
    description: 'Multi-tenant subscription tiers, usage progress bars, and invoice downloads.',
    status: 'PLANNING',
    progress: 25,
    membersCount: 4,
    completedTasks: 5,
    totalTasks: 20,
    dueDate: 'Dec 10, 2026',
  },
  {
    id: 'proj_4',
    name: 'Mobile Application SDK',
    slug: 'mobile-app',
    description: 'React Native & Expo cross-platform mobile client for workspace notifications.',
    status: 'COMPLETED',
    progress: 100,
    membersCount: 6,
    completedTasks: 45,
    totalTasks: 45,
    dueDate: 'Aug 30, 2026',
  },
];

export default function ProjectsPage() {
  const { selectedOrgSlug } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'acme';

  const [projects, setProjects] = useState<ProjectItem[]>(INITIAL_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const newProj: ProjectItem = {
      id: `proj_${projects.length + 1}`,
      name: newName,
      slug: newName.toLowerCase().replace(/\s+/g, '-'),
      description: newDesc,
      status: 'PLANNING',
      progress: 0,
      membersCount: 1,
      completedTasks: 0,
      totalTasks: 10,
      dueDate: 'Dec 31, 2026',
    };
    setProjects([newProj, ...projects]);
    setShowCreateModal(false);
    setNewName('');
    setNewDesc('');
  };

  const getStatusBadge = (status: ProjectItem['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-950 border-emerald-800 text-emerald-300 font-bold';
      case 'PLANNING':
        return 'bg-indigo-950 border-indigo-800 text-indigo-300';
      case 'COMPLETED':
        return 'bg-blue-950 border-blue-800 text-blue-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Projects Workspace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {filteredProjects.length} Projects
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Overview of active initiatives and project deliverables in <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter projects by name or description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 active:scale-95 ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white font-bold border-indigo-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all duration-200 shadow-sm space-y-4 hover:scale-[1.01] hover:shadow-lg group"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 font-bold text-sm flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 group-hover:scale-105">
                  {p.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">/{p.slug}</p>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getStatusBadge(p.status)}`}>
                {p.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans">
              {p.description}
            </p>

            {/* Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-slate-400">Progress Completion</span>
                <span className="text-indigo-400 font-bold">{p.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${p.progress}%` }}
                ></div>
              </div>
            </div>

            {/* Card Footer Details */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-500" /> {p.membersCount}
                </span>
                <span className="flex items-center gap-1">
                  <CheckSquare className="w-3.5 h-3.5 text-slate-500" /> {p.completedTasks}/{p.totalTasks}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{p.dueDate}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform ml-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 text-slate-100 font-sans">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Create Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="AI Workspace Integration"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Project scope and deliverables..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98]"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
