import { useAuthStore } from '@/store/useAuthStore';

export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    const customUrl = useAuthStore.getState().backendUrl;
    if (customUrl) return customUrl;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/graphql';
};

export interface GraphQLErrorItem {
  message: string;
  statusCode?: number;
  [key: string]: any;
}

export async function graphqlRequest<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const url = getBackendUrl();
  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP Error ${response.status}: ${text || response.statusText}`);
  }

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    const errorMsg = result.errors.map((e: GraphQLErrorItem) => e.message).join(' | ');
    throw new Error(errorMsg);
  }

  return result.data as T;
}

export async function checkBackendConnection(): Promise<{ ok: boolean; message: string }> {
  const url = getBackendUrl();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'query ConnectionCheck { __typename }' }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.data || data.errors) {
        return { ok: true, message: 'Backend connected' };
      }
    }
    return { ok: false, message: `Status ${res.status}: ${res.statusText}` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to connect to backend server' };
  }
}
