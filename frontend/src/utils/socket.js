import { io } from 'socket.io-client';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function connectSocket(token) {
  return io(BASE, { auth: { token }, transports: ['websocket', 'polling'] });
}

export const emitAsync = (socket, event, payload) =>
  new Promise((resolve, reject) => {
    socket.timeout(8000).emit(event, payload, (err, res) => {
      if (err) return reject(new Error('Máy chủ không phản hồi'));
      if (res?.error) return reject(new Error(res.error));
      resolve(res || {});
    });
  });
