'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_TEAMS_QUERY,
  TEAM_MEMBERS_QUERY,
  TEAM_PROJECTS_QUERY,
  CREATE_TEAM_MUTATION,
  UPDATE_TEAM_MUTATION,
  DELETE_TEAM_MUTATION,
  ADD_TEAM_MEMBER_MUTATION,
  REMOVE_TEAM_MEMBER_MUTATION,
  ORGANIZATION_MEMBERS_QUERY,
  ORGANIZATION_PROJECTS_QUERY,
  PROJECT_TASKS_QUERY,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Users,
  Plus,
  UserPlus,
  UserMinus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Check,
  X,
  ArrowUpRight,
  FolderKanban,
  Briefcase,
  BarChart3,
  Activity,
  Layers,
  Search,
  Loader2,
  Sparkles,
  Shield,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react';

export default function TeamsPage() {
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId, selectedOrgSlug, selectedOrgName } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'workspace';
  const effectiveOrgPubId = selectedOrgPubId || orgSlug;

  // Active Team and Tab State
  const [selectedTeamPubId, setSelectedTeamPubId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workload' | 'members' | 'projects'>('workload');

  // Search & Filter State
  const [teamSearch, setTeamSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [inspectMember, setInspectMember] = useState<any | null>(null);

  // Form Inputs
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [initialMemberPubIds, setInitialMemberPubIds] = useState<string[]>([]);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [addMemberPubId, setAddMemberPubId] = useState('');

  // Toast Status
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Organization Teams
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['organizationTeams', effectiveOrgPubId],
    queryFn: async () => {
      const res = await graphqlRequest<{ organizationTeams: any[] }>(ORGANIZATION_TEAMS_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.organizationTeams || [];
    },
    enabled: !!accessToken && !!effectiveOrgPubId,
  });

  // Filtered Teams based on search
  const filteredTeams = useMemo(() => {
    if (!teamSearch.trim()) return teams;
    const q = teamSearch.toLowerCase();
    return teams.filter(
      (t: any) =>
        t.name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
    );
  }, [teams, teamSearch]);

  // Determine active team
  const activeTeam = useMemo(() => {
    if (selectedTeamPubId) {
      const found = teams.find((t: any) => t.pubId === selectedTeamPubId);
      if (found) return found;
    }
    return teams.length > 0 ? teams[0] : null;
  }, [teams, selectedTeamPubId]);

  const activeTeamPubId = activeTeam?.pubId || '';

  // 2. Fetch Team Members for active team
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['teamMembers', activeTeamPubId],
    queryFn: async () => {
      if (!activeTeamPubId) return [];
      const res = await graphqlRequest<{ teamMembers: any[] }>(TEAM_MEMBERS_QUERY, {
        teamPubId: activeTeamPubId,
      });
      return res.teamMembers || [];
    },
    enabled: !!activeTeamPubId && !!accessToken,
  });

  // 3. Fetch Organization Members (for adding members to teams)
  const { data: organizationMembers = [] } = useQuery({
    queryKey: ['organizationMembers', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationMembers: any[] }>(ORGANIZATION_MEMBERS_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.organizationMembers || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Available organization members to add to the active team
  const availableOrgMembers = useMemo(() => {
    const existingUserPubIds = new Set(teamMembers.map((tm: any) => tm.user?.pubId).filter(Boolean));
    return organizationMembers.filter((om: any) => om.user?.pubId && !existingUserPubIds.has(om.user.pubId));
  }, [organizationMembers, teamMembers]);

  // 4. Fetch Organization Projects
  const { data: orgProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ['organizationProjects', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationProjects: any[] }>(ORGANIZATION_PROJECTS_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.organizationProjects || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // 5. Fetch Projects Assigned to Active Team
  const { data: teamAssignedProjects = [] } = useQuery({
    queryKey: ['teamProjects', activeTeamPubId],
    queryFn: async () => {
      if (!activeTeamPubId) return [];
      const res = await graphqlRequest<{ teamProjects: any[] }>(TEAM_PROJECTS_QUERY, {
        teamPubId: activeTeamPubId,
      });
      return res.teamProjects || [];
    },
    enabled: !!activeTeamPubId && !!accessToken,
  });

  // 6. Fetch All Tasks across projects for Live Workload calculations
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: [
      'orgAllTasks',
      effectiveOrgPubId,
      (orgProjects || []).map((p: any) => p.pubId).sort().join(','),
    ],
    queryFn: async () => {
      if (!orgProjects || orgProjects.length === 0) return [];
      const results = await Promise.all(
        orgProjects.map((p: any) =>
          graphqlRequest<{ projectTasks: any[] }>(PROJECT_TASKS_QUERY, {
            projectPubId: p.pubId,
          })
            .then((res) => res.projectTasks || [])
            .catch(() => [])
        )
      );
      return results.flat();
    },
    enabled: !!effectiveOrgPubId && orgProjects.length > 0 && !!accessToken,
  });

  // 7. Workload Calculations per Member for the Active Team
  const teamWorkloadData = useMemo(() => {
    return teamMembers.map((tm: any) => {
      const userPubId = tm.user?.pubId;
      const assignedTasks = allTasks.filter((task: any) =>
        (task.assignees || []).some((a: any) => a.user?.pubId === userPubId)
      );

      const todoTasks = assignedTasks.filter((t: any) => t.status === 'TODO');
      const inProgressTasks = assignedTasks.filter((t: any) => t.status === 'IN_PROGRESS');
      const doneTasks = assignedTasks.filter((t: any) => t.status === 'DONE');
      const activeTasks = assignedTasks.filter((t: any) => t.status === 'TODO' || t.status === 'IN_PROGRESS');

      const urgentTasks = activeTasks.filter((t: any) => t.priority === 'URGENT' || t.priority === 'HIGH');
      const overdueTasks = activeTasks.filter(
        (t: any) => t.dueDate && new Date(t.dueDate).getTime() < Date.now()
      );

      const activeCount = activeTasks.length;
      const totalCount = assignedTasks.length;
      const completionRate = totalCount > 0 ? Math.round((doneTasks.length / totalCount) * 100) : 0;

      // Capacity Gauge (Baseline: 8 active tasks = 100% capacity)
      const capacityPercent = Math.min(100, Math.round((activeCount / 8) * 100));

      let loadStatus = {
        label: 'Available',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        barColor: 'bg-emerald-500',
      };

      if (activeCount === 0) {
        loadStatus = {
          label: 'Available',
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          barColor: 'bg-emerald-500',
        };
      } else if (activeCount <= 3) {
        loadStatus = {
          label: 'Light',
          color: 'text-sky-400',
          bg: 'bg-sky-500/10 border-sky-500/30',
          barColor: 'bg-sky-500',
        };
      } else if (activeCount <= 6) {
        loadStatus = {
          label: 'Optimal',
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10 border-indigo-500/30',
          barColor: 'bg-indigo-500',
        };
      } else if (activeCount <= 8) {
        loadStatus = {
          label: 'Heavy',
          color: 'text-amber-400',
          bg: 'bg-amber-500/10 border-amber-500/30',
          barColor: 'bg-amber-500',
        };
      } else {
        loadStatus = {
          label: 'Overloaded',
          color: 'text-rose-400',
          bg: 'bg-rose-500/10 border-rose-500/30',
          barColor: 'bg-rose-500',
        };
      }

      return {
        member: tm,
        assignedTasks,
        activeTasks,
        todoTasks,
        inProgressTasks,
        doneTasks,
        urgentTasks,
        overdueTasks,
        activeCount,
        totalCount,
        completionRate,
        capacityPercent,
        loadStatus,
      };
    });
  }, [teamMembers, allTasks]);

  // Team Aggregate Statistics
  const teamAggregate = useMemo(() => {
    const totalAssignedTasks = teamWorkloadData.reduce((acc, curr) => acc + curr.totalCount, 0);
    const totalActiveTasks = teamWorkloadData.reduce((acc, curr) => acc + curr.activeCount, 0);
    const totalDoneTasks = teamWorkloadData.reduce((acc, curr) => acc + curr.doneTasks.length, 0);
    const totalUrgentTasks = teamWorkloadData.reduce((acc, curr) => acc + curr.urgentTasks.length, 0);
    const totalOverdueTasks = teamWorkloadData.reduce((acc, curr) => acc + curr.overdueTasks.length, 0);

    const avgTasksPerMember =
      teamWorkloadData.length > 0
        ? (totalActiveTasks / teamWorkloadData.length).toFixed(1)
        : '0';

    return {
      totalAssignedTasks,
      totalActiveTasks,
      totalDoneTasks,
      totalUrgentTasks,
      totalOverdueTasks,
      avgTasksPerMember,
    };
  }, [teamWorkloadData]);

  // Filtered members for Tab 2
  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return teamWorkloadData;
    const q = memberSearch.toLowerCase();
    return teamWorkloadData.filter(
      (item) =>
        item.member.user?.fullName?.toLowerCase().includes(q) ||
        item.member.user?.email?.toLowerCase().includes(q)
    );
  }, [teamWorkloadData, memberSearch]);

  // --- MUTATIONS ---

  // Create Team Mutation
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createTeam: any }>(CREATE_TEAM_MUTATION, {
        input: {
          name: teamName.trim(),
          description: teamDesc.trim() || undefined,
          organizationPubId: effectiveOrgPubId,
          initialMemberPubIds: initialMemberPubIds.length > 0 ? initialMemberPubIds : undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: `Team "${data.createTeam.name}" created.` });
      setSelectedTeamPubId(data.createTeam.pubId);
      setShowCreateModal(false);
      setTeamName('');
      setTeamDesc('');
      setInitialMemberPubIds([]);
      queryClient.invalidateQueries({ queryKey: ['organizationTeams', effectiveOrgPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create team.' });
    },
  });

  // Update Team Mutation
  const updateTeamMutation = useMutation({
    mutationFn: async () => {
      if (!activeTeamPubId) return;
      return graphqlRequest<{ updateTeam: any }>(UPDATE_TEAM_MUTATION, {
        pubId: activeTeamPubId,
        input: {
          name: editName.trim(),
          description: editDesc.trim() || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: `Team "${data?.updateTeam?.name || editName}" updated.` });
      setShowEditModal(false);
      queryClient.invalidateQueries({ queryKey: ['organizationTeams', effectiveOrgPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update team.' });
    },
  });

  // Delete Team Mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      if (!activeTeamPubId) return;
      return graphqlRequest<{ deleteTeam: any }>(DELETE_TEAM_MUTATION, {
        pubId: activeTeamPubId,
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data?.deleteTeam?.message || 'Team deleted successfully.' });
      setShowDeleteModal(false);
      setSelectedTeamPubId(null);
      queryClient.invalidateQueries({ queryKey: ['organizationTeams', effectiveOrgPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to delete team.' });
    },
  });

  // Add Member to Team Mutation
  const addTeamMemberMutation = useMutation({
    mutationFn: async (userPubId: string) => {
      if (!activeTeamPubId || !userPubId) return;
      return graphqlRequest<{ addTeamMember: any }>(ADD_TEAM_MEMBER_MUTATION, {
        input: {
          teamPubId: activeTeamPubId,
          userPubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data?.addTeamMember?.message || 'Member added to team.' });
      setShowAddMemberModal(false);
      setAddMemberPubId('');
      queryClient.invalidateQueries({ queryKey: ['teamMembers', activeTeamPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationTeams', effectiveOrgPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to add member to team.' });
    },
  });

  // Remove Member from Team Mutation
  const removeTeamMemberMutation = useMutation({
    mutationFn: async (userPubId: string) => {
      if (!activeTeamPubId || !userPubId) return;
      return graphqlRequest<{ removeTeamMember: any }>(REMOVE_TEAM_MEMBER_MUTATION, {
        input: {
          teamPubId: activeTeamPubId,
          userPubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data?.removeTeamMember?.message || 'Member removed from team.' });
      queryClient.invalidateQueries({ queryKey: ['teamMembers', activeTeamPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationTeams', effectiveOrgPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to remove member from team.' });
    },
  });

  return (
    <div className="space-y-6 font-sans text-slate-100 pb-16">
      {/* Toast Feedback Notification */}
      {statusMsg && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium animate-in fade-in duration-200 shadow-lg ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TOP BANNER & METRICS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-100 tracking-tight">Teams & Workloads</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                  /{orgSlug}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage department squads, monitor member capacity, and balance tasks across projects in{' '}
                <span className="text-slate-200 font-semibold">{selectedOrgName || orgSlug}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setTeamName('');
                setTeamDesc('');
                setInitialMemberPubIds([]);
                setShowCreateModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          </div>
        </div>

        {/* Global Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Teams</span>
            </p>
            <p className="text-xl font-extrabold text-slate-100 mt-1 font-mono">{teams.length}</p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Workload</span>
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="text-xl font-extrabold text-slate-100 font-mono">
                {allTasks.filter((t: any) => t.status === 'TODO' || t.status === 'IN_PROGRESS').length}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">in-flight tasks</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Completed Tasks</span>
            </p>
            <p className="text-xl font-extrabold text-slate-100 mt-1 font-mono">
              {allTasks.filter((t: any) => t.status === 'DONE').length}
            </p>
          </div>

          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Org Projects</span>
            </p>
            <p className="text-xl font-extrabold text-slate-100 mt-1 font-mono">{orgProjects.length}</p>
          </div>
        </div>
      </div>

      {/* TEAMS DIRECTORY & SELECTOR */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Teams Directory
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {teams.length}
            </span>
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Search teams by name..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
            />
          </div>
        </div>

        {teamsLoading ? (
          <div className="p-12 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl gap-3">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">Loading organization teams...</p>
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="p-10 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <div className="p-3 bg-slate-800/60 rounded-full text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">No teams found</p>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {teamSearch
                  ? `No teams match "${teamSearch}". Try clearing your search filter.`
                  : 'Start organizing your squad by creating your first department or project team.'}
              </p>
            </div>
            {!teamSearch && (
              <button
                onClick={() => {
                  setTeamName('');
                  setTeamDesc('');
                  setInitialMemberPubIds([]);
                  setShowCreateModal(true);
                }}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Create First Team
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredTeams.map((team: any) => {
              const isSelected = team.pubId === activeTeamPubId;
              const count = team.memberCount || (team.members || []).length || 0;
              const linkedProjectsCount = orgProjects.filter((p: any) => p.teamPubId === team.pubId).length;

              return (
                <div
                  key={team.pubId}
                  onClick={() => setSelectedTeamPubId(team.pubId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group relative ${
                    isSelected
                      ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-300 group-hover:bg-indigo-600/30 group-hover:text-indigo-300 transition-colors'
                          }`}
                        >
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-sm text-slate-100 truncate">{team.name}</h3>
                      </div>

                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-400 font-sans line-clamp-2 min-h-[32px]">
                      {team.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-indigo-400" />
                        <span>{count}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderKanban className="w-3 h-3 text-amber-400" />
                        <span>{linkedProjectsCount} proj</span>
                      </span>
                    </div>

                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        isSelected ? 'text-indigo-400 translate-x-0.5' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACTIVE TEAM WORKSPACE (TABS: WORKLOAD, MEMBERS, PROJECTS) */}
      {activeTeam && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Active Team Header Bar */}
          <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/40">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100">{activeTeam.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  pubId: {activeTeam.pubId.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                {activeTeam.description || 'No description set for this team.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditName(activeTeam.name);
                  setEditDesc(activeTeam.description || '');
                  setShowEditModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Edit Team</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          {/* Team Workload Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-slate-800 border-b border-slate-800 bg-slate-950/20 text-xs">
            <div className="p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-500">Team Members</p>
              <p className="text-base font-bold text-slate-100 font-mono mt-0.5">{teamMembers.length}</p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-500">Active In-Flight</p>
              <p className="text-base font-bold text-indigo-400 font-mono mt-0.5">
                {teamAggregate.totalActiveTasks}
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-500">Completed Tasks</p>
              <p className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                {teamAggregate.totalDoneTasks}
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-500">Urgent / High Load</p>
              <p className="text-base font-bold text-amber-400 font-mono mt-0.5">
                {teamAggregate.totalUrgentTasks}
              </p>
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-mono uppercase text-slate-500">Avg Tasks / Member</p>
              <p className="text-base font-bold text-slate-200 font-mono mt-0.5">
                {teamAggregate.avgTasksPerMember}
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('workload')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'workload'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Workload & Capacity</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {teamMembers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Members</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {teamMembers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('projects')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'projects'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              <span>Assigned Projects</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                {teamAssignedProjects.length}
              </span>
            </button>
          </div>

          {/* TAB 1: WORKLOAD & CAPACITY */}
          {activeTab === 'workload' && (
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>Member Capacity & Task Allocation</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live task allocation calculated from all active projects. Benchmark capacity is 8
                    concurrent tasks.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available (0)
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Optimal (1-6)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Heavy (7-8)
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Overload (9+)
                  </span>
                </div>
              </div>

              {membersLoading || tasksLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Calculating live workload matrix...</p>
                </div>
              ) : teamWorkloadData.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-3">
                  <p className="text-xs text-slate-400">No members in this team yet.</p>
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Add First Member
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {teamWorkloadData.map((item) => {
                    const u = item.member.user;
                    const initials = (u?.fullName || u?.email || 'U').slice(0, 2).toUpperCase();

                    return (
                      <div
                        key={item.member.pubId}
                        className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
                      >
                        {/* Member Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-100 text-xs truncate">
                                {u?.fullName || u?.email?.split('@')[0]}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono truncate">{u?.email}</p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.loadStatus.bg} ${item.loadStatus.color} flex-shrink-0`}
                          >
                            {item.loadStatus.label}
                          </span>
                        </div>

                        {/* Capacity Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <span>Capacity Load</span>
                            <span className="font-bold text-slate-200">
                              {item.activeCount} / 8 tasks ({item.capacityPercent}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.loadStatus.barColor} transition-all duration-300`}
                              style={{ width: `${item.capacityPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Task Distribution Pills */}
                        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                          <div className="p-1.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                            <p className="text-[9px] text-slate-500 uppercase">Todo</p>
                            <p className="text-xs font-bold text-slate-200">{item.todoTasks.length}</p>
                          </div>
                          <div className="p-1.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                            <p className="text-[9px] text-indigo-400 uppercase">In Progress</p>
                            <p className="text-xs font-bold text-indigo-300">
                              {item.inProgressTasks.length}
                            </p>
                          </div>
                          <div className="p-1.5 bg-slate-900 border border-slate-800/80 rounded-lg">
                            <p className="text-[9px] text-emerald-400 uppercase">Done</p>
                            <p className="text-xs font-bold text-emerald-300">{item.doneTasks.length}</p>
                          </div>
                        </div>

                        {/* Action & Alerts */}
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] font-mono">
                            {item.urgentTasks.length > 0 && (
                              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                                <AlertTriangle className="w-3 h-3" />
                                {item.urgentTasks.length} Urgent
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setInspectMember(item)}
                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer transition-colors"
                          >
                            <span>Inspect Tasks</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TEAM MEMBERS */}
          {activeTab === 'members' && (
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search member by name or email..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              {membersLoading ? (
                <div className="p-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  <p className="text-xs text-slate-400 font-mono">Loading team members...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400">
                    {memberSearch ? `No members found matching "${memberSearch}".` : 'No members in this team.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Member</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Load Status</th>
                        <th className="p-3">Active Tasks</th>
                        <th className="p-3">Joined Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {filteredMembers.map((item) => {
                        const u = item.member.user;
                        const initials = (u?.fullName || u?.email || 'U').slice(0, 2).toUpperCase();

                        return (
                          <tr key={item.member.pubId} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                  {initials}
                                </div>
                                <span className="font-semibold text-slate-100 font-sans">
                                  {u?.fullName || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-300 font-sans">{u?.email}</td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.loadStatus.bg} ${item.loadStatus.color}`}
                              >
                                {item.loadStatus.label}
                              </span>
                            </td>
                            <td className="p-3 text-slate-200">
                              <span className="font-bold text-indigo-300">{item.activeCount}</span> in-flight
                            </td>
                            <td className="p-3 text-slate-400">
                              {new Date(item.member.joinedAt).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                title="Remove from Team"
                                disabled={removeTeamMemberMutation.isPending}
                                onClick={() => {
                                  if (u?.pubId && confirm(`Remove ${u.fullName || u.email} from this team?`)) {
                                    removeTeamMemberMutation.mutate(u.pubId);
                                  }
                                }}
                                className="p-1.5 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 rounded-lg cursor-pointer transition-colors"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ASSIGNED PROJECTS */}
          {activeTab === 'projects' && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-indigo-400" />
                    <span>Projects Assigned to {activeTeam.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Projects linked to this department squad in organization settings.
                  </p>
                </div>

                <Link
                  href="/dashboard/projects"
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  <span>Manage in Projects</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {teamAssignedProjects.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                  <FolderKanban className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-300 font-semibold">No projects assigned to this team</p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Assign this team when creating or updating a project in the Projects dashboard.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {teamAssignedProjects.map((p: any) => (
                    <div
                      key={p.pubId}
                      className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                            {p.key}
                          </span>
                          <h4 className="font-bold text-sm text-slate-100 mt-1">{p.name}</h4>
                        </div>

                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {p.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                        {p.description || 'No project description.'}
                      </p>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>{p.memberCount || 0} members</span>
                        </span>

                        <Link
                          href="/dashboard/tasks"
                          className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          <span>Open Board</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CREATE TEAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Create New Team</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTeamMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Frontend Engineering, Product Design"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Scope, objectives, and responsibilities of this team..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {/* Initial Members Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assign Initial Members (Optional)
                </label>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2 divide-y divide-slate-800/60">
                  {organizationMembers.length === 0 ? (
                    <p className="text-[11px] text-slate-500 p-2">No organization members found.</p>
                  ) : (
                    organizationMembers.map((m: any) => {
                      const u = m.user;
                      const isSelected = initialMemberPubIds.includes(u?.pubId);

                      return (
                        <div
                          key={u?.pubId}
                          onClick={() => {
                            if (!u?.pubId) return;
                            if (isSelected) {
                              setInitialMemberPubIds(initialMemberPubIds.filter((id) => id !== u.pubId));
                            } else {
                              setInitialMemberPubIds([...initialMemberPubIds, u.pubId]);
                            }
                          }}
                          className={`p-2 flex items-center justify-between rounded cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-950/50 text-indigo-200' : 'hover:bg-slate-800/40 text-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{u?.fullName || u?.email}</p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">{u?.email}</p>
                          </div>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTeamMutation.isPending || !teamName.trim()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  {createTeamMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Team</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEAM MODAL */}
      {showEditModal && activeTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <span>Edit Team</span>
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTeamMutation.mutate();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTeamMutation.isPending || !editName.trim()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  {updateTeamMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TEAM CONFIRMATION MODAL */}
      {showDeleteModal && activeTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-900/50 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2 bg-rose-950/80 rounded-xl border border-rose-800/50">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-100">Delete Team</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{activeTeam.name}"</span>?
              Members and assigned projects will remain in the organization, but team grouping will be permanently removed.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTeamMutation.isPending}
                onClick={() => deleteTeamMutation.mutate()}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                {deleteTeamMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Team</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MEMBER TO TEAM MODAL */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Add Member to {activeTeam?.name}</span>
              </h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Select an organization member to add to this team squad:
              </p>

              {availableOrgMembers.length === 0 ? (
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center text-xs text-slate-500">
                  All organization members are already part of this team.
                </div>
              ) : (
                <select
                  value={addMemberPubId}
                  onChange={(e) => setAddMemberPubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                >
                  <option value="">Select an organization member...</option>
                  {availableOrgMembers.map((om: any) => (
                    <option key={om.user?.pubId} value={om.user?.pubId}>
                      {om.user?.fullName || om.user?.email} ({om.role})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!addMemberPubId || addTeamMemberMutation.isPending}
                onClick={() => {
                  if (addMemberPubId) {
                    addTeamMemberMutation.mutate(addMemberPubId);
                  }
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                {addTeamMemberMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Add to Team</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT MEMBER TASKS SLIDE-OVER DRAWER */}
      {inspectMember && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 text-slate-100 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center justify-center">
                    {(inspectMember.member.user?.fullName || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">
                      {inspectMember.member.user?.fullName || inspectMember.member.user?.email}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {inspectMember.member.user?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectMember(null)}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Member Workload Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[9px] uppercase text-slate-500">Active</p>
                  <p className="text-sm font-bold text-indigo-300">{inspectMember.activeCount}</p>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[9px] uppercase text-slate-500">Done</p>
                  <p className="text-sm font-bold text-emerald-300">{inspectMember.doneTasks.length}</p>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                  <p className="text-[9px] uppercase text-slate-500">Capacity</p>
                  <p className="text-sm font-bold text-slate-200">{inspectMember.capacityPercent}%</p>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Assigned Tasks ({inspectMember.assignedTasks.length})</span>
                  <Link
                    href="/dashboard/tasks"
                    className="text-indigo-400 hover:text-indigo-300 lowercase font-sans text-[11px] flex items-center gap-0.5"
                  >
                    <span>view board</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </h4>

                {inspectMember.assignedTasks.length === 0 ? (
                  <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center text-xs text-slate-500 italic">
                    No tasks assigned to this member across active projects.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                    {inspectMember.assignedTasks.map((t: any) => {
                      const taskKey = t.project?.key
                        ? `${t.project.key}-${t.pubId.slice(-4).toUpperCase()}`
                        : t.pubId.slice(0, 8);

                      return (
                        <div
                          key={t.pubId}
                          className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                              {taskKey}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full border ${
                                t.status === 'DONE'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                  : t.status === 'IN_PROGRESS'
                                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                                  : 'bg-slate-800 border-slate-700 text-slate-400'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>

                          <p className="font-semibold text-slate-200 text-xs line-clamp-2">{t.title}</p>

                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                            <span
                              className={`px-1.5 py-0.2 rounded ${
                                t.priority === 'URGENT'
                                  ? 'text-rose-400 bg-rose-500/10 font-bold'
                                  : t.priority === 'HIGH'
                                  ? 'text-amber-400 bg-amber-500/10'
                                  : 'text-slate-400'
                              }`}
                            >
                              {t.priority}
                            </span>
                            {t.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                {new Date(t.dueDate).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectMember(null)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
