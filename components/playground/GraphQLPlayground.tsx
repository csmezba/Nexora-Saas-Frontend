'use client';

import React, { useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';
import { Terminal, Play, Code2, Copy, Check } from 'lucide-react';

const SNIPPETS = [
  {
    label: 'Query me()',
    query: `query {
  me {
    pubId
    email
    fullName
    createdAt
  }
}`,
    variables: '{}',
  },
  {
    label: 'Query myOrganizations()',
    query: `query {
  myOrganizations {
    pubId
    name
    slug
    currentUserRole
    memberCount
  }
}`,
    variables: '{}',
  },
  {
    label: 'Query permissions()',
    query: `query {
  permissions {
    pubId
    resource
    action
    description
  }
}`,
    variables: '{}',
  },
  {
    label: 'Mutation login()',
    query: `mutation Login($input: LoginInput!) {
  login(input: $input) {
    accessToken
    user {
      pubId
      email
    }
  }
}`,
    variables: JSON.stringify(
      { input: { email: 'admin@example.com', password: 'password123' } },
      null,
      2
    ),
  },
  {
    label: 'Mutation createOrganization()',
    query: `mutation CreateOrg($input: CreateOrganizationInput!) {
  createOrganization(input: $input) {
    pubId
    name
    slug
    currentUserRole
  }
}`,
    variables: JSON.stringify(
      { input: { name: 'Sample Workspace', slug: 'sample-workspace' } },
      null,
      2
    ),
  },
];

export default function GraphQLPlayground() {
  const [query, setQuery] = useState<string>(SNIPPETS[0].query);
  const [variables, setVariables] = useState<string>(SNIPPETS[0].variables);
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleExecute = async () => {
    setLoading(true);
    setResponse('Executing request...');
    try {
      let parsedVars = {};
      if (variables.trim()) {
        parsedVars = JSON.parse(variables);
      }
      const data = await graphqlRequest(query, parsedVars);
      setResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-slate-900">
            GraphQL Interactive Runner & Payload Inspector
          </h3>
        </div>
      </div>

      {/* Snippets Shortcuts */}
      <div>
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider font-mono mb-2 block">
          Quick Request Snippets:
        </span>
        <div className="flex flex-wrap gap-2">
          {SNIPPETS.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                setQuery(s.query);
                setVariables(s.variables);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-mono border border-slate-200 transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Pane */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-mono text-slate-600 mb-1 font-semibold">
              GraphQL Query / Mutation String
            </label>
            <textarea
              rows={11}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-600 mb-1 font-semibold">
              Variables (JSON)
            </label>
            <textarea
              rows={4}
              value={variables}
              onChange={(e) => setVariables(e.target.value)}
              className="w-full p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-800"
            />
          </div>

          <button
            onClick={handleExecute}
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs rounded-lg transition-colors font-bold shadow-sm flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>{loading ? 'Executing Query...' : 'Run GraphQL Request'}</span>
          </button>
        </div>

        {/* Output Pane */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-mono text-slate-600 font-semibold">
              GraphQL Response Payload
            </label>
            {response && (
              <button
                onClick={copyResponse}
                className="text-[11px] font-mono text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </button>
            )}
          </div>
          <pre className="w-full h-[400px] p-3.5 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 font-mono text-xs overflow-auto">
            {response || '// Click "Run GraphQL Request" or select a snippet above to view backend response.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
