'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { MY_ORGANIZATIONS_QUERY } from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import CreateOrganizationModal from '@/components/organization/CreateOrganizationModal';
import { Building2, ChevronDown, Plus, Check, Layers } from 'lucide-react';

export default function TenantSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { accessToken, selectedOrgPubId, selectedOrgSlug, setSelectedOrg } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Auto-select first organization if none currently selected
  useEffect(() => {
    if (myOrgs.length > 0 && (!selectedOrgPubId || !myOrgs.some((o: any) => o.pubId === selectedOrgPubId))) {
      setSelectedOrg(myOrgs[0].pubId, myOrgs[0].slug);
    }
  }, [myOrgs, selectedOrgPubId, setSelectedOrg]);

  const activeOrg = myOrgs.find((o: any) =>
    (selectedOrgPubId && o.pubId === selectedOrgPubId) ||
    (selectedOrgSlug && o.slug === selectedOrgSlug)
  ) || myOrgs[0] || {
    name: 'Acme Corporation',
    slug: 'acme',
    currentUserRole: 'OWNER',
  };

  const handleSelectOrg = (org: any) => {
    setSelectedOrg(org.pubId, org.slug);
    setOpen(false);
    queryClient.invalidateQueries();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 hover:border-slate-600 border border-slate-700 text-slate-100 cursor-pointer transition-all duration-200 active:scale-[0.99] font-sans text-xs shadow-sm"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-indigo-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105">
            {activeOrg.name.charAt(0).toUpperCase()}
          </div>
          <div className="text-left overflow-hidden">
            <p className="font-semibold text-xs text-slate-100 truncate">{activeOrg.name}</p>
            <p className="text-[10px] font-mono text-slate-400 truncate">/{activeOrg.slug}</p>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 font-sans animate-in fade-in duration-150">
          <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
            Switch Organization
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {myOrgs.length > 0 ? (
              myOrgs.map((org: any) => {
                const isSelected = org.pubId === activeOrg.pubId || org.slug === activeOrg.slug;
                return (
                  <button
                    key={org.pubId || org.slug}
                    onClick={() => handleSelectOrg(org)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium cursor-pointer transition-all duration-150 hover:translate-x-0.5 ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/20'
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
                className="w-full text-left p-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer transition-all duration-150"
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
              className="w-full flex items-center gap-2 p-2 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-950/40 hover:text-indigo-300 cursor-pointer transition-all duration-150 active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Organization</span>
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
