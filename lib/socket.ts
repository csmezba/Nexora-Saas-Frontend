import { io, Socket } from 'socket.io-client';
import { getBackendUrl } from './graphql-client';

export const getSocketBaseUrl = (): string => {
  const backendUrl = getBackendUrl();
  return backendUrl.replace(/\/graphql\/?$/, '');
};

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (typeof window === 'undefined') {
    // Return mock or dummy on server
    return {} as Socket;
  }

  if (!socketInstance) {
    const url = getSocketBaseUrl();
    socketInstance = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }

  return socketInstance;
};
