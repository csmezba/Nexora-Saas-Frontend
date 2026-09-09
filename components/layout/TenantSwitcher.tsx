'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { MY_ORGANIZATIONS_QUERY, CREATE_ORGANIZATION_MUTATION } from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import { Building2, ChevronDown, Plus, Check, Layers } from 'lucide-react';

export default function TenantSwitcher() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();

  const currentSlug = (params?.organizationSlug as string) || 'acme';
  const { accessToken, setSelectedOrg } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgSlug, setNewOrgSlug] = useState('');

  // Fetch real user's organizations from GraphQL backend
  const { data: myOrgs = [] } = useQuery({
    queryKey: ['myOrganizations', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await graphqlRequest<{ myOrganizations: any[] }>(MY_ORGANIZATIONS_QUERY);
      return res.myOrganizations;
    },
    enabled: !!accessToken,
  });

  const activeOrg = myOrgs.find((o) => o.slug === currentSlug) || {
    name: currentSlug === 'acme' ? 'Acme Corporation' : currentSlug,
    slug: currentSlug,
    currentUserRole: 'OWNER',
  };

  const createOrgMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ createOrganization: any }>(CREATE_ORGANIZATION_MUTATION, {
        input: {
          name: newOrgName,
          slug: newOrgSlug,
        },
      });
    },
    onSuccess: (data) => {
      const created = data.createOrganization;
      setSelectedOrg(created.pubId, created.slug);
      queryClient.invalidateQueries();
      setShowCreateModal(false);
      setNewOrgName('');
      setNewOrgSlug('');
      router.push(`/${created.slug}/dashboard`);
    },
  });

  const handleSelectOrg = (org: any) => {
    setSelectedOrg(org.pubId, org.slug);
    setOpen(false);
    router.push(`/${org.slug}/dashboard`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-100 transition-all font-sans text-xs"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
            {activeOrg.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left overflow-hidden">
            <p className="font-semibold text-xs text-slate-100 truncate">{activeOrg.name}</p>
            <p className="text-[10px] font-mono text-slate-400 truncate">/{activeOrg.slug}</p>
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-1.5 font-sans animate-in fade-in duration-100">
          <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
            Switch Organization
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {myOrgs.length > 0 ? (
              myOrgs.map((org: any) => {
                const isSelected = org.slug === currentSlug;
                return (
                  <button
                    key={org.pubId || org.slug}
                    onClick={() => handleSelectOrg(org)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{org.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                );
              })
            ) : (
              <button
                onClick={() =>
                  handleSelectOrg({ name: 'Acme Corp', slug: 'acme', pubId: 'org_acme' })
                }
                className="w-full text-left p-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Acme Corporation (/acme)
              </button>
            )}
          </div>

          <div className="border-t border-slate-800 mt-1 pt-1">
            <button
              onClick={() => {
                setOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </button>
          </div>
        </div>
      )}

      {/* Create Org Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 text-slate-100 font-sans">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Create New Organization
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Add a new tenant workspace to your Nexora account.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOrgMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Nexora Labs"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Workspace URL Slug *</label>
                <input
                  type="text"
                  required
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="nexora-labs"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrgMutation.isPending}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {createOrgMutation.isPending ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
