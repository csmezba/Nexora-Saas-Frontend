'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  MY_ORGANIZATIONS_QUERY,
  ORGANIZATION_TEAMS_QUERY,
  ORGANIZATION_MEMBERS_QUERY,
  PERMISSIONS_QUERY,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import {
  FolderKanban,
  CheckSquare,
  Ticket,
  Users,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const { accessToken, user, selectedOrgPubId, selectedOrgSlug } = useAuthStore();

  // Queries to backend GraphQL
  const { data: myOrgs = [] } = useQuery({
    queryKey: ['myOrganizations', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await graphqlRequest<{ myOrganizations: any[] }>(MY_ORGANIZATIONS_QUERY);
      return res.myOrganizations;
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

  const orgName = activeOrg?.name?.trim() || 'Acme Corporation';
  const orgSlug = activeOrg?.slug?.trim() || 'acme';

  const { data: teams = [] } = useQuery({
    queryKey: ['organizationTeams', activeOrg?.pubId],
    queryFn: async () => {
      if (!activeOrg?.pubId) return [];
      const res = await graphqlRequest<{ organizationTeams: any[] }>(ORGANIZATION_TEAMS_QUERY, {
        organizationPubId: activeOrg.pubId,
      });
      return res.organizationTeams;
    },
    enabled: !!activeOrg?.pubId && !!accessToken,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['organizationMembers', activeOrg?.pubId],
    queryFn: async () => {
      if (!activeOrg?.pubId) return [];
      const res = await graphqlRequest<{ organizationMembers: any[] }>(ORGANIZATION_MEMBERS_QUERY, {
        organizationPubId: activeOrg.pubId,
      });
      return res.organizationMembers;
    },
    enabled: !!activeOrg?.pubId && !!accessToken,
  });

  const metrics = [
    {
      title: 'Active Projects',
      value: '8',
      change: '+2 this week',
      icon: FolderKanban,
      color: 'text-indigo-400',
      bg: 'bg-indigo-950/40 border-indigo-800/40',
    },
    {
      title: 'Open Tasks',
      value: '24',
      change: '14 due today',
      icon: CheckSquare,
      color: 'text-amber-400',
      bg: 'bg-amber-950/40 border-amber-800/40',
    },
    {
      title: 'Open Support Tickets',
      value: '5',
      change: '-3 resolved today',
      icon: Ticket,
      color: 'text-rose-400',
      bg: 'bg-rose-950/40 border-rose-800/40',
    },
    {
      title: 'Team Members',
      value: (members.length || activeOrg?.memberCount || 6).toString(),
      change: `${teams.length} teams active`,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-950/40 border-emerald-800/40',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">
            Executive Overview &bull; /{orgSlug}
          </span>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            Good morning, {user?.fullName || 'Workspace Lead'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Here is what is happening across <strong className="text-slate-200">{orgName}</strong> today.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <p className="text-[10px] text-slate-400">AI Tokens Used</p>
              <p className="font-bold text-slate-200">142,850 / 500k</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.title}
              className={`p-4 rounded-xl border ${m.bg} shadow-sm space-y-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-indigo-500/40`}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300">{m.title}</span>
                <Icon className={`w-4 h-4 ${m.color} transition-transform duration-200 group-hover:scale-110`} />
              </div>
              <p className="text-2xl font-bold text-slate-100 font-mono">{m.value}</p>
              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span>{m.change}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Activity & Project Status Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recent Workspace Activity
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Live updates</span>
          </div>

          <div className="space-y-3">
            {[
              { text: 'John Doe deployed Mobile App v2.4 API updates', time: '12m ago', tag: 'ENGINEERING' },
              { text: 'Sarah Connor updated ticket #104 status to Resolved', time: '45m ago', tag: 'SUPPORT' },
              { text: 'AI Assistant generated weekly project risk summary', time: '2h ago', tag: 'AI WORKSPACE' },
              { text: 'Acme Corp member role granted to dev-lead@example.com', time: '4h ago', tag: 'SECURITY' },
            ].map((act, i) => (
              <div
                key={i}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs font-sans cursor-pointer transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/80 hover:translate-x-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-slate-200">{act.text}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                    {act.tag}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project Health Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Project Velocity & Health
            </h3>
          </div>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>AI Platform Migration</span>
                <span className="font-mono text-emerald-400">85%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[85%] rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Support Portal Redesign</span>
                <span className="font-mono text-indigo-400">62%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[62%] rounded-full"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-medium mb-1">
                <span>Stripe Billing v3</span>
                <span className="font-mono text-amber-400">40%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-[40%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
