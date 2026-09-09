'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { PERMISSIONS_QUERY } from '@/graphql/documents';
import { Lock, Search, Shield, KeyRound, Loader2 } from 'lucide-react';

export default function PermissionsCatalogSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<string>('ALL');

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await graphqlRequest<{ permissions: any[] }>(PERMISSIONS_QUERY);
      return res.permissions || [];
    },
  });

  const resources = ['ALL', ...Array.from(new Set(permissions.map((p: any) => p.resource || 'general')))];

  const filtered = permissions.filter((p: any) => {
    const matchesSearch =
      p.resource?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesResource = selectedResource === 'ALL' || (p.resource || 'general') === selectedResource;
    return matchesSearch && matchesResource;
  });

  return (
    <div className="space-y-6">
      {/* Search & Resource Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions by resource, action, or description..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto pb-1 max-w-full">
          {resources.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedResource(r)}
              className={`px-3 py-1.5 rounded-lg border cursor-pointer transition-all duration-200 active:scale-95 whitespace-nowrap text-[11px] ${
                selectedResource === r
                  ? 'bg-indigo-600 text-white font-bold border-indigo-500 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Table */}
      {isLoading ? (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center gap-2 text-slate-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Loading permissions catalog...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-dashed border-slate-800 rounded-xl space-y-2">
          <Lock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No permissions match your search criteria.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
              <tr>
                <th className="p-3">Resource</th>
                <th className="p-3">Action</th>
                <th className="p-3">Description</th>
                <th className="p-3">Permission Identifier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filtered.map((p: any) => (
                <tr key={p.pubId} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 font-bold text-indigo-300 font-mono text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60">
                      {p.resource}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-emerald-400">{p.action}</td>
                  <td className="p-3 text-slate-300 font-sans text-xs">
                    {p.description || `Permission to ${p.action} on ${p.resource}`}
                  </td>
                  <td className="p-3 text-slate-500 text-[10px] select-all">{p.pubId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
