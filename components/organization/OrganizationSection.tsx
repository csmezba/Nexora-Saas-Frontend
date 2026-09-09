'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import CreateOrganizationModal from '@/components/organization/CreateOrganizationModal';
import {
  MY_ORGANIZATIONS_QUERY,
  ORGANIZATION_QUERY,
  ORGANIZATION_MEMBERS_QUERY,
  CREATE_ORGANIZATION_MUTATION,
  UPDATE_ORGANIZATION_MUTATION,
  DELETE_ORGANIZATION_MUTATION,
  ADD_ORGANIZATION_MEMBER_MUTATION,
  UPDATE_ORGANIZATION_MEMBER_ROLE_MUTATION,
  REMOVE_ORGANIZATION_MEMBER_MUTATION,
  LEAVE_ORGANIZATION_MUTATION,
} from '@/graphql/documents';
import {
  Building2,
  Users,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
  Crown,
  Shield,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

const ORG_ROLES = [
  'OWNER',
  'ADMIN',
  'MANAGER',
  'DEVELOPER',
  'DESIGNER',
  'QA',
  'SALES',
  'MARKETING',
  'ACCOUNTANT',
  'MEMBER',
  'VIEWER',
];

const getRoleBadgeStyle = (role: string) => {
  switch (role) {
    case 'OWNER':
      return 'bg-purple-100 border-purple-200 text-purple-800 font-bold';
    case 'ADMIN':
      return 'bg-indigo-100 border-indigo-200 text-indigo-800 font-semibold';
    case 'MANAGER':
      return 'bg-blue-100 border-blue-200 text-blue-800';
    case 'DEVELOPER':
      return 'bg-emerald-100 border-emerald-200 text-emerald-800';
    default:
      return 'bg-slate-100 border-slate-200 text-slate-700';
  }
};

export default function OrganizationSection() {
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId, setSelectedOrgPubId } = useAuthStore();

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Forms state
  const [createName, setCreateName] = useState('');
  const [createSlug, setCreateSlug] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createLogo, setCreateLogo] = useState('');

  const [editPubId, setEditPubId] = useState('');
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLogo, setEditLogo] = useState('');

  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberRole, setAddMemberRole] = useState('MEMBER');

  const [updateMemberUserId, setUpdateMemberUserId] = useState('');
  const [updateMemberRole, setUpdateMemberRole] = useState('MEMBER');

  // Queries
  const {
    data: myOrgs = [],
    isLoading: orgsLoading,
    refetch: refetchOrgs,
  } = useQuery({
    queryKey: ['myOrganizations', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await graphqlRequest<{ myOrganizations: any[] }>(MY_ORGANIZATIONS_QUERY);
      return res.myOrganizations;
    },
    enabled: !!accessToken,
  });

  const activeOrgPubId = selectedOrgPubId || (myOrgs.length > 0 ? myOrgs[0].pubId : '');

  const { data: activeOrg, isLoading: activeOrgLoading } = useQuery({
    queryKey: ['organization', activeOrgPubId],
    queryFn: async () => {
      if (!activeOrgPubId) return null;
      const res = await graphqlRequest<{ organization: any }>(ORGANIZATION_QUERY, {
        pubIdOrSlug: activeOrgPubId,
      });
      return res.organization;
    },
    enabled: !!activeOrgPubId && !!accessToken,
  });

  const { data: orgMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['organizationMembers', activeOrgPubId],
    queryFn: async () => {
      if (!activeOrgPubId) return [];
      const res = await graphqlRequest<{ organizationMembers: any[] }>(ORGANIZATION_MEMBERS_QUERY, {
        organizationPubId: activeOrgPubId,
      });
      return res.organizationMembers;
    },
    enabled: !!activeOrgPubId && !!accessToken,
  });

  // Mutations
  const createOrgMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createOrganization: any }>(CREATE_ORGANIZATION_MUTATION, {
        input: {
          name: createName,
          slug: createSlug,
          description: createDesc || undefined,
          logoUrl: createLogo || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: `Created organization ${data.createOrganization.name}` });
      setSelectedOrgPubId(data.createOrganization.pubId);
      setCreateName('');
      setCreateSlug('');
      setCreateDesc('');
      setCreateLogo('');
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const updateOrgMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ updateOrganization: any }>(UPDATE_ORGANIZATION_MUTATION, {
        pubId: editPubId || activeOrgPubId,
        input: {
          name: editName || undefined,
          slug: editSlug || undefined,
          description: editDesc || undefined,
          logoUrl: editLogo || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: `Updated organization ${data.updateOrganization.name}` });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (pubId: string) => {
      return graphqlRequest<{ deleteOrganization: any }>(DELETE_ORGANIZATION_MUTATION, { pubId });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.deleteOrganization.message });
      setSelectedOrgPubId(null);
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ addOrganizationMember: any }>(ADD_ORGANIZATION_MEMBER_MUTATION, {
        input: {
          organizationId: activeOrgPubId,
          email: addMemberEmail,
          role: addMemberRole,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.addOrganizationMember.message });
      setAddMemberEmail('');
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const updateMemberRoleMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ updateOrganizationMemberRole: any }>(
        UPDATE_ORGANIZATION_MEMBER_ROLE_MUTATION,
        {
          input: {
            organizationId: activeOrgPubId,
            userId: updateMemberUserId,
            role: updateMemberRole,
          },
        }
      );
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.updateOrganizationMemberRole.message });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return graphqlRequest<{ removeOrganizationMember: any }>(
        REMOVE_ORGANIZATION_MEMBER_MUTATION,
        {
          input: {
            organizationId: activeOrgPubId,
            userId: targetUserId,
          },
        }
      );
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.removeOrganizationMember.message });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const leaveOrgMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ leaveOrganization: any }>(LEAVE_ORGANIZATION_MUTATION, {
        organizationPubId: activeOrgPubId,
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.leaveOrganization.message });
      setSelectedOrgPubId(null);
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  if (!accessToken) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs font-mono">
        Please login under Auth section to access Organization endpoints.
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

      {/* My Organizations Grid */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              My Organizations ({myOrgs.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-medium cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Organization</span>
            </button>

            <button
              onClick={() => refetchOrgs()}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-lg border border-slate-200 font-medium cursor-pointer transition-all duration-200 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {orgsLoading ? (
          <p className="text-xs text-slate-500 font-mono">Loading organizations...</p>
        ) : myOrgs.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono">No organizations found. Create one using the form below.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {myOrgs.map((org: any) => {
              const isSelected = org.pubId === activeOrgPubId;
              return (
                <div
                  key={org.pubId}
                  onClick={() => setSelectedOrgPubId(org.pubId)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                      : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isSelected ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {org.name?.charAt(0) || 'O'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">{org.name}</h4>
                        <p className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                          slug: {org.slug}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(
                        org.currentUserRole
                      )}`}
                    >
                      {org.currentUserRole}
                    </span>
                  </div>

                  <p className={`text-[11px] line-clamp-2 mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    {org.description || 'No description provided'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-200/20 flex justify-between items-center text-[10px]">
                    <span className="flex items-center gap-1 font-mono">
                      <Users className="w-3 h-3" /> {org.memberCount ?? 1} Members
                    </span>
                    <span className="font-mono text-[9px] opacity-70">{org.pubId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Organization Detail & Members */}
      {activeOrg && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-start pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 font-mono">
                Active Selected Organization
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{activeOrg.name}</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                pubId: {activeOrg.pubId} | slug: {activeOrg.slug} | Your Role: {activeOrg.currentUserRole}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => leaveOrgMutation.mutate()}
                disabled={leaveOrgMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs rounded-md font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Org</span>
              </button>

              {activeOrg.currentUserRole === 'OWNER' && (
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${activeOrg.name}?`)) {
                      deleteOrgMutation.mutate(activeOrg.pubId);
                    }
                  }}
                  disabled={deleteOrgMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-md font-medium transition-colors shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Org</span>
                </button>
              )}
            </div>
          </div>

          {/* Members Table */}
          <div>
            <h4 className="font-semibold text-xs text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-slate-500" />
              Organization Members ({orgMembers.length})
            </h4>

            {membersLoading ? (
              <p className="text-xs text-slate-500 font-mono">Loading members...</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3 border-r border-slate-200">Member</th>
                      <th className="p-3 border-r border-slate-200">Email</th>
                      <th className="p-3 border-r border-slate-200">Role</th>
                      <th className="p-3 border-r border-slate-200">User PubId</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {orgMembers.map((m: any) => (
                      <tr key={m.pubId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 border-r border-slate-200 font-medium font-sans flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {m.user?.fullName?.charAt(0) || 'U'}
                          </div>
                          <span>{m.user?.fullName || 'N/A'}</span>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-slate-700">{m.user?.email}</td>
                        <td className="p-3 border-r border-slate-200">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] ${getRoleBadgeStyle(
                              m.role
                            )}`}
                          >
                            {m.role}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-200 text-[11px] text-slate-500">{m.user?.pubId}</td>
                        <td className="p-3 flex items-center gap-2 font-sans">
                          <button
                            onClick={() => {
                              setUpdateMemberUserId(m.user?.pubId || '');
                              setUpdateMemberRole(m.role);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded text-[11px] font-medium"
                          >
                            Set Role
                          </button>
                          <button
                            onClick={() => removeMemberMutation.mutate(m.user?.pubId)}
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
        {/* Create Organization Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            Create Organization
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createOrgMutation.mutate();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Organization Name *</label>
              <input
                type="text"
                required
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Slug * (URL friendly)</label>
              <input
                type="text"
                required
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                placeholder="acme-corp"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
              <input
                type="text"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="SaaS platform organization"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={createLogo}
                onChange={(e) => setCreateLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={createOrgMutation.isPending}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {createOrgMutation.isPending ? 'Creating...' : 'Create Organization'}
            </button>
          </form>
        </div>

        {/* Update Organization Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            Update Organization
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateOrgMutation.mutate();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Org pubId or Slug *</label>
              <input
                type="text"
                required
                value={editPubId || activeOrgPubId}
                onChange={(e) => setEditPubId(e.target.value)}
                placeholder={activeOrgPubId || 'org-pub-id'}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Updated Name"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Slug</label>
              <input
                type="text"
                value={editSlug}
                onChange={(e) => setEditSlug(e.target.value)}
                placeholder="updated-slug"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Description</label>
              <input
                type="text"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Updated Description"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={updateOrgMutation.isPending}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
            >
              {updateOrgMutation.isPending ? 'Updating...' : 'Update Organization Details'}
            </button>
          </form>
        </div>

        {/* Add Member Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            Add Organization Member
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMemberMutation.mutate();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">User Email *</label>
              <input
                type="email"
                required
                value={addMemberEmail}
                onChange={(e) => setAddMemberEmail(e.target.value)}
                placeholder="member@example.com"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Organization Role</label>
              <select
                value={addMemberRole}
                onChange={(e) => setAddMemberRole(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                {ORG_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={addMemberMutation.isPending || !activeOrgPubId}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {addMemberMutation.isPending ? 'Adding Member...' : 'Add Member to Selected Org'}
            </button>
          </form>
        </div>

        {/* Update Member Role Form */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            Update Member Role
          </h4>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMemberRoleMutation.mutate();
            }}
            className="space-y-3.5"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">User PubId or Email *</label>
              <input
                type="text"
                required
                value={updateMemberUserId}
                onChange={(e) => setUpdateMemberUserId(e.target.value)}
                placeholder="usr_123..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">New Role *</label>
              <select
                value={updateMemberRole}
                onChange={(e) => setUpdateMemberRole(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                {ORG_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={updateMemberRoleMutation.isPending || !activeOrgPubId}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {updateMemberRoleMutation.isPending ? 'Updating Role...' : 'Update Member Role'}
            </button>
          </form>
        </div>
      </div>

      {/* Modal for Organization Form */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(created) => {
          setSelectedOrgPubId(created.pubId);
          refetchOrgs();
          setStatusMsg({ type: 'success', text: `Organization "${created.name}" created successfully!` });
        }}
      />
    </div>
  );
}
