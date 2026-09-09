'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_ROLE_ENUM_QUERY,
  ORGANIZATION_ROLES_QUERY,
  ORGANIZATION_MEMBER_ROLES_QUERY,
  UPDATE_ORGANIZATION_MEMBER_ROLE_MUTATION,
  ASSIGN_ROLE_TO_MEMBER_MUTATION,
  REMOVE_ROLE_FROM_MEMBER_MUTATION,
} from '@/graphql/documents';
import {
  X,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Sparkles,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';

interface MemberRolesPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationPubId: string;
  member: {
    pubId: string;
    role: string;
    joinedAt: string;
    user: {
      pubId: string;
      email: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
    };
  } | null;
}

export default function MemberRolesPermissionsModal({
  isOpen,
  onClose,
  organizationPubId,
  member,
}: MemberRolesPermissionsModalProps) {
  const queryClient = useQueryClient();

  const [selectedBaseRole, setSelectedBaseRole] = useState<string>(member?.role || '');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  React.useEffect(() => {
    if (member?.role) {
      setSelectedBaseRole(member.role);
    }
    setStatusMsg(null);
  }, [member]);

  // 1. Query real OrganizationRole enum values from GraphQL backend
  const { data: roleEnumValues = [], isLoading: isRoleEnumLoading } = useQuery({
    queryKey: ['organizationRoleEnum'],
    queryFn: async () => {
      const res = await graphqlRequest<{ __type: { enumValues: Array<{ name: string; description?: string }> } }>(
        ORGANIZATION_ROLE_ENUM_QUERY
      );
      return (res.__type?.enumValues || []).map((e) => e.name).filter(Boolean);
    },
    enabled: isOpen,
  });

  // 2. Query Organization Custom Roles from backend
  const { data: orgRoles = [], isLoading: isOrgRolesLoading } = useQuery({
    queryKey: ['organizationRoles', organizationPubId],
    queryFn: async () => {
      if (!organizationPubId) return [];
      const res = await graphqlRequest<{ organizationRoles: any[] }>(ORGANIZATION_ROLES_QUERY, {
        organizationPubId,
      });
      return res.organizationRoles || [];
    },
    enabled: isOpen && !!organizationPubId,
  });

  // 3. Query member's assigned roles and permissions from backend
  const {
    data: memberAssignedRoles = [],
    isLoading: isMemberRolesLoading,
    refetch: refetchMemberRoles,
  } = useQuery({
    queryKey: ['organizationMemberRoles', organizationPubId, member?.pubId],
    queryFn: async () => {
      if (!organizationPubId || !member?.pubId) return [];
      const res = await graphqlRequest<{ organizationMemberRoles: any[] }>(
        ORGANIZATION_MEMBER_ROLES_QUERY,
        {
          organizationPubId,
          memberPubId: member.pubId,
        }
      );
      return res.organizationMemberRoles || [];
    },
    enabled: isOpen && !!organizationPubId && !!member?.pubId,
  });

  // 4. Mutation: Update Base Role
  const updateBaseRoleMutation = useMutation({
    mutationFn: async (newRole: string) => {
      if (!member?.user?.pubId) throw new Error('Missing user id');
      return graphqlRequest<{ updateOrganizationMemberRole: any }>(
        UPDATE_ORGANIZATION_MEMBER_ROLE_MUTATION,
        {
          input: {
            organizationId: organizationPubId,
            userId: member.user.pubId,
            role: newRole,
          },
        }
      );
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data.updateOrganizationMemberRole.message || 'Member role updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['organizationMembers', organizationPubId] });
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to update member role.',
      });
    },
  });

  // 5. Mutation: Assign Custom Role to Member
  const assignRoleMutation = useMutation({
    mutationFn: async (rolePubId: string) => {
      if (!member?.pubId) throw new Error('Missing member id');
      return graphqlRequest<{ assignRoleToMember: any }>(ASSIGN_ROLE_TO_MEMBER_MUTATION, {
        input: {
          organizationPubId,
          memberPubId: member.pubId,
          rolePubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data.assignRoleToMember.message || 'Role assigned to member.',
      });
      refetchMemberRoles();
      queryClient.invalidateQueries({ queryKey: ['organizationRoles', organizationPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationMembers', organizationPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to assign role.',
      });
    },
  });

  // 6. Mutation: Remove Custom Role from Member
  const removeRoleMutation = useMutation({
    mutationFn: async (rolePubId: string) => {
      if (!member?.pubId) throw new Error('Missing member id');
      return graphqlRequest<{ removeRoleFromMember: any }>(REMOVE_ROLE_FROM_MEMBER_MUTATION, {
        input: {
          organizationPubId,
          memberPubId: member.pubId,
          rolePubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data.removeRoleFromMember.message || 'Role removed from member.',
      });
      refetchMemberRoles();
      queryClient.invalidateQueries({ queryKey: ['organizationRoles', organizationPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationMembers', organizationPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to remove role.',
      });
    },
  });

  if (!isOpen || !member) return null;

  const assignedRolePubIds = new Set(memberAssignedRoles.map((r: any) => r.pubId));

  // Compute effective permissions directly from member's assigned roles queried from backend
  const effectivePermissionsMap = new Map<string, any>();
  memberAssignedRoles.forEach((role: any) => {
    (role.permissions || []).forEach((p: any) => {
      if (p && p.pubId) {
        effectivePermissionsMap.set(p.pubId, p);
      }
    });
  });
  const effectivePermissions = Array.from(effectivePermissionsMap.values());

  const memberDisplayName =
    member.user?.fullName || member.user?.email?.split('@')[0] || 'Member';

  const handleBaseRoleSave = () => {
    if (!selectedBaseRole || selectedBaseRole === member.role) return;
    updateBaseRoleMutation.mutate(selectedBaseRole);
  };

  const handleToggleCustomRole = (rolePubId: string) => {
    if (assignedRolePubIds.has(rolePubId)) {
      removeRoleMutation.mutate(rolePubId);
    } else {
      assignRoleMutation.mutate(rolePubId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <span>Set Roles & Permissions</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {member.user?.email}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Manage roles and permissions for{' '}
                <strong className="text-slate-200">{memberDisplayName}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center justify-between gap-2 border shadow-sm ${
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
              className="p-0.5 hover:bg-white/10 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs font-sans">
          {/* Section 1: Member Base Role */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Base Organization Role</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Current role: <span className="font-mono text-indigo-300 font-semibold">{member.role}</span>
                </p>
              </div>

              {selectedBaseRole && selectedBaseRole !== member.role && (
                <button
                  type="button"
                  onClick={handleBaseRoleSave}
                  disabled={updateBaseRoleMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  {updateBaseRoleMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span>Save Role</span>
                </button>
              )}
            </div>

            {isRoleEnumLoading ? (
              <div className="p-3 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Loading roles from backend...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                {roleEnumValues.map((r: any, idx: number) => {
                  const roleName = typeof r === 'string' ? r : r?.name || `role_${idx}`;
                  const isSelected = selectedBaseRole === roleName;
                  const isCurrent = member.role === roleName;

                  return (
                    <button
                      key={roleName}
                      type="button"
                      onClick={() => setSelectedBaseRole(roleName)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <span>{roleName}</span>
                      {isCurrent && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-black/30 text-emerald-300 font-sans">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Custom Organization Roles */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Custom Organization Roles</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Roles defined in this organization from backend database.
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                {memberAssignedRoles.length} Assigned
              </span>
            </div>

            {isOrgRolesLoading ? (
              <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading organization roles...</span>
              </div>
            ) : orgRoles.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-900 border border-dashed border-slate-800 text-center space-y-1">
                <p className="text-slate-300 font-medium">No custom roles defined in this workspace.</p>
                <p className="text-slate-500 text-[11px]">
                  Create custom roles in the Custom Roles tab to assign them to members.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {orgRoles.map((role: any) => {
                  const isAssigned = assignedRolePubIds.has(role.pubId);
                  const isPending =
                    (assignRoleMutation.isPending &&
                      assignRoleMutation.variables === role.pubId) ||
                    (removeRoleMutation.isPending &&
                      removeRoleMutation.variables === role.pubId);

                  const permsCount = role.permissions?.length || 0;

                  return (
                    <div
                      key={role.pubId}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                        isAssigned
                          ? 'bg-purple-950/20 border-purple-800/60'
                          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{role.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 border border-slate-700">
                            {permsCount} {permsCount === 1 ? 'Permission' : 'Permissions'}
                          </span>
                        </div>
                        {role.description && (
                          <p className="text-[11px] text-slate-400 truncate">{role.description}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleCustomRole(role.pubId)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 active:scale-95 disabled:opacity-50 whitespace-nowrap ${
                          isAssigned
                            ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                        }`}
                      >
                        {isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isAssigned ? (
                          <>
                            <Trash2 className="w-3 h-3" />
                            <span>Remove Role</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Assign Role</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Member Permissions from Assigned Roles */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-100 flex items-center gap-1.5 text-xs">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Assigned Role Permissions ({effectivePermissions.length})</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Granular permissions granted to this member from custom organization roles in backend.
                </p>
              </div>
            </div>

            {isMemberRolesLoading ? (
              <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Loading member permissions...</span>
              </div>
            ) : effectivePermissions.length === 0 ? (
              <div className="p-3 bg-slate-900/60 rounded-lg text-slate-400 text-center text-[11px] border border-slate-800">
                No custom role permissions assigned to this member.
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-900/80 rounded-lg border border-slate-800">
                {effectivePermissions.map((perm: any, pIdx: number) => (
                  <span
                    key={perm.pubId || `${perm.resource}:${perm.action}:${pIdx}`}
                    title={perm.description || `${perm.resource}:${perm.action}`}
                    className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[10px] border border-slate-700/80 flex items-center gap-1"
                  >
                    <span className="text-emerald-400 font-semibold">{perm.resource}</span>
                    <span className="text-slate-500">:</span>
                    <span className="text-indigo-300">{perm.action}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
