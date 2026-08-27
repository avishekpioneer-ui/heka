import { useContext, useEffect, useRef } from 'react';
import OpdSocketContext from './opd-socket-context';

export const useOpdSocket = () => useContext(OpdSocketContext);

// Subscribes to a live OPD event for the lifetime of the calling component.
export const useOpdSocketEvent = (event, handler) => {
  const context = useContext(OpdSocketContext);
  const socket = context?.socket;
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket || !event) return;
    const listener = (payload) => {
      if (handlerRef.current) {
        handlerRef.current(payload);
      }
    };
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
};
