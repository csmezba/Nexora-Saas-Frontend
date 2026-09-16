'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Mail,
  Check,
  RotateCcw,
} from 'lucide-react';
import { graphqlRequest } from '@/lib/graphql-client';
import { SEND_PUBLIC_INQUIRY_MUTATION } from '@/graphql/documents';
import type { PublicInquiryResponseDto } from '@/types/crm';
import { getSocket } from '@/lib/socket';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user' | 'agent';
  text: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  suggestedActions?: { label: string; action: string }[];
  isEmailPrompt?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome-1',
    sender: 'bot',
    text: "👋 Hi there! Welcome to Nexora. I'm your live support assistant. How can our team help your business today?",
    timestamp: 'Just now',
    suggestedActions: [
      { label: '💰 Explore Pricing & Plans', action: 'pricing' },
      { label: '🚀 Schedule a Live Demo', action: 'demo' },
      { label: '🛠 Technical Support Question', action: 'support' },
      { label: '🏢 Talk to Enterprise Sales', action: 'sales' },
    ],
  },
];

const BOT_RESPONSES: Record<string, { reply: string; actions?: { label: string; action: string }[] }> = {
  pricing: {
    reply: "Nexora offers three flexible tiers:\n• Free Starter ($0) for prototypes\n• Business Pro ($49/mo) for growing teams\n• Enterprise ($199/mo) with isolated tenant database & custom SLA.\n\nLeave your email below to receive our detailed pricing sheet or get in touch with sales!",
    actions: [
      { label: '✨ Start Free Trial', action: 'start_trial' },
      { label: '💬 Contact Sales Team', action: 'sales' },
    ],
  },
  demo: {
    reply: "We'd love to give you a guided walk-through! Please leave your email address below, and our team will follow up directly on our dashboard to schedule a demo.",
    actions: [
      { label: '⚡ Register Instant Account', action: 'start_trial' },
    ],
  },
  support: {
    reply: "Our engineering and customer support teams are on standby! Please describe what you need help with and enter your email so we can send our reply directly to your inbox.",
    actions: [
      { label: '🎫 Submit Support Inquiry', action: 'support_inquiry' },
    ],
  },
  sales: {
    reply: "Enterprise teams get dedicated database isolation, SSO/SAML 2.0, audit logs, and 99.99% uptime SLA. Feel free to leave your name & company email, and our sales team will reach out promptly.",
  },
  start_trial: {
    reply: "Awesome! You can create your free organization workspace in under 60 seconds without a credit card.",
  },
};

