'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Zap,
  CheckCircle2,
  Ticket,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { selectedOrgSlug } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'workspace';
  const [dateRange, setDateRange] = useState('30d');

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>Analytics & Workspace Insights</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Realtime Data
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Performance metrics, velocity, support SLA, and AI token consumption for <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            {['7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  dateRange === r
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors">
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Sprint Velocity</span>
          <p className="text-2xl font-bold text-slate-100">42 pts / wk</p>
          <p className="text-[11px] text-emerald-400 font-sans flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14% from last sprint
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Ticket Resolution SLA</span>
          <p className="text-2xl font-bold text-indigo-400">1.4 hours</p>
          <p className="text-[11px] text-emerald-400 font-sans flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 98.2% within SLA target
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">AI Token Utilization</span>
          <p className="text-2xl font-bold text-amber-400">142,850</p>
          <p className="text-[11px] text-slate-400 font-sans">28.5% of monthly quota</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Active Workspace Users</span>
          <p className="text-2xl font-bold text-emerald-400">18 users</p>
          <p className="text-[11px] text-slate-400 font-sans">Across 4 departments</p>
        </div>
      </div>

      {/* Visual Chart Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
        {/* Chart 1: Task Completion Velocity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Tasks Created vs Completed</h3>
              <p className="text-xs text-slate-400">Weekly task throughput across projects</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 font-bold">+18% Output</span>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-48 flex items-end justify-between gap-3 pt-4 border-b border-slate-800 pb-2">
            {[
              { label: 'W1', created: 60, completed: 85 },
              { label: 'W2', created: 75, completed: 90 },
              { label: 'W3', created: 50, completed: 70 },
              { label: 'W4', created: 90, completed: 95 },
              { label: 'W5', created: 80, completed: 100 },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="w-full flex justify-center items-end gap-1 h-36">
                  <div
                    className="w-3.5 bg-slate-700 rounded-t-sm transition-all"
                    style={{ height: `${bar.created}%` }}
                    title={`Created: ${bar.created}`}
                  ></div>
                  <div
                    className="w-3.5 bg-indigo-500 rounded-t-sm transition-all"
                    style={{ height: `${bar.completed}%` }}
                    title={`Completed: ${bar.completed}`}
                  ></div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{bar.label}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 bg-slate-700 rounded-sm"></span> Created Tasks
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> Completed Tasks
            </span>
          </div>
        </div>

        {/* Chart 2: AI Token Utilization */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                AI Assistant Token Consumption
              </h3>
              <p className="text-xs text-slate-400">Daily tokens used by AI Workspace & Support</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-bold">142.8k / 500k</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-4 border-b border-slate-800 pb-2">
            {[35, 45, 60, 50, 75, 90, 80, 65, 70, 85].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div
                  className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-sm transition-all"
                  style={{ height: `${val}%` }}
                ></div>
                <span className="text-[9px] font-mono text-slate-500">{i + 1}d</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-400">
            <span>Average: 14.2k tokens / day</span>
            <span className="text-emerald-400">Within Budget</span>
          </div>
        </div>
      </div>
    </div>
  );
}
