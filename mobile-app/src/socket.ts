import { io, Socket } from 'socket.io-client';
import { API_URL } from './config';

let socket: Socket | null = null;
export const getSocket = (): Socket => {
  if (!socket) socket = io(API_URL, { transports: ['websocket'] });
  return socket;
};
export const closeSocket = () => {
  socket?.disconnect();
  socket = null;
};
