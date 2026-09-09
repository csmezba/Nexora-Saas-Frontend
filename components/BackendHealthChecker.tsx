'use client';

import React, { useEffect, useState } from 'react';
import { checkBackendConnection, getBackendUrl } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import { Activity, Server, RefreshCw, CheckCircle2, AlertTriangle, Settings2 } from 'lucide-react';

export default function BackendHealthChecker() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [message, setMessage] = useState<string>('Checking backend connection...');
  const { backendUrl, setBackendUrl } = useAuthStore();
  const [inputUrl, setInputUrl] = useState<string>(backendUrl);
  const [showSettings, setShowSettings] = useState(false);

  const runCheck = async () => {
    setStatus('checking');
    setMessage('Connecting to GraphQL endpoint...');
    const result = await checkBackendConnection();
    if (result.ok) {
      setStatus('connected');
      setMessage(`Connected to NestJS GraphQL Backend`);
    } else {
      setStatus('error');
      setMessage(`Disconnected: ${result.message}`);
    }
  };

  useEffect(() => {
    runCheck();
  }, [backendUrl]);

  const handleUpdateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setBackendUrl(inputUrl);
    setShowSettings(false);
  };

  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
            <span className="relative flex h-2 w-2">
              {status === 'connected' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : status === 'error' ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              ) : (
                <span className="animate-pulse relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
              )}
            </span>
            <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-300">
              {status === 'connected' && 'Backend Connected'}
              {status === 'error' && 'Backend Offline / Error'}
              {status === 'checking' && 'Connecting...'}
            </span>
          </div>

          <span className="text-slate-400 hidden sm:inline-block font-mono text-[11px]">
            {getBackendUrl()}
          </span>
        </div>

        {/* Diagnostic Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all font-medium border border-slate-700 text-[11px]"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Endpoint Config</span>
          </button>

          <button
            onClick={runCheck}
            disabled={status === 'checking'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-medium text-[11px] disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
            <span>Re-check</span>
          </button>
        </div>
      </div>

      {/* Endpoint Settings Drawer */}
      {showSettings && (
        <div className="max-w-7xl mx-auto mt-3 p-3 bg-slate-800/90 border border-slate-700 rounded-lg shadow-xl">
          <form onSubmit={handleUpdateUrl} className="flex flex-wrap items-center gap-3">
            <Server className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-slate-200">GraphQL Server URL:</span>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://localhost:8000/graphql"
              className="flex-1 min-w-[280px] px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs transition-colors"
            >
              Save Endpoint
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
