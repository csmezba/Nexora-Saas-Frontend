'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
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
  Tag,
} from 'lucide-react';

interface ConversationItem {
  id: string;
  customerName: string;
  company: string;
  email: string;
  plan: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: { sender: 'customer' | 'agent'; text: string; time: string }[];
}

const CONVERSATIONS: ConversationItem[] = [
  {
    id: 'conv_1',
    customerName: 'Marcus Vance',
    company: 'Acme Corp',
    email: 'marcus@acme.com',
    plan: 'Enterprise Pro',
    lastMessage: 'How do we configure custom SSO SAML login for our team?',
    time: '10m ago',
    unread: true,
    messages: [
      {
        sender: 'customer',
        text: 'Hi team, we are setting up our organization on Nexora. How do we configure custom SSO SAML login for our team?',
        time: '10:42 AM',
      },
      {
        sender: 'agent',
        text: 'Hello Marcus! You can set up SAML SSO under Organization Settings -> Security & Authentication. I can also send you our configuration guide.',
        time: '10:45 AM',
      },
      {
        sender: 'customer',
        text: 'That would be great! Does it support Okta and Azure AD integration?',
        time: '10:48 AM',
      },
    ],
  },
  {
    id: 'conv_2',
    customerName: 'Sarah Jenkins',
    company: 'Vanguard Systems',
    email: 'sarah@vanguard.io',
    plan: 'Business Tier',
    lastMessage: 'Our AI token limit was reached earlier today. Can we expand quota?',
    time: '1h ago',
    unread: false,
    messages: [
      {
        sender: 'customer',
        text: 'Our AI token limit was reached earlier today. Can we expand quota?',
        time: '9:30 AM',
      },
    ],
  },
  {
    id: 'conv_3',
    customerName: 'David Zhang',
    company: 'CloudScale Inc',
    email: 'david@cloudscale.net',
    plan: 'Developer Pro',
    lastMessage: 'Webhook delivery failed for event project.task_updated.',
    time: '3h ago',
    unread: false,
    messages: [
      {
        sender: 'customer',
        text: 'Webhook delivery failed for event project.task_updated. Can you verify endpoint logs?',
        time: '7:15 AM',
      },
    ],
  },
];

export default function SupportInboxPage() {
  const { selectedOrgSlug } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'acme';

  const [activeConvId, setActiveConvId] = useState<string>('conv_1');
  const [replyText, setReplyText] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>(CONVERSATIONS);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              unread: false,
              messages: [
                ...c.messages,
                { sender: 'agent', text: replyText, time: 'Just now' },
              ],
            }
          : c
      )
    );
    setReplyText('');
  };

  return (
    <div className="h-[calc(100vh-6rem)] font-sans text-slate-100 flex flex-col space-y-3">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-slate-100">Support Inbox & Conversations</h2>
        </div>
        <span className="text-xs font-mono text-slate-400">/{orgSlug}/inbox</span>
      </div>

      {/* 3-Column Layout Container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex min-h-0">
        {/* Column 1: Conversations List */}
        <div className="w-72 border-r border-slate-800 flex flex-col bg-slate-950/60">
          <div className="p-3 border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search inbox..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {conversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-1 ${
                    isSelected ? 'bg-slate-800/90 border-l-2 border-indigo-500' : 'hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-slate-200 truncate">
                      {conv.customerName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{conv.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{conv.company}</p>
                  <p className="text-xs text-slate-400 line-clamp-1 font-sans">{conv.lastMessage}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: Active Thread */}
        <div className="flex-1 flex flex-col bg-slate-900">
          {/* Thread Header */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
            <div>
              <h3 className="font-bold text-sm text-slate-100">{activeConv.customerName}</h3>
              <p className="text-xs text-slate-400 font-mono">{activeConv.email} &bull; {activeConv.company}</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-mono font-bold">
              {activeConv.plan}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {activeConv.messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'agent' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md p-3.5 rounded-xl text-xs leading-relaxed ${
                    m.sender === 'agent'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[10px] font-mono text-slate-500 mt-1 px-1">{m.time}</span>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-3 border-t border-slate-800 bg-slate-950/80 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${activeConv.customerName}...`}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Column 3: Customer Profile Metadata Panel */}
        <div className="w-72 border-l border-slate-800 p-4 bg-slate-950/60 font-sans space-y-4 hidden md:block">
          <div className="pb-3 border-b border-slate-800">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">
              Customer Profile
            </span>
            <h4 className="font-bold text-sm text-slate-100 mt-1">{activeConv.customerName}</h4>
            <p className="text-xs text-slate-400 font-mono">{activeConv.email}</p>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px]">Company</span>
              <p className="font-bold text-slate-200 font-sans">{activeConv.company}</p>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px]">Current SaaS Plan</span>
              <p className="font-bold text-indigo-400">{activeConv.plan}</p>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px]">Open Tickets</span>
              <p className="font-bold text-slate-200">1 active support ticket</p>
            </div>
          </div>

          {/* AI Response Suggestions */}
          <div className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Reply Suggestion</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              &quot;We support SAML 2.0 with Okta, Azure AD, and Google Workspace. Click Settings &rarr; Auth to upload IDP Metadata.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
