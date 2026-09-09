'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  MY_ORGANIZATIONS_QUERY,
  ORGANIZATION_TEAMS_QUERY,
  ORGANIZATION_MEMBERS_QUERY,
  ORGANIZATION_PROJECTS_QUERY,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import {
  FolderKanban,
  Users,
  Building2,
  Calendar,
  Shield,
  ArrowRight,
  UserCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  Layers,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { accessToken, user, selectedOrgPubId, selectedOrgSlug, selectedOrgName } = useAuthStore();

  // Queries to backend GraphQL
  const { data: myOrgs = [] } = useQuery({
    queryKey: ['myOrganizations', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await graphqlRequest<{ myOrganizations: any[] }>(MY_ORGANIZATIONS_QUERY);
      return res.myOrganizations || [];
    },
    enabled: !!accessToken,
  });

  const validOrgs = Array.isArray(myOrgs) ? myOrgs.filter((o: any) => o && typeof o === 'object') : [];
  const activeOrg =
    validOrgs.find(
      (o) =>
        (selectedOrgPubId && o.pubId === selectedOrgPubId) ||
        (selectedOrgSlug && o.slug === selectedOrgSlug)
    ) ||
    validOrgs[0] ||
    null;

  const effectiveOrgPubId = selectedOrgPubId || activeOrg?.pubId || '';
  const orgName = activeOrg?.name?.trim() || selectedOrgName || 'Workspace';
  const orgSlug = activeOrg?.slug?.trim() || selectedOrgSlug || 'workspace';
  const userRole = activeOrg?.currentUserRole || 'MEMBER';

  // 1. Real Teams Query
  const { data: teams = [] } = useQuery({
    queryKey: ['organizationTeams', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationTeams: any[] }>(ORGANIZATION_TEAMS_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.organizationTeams || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // 2. Real Members Query
  const { data: members = [] } = useQuery({
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

  // 3. Real Projects Query
  const { data: projects = [] } = useQuery({
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

  const metrics = [
    {
      title: 'Active Projects',
      value: projects.length.toString(),
      change: `${projects.length === 1 ? '1 initiative' : `${projects.length} initiatives`} ongoing`,
      icon: FolderKanban,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40 border-indigo-800/40',
      link: '/dashboard/projects',
    },
    {
      title: 'Organization Members',
      value: members.length.toString(),
      change: `${members.length === 1 ? '1 member' : `${members.length} members`} registered`,
      icon: UserCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/40',
      link: '/dashboard/members',
    },
    {
      title: 'Active Teams',
      value: teams.length.toString(),
      change: `${teams.length} department groups`,
      icon: Users,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/40',
      link: '/dashboard/teams',
    },
    {
      title: 'Your Role',
      value: userRole,
      change: `Permissions active`,
      icon: Shield,
      color: 'text-purple-400',
      bg: 'bg-purple-950/40 border-purple-800/40',
      link: '/dashboard/settings',
    },
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80 font-bold';
      case 'ADMIN':
        return 'bg-purple-950/80 text-purple-300 border-purple-800/80 font-bold';
      case 'DEVELOPER':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Workspace Overview &bull; /{orgSlug}</span>
          </span>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            Good morning, {user?.fullName || user?.email || 'Workspace Lead'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Here is what is happening across <strong className="text-slate-200">{orgName}</strong> today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/members"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Manage Members</span>
          </Link>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 shadow-sm"
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>View Projects</span>
          </Link>
        </div>
      </div>

      {/* Real Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.title}
              href={m.link}
              className={`p-4 rounded-xl border ${m.bg} shadow-sm space-y-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-indigo-500/40 block`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300">{m.title}</span>
                <Icon className={`w-4 h-4 ${m.color} transition-transform duration-200 group-hover:scale-110`} />
              </div>
              <p className="text-2xl font-bold text-slate-100 font-mono">{m.value}</p>
              <p className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                <span>{m.change}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </p>
            </Link>
          );
        })}
      </div>

      {/* Main Content Grid: Real Members Roster + Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real Organization Members Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Organization Members ({members.length})</span>
            </h3>
            <Link
              href="/dashboard/members"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
            >
              <span>View All & Invite</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {members.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No members registered in this workspace yet.</p>
              <Link
                href="/dashboard/members"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Invite Members</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {members.slice(0, 5).map((m: any) => {
                const memberName = m.user?.fullName || m.user?.email?.split('@')[0] || 'Member';
                const memberEmail = m.user?.email || '';
                const initial = (memberName.replace(/[^a-zA-Z0-9]/g, '').charAt(0) || 'U').toUpperCase();
                const isCurrent = user?.email && m.user?.email === user.email;

                return (
                  <div
                    key={m.pubId}
                    className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs font-sans hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {initial}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span>{memberName}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">{memberEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getRoleBadgeStyle(m.role)}`}>
                        {m.role}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        Joined {new Date(m.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real Projects Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-400" />
              <span>Active Projects ({projects.length})</span>
            </h3>
            <Link
              href="/dashboard/projects"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-3">
              <FolderKanban className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No initiatives launched yet.</p>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 text-xs font-sans">
              {projects.slice(0, 4).map((p: any) => (
                <div
                  key={p.pubId}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-1.5 hover:border-indigo-500/30 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300">
                      {p.key}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {p.description || 'No description provided'}
                  </p>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                    <span>{p.memberCount || 1} members</span>
                    <span className="text-indigo-400 font-semibold">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

