'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_ROLES_QUERY,
  PERMISSIONS_QUERY,
  CREATE_ROLE_MUTATION,
  UPDATE_ROLE_MUTATION,
  DELETE_ROLE_MUTATION,
  ASSIGN_PERMISSIONS_TO_ROLE_MUTATION,
} from '@/graphql/documents';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Search,
  Check,
  KeyRound,
  Users,
} from 'lucide-react';

interface RoleMatrixSectionProps {
  organizationPubId: string;
}

export default function RoleMatrixSection({ organizationPubId }: RoleMatrixSectionProps) {
  const queryClient = useQueryClient();

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);

  // 1. Fetch organization custom roles
  const {
    data: orgRoles = [],
    isLoading: isRolesLoading,
    error: rolesError,
  } = useQuery({
    queryKey: ['organizationRoles', organizationPubId],
    queryFn: async () => {
      if (!organizationPubId) return [];
      const res = await graphqlRequest<{ organizationRoles: any[] }>(ORGANIZATION_ROLES_QUERY, {
        organizationPubId,
      });
      return res.organizationRoles || [];
    },
    enabled: !!organizationPubId,
  });

  // 2. Fetch all system permissions
  const { data: permissions = [], isLoading: isPermsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await graphqlRequest<{ permissions: any[] }>(PERMISSIONS_QUERY);
      return res.permissions || [];
    },
  });

  // 3. Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      setStatusMsg(null);
      return graphqlRequest<{ createRole: any }>(CREATE_ROLE_MUTATION, {
        input: {
          name: newRoleName.trim(),
          description: newRoleDesc.trim() || undefined,
          organizationPubId,
          permissionPubIds: newRolePerms.length > 0 ? newRolePerms : undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Role "${data?.createRole?.name || newRoleName}" created successfully.`,
      });
      setShowCreateModal(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePerms([]);
      queryClient.invalidateQueries({ queryKey: ['organizationRoles', organizationPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to create role.',
      });
    },
  });

  // 4. Assign Permissions to Role Mutation
  const assignPermsMutation = useMutation({
    mutationFn: async () => {
      if (!editingRole?.pubId) return;
      setStatusMsg(null);
      return graphqlRequest<{ assignPermissionsToRole: any }>(
        ASSIGN_PERMISSIONS_TO_ROLE_MUTATION,
        {
          input: {
            rolePubId: editingRole.pubId,
            permissionPubIds: editPerms,
          },
        }
      );
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Permissions updated for role "${data?.assignPermissionsToRole?.name || 'Role'}".`,
      });
      setEditingRole(null);
      queryClient.invalidateQueries({ queryKey: ['organizationRoles', organizationPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationMemberRoles', organizationPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to update permissions.',
      });
    },
  });

  // 5. Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (pubId: string) => {
      setStatusMsg(null);
      return graphqlRequest<{ deleteRole: any }>(DELETE_ROLE_MUTATION, { pubId });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: data.deleteRole.message || 'Role deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['organizationRoles', organizationPubId] });
      queryClient.invalidateQueries({ queryKey: ['organizationMemberRoles', organizationPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to delete role.',
      });
    },
  });

  const handleDeleteRole = (role: any) => {
    if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      deleteRoleMutation.mutate(role.pubId);
    }
  };

  const handleOpenEditPerms = (role: any) => {
    setEditingRole(role);
    const existingPermIds = (role.permissions || []).map((p: any) => p.pubId);
    setEditPerms(existingPermIds);
  };

  const filteredRoles = orgRoles.filter(
    (r: any) =>
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group system permissions by resource
  const permissionsByResource: Record<string, any[]> = {};
  permissions.forEach((p: any) => {
    const res = p.resource || 'general';
    if (!permissionsByResource[res]) permissionsByResource[res] = [];
    permissionsByResource[res].push(p);
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search custom roles by name or description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setStatusMsg(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create Custom Role</span>
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

      {/* Roles Grid */}
      {isRolesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 animate-pulse"
            >
              <div className="h-4 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-48 bg-slate-800/60 rounded" />
              <div className="h-16 bg-slate-950/40 rounded" />
            </div>
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-slate-200">No Custom Roles Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Custom roles enable you to create granular access groups (e.g. Lead Engineer, Support
            Agent) and attach specific system permissions to members.
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Role</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRoles.map((role: any) => {
            const rolePerms = role.permissions || [];

            return (
              <div
                key={role.pubId}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <span>{role.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80">
                          {rolePerms.length} {rolePerms.length === 1 ? 'Permission' : 'Permissions'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {role.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPerms(role)}
                        title="Configure Role Permissions"
                        className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRole(role)}
                        title="Delete Role"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Attached Permissions Pills */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                      Granted Permissions
                    </span>
                    {rolePerms.length === 0 ? (
                      <p className="text-[11px] text-slate-500 italic">No permissions assigned yet.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                        {rolePerms.map((p: any) => (
                          <span
                            key={p.pubId}
                            title={p.description || `${p.resource}:${p.action}`}
                            className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[10px] border border-slate-800 flex items-center gap-1"
                          >
                            <span className="text-purple-400 font-semibold">{p.resource}</span>
                            <span className="text-slate-500">:</span>
                            <span className="text-slate-300">{p.action}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>ID: {role.pubId}</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPerms(role)}
                    className="text-indigo-400 hover:text-indigo-300 font-sans font-semibold cursor-pointer"
                  >
                    Edit Permissions &rarr;
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Create Custom Organization Role</h3>
                  <p className="text-xs text-slate-400">
                    Define a role and select the permissions granted to assigned members.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate();
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs font-sans flex-1"
            >
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Role Name <span className="text-indigo-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Release Manager, Security Officer"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Describe the responsibilities and scope of this role..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-slate-300">
                    Select Granted Permissions ({newRolePerms.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRolePerms(permissions.map((p: any) => p.pubId))}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">&bull;</span>
                    <button
                      type="button"
                      onClick={() => setNewRolePerms([])}
                      className="text-[10px] text-slate-400 hover:text-slate-300 font-mono cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto p-3 bg-slate-950 rounded-lg border border-slate-800">
                  {Object.entries(permissionsByResource).map(([resource, perms]) => (
                    <div key={resource} className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        {resource}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {perms.map((p: any) => {
                          const isChecked = newRolePerms.includes(p.pubId);
                          return (
                            <label
                              key={p.pubId}
                              className={`flex items-center gap-2 p-1.5 rounded border text-[11px] font-mono cursor-pointer transition-colors ${
                                isChecked
                                  ? 'bg-purple-950/40 border-purple-800/80 text-purple-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewRolePerms((prev) => [...prev, p.pubId]);
                                  } else {
                                    setNewRolePerms((prev) => prev.filter((id) => id !== p.pubId));
                                  }
                                }}
                                className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                              />
                              <span className="truncate">{p.action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending || !newRoleName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  {createRoleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Permissions Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">
                    Edit Permissions &bull; {editingRole.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Configure the exact capabilities granted by this role.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignPermsMutation.mutate();
              }}
              className="p-5 overflow-y-auto space-y-4 text-xs font-sans flex-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-300">
                  Select Permissions ({editPerms.length} selected)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditPerms(permissions.map((p: any) => p.pubId))}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-600">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setEditPerms([])}
                    className="text-[10px] text-slate-400 hover:text-slate-300 font-mono cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto p-3 bg-slate-950 rounded-lg border border-slate-800">
                {Object.entries(permissionsByResource).map(([resource, perms]) => (
                  <div key={resource} className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                      {resource}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {perms.map((p: any) => {
                        const isChecked = editPerms.includes(p.pubId);
                        return (
                          <label
                            key={p.pubId}
                            className={`flex items-center gap-2 p-1.5 rounded border text-[11px] font-mono cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-purple-950/40 border-purple-800/80 text-purple-200'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditPerms((prev) => [...prev, p.pubId]);
                                } else {
                                  setEditPerms((prev) => prev.filter((id) => id !== p.pubId));
                                }
                              }}
                              className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span className="truncate">{p.action}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignPermsMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  {assignPermsMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Permissions</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
