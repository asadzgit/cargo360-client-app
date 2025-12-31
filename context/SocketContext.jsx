import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import io from 'socket.io-client';
import { API_BASE_URL, getAccessToken } from '../services/api';
import { useNotification } from './NotificationContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const connectSocketRef = useRef(null);
  const { showNotification } = useNotification();

  const handleNotification = useCallback((notification) => {
    // Show styled notification
    const { title, body } = notification;
    
    showNotification({
      title: title || 'Notification',
      body: body || 'You have a new notification',
    });
  }, [showNotification]);

  const connectSocket = useCallback(async () => {
    try {
      // Don't connect if already connected
      if (socketRef.current?.connected) {
        return;
      }

      // Get access token
      const token = await getAccessToken();
      if (!token) {
        // No token, disconnect if connected
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setIsConnected(false);
        return;
      }

      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Create new socket connection
      const socket = io(API_BASE_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('[Socket] Connected to real-time notifications');
        setIsConnected(true);
        
        // Clear any pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      });

      socket.on('connected', (data) => {
        console.log('[Socket] Server confirmed connection:', data);
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        setIsConnected(false);
        
        // Only attempt reconnection if it's not a manual disconnect
        if (reason !== 'io client disconnect') {
          // Try to reconnect after a delay
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocketRef.current?.();
          }, 3000);
        }
      });

      socket.on('error', (error) => {
        console.error('[Socket] Error:', error);
      });

      socket.on('connect_error', async (error) => {
        console.error('[Socket] Connection error:', error);
        
        // If authentication failed, try to get a new token
        if (error.message === 'Authentication failed' || error.message?.includes('401')) {
          // Token might be expired, try reconnecting after a short delay
          // The token refresh will be handled by the API interceptor
          setTimeout(() => {
            connectSocketRef.current?.();
          }, 2000);
        }
      });

      // Listen for notifications
      socket.on('notification', (notification) => {
        console.log('[Socket] New notification received:', notification);
        handleNotification(notification);
      });
    } catch (error) {
      console.error('[Socket] Failed to connect:', error);
      setIsConnected(false);
    }
  }, [handleNotification]);

  // Store connectSocket in ref so it can be accessed in useEffect
  connectSocketRef.current = connectSocket;

  // Connect when component mounts and user has token
  useEffect(() => {
    connectSocketRef.current?.();

    // Periodically check for token and reconnect if not connected
    // This handles the case when user logs in after the component mounts
    const tokenCheckInterval = setInterval(() => {
      if (!socketRef.current?.connected) {
        connectSocketRef.current?.();
      }
    }, 5000); // Check every 5 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(tokenCheckInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connectSocket]);

  // Expose socket instance and connection status
  const value = {
    socket: socketRef.current,
    isConnected,
    connectSocket,
    disconnectSocket: () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    },
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

