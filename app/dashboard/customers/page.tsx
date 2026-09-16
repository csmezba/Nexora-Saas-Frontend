'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  CUSTOMERS_QUERY,
  MY_ORGANIZATIONS_QUERY,
  CREATE_CUSTOMER_MUTATION,
  UPDATE_CUSTOMER_MUTATION,
  DELETE_CUSTOMER_MUTATION,
} from '@/graphql/documents';
import type { CustomerResponseDto } from '@/types/crm';
import {
  Building2,
  Search,
  Plus,
  Mail,
  Phone,
  Ticket,
  MessageSquare,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { accessToken, selectedOrgPubId, selectedOrgSlug, selectedOrgName } = useAuthStore();

  // Resolve Active Organization
  const { data: myOrgs = [] } = useQuery({
    queryKey: ['myOrganizations', accessToken],
    queryFn: async () => {
      if (!accessToken) return [];
      const res = await graphqlRequest<{ myOrganizations: any[] }>(MY_ORGANIZATIONS_QUERY);
      return res.myOrganizations || [];
    },
    enabled: !!accessToken,
  });

  const validOrgs = Array.isArray(myOrgs) ? myOrgs.filter((o: any) => o && typeof o === 'object') : [];
  const activeOrg =
    validOrgs.find(
      (o) =>
        (selectedOrgPubId && o.pubId === selectedOrgPubId) ||
        (selectedOrgSlug && o.slug === selectedOrgSlug)
    ) ||
    validOrgs[0] ||
    null;

  const effectiveOrgPubId = selectedOrgPubId || activeOrg?.pubId || '';
  const orgSlug = activeOrg?.slug?.trim() || selectedOrgSlug || 'workspace';

  // Search & Filters
  const [search, setSearch] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomerResponseDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerResponseDto | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formPhone, setFormPhone] = useState('');

  // Fetch Customers
  const {
    data: customers = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['customers', effectiveOrgPubId, search],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ customers: CustomerResponseDto[] }>(CUSTOMERS_QUERY, {
        organizationPubId: effectiveOrgPubId,
        filter: search.trim() ? { search: search.trim() } : null,
      });
      return res.customers || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
    refetchInterval: 5000,
  });

  // Create Mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () => {
      return await graphqlRequest<{ createCustomer: CustomerResponseDto }>(CREATE_CUSTOMER_MUTATION, {
        input: {
          organizationPubId: effectiveOrgPubId,
          name: formName.trim(),
          email: formEmail.trim() || undefined,
          company: formCompany.trim() || undefined,
          phone: formPhone.trim() || undefined,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers', effectiveOrgPubId] });
      setIsCreateOpen(false);
      resetForm();
      setStatusMsg({ type: 'success', text: `Customer "${data.createCustomer.name}" created successfully.` });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create customer' });
    },
  });

  // Update Mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!editTarget) throw new Error('No customer selected');
      return await graphqlRequest<{ updateCustomer: CustomerResponseDto }>(UPDATE_CUSTOMER_MUTATION, {
        pubId: editTarget.pubId,
        input: {
          name: formName.trim() || undefined,
          email: formEmail.trim() || undefined,
          company: formCompany.trim() || undefined,
          phone: formPhone.trim() || undefined,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers', effectiveOrgPubId] });
      setEditTarget(null);
      resetForm();
      setStatusMsg({ type: 'success', text: `Customer "${data.updateCustomer.name}" updated successfully.` });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update customer' });
    },
  });

  // Delete Mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) throw new Error('No customer selected');
      return await graphqlRequest<{ deleteCustomer: { success: boolean; message: string } }>(
        DELETE_CUSTOMER_MUTATION,
        {
          pubId: deleteTarget.pubId,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', effectiveOrgPubId] });
      setDeleteTarget(null);
      setStatusMsg({ type: 'success', text: 'Customer removed successfully.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to delete customer' });
    },
  });

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormCompany('');
    setFormPhone('');
  };

  const openEditModal = (c: CustomerResponseDto) => {
    setEditTarget(c);
    setFormName(c.name || '');
    setFormEmail(c.email || '');
    setFormCompany(c.company || '');
    setFormPhone(c.phone || '');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  // Metrics
  const totalCustomers = customers.length;
  const totalTickets = customers.reduce((acc, c) => acc + (c.ticketCount || 0), 0);
  const companiesCount = new Set(customers.map((c) => c.company).filter(Boolean)).size;

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">Customer CRM & Accounts</h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {totalCustomers} {totalCustomers === 1 ? 'Customer' : 'Customers'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage client records, ticket histories, and support communications for{' '}
              <span className="text-slate-200 font-mono">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleOpenCreate}
            disabled={!effectiveOrgPubId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Customers</p>
            <h3 className="text-xl font-bold text-slate-100 font-mono">{totalCustomers}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Unique Companies</p>
            <h3 className="text-xl font-bold text-slate-100 font-mono">{companiesCount}</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Linked Tickets</p>
            <h3 className="text-xl font-bold text-slate-100 font-mono">{totalTickets}</h3>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, company, email, or phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Customer Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs font-mono">Loading customer records from GraphQL...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="p-3 bg-slate-800/80 rounded-full text-slate-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">No customer records found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {search
                  ? `No customers match your search "${search}". Try clearing filters.`
                  : 'Start adding your customer contacts, companies, and accounts to Nexora CRM.'}
              </p>
            </div>
            {!search && (
              <button
                onClick={handleOpenCreate}
                disabled={!effectiveOrgPubId}
                className="mt-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Customer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Company</th>
                  <th className="p-3.5">Contact Details</th>
                  <th className="p-3.5">Tickets</th>
                  <th className="p-3.5">Added Date</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {customers.map((c) => (
                  <tr key={c.pubId} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center justify-center text-xs font-mono font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div>{c.name}</div>
                          <div className="text-[10px] font-mono text-slate-500">{c.pubId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5">
                      {c.company ? (
                        <span className="font-medium text-slate-200">{c.company}</span>
                      ) : (
                        <span className="text-slate-500 italic">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-1">
                        {c.email ? (
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{c.email}</span>
                          </div>
                        ) : null}
                        {c.phone ? (
                          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                        ) : null}
                        {!c.email && !c.phone && <span className="text-slate-500 italic">—</span>}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Link
                        href={`/dashboard/tickets?customerPubId=${c.pubId}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono transition-colors"
                      >
                        <Ticket className="w-3 h-3 text-indigo-400" />
                        <span>{c.ticketCount ?? 0} Tickets</span>
                      </Link>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/dashboard/inbox?customerPubId=${c.pubId}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                          title="Open Support Conversation"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/dashboard/tickets?createCustomerPubId=${c.pubId}`}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                          title="Create Ticket"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CUSTOMER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">Add New Customer</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCustomerMutation.mutate();
              }}
              className="p-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Alex Henderson"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g. alex@acme.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim() || createCustomerMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {createCustomerMutation.isPending && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Create Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CUSTOMER MODAL */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">Edit Customer</h3>
              </div>
              <button
                onClick={() => setEditTarget(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCustomerMutation.mutate();
              }}
              className="p-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formName.trim() || updateCustomerMutation.isPending}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {updateCustomerMutation.isPending && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Delete Customer</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete customer{' '}
              <span className="font-bold text-white">&quot;{deleteTarget.name}&quot;</span>? All
              associated historical references will remain unlinked.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteCustomerMutation.mutate()}
                disabled={deleteCustomerMutation.isPending}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {deleteCustomerMutation.isPending && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
