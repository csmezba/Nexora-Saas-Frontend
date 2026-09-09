'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { SlidersHorizontal, Check, Plug } from 'lucide-react';

const INTEGRATIONS = [
  { id: 'int_1', name: 'GitHub Sync', desc: 'Sync PRs, commit references, and issue status.', connected: true },
  { id: 'int_2', name: 'Slack Notifications', desc: 'Realtime task assignments and ticket alerts.', connected: true },
  { id: 'int_3', name: 'Stripe Billing API', desc: 'Multi-tenant subscription webhook processing.', connected: true },
  { id: 'int_4', name: 'Okta SAML 2.0', desc: 'Single sign-on enterprise authentication.', connected: false },
];

export default function IntegrationsPage() {
  const params = useParams();
  const orgSlug = (params?.organizationSlug as string) || 'acme';

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Integrations Marketplace</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                4 Available
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Connect external dev tools, webhooks, and communication bots to <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((i) => (
          <div key={i.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-100">{i.name}</h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  i.connected
                    ? 'bg-emerald-950 border-emerald-800 text-emerald-300 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {i.connected ? 'Connected' : 'Not Configured'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans">{i.desc}</p>
            <button
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                i.connected
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {i.connected ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
