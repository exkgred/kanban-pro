import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(accessToken: string): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001/realtime', {
      auth: { token: accessToken },
      autoConnect: false,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
