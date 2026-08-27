import { createContext } from 'react';

const OpdSocketContext = createContext({
  socket: null,
  connected: false,
});

export default OpdSocketContext;
