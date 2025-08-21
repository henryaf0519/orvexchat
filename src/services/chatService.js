// src/services/chatService.js

import { apiFetch } from './api'; // Importa nuestro interceptor centralizado

/**
 * Obtiene la lista de todas las conversaciones.
 */
export async function getChats() {
  try {
    const response = await apiFetch('/dynamo/conversations'); 
    if (!response.ok) {
      throw new Error('Error al obtener la lista de conversaciones.');
    }
    const conversationIds = await response.json();
    return conversationIds.map((id) => ({
      id: id,
      name: id,
      messages: [],
    }));
  } catch (error) {
    console.error('Fallo en getChats:', error);
    return [];
  }
}

/**
 * Envía un mensaje a una conversación específica.
 */
export async function sendMessage(chatId, text) {
  try {
    const response = await apiFetch('/dynamo/message', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: chatId,
        from: 'agent',
        text: text,
        messageId: `sent-${Date.now()}`,
        status: 'SENT',
        type: 'text',
      }),
    });
    if (!response.ok) {
      throw new Error('Error al enviar el mensaje.');
    }
    return await response.json();
  } catch (error) {
    console.error('Fallo en sendMessage:', error);
    return null;
  }
}

/**
 * Obtiene todos los mensajes de una conversación.
 */
export async function getMessages(chatId) {
  try {
    const response = await apiFetch(`/dynamo/messages/${chatId}`);
    if (!response.ok) {
      throw new Error('Error al obtener los mensajes de la conversación.');
    }
    return await response.json();
  } catch (error) {
    console.error('Fallo en getMessages:', error);
    return [];
  }
}

/**
 * Actualiza el modo de control de un chat (IA o humano).
 */
export async function updateChatMode(chatId, newMode) {
  try {
    const response = await apiFetch(`/dynamo/control/${chatId}`, {
      method: 'POST',
      body: JSON.stringify({ newMode }),
    });
    if (!response.ok) {
      throw new Error('Error al actualizar el modo del chat.');
    }
    return await response.json();
  } catch (error) {
    console.error('Fallo en updateChatMode:', error);
    return null;
  }
}