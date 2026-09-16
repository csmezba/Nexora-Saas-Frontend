'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  TICKETS_QUERY,
  TICKET_QUERY,
  TICKET_COMMENTS_QUERY,
  CUSTOMERS_QUERY,
  MY_ORGANIZATIONS_QUERY,
  ORGANIZATION_MEMBERS_QUERY,
  CREATE_TICKET_MUTATION,
  UPDATE_TICKET_MUTATION,
  ASSIGN_TICKET_MUTATION,
  DELETE_TICKET_MUTATION,
  CREATE_TICKET_COMMENT_MUTATION,
  DELETE_TICKET_COMMENT_MUTATION,
} from '@/graphql/documents';
import type {
  TicketResponseDto,
  TicketStatus,
  TicketPriority,
  TicketCommentResponseDto,
  CustomerResponseDto,
} from '@/types/crm';
import {
  Ticket,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  User,
  Building2,
  MessageSquare,
  Trash2,
  X,
  Send,
  RefreshCw,
  ChevronRight,
  Shield,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

function TicketsContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { accessToken, user, selectedOrgPubId, selectedOrgSlug } = useAuthStore();

  const customerPubIdParam = searchParams.get('customerPubId');
  const createForCustomerPubId = searchParams.get('createCustomerPubId');

  // Active Organization Resolution
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

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [activeCustomerFilter, setActiveCustomerFilter] = useState<string>(customerPubIdParam || '');

  // Selection & Modals
  const [selectedTicketPubId, setSelectedTicketPubId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTicketTarget, setDeleteTicketTarget] = useState<TicketResponseDto | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Ticket Form State
  const [newCustomerPubId, setNewCustomerPubId] = useState<string>(createForCustomerPubId || '');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [newStatus, setNewStatus] = useState<TicketStatus>('OPEN');
  const [newAssignedUserPubId, setNewAssignedUserPubId] = useState<string>('');

  // Comment Form State
  const [commentContent, setCommentContent] = useState('');

  // Automatically open create modal if createCustomerPubId is in query params
  useEffect(() => {
    if (createForCustomerPubId) {
      setNewCustomerPubId(createForCustomerPubId);
      setIsCreateOpen(true);
    }
  }, [createForCustomerPubId]);

  // Fetch Customers for Organization
  const { data: customers = [] } = useQuery({
    queryKey: ['customers', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ customers: CustomerResponseDto[] }>(CUSTOMERS_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.customers || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Fetch Organization Members for Assignment
  const { data: orgMembers = [] } = useQuery({
    queryKey: ['organizationMembers', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ organizationMembers: any[] }>(ORGANIZATION_MEMBERS_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.organizationMembers || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Fetch Tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    isRefetching: ticketsRefetching,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: [
      'tickets',
      effectiveOrgPubId,
      statusFilter,
      priorityFilter,
      activeCustomerFilter,
      search,
    ],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const filter: any = {};
      if (search.trim()) filter.search = search.trim();
      if (statusFilter !== 'ALL') filter.status = statusFilter as TicketStatus;
      if (priorityFilter !== 'ALL') filter.priority = priorityFilter as TicketPriority;
      if (activeCustomerFilter) filter.customerPubId = activeCustomerFilter;

      const res = await graphqlRequest<{ tickets: TicketResponseDto[] }>(TICKETS_QUERY, {
        organizationPubId: effectiveOrgPubId,
        filter: Object.keys(filter).length > 0 ? filter : null,
      });
      return res.tickets || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
  });

  // Fetch Selected Ticket Details (with comments)
  const {
    data: selectedTicket,
    isLoading: ticketDetailLoading,
    refetch: refetchTicketDetail,
  } = useQuery({
    queryKey: ['ticketDetail', selectedTicketPubId],
    queryFn: async () => {
      if (!selectedTicketPubId) return null;
      const res = await graphqlRequest<{ ticket: TicketResponseDto }>(TICKET_QUERY, {
        pubId: selectedTicketPubId,
      });
      return res.ticket;
    },
    enabled: !!selectedTicketPubId && !!accessToken,
  });

  // Fetch Comments specifically for the active ticket
  const {
    data: comments = [],
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['ticketComments', selectedTicketPubId],
    queryFn: async () => {
      if (!selectedTicketPubId) return [];
      const res = await graphqlRequest<{ ticketComments: TicketCommentResponseDto[] }>(
        TICKET_COMMENTS_QUERY,
        {
          ticketPubId: selectedTicketPubId,
        }
      );
      return res.ticketComments || [];
    },
    enabled: !!selectedTicketPubId && !!accessToken,
  });

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      return await graphqlRequest<{ createTicket: TicketResponseDto }>(CREATE_TICKET_MUTATION, {
        input: {
          customerPubId: newCustomerPubId,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          priority: newPriority,
          status: newStatus,
          assignedToUserPubId: newAssignedUserPubId || undefined,
        },
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tickets', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['customers', effectiveOrgPubId] });
      setIsCreateOpen(false);
      resetCreateForm();
      setSelectedTicketPubId(data.createTicket.pubId);
      setStatusMsg({ type: 'success', text: `Ticket "${data.createTicket.title}" created successfully.` });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create ticket' });
    },
  });

  // Update Ticket Status/Priority
  const updateTicketMutation = useMutation({
    mutationFn: async (vars: { pubId: string; status?: TicketStatus; priority?: TicketPriority }) => {
      return await graphqlRequest<{ updateTicket: TicketResponseDto }>(UPDATE_TICKET_MUTATION, {
        pubId: vars.pubId,
        input: {
          status: vars.status,
          priority: vars.priority,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketPubId] });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to update ticket' });
    },
  });

  // Assign Ticket Mutation
  const assignTicketMutation = useMutation({
    mutationFn: async (vars: { ticketPubId: string; assignedToUserPubId: string | null }) => {
      return await graphqlRequest<{ assignTicket: TicketResponseDto }>(ASSIGN_TICKET_MUTATION, {
        input: {
          ticketPubId: vars.ticketPubId,
          assignedToUserPubId: vars.assignedToUserPubId || null,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketPubId] });
      setStatusMsg({ type: 'success', text: 'Ticket assignment updated.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to assign ticket' });
    },
  });

  // Delete Ticket Mutation
  const deleteTicketMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTicketTarget) return;
      return await graphqlRequest<{ deleteTicket: { success: boolean; message: string } }>(
        DELETE_TICKET_MUTATION,
        {
          pubId: deleteTicketTarget.pubId,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['customers', effectiveOrgPubId] });
      if (selectedTicketPubId === deleteTicketTarget?.pubId) {
        setSelectedTicketPubId(null);
      }
      setDeleteTicketTarget(null);
      setStatusMsg({ type: 'success', text: 'Ticket deleted successfully.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to delete ticket' });
    },
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicketPubId || !commentContent.trim()) return;
      return await graphqlRequest<{ createTicketComment: TicketCommentResponseDto }>(
        CREATE_TICKET_COMMENT_MUTATION,
        {
          input: {
            ticketPubId: selectedTicketPubId,
            content: commentContent.trim(),
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketComments', selectedTicketPubId] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketPubId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', effectiveOrgPubId] });
      setCommentContent('');
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to post comment' });
    },
  });

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentPubId: string) => {
      return await graphqlRequest<{ deleteTicketComment: { success: boolean } }>(
        DELETE_TICKET_COMMENT_MUTATION,
        {
          commentPubId,
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticketComments', selectedTicketPubId] });
      queryClient.invalidateQueries({ queryKey: ['ticketDetail', selectedTicketPubId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', effectiveOrgPubId] });
    },
  });

  const resetCreateForm = () => {
    setNewCustomerPubId(customers[0]?.pubId || '');
    setNewTitle('');
    setNewDescription('');
    setNewPriority('MEDIUM');
    setNewStatus('OPEN');
    setNewAssignedUserPubId('');
  };

  // Metrics
  const totalCount = tickets.length;
  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
  const urgentCount = tickets.filter((t) => t.priority === 'URGENT').length;

  const priorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-950/80 border-rose-800 text-rose-300';
      case 'HIGH':
        return 'bg-amber-950/80 border-amber-800 text-amber-300';
      case 'MEDIUM':
        return 'bg-indigo-950/80 border-indigo-800 text-indigo-300';
      case 'LOW':
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  const statusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-950/80 border-blue-800 text-blue-300';
      case 'IN_PROGRESS':
        return 'bg-purple-950/80 border-purple-800 text-purple-300';
      case 'RESOLVED':
        return 'bg-emerald-950/80 border-emerald-800 text-emerald-300';
      case 'CLOSED':
      default:
        return 'bg-slate-800 border-slate-700 text-slate-400';
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100">Support Ticket Resolution</h2>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {totalCount} {totalCount === 1 ? 'Ticket' : 'Tickets'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Track customer issues, incident resolution, and internal comments for{' '}
              <span className="text-slate-200 font-mono">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetchTickets()}
            disabled={ticketsRefetching}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 disabled:opacity-50"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${ticketsRefetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              if (customers.length > 0 && !newCustomerPubId) {
                setNewCustomerPubId(customers[0].pubId);
              }
              setIsCreateOpen(true);
            }}
            disabled={!effectiveOrgPubId}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Create Ticket</span>
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

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-indigo-950/40 border-indigo-500/60 shadow-sm ring-1 ring-indigo-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-slate-400 font-medium">All Tickets</span>
          <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{totalCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('OPEN')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'OPEN'
              ? 'bg-blue-950/40 border-blue-500/60 shadow-sm ring-1 ring-blue-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-blue-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" /> Open
          </span>
          <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{openCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-purple-950/40 border-purple-500/60 shadow-sm ring-1 ring-purple-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-purple-400 font-medium flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> In Progress
          </span>
          <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{inProgressCount}</p>
        </button>

        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
          <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{resolvedCount}</p>
        </button>

        <button
          onClick={() => setPriorityFilter(priorityFilter === 'URGENT' ? 'ALL' : 'URGENT')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            priorityFilter === 'URGENT'
              ? 'bg-rose-950/40 border-rose-500/60 shadow-sm ring-1 ring-rose-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="text-[11px] text-rose-400 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Urgent
          </span>
          <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">{urgentCount}</p>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets by subject or description..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
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

        <div className="flex items-center gap-2">
          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Customer filter */}
          {customers.length > 0 && (
            <select
              value={activeCustomerFilter}
              onChange={(e) => setActiveCustomerFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500 max-w-[180px]"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.pubId} value={c.pubId}>
                  {c.name} {c.company ? `(${c.company})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Grid: Tickets List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Tickets Table / List */}
        <div
          className={`${
            selectedTicketPubId ? 'lg:col-span-7' : 'lg:col-span-12'
          } bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all`}
        >
          {ticketsLoading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs font-mono">Loading tickets from GraphQL...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-slate-800/80 rounded-full text-slate-400">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">No support tickets found</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  {search || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || activeCustomerFilter
                    ? 'No tickets match the current filters. Try clearing or changing filters.'
                    : 'All customer tickets have been resolved, or no tickets have been raised yet.'}
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(true)}
                disabled={!effectiveOrgPubId}
                className="mt-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Ticket</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Subject & ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Assigned Agent</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {tickets.map((t) => {
                    const isSelected = t.pubId === selectedTicketPubId;
                    return (
                      <tr
                        key={t.pubId}
                        onClick={() => setSelectedTicketPubId(t.pubId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-950/40 border-l-2 border-indigo-500'
                            : 'hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-slate-100 line-clamp-1">
                              {t.title}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                              <span className="text-indigo-400 font-bold">{t.pubId}</span>
                              {t.commentsCount ? (
                                <span className="flex items-center gap-0.5 text-slate-400">
                                  <MessageSquare className="w-2.5 h-2.5" />
                                  {t.commentsCount}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-medium text-slate-200">
                            {t.customer?.name || 'Customer'}
                          </div>
                          {t.customer?.company && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.customer.company}
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${priorityBadge(
                              t.priority
                            )}`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${statusBadge(
                              t.status
                            )}`}
                          >
                            {t.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {t.assignedTo ? (
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono">
                                {t.assignedTo.fullName.charAt(0)}
                              </div>
                              <span className="text-xs truncate max-w-[120px]">
                                {t.assignedTo.fullName}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setSelectedTicketPubId(t.pubId)}
                              className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                              title="View Ticket Details"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTicketTarget(t)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                              title="Delete Ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ticket Detail & Comments Slide-over/Panel */}
        {selectedTicketPubId && (
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {ticketDetailLoading && !selectedTicket ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <p className="text-xs font-mono">Loading ticket details...</p>
              </div>
            ) : selectedTicket ? (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-400">
                        {selectedTicket.pubId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${priorityBadge(
                          selectedTicket.priority
                        )}`}
                      >
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-100 line-clamp-1">
                      {selectedTicket.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTicketPubId(null)}
                    className="text-slate-400 hover:text-slate-200 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Status & Assignee Controls */}
                <div className="p-3 bg-slate-950/80 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={selectedTicket.status}
                      onChange={(e) =>
                        updateTicketMutation.mutate({
                          pubId: selectedTicket.pubId,
                          status: e.target.value as TicketStatus,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">
                      Assigned Agent
                    </label>
                    <select
                      value={selectedTicket.assignedTo?.pubId || ''}
                      onChange={(e) =>
                        assignTicketMutation.mutate({
                          ticketPubId: selectedTicket.pubId,
                          assignedToUserPubId: e.target.value || null,
                        })
                      }
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Unassigned</option>
                      {orgMembers.map((m) => (
                        <option key={m.user.pubId} value={m.user.pubId}>
                          {m.user.fullName || m.user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Body & Description */}
                <div className="p-4 border-b border-slate-800 space-y-3 overflow-y-auto max-h-48 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                      Customer Profile
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <div className="font-semibold text-slate-200">
                        {selectedTicket.customer?.name}
                      </div>
                      <Link
                        href={`/dashboard/inbox?customerPubId=${selectedTicket.customerPubId}`}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat Thread</span>
                      </Link>
                    </div>
                    {selectedTicket.customer?.company && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        {selectedTicket.customer.company} &bull; {selectedTicket.customer.email}
                      </p>
                    )}
                  </div>

                  {selectedTicket.description && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-500">
                        Description
                      </span>
                      <p className="text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
                        {selectedTicket.description}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                    <span>Raised {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                    {selectedTicket.resolvedAt && (
                      <span className="text-emerald-400">
                        Resolved {new Date(selectedTicket.resolvedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-950/40">
                  <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Internal Comments ({comments.length})</span>
                    </span>
                    <button
                      onClick={() => refetchComments()}
                      className="text-slate-500 hover:text-slate-300 text-[10px] font-mono"
                    >
                      Refresh
                    </button>
                  </div>

                  {/* Comments Timeline */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {commentsLoading ? (
                      <p className="text-[11px] text-slate-500 text-center py-4">
                        Loading comments...
                      </p>
                    ) : comments.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-4 italic">
                        No comments yet. Post an internal note below.
                      </p>
                    ) : (
                      comments.map((cm) => (
                        <div
                          key={cm.pubId}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-300 text-[11px]">
                              {cm.author?.fullName || cm.author?.email || 'Agent'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-slate-500">
                                {new Date(cm.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <button
                                onClick={() => deleteCommentMutation.mutate(cm.pubId)}
                                className="text-slate-600 hover:text-rose-400 p-0.5 transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                            {cm.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* New Comment Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      addCommentMutation.mutate();
                    }}
                    className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2"
                  >
                    <input
                      type="text"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Add an internal note or update..."
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!commentContent.trim() || addCommentMutation.isPending}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post</span>
                    </button>
                  </form>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">Create Support Ticket</h3>
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
                createTicketMutation.mutate();
              }}
              className="p-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Customer <span className="text-rose-400">*</span>
                </label>
                {customers.length === 0 ? (
                  <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 text-xs">
                    No customers found in this organization. Please add a customer first in the{' '}
                    <Link href="/dashboard/customers" className="underline font-semibold">
                      Customers CRM
                    </Link>
                    .
                  </div>
                ) : (
                  <select
                    required
                    value={newCustomerPubId}
                    onChange={(e) => setNewCustomerPubId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      Select a customer...
                    </option>
                    {customers.map((c) => (
                      <option key={c.pubId} value={c.pubId}>
                        {c.name} {c.company ? `(${c.company})` : ''} - {c.email || 'No email'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Subject / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. SSO Integration failing with Okta"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Provide details about the issue, reproduction steps, error logs..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Initial Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign To Agent</label>
                <select
                  value={newAssignedUserPubId}
                  onChange={(e) => setNewAssignedUserPubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Leave unassigned</option>
                  {orgMembers.map((m) => (
                    <option key={m.user.pubId} value={m.user.pubId}>
                      {m.user.fullName || m.user.email} ({m.role})
                    </option>
                  ))}
                </select>
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
                  disabled={
                    !newTitle.trim() ||
                    !newCustomerPubId ||
                    createTicketMutation.isPending
                  }
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {createTicketMutation.isPending && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Create Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE TICKET CONFIRMATION MODAL */}
      {deleteTicketTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-sm shadow-2xl p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-100">Delete Support Ticket</h4>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete ticket{' '}
              <span className="font-bold text-white">&quot;{deleteTicketTarget.title}&quot;</span> (
              {deleteTicketTarget.pubId})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setDeleteTicketTarget(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteTicketMutation.mutate()}
                disabled={deleteTicketMutation.isPending}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {deleteTicketMutation.isPending && (
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

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs font-mono">Loading Tickets Dashboard...</p>
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}
