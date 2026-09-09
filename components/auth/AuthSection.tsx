'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ME_QUERY,
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  REFRESH_TOKEN_MUTATION,
  LOGOUT_MUTATION,
} from '@/graphql/documents';
import {
  User,
  Mail,
  Lock,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function AuthSection() {
  const queryClient = useQueryClient();
  const { accessToken, refreshToken, user, setAuth, logout } = useAuthStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');

  const [customRefresh, setCustomRefresh] = useState(refreshToken || '');
  const [showTokens, setShowTokens] = useState(false);

  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Query: Current logged in user profile
  const {
    data: meData,
    isLoading: meLoading,
    refetch: refetchMe,
  } = useQuery({
    queryKey: ['me', accessToken],
    queryFn: async () => {
      if (!accessToken) return null;
      const res = await graphqlRequest<{ me: any }>(ME_QUERY);
      return res.me;
    },
    enabled: !!accessToken,
  });

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ login: any }>(LOGIN_MUTATION, {
        input: { email: loginEmail, password: loginPassword },
      });
    },
    onSuccess: (data) => {
      const auth = data.login;
      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
      });
      setCustomRefresh(auth.refreshToken);
      setStatusMsg({ type: 'success', text: `Authenticated successfully as ${auth.user.email}` });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message });
    },
  });

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ register: any }>(REGISTER_MUTATION, {
        input: {
          email: regEmail,
          password: regPassword,
          firstName: regFirstName || undefined,
          lastName: regLastName || undefined,
        },
      });
    },
    onSuccess: (data) => {
      const auth = data.register;
      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
      });
      setCustomRefresh(auth.refreshToken);
      setStatusMsg({ type: 'success', text: `Registered & logged in as ${auth.user.email}` });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message });
    },
  });

  // Refresh Token Mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ refreshToken: any }>(REFRESH_TOKEN_MUTATION, {
        input: { refreshToken: customRefresh || refreshToken || '' },
      });
    },
    onSuccess: (data) => {
      const auth = data.refreshToken;
      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
      });
      setCustomRefresh(auth.refreshToken);
      setStatusMsg({ type: 'success', text: 'Access token refreshed successfully!' });
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err.message });
    },
  });

  // Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return graphqlRequest<{ logout: any }>(LOGOUT_MUTATION);
    },
    onSuccess: () => {
      logout();
      setStatusMsg({ type: 'success', text: 'Logged out successfully' });
      queryClient.clear();
    },
    onError: (err: any) => {
      logout();
      setStatusMsg({ type: 'error', text: `Logout notice: ${err.message}` });
    },
  });

  const currentUser = meData || user;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-lg border text-xs font-medium flex items-center justify-between shadow-sm transition-all ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-[11px] font-semibold opacity-70 hover:opacity-100 px-2 py-0.5 rounded bg-black/5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active User Profile Status */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-slate-900">1. Current Authenticated Profile</h3>
          </div>
          {accessToken && (
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              JWT Active
            </span>
          )}
        </div>

        {accessToken ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                  {currentUser?.fullName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {currentUser?.fullName || 'Authenticated User'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser?.email}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
                <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">User Identifier</p>
                <p className="font-semibold text-slate-800 truncate">{currentUser?.pubId || 'Fetching...'}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono flex items-center justify-between">
                <div>
                  <p className="text-slate-400 uppercase text-[10px] font-bold tracking-wider mb-1">Tokens Status</p>
                  <p className="text-emerald-700 font-semibold">Access & Refresh Active</p>
                </div>
                <button
                  onClick={() => setShowTokens(!showTokens)}
                  className="p-1.5 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                  title="Toggle token visibility"
                >
                  {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {showTokens && (
              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] space-y-2 border border-slate-800">
                <div>
                  <span className="text-indigo-400 font-bold">Access Token: </span>
                  <span className="break-all">{accessToken}</span>
                </div>
                {refreshToken && (
                  <div>
                    <span className="text-emerald-400 font-bold">Refresh Token: </span>
                    <span className="break-all">{refreshToken}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => refetchMe()}
                disabled={meLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs rounded-md font-medium transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${meLoading ? 'animate-spin' : ''}`} />
                <span>{meLoading ? 'Querying...' : 'Refetch me() Query'}</span>
              </button>

              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-md font-medium transition-colors shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{logoutMutation.isPending ? 'Logging out...' : 'Logout Session'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs font-mono flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>No JWT session found. Register a new user or login below to authenticate backend calls.</span>
          </div>
        )}
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-sm text-slate-900">User Login</h4>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loginMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                {loginMutation.isPending ? 'Authenticating...' : 'Authenticate'}
              </button>
            </form>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h4 className="font-semibold text-sm text-slate-900">Create Account</h4>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="newuser@example.com"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password * (min 6)</label>
              <input
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
            >
              {registerMutation.isPending ? 'Registering...' : 'Register New User'}
            </button>
          </form>
        </div>

        {/* Refresh Token Card */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <RefreshCw className="w-4 h-4 text-indigo-600" />
              <h4 className="font-semibold text-sm text-slate-900">Exchange Refresh Token</h4>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                refreshMutation.mutate();
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Refresh Token String</label>
                <textarea
                  rows={3}
                  required
                  value={customRefresh}
                  onChange={(e) => setCustomRefresh(e.target.value)}
                  placeholder="Paste JWT Refresh Token..."
                  className="w-full p-2.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={refreshMutation.isPending || !customRefresh}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm disabled:opacity-50"
              >
                {refreshMutation.isPending ? 'Refreshing...' : 'Refresh Access Token'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
