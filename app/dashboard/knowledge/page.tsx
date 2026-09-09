'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { BookOpen, FileText, Search, Plus, Sparkles } from 'lucide-react';

const DOCUMENTS = [
  { id: 'doc_1', title: 'GraphQL Authentication & JWT Strategy Guide', category: 'Engineering', updated: '2h ago' },
  { id: 'doc_2', title: 'Multi-Tenant Security & Tenant Isolation Policy', category: 'Security', updated: 'Yesterday' },
  { id: 'doc_3', title: 'SAML SSO Integration Playbook (Okta & Azure AD)', category: 'Support', updated: '3 days ago' },
];

export default function KnowledgePage() {
  const { selectedOrgSlug } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'workspace';

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Knowledge Base & Docs</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {DOCUMENTS.length} Documents
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Centralized organization documentation and AI grounding sources in <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Document</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DOCUMENTS.map((d) => (
          <div key={d.id} className="p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span className="text-[10px] font-mono text-slate-500 uppercase">{d.category}</span>
            </div>
            <h3 className="font-bold text-sm text-slate-100 leading-snug">{d.title}</h3>
            <p className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800">Updated {d.updated}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
