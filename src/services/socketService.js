// src/services/socketService.js

import { io } from 'socket.io-client';

let socket;
const Socket_URL = import.meta.env.VITE_API_BASE_URL;;

export function initSocket() {
  if (socket) return socket;

  socket = io(Socket_URL, {
    path: '/socket',
  });

  socket.on('connect', () => {
    console.log('¡Conectado al servidor de Socket.IO!');
  });
  
  return socket;
}

// ✅ Función para decirle al backend que nos suscriba a una sala.
export function subscribeToChat(chatId) {
  if (socket && socket.connected) {
    socket.emit('subscribeToChat', chatId);
  }
}

// ✅ Función para decirle al backend que nos desuscriba de una sala.
export function unsubscribeFromChat(chatId) {
  if (socket && socket.connected) {
    socket.emit('unsubscribeFromChat', chatId);
  }
}