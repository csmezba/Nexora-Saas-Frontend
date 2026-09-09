'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_PROJECTS_QUERY,
  CREATE_PROJECT_MUTATION,
  ORGANIZATION_TEAMS_QUERY,
  MY_ORGANIZATIONS_QUERY,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import {
  FolderKanban,
  Plus,
  Search,
  Users,
  CheckSquare,
  Clock,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Loader2,
  Calendar,
  Building2,
  Tag,
  ArrowRight,
} from 'lucide-react';

export type ProjectStatusType = 'ACTIVE' | 'PLANNING' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';

export interface ProjectItem {
  pubId: string;
  name: string;
  key: string;
  description?: string | null;
  status: ProjectStatusType;
  startDate?: string | null;
  dueDate?: string | null;
  memberCount: number;
  organizationPubId: string;
  teamPubId?: string | null;
  team?: {
    pubId: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId, selectedOrgSlug } = useAuthStore();

  // Organization resolution
  const { data: myOrgs = [] } = useQuery({
    queryKey: ['myOrganizations', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await graphqlRequest<{ myOrganizations: any[] }>(MY_ORGANIZATIONS_QUERY);
      return res.myOrganizations || [];
    },
    enabled: !!accessToken,
  });

  const activeOrg =
    myOrgs.find(
      (o) =>
        (selectedOrgPubId && o.pubId === selectedOrgPubId) ||
        (selectedOrgSlug && o.slug === selectedOrgSlug)
    ) ||
    myOrgs[0] ||
    null;

  const effectiveOrgPubId = selectedOrgPubId || activeOrg?.pubId || '';
  const currentOrgName = activeOrg?.name || 'Selected Workspace';
  const orgSlug = selectedOrgSlug || activeOrg?.slug || 'workspace';

