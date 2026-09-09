'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_TEAMS_QUERY,
  TEAM_MEMBERS_QUERY,
  CREATE_TEAM_MUTATION,
  ADD_TEAM_MEMBER_MUTATION,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import { Users, Plus, UserPlus, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function TeamsPage() {
  const params = useParams();
  const orgSlug = (params?.organizationSlug as string) || 'acme';
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId } = useAuthStore();

  const [selectedTeamPubId, setSelectedTeamPubId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['organizationTeams', selectedOrgPubId || orgSlug],
    queryFn: async () => {
      const res = await graphqlRequest<{ organizationTeams: any[] }>(ORGANIZATION_TEAMS_QUERY, {
        organizationPubId: selectedOrgPubId || orgSlug,
      });
      return res.organizationTeams;
    },
    enabled: !!accessToken,
  });

  const activeTeamPubId = selectedTeamPubId || (teams.length > 0 ? teams[0].pubId : '');

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers', activeTeamPubId],
    queryFn: async () => {
      if (!activeTeamPubId) return [];
      const res = await graphqlRequest<{ teamMembers: any[] }>(TEAM_MEMBERS_QUERY, {
        teamPubId: activeTeamPubId,
      });
      return res.teamMembers;
    },
    enabled: !!activeTeamPubId && !!accessToken,
  });

  const createTeamMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createTeam: any }>(CREATE_TEAM_MUTATION, {
        input: {
          name: teamName,
          description: teamDesc || undefined,
          organizationPubId: selectedOrgPubId || orgSlug,
        },
      });
    },
    onSuccess: (data) => {
      setSelectedTeamPubId(data.createTeam.pubId);
      setShowCreateModal(false);
      setTeamName('');
      setTeamDesc('');
      queryClient.invalidateQueries();
    },
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Teams & Workload Management</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {teams.length} Teams
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Department teams, member allocations, and workload across <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Team</span>
        </button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {teams.map((t: any) => (
          <div
            key={t.pubId}
            onClick={() => setSelectedTeamPubId(t.pubId)}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              t.pubId === activeTeamPubId
                ? 'bg-slate-900 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm text-slate-100">{t.name}</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {t.memberCount || 0} Members
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans line-clamp-2">{t.description || 'No description'}</p>
            <p className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800 mt-2">pubId: {t.pubId}</p>
          </div>
        ))}
      </div>

      {/* Selected Team Members Table */}
      {activeTeamPubId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Team Members ({teamMembers.length})</span>
          </h3>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">User PubId</th>
                  <th className="p-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {teamMembers.map((tm: any) => (
                  <tr key={tm.pubId} className="hover:bg-slate-800/60 transition-colors">
                    <td className="p-3 font-semibold text-slate-100 font-sans">{tm.user?.fullName || 'N/A'}</td>
                    <td className="p-3 text-slate-300">{tm.user?.email}</td>
                    <td className="p-3 text-slate-500 text-[10px]">{tm.user?.pubId}</td>
                    <td className="p-3 text-slate-400">{new Date(tm.joinedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 text-slate-100 font-sans">
            <h3 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" />
              Create Team
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTeamMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Engineering Lead Team"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={teamDesc}
                  onChange={(e) => setTeamDesc(e.target.value)}
                  placeholder="Team scope and responsibilities..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                />
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
                  disabled={createTeamMutation.isPending}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
