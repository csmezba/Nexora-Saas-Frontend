'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  Kanban,
  List,
  Calendar as CalendarIcon,
  Sparkles,
  User,
  Clock,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';

export interface TaskCardItem {
  id: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assignee: string;
  project: string;
  dueDate: string;
  commentsCount: number;
}

const INITIAL_TASKS: TaskCardItem[] = [
  {
    id: 'TASK-101',
    title: 'Configure GraphQL JWT auth guards & refresh token strategy',
    description: 'Ensure NestJS backend protects organization & team queries with JwtAuthGuard.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: 'Alex Rivera',
    project: 'Backend Core',
    dueDate: 'Sep 12',
    commentsCount: 4,
  },
  {
    id: 'TASK-102',
    title: 'Build multi-tenant URL routing layout for Next.js App Router',
    description: 'Structure /[organizationSlug]/... routes with persistent AppShell & Sidebar.',
    status: 'DONE',
    priority: 'URGENT',
    assignee: 'John Doe',
    project: 'Frontend Platform',
    dueDate: 'Sep 10',
    commentsCount: 6,
  },
  {
    id: 'TASK-103',
    title: 'Implement 3-column enterprise support inbox UI',
    description: 'Create Intercom-like conversation thread and customer profile side panel.',
    status: 'IN_REVIEW',
    priority: 'MEDIUM',
    assignee: 'Sarah Connor',
    project: 'Support Workspace',
    dueDate: 'Sep 15',
    commentsCount: 2,
  },
  {
    id: 'TASK-104',
    title: 'Design streaming AI assistant prompt templates & citations',
    description: 'Support quick prompt chips and knowledge base doc grounding in AI chat.',
    status: 'TODO',
    priority: 'HIGH',
    assignee: 'Elena Rostova',
    project: 'AI Workspace',
    dueDate: 'Sep 18',
    commentsCount: 1,
  },
  {
    id: 'TASK-105',
    title: 'Setup Recharts velocity & token consumption analytics',
    description: 'Render interactive area and bar charts for team productivity insights.',
    status: 'BACKLOG',
    priority: 'LOW',
    assignee: 'David Kim',
    project: 'Analytics Engine',
    dueDate: 'Sep 22',
    commentsCount: 0,
  },
];

const COLUMNS: { id: TaskCardItem['status']; label: string; color: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-700 bg-slate-900/60' },
  { id: 'TODO', label: 'To Do', color: 'border-indigo-900/60 bg-indigo-950/20' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-900/60 bg-amber-950/20' },
  { id: 'IN_REVIEW', label: 'In Review', color: 'border-purple-900/60 bg-purple-950/20' },
  { id: 'DONE', label: 'Done', color: 'border-emerald-900/60 bg-emerald-950/20' },
];

export default function TasksPage() {
  const { selectedOrgSlug } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'acme';

  const [tasks, setTasks] = useState<TaskCardItem[]>(INITIAL_TASKS);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskCardItem | null>(null);

  // New task form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<TaskCardItem['priority']>('MEDIUM');

  const moveTask = (taskId: string, newStatus: TaskCardItem['status']) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: TaskCardItem = {
      id: `TASK-${100 + tasks.length + 1}`,
      title: newTitle,
      description: newDesc,
      status: 'TODO',
      priority: newPriority,
      assignee: 'Current User',
      project: 'Main Sprint',
      dueDate: 'Today',
      commentsCount: 0,
    };
    setTasks([newTask, ...tasks]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const filteredTasks = tasks.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityBadge = (p: TaskCardItem['priority']) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-950 border-rose-800 text-rose-300 font-bold';
      case 'HIGH':
        return 'bg-amber-950 border-amber-800 text-amber-300';
      case 'MEDIUM':
        return 'bg-indigo-950 border-indigo-800 text-indigo-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Task Workspace & Kanban</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {filteredTasks.length} Tasks
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage sprints, backlog, and task statuses across <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md cursor-pointer transition-all duration-200 active:scale-95 ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md cursor-pointer transition-all duration-200 active:scale-95 ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`p-3 rounded-xl border ${col.color} flex flex-col h-[600px] shadow-sm`}
              >
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
                  <span className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 font-semibold border border-slate-800">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-3.5 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 rounded-lg cursor-pointer transition-all duration-200 shadow-sm hover:border-indigo-500/40 hover:scale-[1.02] hover:shadow-md space-y-2.5 group"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono text-slate-500 font-bold group-hover:text-indigo-400 transition-colors">
                          {task.id}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${getPriorityBadge(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      <h4 className="font-semibold text-xs text-slate-100 line-clamp-2 leading-snug">
                        {task.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 line-clamp-2 font-sans">
                        {task.description}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{task.assignee}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" /> {task.commentsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Task Title</th>
                <th className="p-3">Status</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Project</th>
                <th className="p-3">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredTasks.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                >
                  <td className="p-3 text-indigo-400 font-bold">{t.id}</td>
                  <td className="p-3 font-semibold text-slate-100 font-sans">{t.title}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] ${getPriorityBadge(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300 font-sans">{t.assignee}</td>
                  <td className="p-3 text-slate-400">{t.project}</td>
                  <td className="p-3 text-slate-400">{t.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Detail Side Panel Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full p-6 overflow-y-auto space-y-5 font-sans text-slate-100 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-indigo-400">{selectedTask.id}</span>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-100 leading-snug mb-2">{selectedTask.title}</h3>
              <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed font-sans">
                {selectedTask.description}
              </p>
            </div>

            {/* Quick Status Moves */}
            <div>
              <label className="block text-[11px] font-mono text-slate-500 uppercase font-bold mb-1.5">
                Change Status Column:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COLUMNS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => moveTask(selectedTask.id, c.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
                      selectedTask.status === c.id
                        ? 'bg-indigo-600 text-white font-bold border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Summary Action Trigger */}
            <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>AI Workspace Summary</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Task involves backend GraphQL resolvers and state synchronization. Subtasks created and validated.
              </p>
            </div>

            {/* Activity Log */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase">Activity Log</h4>
              <div className="space-y-2 text-xs font-mono text-slate-400">
                <p>&bull; Status updated to {selectedTask.status}</p>
                <p>&bull; Assigned to {selectedTask.assignee}</p>
                <p>&bull; Created in project {selectedTask.project}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 text-slate-100 font-sans">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Create Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Implement GraphQL endpoint for task deletion"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Task details and acceptance criteria..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="URGENT">URGENT</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
