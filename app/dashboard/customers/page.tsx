'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Building2, Search, Plus, Mail, Shield, CheckCircle2 } from 'lucide-react';

interface CustomerItem {
  id: string;
  name: string;
  company: string;
  email: string;
  plan: string;
  joined: string;
  status: 'ACTIVE' | 'CHURN_RISK' | 'EXPANDING';
}

const CUSTOMERS: CustomerItem[] = [
  { id: 'c_1', name: 'Marcus Vance', company: 'Acme Corp', email: 'marcus@acme.com', plan: 'Business Pro', joined: 'Jan 2026', status: 'ACTIVE' },
  { id: 'c_2', name: 'Sarah Jenkins', company: 'Vanguard Systems', email: 'sarah@vanguard.io', plan: 'Enterprise Unlimited', joined: 'Feb 2026', status: 'EXPANDING' },
  { id: 'c_3', name: 'David Zhang', company: 'CloudScale Inc', email: 'david@cloudscale.net', plan: 'Developer Pro', joined: 'Mar 2026', status: 'CHURN_RISK' },
];

export default function CustomersPage() {
  const params = useParams();
  const orgSlug = (params?.organizationSlug as string) || 'acme';
  const [search, setSearch] = useState('');

  const filtered = CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Customer CRM & Accounts</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {filtered.length} Accounts
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Customer accounts, health scores, and subscription plans for <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
            <tr>
              <th className="p-3">Customer</th>
              <th className="p-3">Company</th>
              <th className="p-3">Email</th>
              <th className="p-3">SaaS Plan</th>
              <th className="p-3">Account Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/60 transition-colors">
                <td className="p-3 font-semibold text-slate-100 font-sans">{c.name}</td>
                <td className="p-3 text-slate-300 font-sans">{c.company}</td>
                <td className="p-3 text-slate-400">{c.email}</td>
                <td className="p-3 font-bold text-indigo-400">{c.plan}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
