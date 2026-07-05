import { useContext, useEffect, useRef } from 'react';
import OpdSocketContext from './opd-socket-context';

export const useOpdSocket = () => useContext(OpdSocketContext);

// Subscribes to a live OPD event for the lifetime of the calling component.
// Handler doesn't need to be stable across renders - we always re-bind to
// the latest handler via a ref instead of re-subscribing the socket.
export const useOpdSocketEvent = (event, handler) => {
  const { socket } = useContext(OpdSocketContext) || {};
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket || !event) return;
    const listener = (payload) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
};