export default function SupportChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Visitor identity & conversation thread
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [isContactSaved, setIsContactSaved] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [activeConvPubId, setActiveConvPubId] = useState<string | null>(null);
  const [pendingMessageText, setPendingMessageText] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to persist messages safely to localStorage
  const persistMessages = (msgs: ChatMessage[]) => {
    try {
      localStorage.setItem('nexora_chat_messages', JSON.stringify(msgs));
    } catch {
      // Ignore storage errors
    }
  };

  // 1. Restore saved visitor state, conversation ID, and messages from localStorage
  useEffect(() => {
    setMounted(true);
    try {
      const savedEmail = localStorage.getItem('nexora_visitor_email');
      const savedName = localStorage.getItem('nexora_visitor_name');
      const savedConv = localStorage.getItem('nexora_conv_pub_id') || sessionStorage.getItem('nexora_conv_pub_id');
      const savedMsgs = localStorage.getItem('nexora_chat_messages');

      if (savedEmail) {
        setVisitorEmail(savedEmail);
        setIsContactSaved(true);
      }
      if (savedName) setVisitorName(savedName);
      if (savedConv) setActiveConvPubId(savedConv);

      if (savedMsgs) {
        try {
          const parsed = JSON.parse(savedMsgs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch {}
      }
    } catch {
      // Ignore storage access errors
    }
  }, []);

  // 2. Poll for agent replies from backend if active conversation exists
  const fetchThreadUpdates = useCallback(async (convPubId: string) => {
    if (!convPubId) return;
    try {
      let backendMessages: any[] = [];

      // Try publicConversation query first
      try {
        const res = await graphqlRequest<{ publicConversation?: any }>(
          `query GetPublicConversation($pubId: String!) {
            publicConversation(pubId: $pubId) {
              messages {
                pubId
                content
                type
                sender {
                  fullName
                  email
                }
                createdAt
              }
            }
          }`,
          { pubId: convPubId }
        );
        if (res?.publicConversation?.messages) {
          backendMessages = res.publicConversation.messages;
        }
      } catch {
        // Fallback to conversation query
        try {
          const res = await graphqlRequest<{ conversation?: any }>(
            `query GetConversation($pubId: String!) {
              conversation(pubId: $pubId) {
                messages {
                  pubId
                  content
                  type
                  sender {
                    fullName
                    email
                  }
                  createdAt
                }
              }
            }`,
            { pubId: convPubId }
          );
          if (res?.conversation?.messages) {
            backendMessages = res.conversation.messages;
          }
        } catch {
          // Both queries failed (e.g. requires public query decorator in backend)
        }
      }

      if (backendMessages && backendMessages.length > 0) {
        setMessages((current) => {
          let hasNewAgentMessage = false;
          const updated = [...current];

          backendMessages.forEach((bm) => {
            const isAgent = Boolean(bm.sender);
            const alreadyExists = updated.some(
              (m) => m.id === bm.pubId || (m.text === bm.content && m.sender === (isAgent ? 'agent' : 'user'))
            );

            if (!alreadyExists) {
              if (isAgent) {
                hasNewAgentMessage = true;
              }
              updated.push({
                id: bm.pubId,
                sender: isAgent ? 'agent' : 'user',
                text: bm.content,
                timestamp: new Date(bm.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                status: 'sent',
              });
            }
          });

          if (hasNewAgentMessage) {
            persistMessages(updated);
            return updated;
          }
          return current;
        });
      }
    } catch {
      // Ignore background poll errors
    }
  }, []);

  // 2. Realtime WebSocket Connection & Room Subscription
  useEffect(() => {
    if (!activeConvPubId) return;

    // Run initial fetch on thread activation
    fetchThreadUpdates(activeConvPubId);

    const socket = getSocket();
    const channel = `conversation:${activeConvPubId}`;

    const joinRoom = () => {
      socket.emit('join:channel', { channel });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
    }

    socket.on('connect', joinRoom);

    // Listen for real-time messages broadcast by the backend
    const handleMessageCreated = (payload: any) => {
      if (!payload) return;

      const isAgent = Boolean(payload.sender);
      const incomingId = payload.pubId || `msg-${payload.id || Date.now()}`;

      setMessages((current) => {
        const alreadyExists = current.some(
          (m) =>
            m.id === incomingId ||
            (m.text === payload.content && m.sender === (isAgent ? 'agent' : 'user'))
        );

        if (alreadyExists) return current;

        const newMsg: ChatMessage = {
          id: incomingId,
          sender: isAgent ? 'agent' : 'user',
          text: payload.content,
          timestamp: new Date(payload.createdAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: 'sent',
        };

        const updated = [...current, newMsg];
        persistMessages(updated);
        return updated;
      });

      if (isAgent && !isOpen) {
        setUnreadCount((c) => c + 1);
      }
    };

    socket.on('message:created', handleMessageCreated);

    return () => {
      socket.emit('leave:channel', { channel });
      socket.off('connect', joinRoom);
      socket.off('message:created', handleMessageCreated);
    };
  }, [activeConvPubId, fetchThreadUpdates, isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Backend submission to NestJS GraphQL sendPublicInquiry
  const submitToBackend = async (
    text: string,
    emailToUse: string,
    nameToUse: string
  ): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      const res = await graphqlRequest<{ sendPublicInquiry: PublicInquiryResponseDto }>(
        SEND_PUBLIC_INQUIRY_MUTATION,
        {
          input: {
            name: nameToUse.trim() || 'Website Visitor',
            email: emailToUse.trim(),
            content: text.trim(),
            conversationPubId: activeConvPubId || undefined,
          },
        }
      );

      if (res?.sendPublicInquiry?.success) {
        const newConvId = res.sendPublicInquiry.conversationPubId;
        if (newConvId) {
          setActiveConvPubId(newConvId);
          try {
            localStorage.setItem('nexora_conv_pub_id', newConvId);
            sessionStorage.setItem('nexora_conv_pub_id', newConvId);
          } catch {}
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Backend sendPublicInquiry error:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle customer sending a message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    persistMessages(newMessages);

    if (!textToSend) setInputVal('');

    // CASE 1: Visitor already provided their email -> Send directly to backend
    if (visitorEmail.trim()) {
      setIsTyping(true);
      const success = await submitToBackend(text, visitorEmail, visitorName);

      const updatedWithSent = newMessages.map((m) =>
        m.id === userMsgId ? { ...m, status: 'sent' as const } : m
      );

      // Only send confirmation on the very first message
      const alreadyConfirmed = messages.some(
        (m) =>
          m.text.includes('routed to our team support inbox') ||
          m.text.includes("created your thread in our Support Inbox")
      );

      if (!alreadyConfirmed && success) {
        setTimeout(() => {
          const botMsg: ChatMessage = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: `Thanks ${visitorName || 'there'}! Your message has been routed to our team support inbox. A team member will reply shortly.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          const finalMsgs = [...updatedWithSent, botMsg];
          setMessages(finalMsgs);
          persistMessages(finalMsgs);
          setIsTyping(false);
        }, 500);
      } else {
        setMessages(updatedWithSent);
        persistMessages(updatedWithSent);
        setIsTyping(false);
      }
      return;
    }

    // CASE 2: First-time visitor has no email yet -> Prompt for email to connect
    setPendingMessageText(text);
    setIsTyping(true);

    setTimeout(() => {
      const lower = text.toLowerCase();
      let replySnippet = "Thank you for reaching out! To ensure our support team can answer you and deliver the reply, please enter your name and email below:";

      if (lower.includes('price') || lower.includes('cost') || lower.includes('plan')) {
        replySnippet = `${BOT_RESPONSES.pricing.reply}\n\nPlease enter your email below to connect with our team:`;
      } else if (lower.includes('demo')) {
        replySnippet = `${BOT_RESPONSES.demo.reply}\n\nPlease enter your email below to schedule:`;
      }

      const promptMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replySnippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isEmailPrompt: true,
      };

      const finalMsgs = [...newMessages, promptMsg];
      setMessages(finalMsgs);
      persistMessages(finalMsgs);
      setIsTyping(false);
    }, 500);
  };

  // Submit contact info and transmit pending message
  const handleConnectAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail.trim()) return;

    try {
      localStorage.setItem('nexora_visitor_email', visitorEmail.trim());
      if (visitorName.trim()) {
        localStorage.setItem('nexora_visitor_name', visitorName.trim());
      }
    } catch {}

    setIsContactSaved(true);
    setShowContactForm(false);

    const textToSubmit = pendingMessageText || 'Customer connected from homepage chat widget';
    setIsTyping(true);

    const success = await submitToBackend(textToSubmit, visitorEmail, visitorName);

    const confirmationMsg: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'agent',
      text: success
        ? `✨ Connected! We've created your thread in our Support Inbox. Our team has been notified and will reply to ${visitorEmail.trim()}.`
        : `Thanks ${visitorName || 'there'}! We've saved ${visitorEmail.trim()} and linked your conversation.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const finalMsgs = [...messages, confirmationMsg];
    setMessages(finalMsgs);
    persistMessages(finalMsgs);

    setIsTyping(false);
    setPendingMessageText(null);
  };

  const handleActionClick = (actionKey: string) => {
    if (actionKey === 'start_trial') {
      window.location.href = '/register';
      return;
    }

    const matched = BOT_RESPONSES[actionKey];
    if (matched) {
      handleSendMessage(matched.actions?.[0]?.label || `I have a question about ${actionKey}`);
    }
  };

  const handleResetChat = () => {
    try {
      localStorage.removeItem('nexora_chat_messages');
      localStorage.removeItem('nexora_conv_pub_id');
      sessionStorage.removeItem('nexora_conv_pub_id');
    } catch {}
    setMessages(INITIAL_MESSAGES);
    setActiveConvPubId(null);
  };

  const handleToggleOpen = () => {
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  if (!mounted) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* 1. Minimized Trigger Bubble */}
      {!isOpen && (
        <button
          onClick={handleToggleOpen}
          aria-label="Open support chat"
          className="relative group p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center border border-indigo-400/40 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
        >
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-950"></span>
          </span>

          <MessageSquare className="w-6 h-6 text-white" />

          {unreadCount > 0 && (
            <span className="absolute -top-2 -left-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md font-mono">
              {unreadCount}
            </span>
          )}

          <div className="hidden group-hover:flex absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900/95 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl backdrop-blur-sm items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Chat with Nexora Support</span>
          </div>
        </button>
      )}

      {/* 2. Expanded Chat Box Window (Opens immediately on visit) */}
      {isOpen && (
        <div className="w-[calc(100vw-2.5rem)] sm:w-[380px] h-[520px] max-h-[calc(100vh-6rem)] bg-slate-950/95 border border-slate-800/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border-b border-slate-800/80 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm border border-indigo-400/30">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-950 rounded-full"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-100">Nexora Live Support</h3>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  {isContactSaved ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Connected as {visitorEmail}
                    </span>
                  ) : (
                    <span>Usually replies in &lt; 2 minutes</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={handleResetChat}
                title="Reset conversation"
                className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowContactForm(!showContactForm)}
                title="Edit your contact email"
                className={`p-1.5 rounded-lg transition-colors ${
                  isContactSaved
                    ? 'text-emerald-400 hover:bg-slate-800'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Mail className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
                className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contact Details Dropdown Banner */}
          {showContactForm && (
            <form
              onSubmit={handleConnectAndSend}
              className="p-3 bg-slate-900/95 border-b border-slate-800 text-xs space-y-2 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold">
                <span>Your contact email for dashboard replies:</span>
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-[11px] transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Save & Connect</span>
                </button>
              </div>
            </form>
          )}

          {/* Messages Feed */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              const isAgent = m.sender === 'agent';

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {isUser ? visitorName || 'You' : isAgent ? 'Support Team' : 'Nexora AI'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">{m.timestamp}</span>
                    {isUser && m.status === 'sent' && (
                      <span className="text-[9px] text-emerald-400 font-mono">✓ Sent</span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-line text-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs shadow-md'
                        : isAgent
                        ? 'bg-emerald-950/90 border border-emerald-800/80 text-emerald-100 rounded-bl-xs'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>

                  {/* Inline Email Capture Form if requested by bot */}
                  {m.isEmailPrompt && !isContactSaved && (
                    <div className="mt-2.5 w-full max-w-[95%] p-3 bg-slate-900 border border-indigo-500/40 rounded-xl shadow-lg space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Deliver my answer to:</span>
                      </div>
                      <form onSubmit={handleConnectAndSend} className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Your Name (optional)"
                            value={visitorName}
                            onChange={(e) => setVisitorName(e.target.value)}
                            className="w-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="email"
                            required
                            placeholder="name@company.com"
                            value={visitorEmail}
                            onChange={(e) => setVisitorEmail(e.target.value)}
                            className="w-1/2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!visitorEmail.trim() || isSubmitting}
                          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isSubmitting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Send & Connect to Support</span>
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Suggested quick action buttons */}
                  {m.suggestedActions && m.suggestedActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[90%]">
                      {m.suggestedActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleActionClick(action.action)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-950/80 border border-slate-800 hover:border-indigo-700/60 text-indigo-300 text-[11px] font-medium transition-all text-left flex items-center gap-1 shadow-sm"
                        >
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-900 border border-slate-800 w-fit text-slate-400 text-[11px]">
                <Bot className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Bar: Input and Send */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/90">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={
                  isContactSaved
                    ? `Reply as ${visitorEmail}...`
                    : 'Ask a question or type a message...'
                }
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isTyping || isSubmitting}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition-all shadow-md flex items-center justify-center"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" /> Live Support Connected
              </span>
              <Link
                href="/login"
                className="hover:text-indigo-400 transition-colors"
              >
                Dashboard Login &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