  // Fetch real projects from DB for selected organization
  const {
    data: projects = [],
    isLoading: isProjectsLoading,
    isFetching,
    error: projectsError,
    refetch,
  } = useQuery({
    queryKey: ['organizationProjects', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationProjects: ProjectItem[] }>(
        ORGANIZATION_PROJECTS_QUERY,
        { organizationPubId: effectiveOrgPubId }
      );
      return res.organizationProjects || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Fetch teams for optional project team assignment
  const { data: teams = [] } = useQuery({
    queryKey: ['organizationTeams', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationTeams: any[] }>(
        ORGANIZATION_TEAMS_QUERY,
        { organizationPubId: effectiveOrgPubId }
      );
      return res.organizationTeams || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Local filter & search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<ProjectStatusType>('ACTIVE');
  const [newTeamPubId, setNewTeamPubId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-generate key from name if not manually edited
  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!keyManuallyEdited) {
      const generated = val
        .trim()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 5);
      setNewKey(generated);
    }
  };

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (input: {
      name: string;
      key: string;
      organizationPubId: string;
      description?: string;
      status?: ProjectStatusType;
      teamPubId?: string;
      dueDate?: string;
    }) => {
      return graphqlRequest<{ createProject: ProjectItem }>(CREATE_PROJECT_MUTATION, {
        input,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizationProjects', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationTeams', effectiveOrgPubId] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to create project. Please try again.');
    },
  });

  const resetForm = () => {
    setNewName('');
    setNewKey('');
    setKeyManuallyEdited(false);
    setNewDesc('');
    setNewStatus('ACTIVE');
    setNewTeamPubId('');
    setNewDueDate('');
    setFormError(null);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveOrgPubId) {
      setFormError('Please select an active organization first.');
      return;
    }
    if (!newName.trim()) {
      setFormError('Project name is required.');
      return;
    }
    const finalKey = (newKey.trim() || newName.trim().slice(0, 4)).toUpperCase();
    setFormError(null);

    createProjectMutation.mutate({
      name: newName.trim(),
      key: finalKey,
      organizationPubId: effectiveOrgPubId,
      description: newDesc.trim() || undefined,
      status: newStatus,
      teamPubId: newTeamPubId || undefined,
      dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
    });
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: ProjectStatusType) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-950/80 border-emerald-800 text-emerald-300 font-bold';
      case 'PLANNING':
        return 'bg-indigo-950/80 border-indigo-800 text-indigo-300';
      case 'COMPLETED':
        return 'bg-blue-950/80 border-blue-800 text-blue-300';
      case 'ON_HOLD':
        return 'bg-amber-950/80 border-amber-800 text-amber-300';
      case 'CANCELLED':
        return 'bg-rose-950/80 border-rose-800 text-rose-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  const formatDisplayDate = (dateStr?: string | null) => {
    if (!dateStr) return 'No due date';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-sm">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Projects Workspace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Initiatives and active projects in</span>
              <span className="text-indigo-300 font-semibold">{currentOrgName}</span>
              <span className="text-[11px] font-mono text-slate-500">({orgSlug})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects by name, key, or description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto pb-1 max-w-full">
          {(['ALL', 'ACTIVE', 'PLANNING', 'COMPLETED', 'ON_HOLD', 'CANCELLED'] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 active:scale-95 whitespace-nowrap text-[11px] ${
                  filterStatus === s
                    ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>
      </div>

      {/* Error notification */}
      {projectsError && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Failed to load projects: {(projectsError as any)?.message || 'Database error'}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-200 rounded text-[11px] font-mono cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isProjectsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-800/70 rounded" />
                  </div>
                </div>
                <div className="h-5 w-16 bg-slate-800 rounded" />
              </div>
              <div className="h-10 bg-slate-800/50 rounded" />
              <div className="pt-3 border-t border-slate-800 flex justify-between">
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-4 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isProjectsLoading && filteredProjects.length === 0 && (
        <div className="p-12 text-center bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 mx-auto flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-200">
              {searchQuery || filterStatus !== 'ALL'
                ? 'No matching projects found'
                : 'No projects in this organization yet'}
            </h3>
            <p className="text-xs text-slate-400">
              {searchQuery || filterStatus !== 'ALL'
                ? 'Try adjusting your search criteria or status filter to locate projects.'
                : `Get started by creating your first project in ${currentOrgName}. You can track tasks, assign teams, and manage deliverables.`}
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Project</span>
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {!isProjectsLoading && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.pubId}
              className="p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl cursor-pointer transition-all duration-200 shadow-sm space-y-4 hover:scale-[1.01] hover:shadow-lg group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-indigo-400 font-bold text-sm flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200 group-hover:scale-105 shadow-sm">
                      {(p.name?.trim()?.charAt(0) || 'P').toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center gap-1.5">
                        <span>{p.name || 'Untitled Project'}</span>
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-indigo-300 border border-slate-700 font-semibold">
                          {p.key}
                        </span>
                        {p.team?.name && (
                          <span className="text-slate-400 flex items-center gap-1">
                            • <span>{p.team.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${getStatusBadge(
                      p.status
                    )}`}
                  >
                    {p.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed font-sans min-h-[2.5rem]">
                  {p.description || 'No description provided for this project.'}
                </p>
              </div>

              {/* Card Footer Details */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono mt-2">
                <div className="flex items-center gap-3.5">
                  <span className="flex items-center gap-1.5 text-[11px]" title="Team members">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{p.memberCount} {p.memberCount === 1 ? 'member' : 'members'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px]" title="Due date">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDisplayDate(p.dueDate)}</span>
                  </span>
                </div>

                <Link
                  href={`/dashboard/tasks`}
                  className="flex items-center gap-1 text-[11px] text-slate-400 group-hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  <span>Tasks</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                <span>Create New Project</span>
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {currentOrgName}
              </span>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. AI Platform Core"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Key *
                  </label>
                  <input
                    type="text"
                    required
                    value={newKey}
                    onChange={(e) => {
                      setKeyManuallyEdited(true);
                      setNewKey(e.target.value.toUpperCase());
                    }}
                    placeholder="e.g. CORE"
                    maxLength={10}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono font-bold text-indigo-300 uppercase focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Scope, goals, deliverables, and team objectives..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ProjectStatusType)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PLANNING">PLANNING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Team (Optional)
                  </label>
                  <select
                    value={newTeamPubId}
                    onChange={(e) => setNewTeamPubId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="">No Team Assigned</option>
                    {teams.map((t: any) => (
                      <option key={t.pubId} value={t.pubId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Project</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

