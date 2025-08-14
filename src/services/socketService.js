// src/services/socketService.js

import { io } from 'socket.io-client';

let socket;
const listeners = new Map();

export function initSocket(url) {
  if (socket) return socket;

  // ✅ ¡CORRECCIÓN CRUCIAL AQUÍ!
  // Le decimos al cliente de Socket.IO que use la misma ruta que el backend.
  socket = io(url, {
    path: '/socket', 
  });
  
  socket.on('connect', () => {
    console.log('¡Conectado al servidor de Socket.IO!');
  });

  socket.on('disconnect', () => {
    console.log('Desconectado del servidor de Socket.IO.');
  });
  
  socket.on('newMessage', (message) => {
    try {
      const { from } = message;
      
      const handlers = listeners.get(from) || [];
      handlers.forEach((fn) => fn(message));
    } catch (err) {
      console.error('Error procesando el mensaje del websocket', err);
    }
  });

  return socket;
}

export function subscribe(chatId, handler) {
  if (!listeners.has(chatId)) {
    listeners.set(chatId, []);
  }
  listeners.get(chatId).push(handler);
  if (socket) {
    socket.emit('subscribeToChat', chatId);
  }
}

export function unsubscribe(chatId, handler) {
  const handlers = listeners.get(chatId);
  if (!handlers) return;
  listeners.set(chatId, handlers.filter((h) => h !== handler));
}

export function sendSocketMessage(payload) {
  if (!socket || !socket.connected) return;
  socket.emit('clientMessage', payload);
}