'use client';

import React from 'react';
import Link from 'next/link';
import {
  Layers,
  Sparkles,
  FolderKanban,
  CheckSquare,
  Inbox,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-100">Nexora</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#features" className="hover:text-slate-100 transition-colors">
              Features
            </a>
            <a href="#solutions" className="hover:text-slate-100 transition-colors">
              Solutions
            </a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">
              Pricing
            </a>
            <a href="#ai" className="hover:text-slate-100 transition-colors">
              AI Assistant
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Start for free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 text-center max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-mono font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Next-Gen AI Multi-Tenant SaaS Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
          One intelligent workspace for your entire organization.
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Combine project management, customer support inbox, knowledge base, and grounded AI assistant into a unified enterprise platform.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-xl flex items-center gap-2"
          >
            <span>Start for free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/acme/dashboard"
            className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-semibold rounded-xl transition-all"
          >
            Explore live demo (/acme/dashboard)
          </Link>
        </div>

        {/* Dashboard Preview Banner */}
        <div className="pt-10">
          <div className="p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800/80 text-left font-mono text-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-indigo-400 font-bold">/acme/dashboard &bull; Multi-Tenant Workspace</span>
                <span className="text-emerald-400">● Live Connected</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500">PROJECTS</span>
                  <p className="font-bold text-slate-200">8 Active Projects</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500">SUPPORT INBOX</span>
                  <p className="font-bold text-slate-200">3-Column Inbox</p>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-500">AI WORKSPACE</span>
                  <p className="font-bold text-amber-400">142.8k Tokens Used</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview Features */}
      <section id="features" className="py-20 border-t border-slate-800/80 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Engineered for high-performing tech teams.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything your team needs to plan sprints, answer customers, and automate documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Kanban & Task Sprints</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag-and-drop task boards with priority tagging, subtask assignment, and side panel drawer contextual editor.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Enterprise Support Inbox</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              3-column customer conversation view with unread tags, ticket escalation, and AI-suggested responses.
            </p>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-100">Grounded AI Assistant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated AI workspace with prompt chips, streaming responses, citations, and risk summaries.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-slate-800/80 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
            Simple, transparent SaaS pricing.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Choose the plan that fits your organization scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="font-bold text-base">Free Starter</h3>
            <p className="text-3xl font-extrabold font-mono">$0</p>
            <p className="text-xs text-slate-400">Ideal for small projects and prototypes.</p>
            <Link
              href="/register"
              className="block w-full text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Get Started
            </Link>
          </div>

          <div className="p-6 bg-gradient-to-b from-indigo-950/60 to-slate-900 border border-indigo-500/60 rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-100">Business Pro</h3>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-600 text-white font-mono rounded-full font-bold">
                POPULAR
              </span>
            </div>
            <p className="text-3xl font-extrabold font-mono">$49</p>
            <p className="text-xs text-slate-400">Everything needed for scaling organizations.</p>
            <Link
              href="/register"
              className="block w-full text-center py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="font-bold text-base">Enterprise</h3>
            <p className="text-3xl font-extrabold font-mono">$199</p>
            <p className="text-xs text-slate-400">Dedicated isolated tenant backend & custom SLA.</p>
            <Link
              href="/register"
              className="block w-full text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 text-xs text-slate-500 font-mono text-center space-y-2">
        <p>&copy; 2026 Nexora Multi-Tenant SaaS Platform &bull; Connected to NestJS GraphQL Backend</p>
      </footer>
    </div>
  );
}
