// src/store/chatStore.js

import { create } from 'zustand';
import { getChats, getMessages, sendMessage as sendMessageAPI, updateChatMode as updateChatModeAPI } from '../services/chatService';

// Función auxiliar para ordenar conversaciones
const sortConversations = (conversations) => {
  return conversations.sort((a, b) => {
    if (!a.lastMessage?.SK) return 1;
    if (!b.lastMessage?.SK) return -1;
    return new Date(b.lastMessage.SK.split('#')[1]) - new Date(a.lastMessage.SK.split('#')[1]);
  });
};

export const useChatStore = create((set, get) => ({
  // ✅ ESTADO
  conversations: [],
  currentChatHistory: [],
  selectedConversationId: null,
  loadingMessages: false,
  isSendDisabled: false,

  // ✅ ACCIONES (Funciones que modifican el estado)
  fetchConversations: async () => {
    const chatList = await getChats();
    const conversationsWithDetails = await Promise.all(
      chatList.map(async (chat) => {
        const messages = await getMessages(chat.id);
        const lastMessage = messages[messages.length - 1] || null;
        return { ...chat, hasUnread: false, modo: "IA", lastMessage };
      })
    );
    const sortedConversations = sortConversations(conversationsWithDetails);
    set({ conversations: sortedConversations });
  },

  selectConversation: async (conversationId) => {
    if (get().selectedConversationId === conversationId) return;

    set({ selectedConversationId: conversationId, loadingMessages: true, currentChatHistory: [] });
    
    // Marcar la conversación como leída
    set(state => ({
        conversations: state.conversations.map(c => 
            c.id === conversationId ? { ...c, hasUnread: false } : c
        )
    }));
    
    const messages = await getMessages(conversationId);
    set({ currentChatHistory: messages, loadingMessages: false });
    
    // Lógica para deshabilitar el envío (ahora centralizada aquí)
    const selectedChat = get().conversations.find(c => c.id === conversationId);
    const isHumanControl = selectedChat?.modo === 'humano';
    if (isHumanControl) {
        const lastMessage = messages[messages.length - 1];
        set({ isSendDisabled: lastMessage ? lastMessage.from === 'agent' : false });
    } else {
        set({ isSendDisabled: true });
    }
  },

  handleNewNotification: (data) => {
    const { conversationId, message } = data;
    set(state => {
      let conversationExists = false;
      let updatedConversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          conversationExists = true;
          // Si el chat está seleccionado, no lo marcamos como no leído
          const isSelected = state.selectedConversationId === conversationId;
          return { ...conv, hasUnread: !isSelected, lastMessage: message };
        }
        return conv;
      });

      if (!conversationExists) {
        updatedConversations.push({
          id: conversationId,
          name: conversationId,
          hasUnread: true,
          modo: "IA",
          lastMessage: message,
        });
      }
      
      return { conversations: sortConversations(updatedConversations) };
    });
  },

  addMessageToHistory: (message) => {
    set(state => ({
      currentChatHistory: [...state.currentChatHistory, message]
    }));
  },
  
  sendMessage: async (text) => {
    const chatId = get().selectedConversationId;
    if (!chatId || get().isSendDisabled) return;

    const result = await sendMessageAPI(chatId, text);
    const newMessage = {
      id_mensaje_wa: result.id_mensaje_wa || `temp-${Date.now()}`,
      text,
      from: "agent",
      estado: "SENT",
      type: "text",
      SK: `MESSAGE#${new Date().toISOString()}`,
    };

    get().addMessageToHistory(newMessage);

    const selectedChat = get().conversations.find(c => c.id === chatId);
    if (selectedChat?.modo === 'humano') {
      set({ isSendDisabled: true });
    }
  },
  
  updateChatMode: async (newMode) => {
      const chatId = get().selectedConversationId;
      if (!chatId) return;
      
      try {
          await updateChatModeAPI(chatId, newMode);
          set(state => ({
              conversations: state.conversations.map(chat =>
                  chat.id === chatId ? { ...chat, modo: newMode } : chat
              )
          }));
      } catch (error) {
          console.error("Error al cambiar el modo del chat:", error);
      }
  },
  
  // Para actualizar el estado de isSendDisabled cuando llega un nuevo mensaje del cliente
  updateSendDisabledOnNewMessage: (message) => {
      const selectedChat = get().conversations.find(c => c.id === get().selectedConversationId);
      if (selectedChat?.modo === 'humano' && message.from !== 'agent') {
          set({ isSendDisabled: false });
      }
  }

  
}));
