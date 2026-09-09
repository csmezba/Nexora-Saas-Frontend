'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ORGANIZATION_ROLES_QUERY,
  PERMISSIONS_QUERY,
  CREATE_ROLE_MUTATION,
  UPDATE_ROLE_MUTATION,
  DELETE_ROLE_MUTATION,
  ASSIGN_PERMISSIONS_TO_ROLE_MUTATION,
  CREATE_PERMISSION_MUTATION,
  UPDATE_PERMISSION_MUTATION,
  DELETE_PERMISSION_MUTATION,
  ASSIGN_ROLE_TO_MEMBER_MUTATION,
  REMOVE_ROLE_FROM_MEMBER_MUTATION,
} from '@/graphql/documents';
import {
  ShieldCheck,
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';

export default function RoleSection() {
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId } = useAuthStore();

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Forms state
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);

  const [permResource, setPermResource] = useState('');
  const [permAction, setPermAction] = useState('');
  const [permDesc, setPermDesc] = useState('');

  const [assignMemberPubId, setAssignMemberPubId] = useState('');
  const [assignRolePubId, setAssignRolePubId] = useState('');

  // Queries
  const { data: permissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await graphqlRequest<{ permissions: any[] }>(PERMISSIONS_QUERY);
      return res.permissions;
    },
    enabled: !!accessToken,
  });

  const { data: orgRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['organizationRoles', selectedOrgPubId],
    queryFn: async () => {
      if (!selectedOrgPubId) return [];
      const res = await graphqlRequest<{ organizationRoles: any[] }>(ORGANIZATION_ROLES_QUERY, {
        organizationPubId: selectedOrgPubId,
      });
      return res.organizationRoles;
    },
    enabled: !!selectedOrgPubId && !!accessToken,
  });

  // Mutations
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createRole: any }>(CREATE_ROLE_MUTATION, {
        input: {
          name: roleName,
          description: roleDesc || undefined,
          organizationPubId: selectedOrgPubId,
          permissionPubIds: selectedPerms.length > 0 ? selectedPerms : undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: `Created role ${data.createRole.name}` });
      setRoleName('');
      setRoleDesc('');
      setSelectedPerms([]);
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (pubId: string) => {
      return graphqlRequest<{ deleteRole: any }>(DELETE_ROLE_MUTATION, { pubId });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.deleteRole.message });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const createPermMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createPermission: any }>(CREATE_PERMISSION_MUTATION, {
        input: {
          resource: permResource,
          action: permAction,
          description: permDesc || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({
        type: 'success',
        text: `Created permission ${data.createPermission.resource}:${data.createPermission.action}`,
      });
      setPermResource('');
      setPermAction('');
      setPermDesc('');
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const deletePermMutation = useMutation({
    mutationFn: async (pubId: string) => {
      return graphqlRequest<{ deletePermission: any }>(DELETE_PERMISSION_MUTATION, { pubId });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.deletePermission.message });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const assignRoleToMemberMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ assignRoleToMember: any }>(ASSIGN_ROLE_TO_MEMBER_MUTATION, {
        input: {
          organizationPubId: selectedOrgPubId,
          memberPubId: assignMemberPubId,
          rolePubId: assignRolePubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.assignRoleToMember.message });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const removeRoleFromMemberMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ removeRoleFromMember: any }>(REMOVE_ROLE_FROM_MEMBER_MUTATION, {
        input: {
          organizationPubId: selectedOrgPubId,
          memberPubId: assignMemberPubId,
          rolePubId: assignRolePubId,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: data.removeRoleFromMember.message });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  if (!accessToken) {
    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-xs font-mono">
        Please login under Auth section to access Roles & Permissions endpoints.
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

      {/* Permissions Section */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              System Permissions ({permissions.length})
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 overflow-x-auto rounded-lg border border-slate-200">
            {permsLoading ? (
              <p className="p-3 text-xs font-mono text-slate-500">Loading permissions...</p>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5 border-r border-slate-200">Resource</th>
                    <th className="p-2.5 border-r border-slate-200">Action</th>
                    <th className="p-2.5 border-r border-slate-200">Description</th>
                    <th className="p-2.5 border-r border-slate-200">PubId</th>
                    <th className="p-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {permissions.map((p: any) => (
                    <tr key={p.pubId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 border-r border-slate-200 font-bold text-slate-800">{p.resource}</td>
                      <td className="p-2.5 border-r border-slate-200 font-semibold text-indigo-700">{p.action}</td>
                      <td className="p-2.5 border-r border-slate-200 text-slate-600 font-sans">{p.description || '-'}</td>
                      <td className="p-2.5 border-r border-slate-200 text-[10px] text-slate-400">{p.pubId}</td>
                      <td className="p-2.5 font-sans">
                        <button
                          onClick={() => deletePermMutation.mutate(p.pubId)}
                          className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded text-[11px] font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Create Permission Form */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 h-fit">
            <h4 className="font-semibold text-xs text-slate-900 mb-3 pb-2 border-b border-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Create System Permission
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPermMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resource *</label>
                <input
                  type="text"
                  required
                  value={permResource}
                  onChange={(e) => setPermResource(e.target.value)}
                  placeholder="project, billing, team"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Action *</label>
                <input
                  type="text"
                  required
                  value={permAction}
                  onChange={(e) => setPermAction(e.target.value)}
                  placeholder="create, read, update, delete"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={permDesc}
                  onChange={(e) => setPermDesc(e.target.value)}
                  placeholder="Allows managing projects"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={createPermMutation.isPending}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm"
              >
                {createPermMutation.isPending ? 'Creating...' : 'Create Permission'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Organization Roles List & Form */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-900">
              Organization Custom Roles ({orgRoles.length})
            </h3>
          </div>
        </div>

        {!selectedOrgPubId && (
          <p className="text-xs font-mono text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            Please select an organization in the Organization section to manage custom roles.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roles Grid */}
          <div>
            {rolesLoading ? (
              <p className="text-xs font-mono text-slate-500">Loading roles...</p>
            ) : orgRoles.length === 0 ? (
              <p className="text-xs font-mono text-slate-500">No custom roles created for this organization yet.</p>
            ) : (
              <div className="space-y-3">
                {orgRoles.map((r: any) => (
                  <div key={r.pubId} className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 shadow-sm text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-900">{r.name}</span>
                      <button
                        onClick={() => deleteRoleMutation.mutate(r.pubId)}
                        className="text-rose-600 hover:text-rose-700 hover:underline font-mono text-[11px]"
                      >
                        Delete Role
                      </button>
                    </div>
                    <p className="text-slate-400 font-mono text-[10px]">pubId: {r.pubId}</p>
                    {r.description && <p className="text-slate-600 mt-1">{r.description}</p>}

                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        Permissions ({r.permissions?.length || 0}):
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.permissions?.map((p: any) => (
                          <span
                            key={p.pubId}
                            className="bg-white border border-slate-300 px-2 py-0.5 rounded-md text-[10px] font-mono text-indigo-700 shadow-2xs"
                          >
                            {p.resource}:{p.action}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Role Form */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            <h4 className="font-semibold text-xs text-slate-900 mb-3 pb-2 border-b border-slate-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              Create Organization Role
            </h4>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Project Lead, Support Manager"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder="Lead role for managing active engineering projects"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Initial Permissions</label>
                <div className="max-h-36 overflow-y-auto border border-slate-300 rounded-md p-2.5 bg-white space-y-1.5 text-xs font-mono">
                  {permissions.map((p: any) => (
                    <label key={p.pubId} className="flex items-center gap-2 text-[11px] cursor-pointer hover:text-indigo-700">
                      <input
                        type="checkbox"
                        checked={selectedPerms.includes(p.pubId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPerms([...selectedPerms, p.pubId]);
                          } else {
                            setSelectedPerms(selectedPerms.filter((id) => id !== p.pubId));
                          }
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        {p.resource}:{p.action}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={createRoleMutation.isPending || !selectedOrgPubId}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                {createRoleMutation.isPending ? 'Creating Role...' : 'Create Role'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Member Custom Role Assignment */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-sm text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          Assign Custom Role to Member
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            assignRoleToMemberMutation.mutate();
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Member PubId *</label>
            <input
              type="text"
              required
              value={assignMemberPubId}
              onChange={(e) => setAssignMemberPubId(e.target.value)}
              placeholder="org_member_pub_id"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Custom Role PubId *</label>
            <input
              type="text"
              required
              value={assignRolePubId}
              onChange={(e) => setAssignRolePubId(e.target.value)}
              placeholder="role_pub_id"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={assignRoleToMemberMutation.isPending || !selectedOrgPubId}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              Assign Role
            </button>

            <button
              type="button"
              onClick={() => removeRoleFromMemberMutation.mutate()}
              disabled={removeRoleFromMemberMutation.isPending || !selectedOrgPubId}
              className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              Remove Role
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
