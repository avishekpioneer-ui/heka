import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import OpdSocketContext from './opd-socket-context';

export const OpdSocketProvider = ({ userId, children }) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const socket = io((import.meta.env.VITE_BACKEND_URI || 'http://localhost:5001').replace(/\/$/, ''), {
      path: '/api/opd/socket.io',
      auth: { userId }
    });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

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
