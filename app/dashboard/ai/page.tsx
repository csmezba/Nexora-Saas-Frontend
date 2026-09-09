'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RefreshCw,
  Zap,
  BookOpen,
  CheckSquare,
  BarChart3,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  citation?: string;
}

const PROMPT_CHIPS = [
  'Summarize this week\'s project activity',
  'Find overdue tasks in engineering team',
  'Analyze project velocity and health',
  'Draft customer response for SAML SSO inquiry',
  'Generate FAQ from knowledge base documents',
];

export default function AIAssistantPage() {
  const { selectedOrgSlug } = useAuthStore();
  const orgSlug = selectedOrgSlug || 'acme';

  const [inputPrompt, setInputPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'ai',
      text: `Hello! I am your AI Workspace Assistant for **${orgSlug.toUpperCase()}**. I can analyze tasks, generate summaries, search your knowledge base, and answer questions across your entire organization.`,
      timestamp: '10:00 AM',
    },
  ]);

  const handleSendPrompt = (textToSend?: string) => {
    const queryText = textToSend || inputPrompt;
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');

    // Simulate AI response
    setTimeout(() => {
      let aiResponseText = `Here is the analysis for **"${queryText}"** across workspace **/${orgSlug}**:\n\n- **Project Velocity**: 85% completion on AI Platform Core.\n- **Open Blockers**: 2 tasks in review.\n- **Recommendation**: Assign additional frontend engineers to Support Portal redesign.`;
      
      if (queryText.includes('overdue')) {
        aiResponseText = `Found 1 task approaching deadline:\n\n1. **TASK-101**: Configure GraphQL JWT auth guards (Due Sep 12) - Assigned to Alex Rivera.`;
      }

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citation: 'Source: Nexora Workspace Index & Knowledge Base',
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  const copyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] font-sans text-slate-100 flex flex-col space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>AI Workspace Assistant</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                GPT-4o Grounded
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Query workspace data, synthesize reports, and automate workflows in <span className="text-slate-200">/{orgSlug}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Tokens Used: 142.8k / 500k</span>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-0">
        {/* Messages Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm ${
                  msg.sender === 'ai'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {msg.sender === 'ai' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none font-mono whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.citation && (
                  <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1 px-1">
                    <BookOpen className="w-3 h-3 text-indigo-400" />
                    <span>{msg.citation}</span>
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1 pt-0.5">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => copyText(msg.id, msg.text)}
                      className="hover:text-slate-300 flex items-center gap-1"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prompt Chips Bar */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 overflow-x-auto flex gap-2">
          {PROMPT_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSendPrompt(chip)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-full text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 font-sans"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{chip}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask anything about tasks, projects, customers, or workspace analytics..."
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-sans"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
            <span>Ask AI</span>
          </button>
        </form>
      </div>
    </div>
  );
}
