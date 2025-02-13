import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: any;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8001';

export const useWebSocket = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  lastMessage: null,

  connect: () => {
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      set({ isConnected: false });
    });

    socket.on('message', (message) => {
      console.log('Received message:', message);
      set({ lastMessage: message });
    });

    socket.on('analysis', (data) => {
      console.log('Received analysis:', data);
      // Handle analysis data
    });

    socket.on('state_update', (data) => {
      console.log('Received state update:', data);
      // Handle state update
    });

    socket.on('monte_carlo_update', (data) => {
      console.log('Received Monte Carlo update:', data);
      // Handle Monte Carlo update
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  sendMessage: (message: string) => {
    const { socket } = get();
    if (socket) {
      socket.emit('message', { text: message });
    }
  },
}));

// Custom hook for WebSocket events
export function useWebSocketEvent<T>(
  eventName: string,
  callback: (data: T) => void
) {
  const { socket } = useWebSocket();

  useEffect(() => { 
    if (!socket) return;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, eventName, callback]);
}

// WebSocket event types
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface AnalysisData {
  score: number;
  message: string;
  alternatives: Array<{
    message: string;
    score: number;
  }>;
}

export interface StateUpdate {
  dots: Array<{
    x: number;
    y: number;
    active: boolean;
  }>;
}

export interface MonteCarloUpdate {
  dots: Array<{
    x: number;
    y: number;
    state: 'success' | 'warning' | 'error' | 'neutral';
  }>;
}

// Initialize WebSocket connection
export function initializeWebSocket() {
  const { connect } = useWebSocket();
  connect();
}

// Cleanup WebSocket connection
export function cleanupWebSocket() {
  const { disconnect } = useWebSocket();
  disconnect();
} 