'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ORGANIZATION_TEAMS_QUERY,
  USER_TEAMS_QUERY,
  TEAM_QUERY,
  TEAM_MEMBERS_QUERY,
  CREATE_TEAM_MUTATION,
  UPDATE_TEAM_MUTATION,
  DELETE_TEAM_MUTATION,
  ADD_TEAM_MEMBER_MUTATION,
  REMOVE_TEAM_MEMBER_MUTATION,
} from '@/graphql/documents';
import {
  Users,
  UserPlus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Building2,
} from 'lucide-react';

export default function TeamSection() {
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId } = useAuthStore();

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedTeamPubId, setSelectedTeamPubId] = useState<string | null>(null);

  // Forms state
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createOrgPubId, setCreateOrgPubId] = useState('');

  const [editTeamPubId, setEditTeamPubId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const [addMemberUserPubId, setAddMemberUserPubId] = useState('');

  const targetOrgPubId = selectedOrgPubId || createOrgPubId;

  // Queries
  const {
    data: orgTeams = [],
    isLoading: orgTeamsLoading,
    refetch: refetchOrgTeams,
  } = useQuery({
    queryKey: ['organizationTeams', targetOrgPubId],
    queryFn: async () => {
      if (!targetOrgPubId) return [];
      const res = await graphqlRequest<{ organizationTeams: any[] }>(ORGANIZATION_TEAMS_QUERY, {
        organizationPubId: targetOrgPubId,
      });
      return res.organizationTeams;
    },
    enabled: !!targetOrgPubId && !!accessToken,
  });

  const activeTeamPubId = selectedTeamPubId || (orgTeams.length > 0 ? orgTeams[0].pubId : '');

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery({
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

  // Mutations
  const createTeamMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createTeam: any }>(CREATE_TEAM_MUTATION, {
        input: {
          name: createName,
          description: createDesc || undefined,
          organizationPubId: targetOrgPubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: `Created team ${data.createTeam.name}` });
      setSelectedTeamPubId(data.createTeam.pubId);
      setCreateName('');
      setCreateDesc('');
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (pubId: string) => {
      return graphqlRequest<{ deleteTeam: any }>(DELETE_TEAM_MUTATION, { pubId });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.deleteTeam.message });
      setSelectedTeamPubId(null);
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const addTeamMemberMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ addTeamMember: any }>(ADD_TEAM_MEMBER_MUTATION, {
        input: {
          teamPubId: activeTeamPubId,
          userPubId: addMemberUserPubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.addTeamMember.message });
      setAddMemberUserPubId('');
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const removeTeamMemberMutation = useMutation({
    mutationFn: async (targetUserPubId: string) => {
      return graphqlRequest<{ removeTeamMember: any }>(REMOVE_TEAM_MEMBER_MUTATION, {
        input: {
          teamPubId: activeTeamPubId,
          userPubId: targetUserPubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.removeTeamMember.message });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  if (!accessToken) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs font-mono">
        Please login under Auth section to access Team endpoints.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-medium flex items-center justify-between shadow-sm transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-[11px] font-semibold opacity-70 hover:opacity-100 px-2 py-0.5 rounded bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Target Org Banner */}
      {!selectedOrgPubId && (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs font-mono space-y-2 text-amber-900">
          <p className="font-semibold">Note: No active organization selected in store.</p>
          <div className="flex gap-2 items-center">
            <label className="text-amber-700">Org PubId / Slug:</label>
            <input
              type="text"
              value={createOrgPubId}
              onChange={(e) => setCreateOrgPubId(e.target.value)}
              placeholder="org-pub-id"
              className="px-3 py-1 bg-white border border-amber-300 rounded text-xs w-64 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Teams Grid */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              Organization Teams ({orgTeams.length})
            </h3>
          </div>

          <button
            onClick={() => refetchOrgTeams()}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-md border border-slate-200 font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {orgTeamsLoading ? (
          <p className="text-xs text-slate-500 font-mono">Loading teams...</p>
        ) : orgTeams.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No teams found in this organization. Create one below.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {orgTeams.map((team: any) => {
              const isSelected = team.pubId === activeTeamPubId;
              return (
                <div
                  key={team.pubId}
                  onClick={() => setSelectedTeamPubId(team.pubId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-xs">{team.name}</h4>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
                        isSelected
                          ? 'bg-indigo-500/30 border-indigo-400 text-indigo-200'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}
                    >
                      {team.memberCount || 0} Members
                    </span>
                  </div>

                  <p className={`text-[11px] line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    {team.description || 'No description provided'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200/20 text-[10px] font-mono opacity-70">
                    pubId: {team.pubId}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Team Members Table */}
      {activeTeamPubId && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                Active Team
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {orgTeams.find((t: any) => t.pubId === activeTeamPubId)?.name || activeTeamPubId}
              </h3>
              <p className="text-xs text-slate-500 font-mono">pubId: {activeTeamPubId}</p>
            </div>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this team?')) {
                  deleteTeamMutation.mutate(activeTeamPubId);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-md font-medium transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Team</span>
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Team Members ({teamMembers.length})
            </h4>

            {membersLoading ? (
              <p className="text-xs text-slate-500 font-mono">Loading members...</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3 border-r border-slate-200">User Name</th>
                      <th className="p-3 border-r border-slate-200">Email</th>
                      <th className="p-3 border-r border-slate-200">User PubId</th>
                      <th className="p-3 border-r border-slate-200">Joined At</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {teamMembers.map((tm: any) => (
                      <tr key={tm.pubId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 border-r border-slate-200 font-medium font-sans flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                            {tm.user?.fullName?.charAt(0) || 'U'}
                          </div>
                          <span>{tm.user?.fullName || 'N/A'}</span>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-slate-700">{tm.user?.email}</td>
                        <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500">{tm.user?.pubId}</td>
                        <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500">
                          {new Date(tm.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-sans">
                          <button
                            onClick={() => removeTeamMemberMutation.mutate(tm.user?.pubId)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded text-[11px] font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Team Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Create Team
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createTeamMutation.mutate();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Team Name *</label>
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Frontend Engineering"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Core Web Engineering Team"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={createTeamMutation.isPending || !targetOrgPubId}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {createTeamMutation.isPending ? 'Creating Team...' : 'Create Team'}
            </button>
          </form>
        </div>

        {/* Add Member to Team Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            Add User to Team
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTeamMemberMutation.mutate();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">User PubId or Email *</label>
              <input
                type="text"
                required
                value={addMemberUserPubId}
                onChange={(e) => setAddMemberUserPubId(e.target.value)}
                placeholder="usr_123... or user@example.com"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={addTeamMemberMutation.isPending || !activeTeamPubId}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {addTeamMemberMutation.isPending ? 'Adding Member...' : 'Add Member to Selected Team'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
