'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ORGANIZATION_QUERY,
  ORGANIZATION_MEMBERS_QUERY,
  ORGANIZATION_ROLES_QUERY,
  PERMISSIONS_QUERY,
  UPDATE_ORGANIZATION_MUTATION,
  DELETE_ORGANIZATION_MUTATION,
  MY_ORGANIZATIONS_QUERY,
} from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import RoleMatrixSection from '@/components/role/RoleMatrixSection';
import {
  Settings,
  Building2,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Trash2,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId, selectedOrgSlug, selectedOrgName, setSelectedOrg } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'roles' | 'permissions'>('general');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgDesc, setOrgDesc] = useState('');

  // Fallback organization resolution
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
  const activeOrgFallback =
    validOrgs.find(
      (o: any) =>
        (selectedOrgPubId && o.pubId === selectedOrgPubId) ||
        (selectedOrgSlug && o.slug === selectedOrgSlug)
    ) ||
    validOrgs[0] ||
    null;

  const targetOrgKey = selectedOrgPubId || selectedOrgSlug || activeOrgFallback?.pubId || '';
  const currentOrgSlug = selectedOrgSlug || activeOrgFallback?.slug || 'workspace';

  // Queries
  const { data: orgData } = useQuery({
    queryKey: ['organization', targetOrgKey],
    queryFn: async () => {
      if (!targetOrgKey) return null;
      const res = await graphqlRequest<{ organization: any }>(ORGANIZATION_QUERY, {
        pubIdOrSlug: targetOrgKey,
      });
      if (res.organization) {
        setOrgName(res.organization.name || '');
        setOrgDesc(res.organization.description || '');
      }
      return res.organization;
    },
    enabled: !!targetOrgKey && !!accessToken,
  });

  const effectivePubId = orgData?.pubId || selectedOrgPubId || activeOrgFallback?.pubId || '';

  const { data: members = [] } = useQuery({
    queryKey: ['organizationMembers', effectivePubId],
    queryFn: async () => {
      if (!effectivePubId) return [];
      const res = await graphqlRequest<{ organizationMembers: any[] }>(ORGANIZATION_MEMBERS_QUERY, {
        organizationPubId: effectivePubId,
      });
      return res.organizationMembers || [];
    },
    enabled: !!effectivePubId && !!accessToken,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ['organizationRoles', effectivePubId],
    queryFn: async () => {
      if (!effectivePubId) return [];
      const res = await graphqlRequest<{ organizationRoles: any[] }>(ORGANIZATION_ROLES_QUERY, {
        organizationPubId: effectivePubId,
      });
      return res.organizationRoles || [];
    },
    enabled: !!effectivePubId && !!accessToken,
  });

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await graphqlRequest<{ permissions: any[] }>(PERMISSIONS_QUERY);
      return res.permissions || [];
    },
    enabled: !!accessToken,
  });

  // Mutations
  const updateOrgMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ updateOrganization: any }>(UPDATE_ORGANIZATION_MUTATION, {
        pubId: effectivePubId,
        input: {
          name: orgName.trim() || undefined,
          description: orgDesc.trim() || undefined,
        },
      });
    },
    onSuccess: (data) => {
      setStatusMsg({ type: 'success', text: `Updated settings for ${data.updateOrganization.name}` });
      setSelectedOrg(data.updateOrganization.pubId, data.updateOrganization.slug, data.updateOrganization.name);
      queryClient.invalidateQueries({ queryKey: ['myOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['organization'] });
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ deleteOrganization: any }>(DELETE_ORGANIZATION_MUTATION, {
        pubId: effectivePubId,
      });
    },
    onSuccess: () => {
      setSelectedOrg(null, null, null);
      queryClient.invalidateQueries();
      router.push('/dashboard');
    },
    onError: (err: any) => setStatusMsg({ type: 'error', text: err.message }),
  });

  const isOwner = orgData?.currentUserRole === 'OWNER';

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Organization Settings & Identity</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                {orgData?.currentUserRole || 'MEMBER'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage configuration, profile, and security permissions for <span className="text-slate-200">/{currentOrgSlug}</span>
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-medium flex items-center justify-between shadow-sm ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
              : 'bg-rose-950 border-rose-800 text-rose-300'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="text-xs font-bold px-2 py-0.5">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'general', label: 'General Info', icon: Building2 },
          { id: 'members', label: `Members (${members.length})`, icon: Users },
          { id: 'roles', label: `Roles (${roles.length})`, icon: ShieldCheck },
          { id: 'permissions', label: `Permissions (${permissions.length})`, icon: Lock },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4 max-w-2xl">
          <h3 className="font-bold text-sm text-slate-100 pb-2 border-b border-slate-800">
            Organization Identity
          </h3>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateOrgMutation.mutate();
            }}
            className="space-y-4 text-xs font-sans"
          >
            <div>
              <label className="block font-medium text-slate-300 mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Workspace URL Slug</label>
              <input
                type="text"
                disabled
                value={currentOrgSlug}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-slate-500 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={orgDesc}
                onChange={(e) => setOrgDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={updateOrgMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{updateOrgMutation.isPending ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </form>

          {/* Danger Zone: Delete Organization */}
          {isOwner && (
            <div className="pt-6 mt-6 border-t border-rose-950/60 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                Danger Zone
              </h4>
              <div className="p-4 bg-rose-950/30 border border-rose-900/40 rounded-xl flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-xs text-rose-200">Delete Organization</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Permanently remove this organization and all associated projects and teams.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently delete this organization? This action cannot be undone.`)) {
                      deleteOrgMutation.mutate();
                    }
                  }}
                  disabled={deleteOrgMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-sm whitespace-nowrap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteOrgMutation.isPending ? 'Deleting...' : 'Delete Organization'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members Management Tab */}
      {activeTab === 'members' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300">Workspace Members ({members.length})</span>
            <Link
              href="/dashboard/members"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              <span>Manage & Invite Members</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950/60 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {members.map((m: any) => (
                <tr key={m.pubId} className="hover:bg-slate-800/60 transition-colors">
                  <td className="p-3 font-semibold text-slate-100 font-sans">{m.user?.fullName || 'N/A'}</td>
                  <td className="p-3 text-slate-300">{m.user?.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 font-bold border border-indigo-800 text-[10px]">
                      {m.role}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{new Date(m.joinedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <RoleMatrixSection organizationPubId={effectivePubId} />
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">Resource</th>
                <th className="p-3">Action</th>
                <th className="p-3">Description</th>
                <th className="p-3">Permission PubId</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {permissions.map((p: any) => (
                <tr key={p.pubId} className="hover:bg-slate-800/60 transition-colors">
                  <td className="p-3 font-bold text-slate-100">{p.resource}</td>
                  <td className="p-3 font-semibold text-indigo-400">{p.action}</td>
                  <td className="p-3 text-slate-300 font-sans">{p.description || '-'}</td>
                  <td className="p-3 text-slate-500 text-[10px]">{p.pubId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
