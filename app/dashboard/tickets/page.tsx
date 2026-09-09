'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Ticket, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const TICKETS = [
  { id: 'TCK-101', subject: 'SAML SSO integration failing with Okta', customer: 'Acme Corp', priority: 'HIGH', status: 'OPEN', date: 'Sep 08' },
  { id: 'TCK-102', subject: 'AI token quota expansion request', customer: 'Vanguard Systems', priority: 'MEDIUM', status: 'IN_PROGRESS', date: 'Sep 07' },
  { id: 'TCK-103', subject: 'Webhook delivery failure on task_updated', customer: 'CloudScale Inc', priority: 'URGENT', status: 'RESOLVED', date: 'Sep 06' },
];

export default function TicketsPage() {
  const { selectedOrgSlug } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'acme';

  return (
    <div className="space-y-6 font-sans text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Support Ticket Resolution</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {TICKETS.length} Tickets
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Escalated tickets and customer issue tracking for <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px]">
            <tr>
              <th className="p-3">Ticket ID</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {TICKETS.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/60 transition-colors">
                <td className="p-3 font-bold text-indigo-400">{t.id}</td>
                <td className="p-3 font-semibold text-slate-100 font-sans">{t.subject}</td>
                <td className="p-3 text-slate-300 font-sans">{t.customer}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px]">
                    {t.priority}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    {t.status}
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
