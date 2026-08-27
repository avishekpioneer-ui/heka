import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import OpdSocketContext from './opd-socket-context';
import { BACKEND_URI } from '../config/api';

export const OpdSocketProvider = ({ userId, children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const cleanUri = (BACKEND_URI || 'http://localhost:5001').replace(/\/$/, '');
    const socket = io(cleanUri, {
      path: '/api/opd/socket.io',
      auth: { userId },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Mobile Socket.IO connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Mobile Socket.IO disconnected:', reason);
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Mobile Socket.IO connect error:', err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  return (
    <OpdSocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </OpdSocketContext.Provider>
  );
};

export default OpdSocketProvider;
