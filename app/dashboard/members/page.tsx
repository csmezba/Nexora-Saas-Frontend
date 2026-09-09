'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_MEMBERS_QUERY,
  ORGANIZATION_ROLES_QUERY,
  ORGANIZATION_ROLE_ENUM_QUERY,
  PERMISSIONS_QUERY,
  ADD_ORGANIZATION_MEMBER_MUTATION,
  REMOVE_ORGANIZATION_MEMBER_MUTATION,
  MY_ORGANIZATIONS_QUERY,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import MemberRolesPermissionsModal from '@/components/member/MemberRolesPermissionsModal';
import RoleMatrixSection from '@/components/role/RoleMatrixSection';
import PermissionsCatalogSection from '@/components/role/PermissionsCatalogSection';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  ShieldCheck,
  Mail,
  Calendar,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Building2,
  UserCheck,
  Lock,
  Sparkles,
} from 'lucide-react';

export default function MembersPage() {
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId, selectedOrgSlug, selectedOrgName, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'members' | 'roles' | 'permissions'>('members');

  // Query real OrganizationRole enum values from GraphQL backend
  const { data: roleEnumValues = [] } = useQuery({
    queryKey: ['organizationRoleEnum'],
    queryFn: async () => {
      const res = await graphqlRequest<{ __type: { enumValues: Array<{ name: string }> } }>(
        ORGANIZATION_ROLE_ENUM_QUERY
      );
      return (res.__type?.enumValues || []).map((e) => e.name);
    },
    enabled: !!accessToken,
  });

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

  const validOrgs = Array.isArray(myOrgs) ? myOrgs.filter((o: any) => o && typeof o === 'object') : [];
  const activeOrg =
    validOrgs.find(
      (o: any) =>
        (selectedOrgPubId && o.pubId === selectedOrgPubId) ||
        (selectedOrgSlug && o.slug === selectedOrgSlug)
    ) ||
    validOrgs[0] ||
    null;

  const effectiveOrgPubId = selectedOrgPubId || activeOrg?.pubId || '';
  const currentOrgName = activeOrg?.name?.trim() || selectedOrgName || 'Workspace';
  const orgSlug = activeOrg?.slug?.trim() || selectedOrgSlug || 'workspace';

  // 1. Fetch real members from DB for selected organization
  const {
    data: members = [],
    isLoading: isMembersLoading,
  } = useQuery({
    queryKey: ['organizationMembers', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationMembers: any[] }>(
        ORGANIZATION_MEMBERS_QUERY,
        { organizationPubId: effectiveOrgPubId }
      );
      return res.organizationMembers || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // 2. Fetch organization custom roles count
  const { data: orgRoles = [] } = useQuery({
    queryKey: ['organizationRoles', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationRoles: any[] }>(ORGANIZATION_ROLES_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.organizationRoles || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // 3. Fetch system permissions count
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await graphqlRequest<{ permissions: any[] }>(PERMISSIONS_QUERY);
      return res.permissions || [];
    },
    enabled: !!accessToken,
  });

  // Local state for search & filtering in members list
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('MEMBER');

  // Selected member for "Set Roles & Permissions" modal
  const [selectedMemberForRoles, setSelectedMemberForRoles] = useState<any | null>(null);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Invite Member Mutation
  const addMemberMutation = useMutation({
    mutationFn: async () => {
      setStatusMsg(null);
      return graphqlRequest<{ addOrganizationMember: any }>(ADD_ORGANIZATION_MEMBER_MUTATION, {
        input: {
          organizationId: effectiveOrgPubId,
          email: newEmail.trim(),
          role: newRole,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data.addOrganizationMember.message || 'Member invited successfully.',
      });
      setShowAddModal(false);
      setNewEmail('');
      setNewRole('MEMBER');
      queryClient.invalidateQueries({ queryKey: ['organizationMembers', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to add member to organization.',
      });
    },
  });

  // Remove Member Mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      setStatusMsg(null);
      return graphqlRequest<{ removeOrganizationMember: any }>(
        REMOVE_ORGANIZATION_MEMBER_MUTATION,
        {
          input: {
            organizationId: effectiveOrgPubId,
            userId,
          },
        }
      );
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data.removeOrganizationMember.message || 'Member removed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['organizationMembers', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to remove member.',
      });
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    addMemberMutation.mutate();
  };

  const handleRemoveMember = (m: any) => {
    const memberName = m.user?.fullName || m.user?.email || 'this member';
    if (confirm(`Are you sure you want to remove ${memberName} from ${currentOrgName}?`)) {
      removeMemberMutation.mutate(m.user.pubId);
    }
  };

  const filteredMembers = members.filter((m: any) => {
    const memberName = m.user?.fullName || '';
    const memberEmail = m.user?.email || '';
    const matchesSearch =
      memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memberEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-sm">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Organization Members & Access Control</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {members.length} {members.length === 1 ? 'Member' : 'Members'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Configure base roles, custom organization roles, and permissions for</span>
              <span className="text-indigo-300 font-semibold">{currentOrgName}</span>
              <span className="text-[11px] font-mono text-slate-500">({orgSlug})</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setStatusMsg(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Member</span>
        </button>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border shadow-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
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

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'members', label: `Workspace Members (${members.length})`, icon: Users },
          { id: 'roles', label: `Custom Roles & Matrix (${orgRoles.length})`, icon: ShieldCheck },
          { id: 'permissions', label: `Permissions Catalog (${permissions.length})`, icon: Lock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: WORKSPACE MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members by name or email..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto pb-1 max-w-full">
              {['ALL', ...roleEnumValues].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 active:scale-95 whitespace-nowrap text-[11px] ${
                    roleFilter === r
                      ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Skeleton */}
          {isMembersLoading && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-slate-950/40 rounded-lg animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 bg-slate-800 rounded" />
                      <div className="h-2.5 w-44 bg-slate-800/70 rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isMembersLoading && filteredMembers.length === 0 && (
            <div className="p-12 text-center bg-slate-900/60 border border-slate-800 border-dashed rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 text-indigo-400 mx-auto flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-200">
                  {searchQuery || roleFilter !== 'ALL'
                    ? 'No matching members found'
                    : 'No members in this organization yet'}
                </h3>
                <p className="text-xs text-slate-400">
                  {searchQuery || roleFilter !== 'ALL'
                    ? 'Try adjusting your search criteria or role filter.'
                    : `Invite team members to ${currentOrgName} to collaborate across projects and tasks.`}
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite First Member</span>
              </button>
            </div>
          )}

          {/* Members Table */}
          {!isMembersLoading && filteredMembers.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Member</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Base Organization Role</th>
                      <th className="p-3.5">Joined Date</th>
                      <th className="p-3.5 text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono">
                    {filteredMembers.map((m: any) => {
                      const memberName =
                        m.user?.fullName || m.user?.email?.split('@')[0] || 'Member';
                      const memberEmail = m.user?.email || 'N/A';
                      const initial = (
                        memberName.replace(/[^a-zA-Z0-9]/g, '').charAt(0) || 'U'
                      ).toUpperCase();
                      const isCurrentUser = Boolean(user?.email && m.user?.email === user.email);

                      return (
                        <tr
                          key={m.pubId}
                          className="hover:bg-slate-800/50 transition-colors group"
                        >
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                                {initial}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-100 font-sans flex items-center gap-1.5">
                                  <span>{memberName}</span>
                                  {isCurrentUser && (
                                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  Member ID: {m.pubId.slice(0, 10)}...
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span>{memberEmail}</span>
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-slate-950 text-indigo-300 border-indigo-800/80">
                              {m.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>{new Date(m.joinedAt).toLocaleDateString()}</span>
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedMemberForRoles(m)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 active:scale-95 shadow-sm"
                                title="Configure Base Role, Custom Organization Roles, and Permissions"
                              >
                                <Shield className="w-3.5 h-3.5" />
                                <span>Set Roles & Permissions</span>
                              </button>

                              {!isCurrentUser && (
                                <button
                                  onClick={() => handleRemoveMember(m)}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                                  title="Remove Member"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM ROLES & MATRIX */}
      {activeTab === 'roles' && (
        <RoleMatrixSection organizationPubId={effectiveOrgPubId} />
      )}

      {/* TAB 3: PERMISSIONS CATALOG */}
      {activeTab === 'permissions' && (
        <PermissionsCatalogSection />
      )}

      {/* Invite Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 font-sans space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Invite Team Member</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  User Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Assigned Base Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors font-mono"
                >
                  {roleEnumValues.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg cursor-pointer transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                >
                  {addMemberMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Inviting...</span>
                    </>
                  ) : (
                    <span>Send Invitation</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set Roles & Permissions Modal */}
      {selectedMemberForRoles && (
        <MemberRolesPermissionsModal
          isOpen={!!selectedMemberForRoles}
          onClose={() => setSelectedMemberForRoles(null)}
          organizationPubId={effectiveOrgPubId}
          member={selectedMemberForRoles}
        />
      )}
    </div>
  );
}
