'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { REGISTER_MUTATION, CREATE_ORGANIZATION_MUTATION } from '@/graphql/documents';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Layers,
  UserPlus,
  Mail,
  Lock,
  Building2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, setSelectedOrg } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: async () => {
      // 1. Register user
      const authRes = await graphqlRequest<{ register: any }>(REGISTER_MUTATION, {
        input: {
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        },
      });

      const auth = authRes.register;
      setAuth({
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        user: auth.user,
      });

      // 2. Create organization if specified
      if (orgName.trim()) {
        const slug = orgSlug || orgName.toLowerCase().replace(/\s+/g, '-');
        const orgRes = await graphqlRequest<{ createOrganization: any }>(
          CREATE_ORGANIZATION_MUTATION,
          {
            input: { name: orgName, slug },
          }
        );
        const org = orgRes.createOrganization;
        setSelectedOrg(org.pubId, org.slug);
        return org.slug;
      }
      return 'acme';
    },
    onSuccess: (targetSlug) => {
      queryClient.invalidateQueries();
      router.push(`/${targetSlug}/dashboard`);
    },
    onError: (err: any) => {
      setErrorMsg(err.message);
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center mx-auto shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Create your Nexora Workspace</h2>
          <p className="text-xs text-slate-400">
            Register your account and initialize your organization.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerMutation.mutate();
          }}
          className="space-y-3.5 text-xs font-sans"
        >
          <div>
            <label className="block font-medium text-slate-300 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lead@organization.com"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Password * (min 6)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 space-y-3">
            <div>
              <label className="block font-medium text-indigo-300 mb-1">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                placeholder="Acme Corporation"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1">Workspace URL Slug</label>
              <input
                type="text"
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                placeholder="acme-corp"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span>{registerMutation.isPending ? 'Registering Workspace...' : 'Create Account & Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
