'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { graphqlRequest } from '@/lib/graphql-client';
import { useAuthStore } from '@/store/useAuthStore';
import {
  CUSTOMERS_QUERY,
  CUSTOMER_CONVERSATIONS_QUERY,
  CONVERSATION_QUERY,
  CREATE_CONVERSATION_MUTATION,
  SEND_MESSAGE_MUTATION,
  MY_ORGANIZATIONS_QUERY,
} from '@/graphql/documents';
import type {
  CustomerResponseDto,
  ConversationResponseDto,
  MessageResponseDto,
  MessageType,
} from '@/types/crm';
import { getSocket } from '@/lib/socket';
import {
  Inbox,
  Search,
  Send,
  Sparkles,
  User,
  Building2,
  Ticket,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  X,
  RefreshCw,
  Phone,
  Mail,
  Bot,
  Terminal,
  ExternalLink,
} from 'lucide-react';

function SupportInboxContent() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { accessToken, user, selectedOrgPubId, selectedOrgSlug } = useAuthStore();

  const customerPubIdParam = searchParams.get('customerPubId');

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

  // State
  const [selectedCustomerPubId, setSelectedCustomerPubId] = useState<string>(customerPubIdParam || '');
  const [activeConvPubId, setActiveConvPubId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('TEXT');
  const [searchFilter, setSearchFilter] = useState('');
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState('');
  const [newConvCustomerPubId, setNewConvCustomerPubId] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync param if provided
  useEffect(() => {
    if (customerPubIdParam) {
      setSelectedCustomerPubId(customerPubIdParam);
    }
  }, [customerPubIdParam]);

  // 1. Fetch Customers in Org
  const {
    data: customers = [],
    isLoading: customersLoading,
    isRefetching: customersRefetching,
    refetch: refetchCustomers,
  } = useQuery({
    queryKey: ['customers', effectiveOrgPubId],
    queryFn: async () => {
      if (!effectiveOrgPubId) return [];
      const res = await graphqlRequest<{ customers: CustomerResponseDto[] }>(CUSTOMERS_QUERY, {
        organizationPubId: effectiveOrgPubId,
      });
      return res.customers || [];
    },
    enabled: !!effectiveOrgPubId && !!accessToken,
    refetchInterval: 4000,
  });

  // Set default customer if none selected
  useEffect(() => {
    if (!selectedCustomerPubId && customers.length > 0) {
      setSelectedCustomerPubId(customers[0].pubId);
    }
  }, [customers, selectedCustomerPubId]);

  // Current selected customer object
  const currentCustomer =
    customers.find((c) => c.pubId === selectedCustomerPubId) || customers[0] || null;

  // 2. Fetch Conversations for selected Customer
  const {
    data: conversations = [],
    isLoading: convsLoading,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['customerConversations', currentCustomer?.pubId],
    queryFn: async () => {
      if (!currentCustomer?.pubId) return [];
      const res = await graphqlRequest<{ customerConversations: ConversationResponseDto[] }>(
        CUSTOMER_CONVERSATIONS_QUERY,
        {
          customerPubId: currentCustomer.pubId,
        }
      );
      return res.customerConversations || [];
    },
    enabled: !!currentCustomer?.pubId && !!accessToken,
    refetchInterval: 4000,
  });

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !activeConvPubId) {
      setActiveConvPubId(conversations[0].pubId);
    } else if (
      conversations.length > 0 &&
      activeConvPubId &&
      !conversations.some((c) => c.pubId === activeConvPubId)
    ) {
      setActiveConvPubId(conversations[0].pubId);
    }
  }, [conversations, activeConvPubId]);

  // 3. Fetch Active Conversation Thread details & messages
  const {
    data: activeConversation,
    isLoading: threadLoading,
    refetch: refetchActiveThread,
  } = useQuery({
    queryKey: ['conversation', activeConvPubId],
    queryFn: async () => {
      if (!activeConvPubId) return null;
      const res = await graphqlRequest<{ conversation: ConversationResponseDto }>(
        CONVERSATION_QUERY,
        {
          pubId: activeConvPubId,
        }
      );
      return res.conversation;
    },
    enabled: !!activeConvPubId && !!accessToken,
    refetchInterval: 5000, // Poll every 5 seconds as safety fallback
  });

  // Realtime Socket.IO subscriptions for Dashboard Inbox
  useEffect(() => {
    const socket = getSocket();

    const joinChannels = () => {
      // 1. Join organization conversations channel for incoming new threads
      if (effectiveOrgPubId) {
        socket.emit('join:channel', { channel: `org:${effectiveOrgPubId}:conversations` });
      }
      // 2. Join active conversation channel for instant messages
      if (activeConvPubId) {
        socket.emit('join:channel', { channel: `conversation:${activeConvPubId}` });
      }
    };

    if (socket.connected) {
      joinChannels();
    } else {
      socket.connect();
    }

    socket.on('connect', joinChannels);

    // Listen for new conversation created by homepage visitors
    const handleConversationCreated = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['customers', effectiveOrgPubId] });
      queryClient.invalidateQueries({ queryKey: ['customerConversations', currentCustomer?.pubId] });
      setStatusMsg({
        type: 'success',
        text: `New conversation started: ${payload?.title || 'Homepage Inquiry'}`,
      });
    };

    // Listen for new messages in active thread
    const handleMessageCreated = (payload: any) => {
      if (payload?.conversationPubId === activeConvPubId) {
        queryClient.invalidateQueries({ queryKey: ['conversation', activeConvPubId] });
        queryClient.invalidateQueries({ queryKey: ['customerConversations', currentCustomer?.pubId] });
      }
    };

    socket.on('conversation:created', handleConversationCreated);
    socket.on('message:created', handleMessageCreated);

    return () => {
      if (effectiveOrgPubId) {
        socket.emit('leave:channel', { channel: `org:${effectiveOrgPubId}:conversations` });
      }
      if (activeConvPubId) {
        socket.emit('leave:channel', { channel: `conversation:${activeConvPubId}` });
      }
      socket.off('connect', joinChannels);
      socket.off('conversation:created', handleConversationCreated);
      socket.off('message:created', handleMessageCreated);
    };
  }, [effectiveOrgPubId, activeConvPubId, currentCustomer?.pubId, queryClient]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // 4. Create Conversation Mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const targetCustomerPubId = newConvCustomerPubId || currentCustomer?.pubId;
      if (!targetCustomerPubId) throw new Error('Customer required');

      return await graphqlRequest<{ createConversation: ConversationResponseDto }>(
        CREATE_CONVERSATION_MUTATION,
        {
          input: {
            customerPubId: targetCustomerPubId,
            title: newConvTitle.trim() || undefined,
          },
        }
      );
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['customerConversations', data.createConversation.customerPubId],
      });
      setSelectedCustomerPubId(data.createConversation.customerPubId);
      setActiveConvPubId(data.createConversation.pubId);
      setIsNewConvOpen(false);
      setNewConvTitle('');
      setStatusMsg({ type: 'success', text: 'New conversation thread started.' });
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to create conversation' });
    },
  });

  // 5. Send Message Mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!activeConvPubId || !replyText.trim()) return;
      return await graphqlRequest<{ sendMessage: MessageResponseDto }>(SEND_MESSAGE_MUTATION, {
        input: {
          conversationPubId: activeConvPubId,
          content: replyText.trim(),
          type: messageType,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation', activeConvPubId] });
      queryClient.invalidateQueries({ queryKey: ['customerConversations', currentCustomer?.pubId] });
      setReplyText('');
    },
    onError: (err: any) => {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to send message' });
    },
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    sendMessageMutation.mutate();
  };

  const handleApplyAISuggestion = (suggestionText: string) => {
    setReplyText(suggestionText);
  };

  // Filtered conversations list
  const filteredConversations = conversations.filter((c) => {
    const titleMatch = (c.title || 'Support Thread').toLowerCase().includes(searchFilter.toLowerCase());
    return titleMatch;
  });

  return (
    <div className="h-[calc(100vh-6rem)] font-sans text-slate-100 flex flex-col space-y-3">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Support Inbox & Conversations</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                Live
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Customer Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg">
            <span className="text-slate-400 font-medium">Customer:</span>
            {customers.length === 0 ? (
              <span className="text-slate-500 italic">No customers</span>
            ) : (
              <select
                value={selectedCustomerPubId}
                onChange={(e) => {
                  setSelectedCustomerPubId(e.target.value);
                  setActiveConvPubId(null);
                }}
                className="bg-transparent text-indigo-300 font-semibold focus:outline-none cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.pubId} value={c.pubId} className="bg-slate-900 text-slate-200">
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => {
                refetchCustomers();
                refetchConversations();
                refetchActiveThread();
              }}
              title="Refresh inbox & customer list"
              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${customersRefetching ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => {
              setNewConvCustomerPubId(selectedCustomerPubId);
              setIsNewConvOpen(true);
            }}
            disabled={!selectedCustomerPubId}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Thread</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div
          className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/50 border-rose-800 text-rose-300'
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)}>
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      )}

      {/* 3-Column Main Chat Window */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex min-h-0">
        {/* ================= COLUMN 1: CONVERSATIONS LIST ================= */}
        <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-950/60">
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {convsLoading ? (
              <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading threads...</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-3">
                <MessageSquare className="w-6 h-6 mx-auto text-slate-600" />
                <p>No conversation threads found for this customer.</p>
                <button
                  onClick={() => {
                    setNewConvCustomerPubId(selectedCustomerPubId);
                    setIsNewConvOpen(true);
                  }}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold transition-colors"
                >
                  Start First Thread
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.pubId === activeConvPubId;
                const lastMsg =
                  conv.messages && conv.messages.length > 0
                    ? conv.messages[conv.messages.length - 1]
                    : null;

                return (
                  <div
                    key={conv.pubId}
                    onClick={() => setActiveConvPubId(conv.pubId)}
                    className={`p-3.5 cursor-pointer transition-colors space-y-1 ${
                      isSelected
                        ? 'bg-slate-800/90 border-l-2 border-indigo-500'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-200 truncate">
                        {conv.title || 'Support Conversation'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(conv.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <span className="text-slate-300 font-semibold">{currentCustomer?.name}</span>
                      {currentCustomer?.company && (
                        <span>&bull; {currentCustomer.company}</span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-1 font-sans">
                      {lastMsg ? lastMsg.content : 'No messages yet in this thread.'}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= COLUMN 2: ACTIVE CONVERSATION THREAD ================= */}
        <div className="flex-1 flex flex-col bg-slate-900 min-w-0">
          {activeConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100">
                      {activeConversation.title || 'Support Conversation'}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {activeConversation.pubId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Customer: <span className="text-slate-200">{currentCustomer?.name}</span>{' '}
                    {currentCustomer?.company ? `(${currentCustomer.company})` : ''} &bull;{' '}
                    {currentCustomer?.email || 'No email'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refetchActiveThread()}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                    title="Refresh thread"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href={`/dashboard/tickets?customerPubId=${currentCustomer?.pubId}`}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 transition-colors"
                  >
                    <Ticket className="w-3 h-3" />
                    <span>View Tickets</span>
                  </Link>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
                {threadLoading && !activeConversation ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-400 mb-2" />
                    <span>Loading conversation history...</span>
                  </div>
                ) : !activeConversation.messages || activeConversation.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-600" />
                    <p>No messages in this conversation yet.</p>
                    <p className="text-[11px] text-slate-600">
                      Send a message below to begin interacting with the customer.
                    </p>
                  </div>
                ) : (
                  activeConversation.messages.map((m) => {
                    const isCurrentUser = m.sender?.pubId === user?.pubId;
                    const isAgent = Boolean(m.sender);
                    const isAI = m.type === 'AI';
                    const isSystem = m.type === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div key={m.pubId} className="flex justify-center my-2">
                          <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono flex items-center gap-1.5">
                            <Terminal className="w-3 h-3 text-slate-500" />
                            <span>{m.content}</span>
                            <span className="text-slate-600">
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.pubId}
                        className={`flex flex-col ${
                          isCurrentUser || isAgent ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px]">
                          <span className="font-semibold text-slate-300">
                            {isAI
                              ? 'Nexora AI Assistant'
                              : m.sender?.fullName || m.sender?.email || currentCustomer?.name || 'Customer'}
                          </span>
                          {isAI && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 text-[9px] font-mono font-bold flex items-center gap-0.5">
                              <Bot className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-500">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div
                          className={`max-w-lg p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                            isAI
                              ? 'bg-indigo-950/80 border border-indigo-700/60 text-indigo-100 rounded-br-none shadow-md'
                              : isCurrentUser || isAgent
                              ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-3 border-t border-slate-800 bg-slate-950/90 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      Send As:
                    </span>
                    {(['TEXT', 'AI', 'SYSTEM'] as MessageType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMessageType(t)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          messageType === t
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Press Enter or click Send
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply in thread... (Sending as ${messageType})`}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendMessageMutation.isPending}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {sendMessageMutation.isPending ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs space-y-3">
              <Inbox className="w-10 h-10 text-slate-700" />
              <p className="font-semibold text-slate-300">No conversation selected</p>
              <p className="text-slate-500 text-center max-w-sm">
                Select a conversation from the left sidebar or start a new thread to interact with{' '}
                {currentCustomer?.name || 'customers'}.
              </p>
            </div>
          )}
        </div>

        {/* ================= COLUMN 3: CUSTOMER PROFILE & METADATA PANEL ================= */}
        <div className="w-72 border-l border-slate-800 p-4 bg-slate-950/60 font-sans space-y-4 hidden lg:block overflow-y-auto">
          {currentCustomer ? (
            <>
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                  Customer Profile
                </span>
                <h4 className="font-bold text-sm text-slate-100 mt-1">{currentCustomer.name}</h4>
                <p className="text-xs text-slate-400 font-mono">
                  {currentCustomer.email || 'No email on file'}
                </p>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px]">Company / Organization</span>
                  <p className="font-bold text-slate-200 font-sans">
                    {currentCustomer.company || '—'}
                  </p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px]">Phone Number</span>
                  <p className="font-bold text-slate-300">{currentCustomer.phone || '—'}</p>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-slate-500 text-[10px]">Total Linked Tickets</span>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-indigo-400">
                      {currentCustomer.ticketCount ?? 0} Tickets
                    </p>
                    <Link
                      href={`/dashboard/tickets?customerPubId=${currentCustomer.pubId}`}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                    >
                      View All
                    </Link>
                  </div>
                </div>

                <Link
                  href={`/dashboard/tickets?createCustomerPubId=${currentCustomer.pubId}`}
                  className="w-full py-2 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Escalate to Ticket</span>
                </Link>
              </div>

              {/* AI Quick Response Suggestions */}
              <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Reply Suggestions</span>
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyAISuggestion(
                        `Hi ${currentCustomer.name}, thank you for reaching out! We are currently investigating this issue and will update you shortly.`
                      )
                    }
                    className="w-full text-left p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors leading-relaxed"
                  >
                    &quot;We are currently investigating this issue and will update you shortly.&quot;
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyAISuggestion(
                        `Hi ${currentCustomer.name}, could you please share reproduction steps or a screenshot so our engineering team can diagnose further?`
                      )
                    }
                    className="w-full text-left p-2 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 transition-colors leading-relaxed"
                  >
                    &quot;Could you please share reproduction steps or a screenshot?&quot;
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-slate-500 text-xs py-8">
              <User className="w-6 h-6 mx-auto mb-1 text-slate-600" />
              <span>Select a customer to view details.</span>
            </div>
          )}
        </div>
      </div>

      {/* NEW CONVERSATION MODAL */}
      {isNewConvOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-sm text-slate-100">Start New Support Thread</h3>
              </div>
              <button
                onClick={() => setIsNewConvOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createConversationMutation.mutate();
              }}
              className="p-4 space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Customer <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={newConvCustomerPubId}
                  onChange={(e) => setNewConvCustomerPubId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="" disabled>
                    Select customer...
                  </option>
                  {customers.map((c) => (
                    <option key={c.pubId} value={c.pubId}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Thread Title / Topic
                </label>
                <input
                  type="text"
                  value={newConvTitle}
                  onChange={(e) => setNewConvTitle(e.target.value)}
                  placeholder="e.g. SSO Setup & Azure AD inquiry"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewConvOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newConvCustomerPubId || createConversationMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {createConversationMutation.isPending && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Create Thread</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-xs font-mono">Loading Support Inbox...</p>
        </div>
      }
    >
      <SupportInboxContent />
    </Suspense>
  );
}
