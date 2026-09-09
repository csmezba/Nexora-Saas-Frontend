'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Download,
} from 'lucide-react';

export default function BillingPage() {
  const params = useParams();
  const orgSlug = (params?.organizationSlug as string) || 'acme';

  const plans = [
    {
      name: 'Free Starter',
      price: '$0',
      period: 'forever',
      features: ['Up to 3 team members', '2 active projects', '1,000 AI tokens / mo', 'Community support'],
      active: false,
    },
    {
      name: 'Business Pro',
      price: '$49',
      period: 'per month',
      features: [
        'Unlimited projects & tasks',
        '25 team member seats',
        '500,000 AI tokens / mo',
        '3-column Support Inbox & Tickets',
        'Priority SAML SSO',
      ],
      active: true,
    },
    {
      name: 'Enterprise Unlimited',
      price: '$199',
      period: 'per month',
      features: [
        'Dedicated isolated database',
        'Unlimited seats & AI tokens',
        'Custom GraphQL webhooks',
        'Dedicated SLA & support manager',
      ],
      active: false,
    },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Billing & Subscription Plans</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                Business Pro Tier Active
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Manage subscription tiers, usage quotas, and payment methods for <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Usage Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Team Member Seats</span>
          <p className="text-xl font-bold text-slate-100">12 / 25 seats</p>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-indigo-500 w-[48%] rounded-full"></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">AI Tokens Quota</span>
          <p className="text-xl font-bold text-amber-400">142.8k / 500k</p>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-amber-500 w-[28%] rounded-full"></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Active Projects</span>
          <p className="text-xl font-bold text-emerald-400">8 / Unlimited</p>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-emerald-500 w-[15%] rounded-full"></div>
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Storage Quota</span>
          <p className="text-xl font-bold text-indigo-300">4.2 GB / 50 GB</p>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-indigo-400 w-[8%] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Plan Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 transition-all ${
              p.active
                ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border-indigo-500/60 shadow-xl ring-1 ring-indigo-500/50'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-base text-slate-100">{p.name}</h3>
                {p.active && (
                  <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono text-[10px] font-bold rounded-full">
                    Current Plan
                  </span>
                )}
              </div>

              <div>
                <span className="text-3xl font-extrabold text-slate-100 font-mono">{p.price}</span>
                <span className="text-xs text-slate-400 font-mono"> /{p.period}</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                {p.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-sm ${
                p.active
                  ? 'bg-slate-800 text-slate-300 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {p.active ? 'Active Plan' : 'Upgrade Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
