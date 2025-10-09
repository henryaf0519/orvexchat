// src/store/chatStore.js

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getChats,
  getMessages,
  sendMessage as sendMessageAPI,
  updateChatMode as updateChatModeAPI,
} from "../services/chatService";

import {
  getSchedules,
  createSchedule,
  deleteSchedule,
  getContacts
} from "../services/reminderService";

const sortConversations = (conversations) => {
  return conversations.sort((a, b) => {
    if (!a.lastMessage?.SK) return 1;
    if (!b.lastMessage?.SK) return -1;
    return (
      new Date(b.lastMessage.SK.split("#")[1]) -
      new Date(a.lastMessage.SK.split("#")[1])
    );
  });
};

export const useChatStore = create(
  persist(
    (set, get) => ({
      userData: null,
      isAuthenticated: false,
      accessToken: null,
      templates: new Map(),
      conversations: [],
      currentChatHistory: [],
      selectedConversationId: null,
      loadingMessages: false,
      isSendDisabled: false,
      schedules: [],
      loadingSchedules: false,
      companyId: null,

      setAuthData: (data) => {
        set({
          userData: data.userData,
          accessToken: data.accessToken,
          isAuthenticated: !!data.accessToken,
          companyId: data.userData?.number_id,
        });
      },

      setTemplates: (templatesArray) => {
        const templatesMap = new Map(templatesArray.map((t) => [t.name, t]));
        set({ templates: templatesMap });
      },

      fetchConversations: async () => {
        const companyId = get().companyId;
        if (!companyId) return;

        const contactList = await getContacts();
        const conversationsWithDetails = await Promise.all(
          contactList.map(async (contact) => {
            const compositeId = `${companyId}#${contact.id}`;
            const messages = await getMessages(compositeId);
            const lastMessage = messages[messages.length - 1] || null;
            return {
              ...contact,
              id: compositeId,
              hasUnread: false,
              modo: contact.modo || "IA",
              lastMessage,
            };
          })
        );
        const sortedConversations = sortConversations(conversationsWithDetails);
        set({ conversations: sortedConversations });
      },

      selectConversation: async (conversationId) => {
        if (get().selectedConversationId === conversationId) return;
        set({
          selectedConversationId: conversationId,
          loadingMessages: true,
          currentChatHistory: [],
        });
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, hasUnread: false } : c
          ),
        }));
        const messages = await getMessages(conversationId);
        set({ currentChatHistory: messages, loadingMessages: false });

        const selectedChat = get().conversations.find(
          (c) => c.id === conversationId
        );
        const isHumanControl = selectedChat?.modo === "humano";

        if (isHumanControl) {
          const lastMessage = messages[messages.length - 1];
          set({
            isSendDisabled: lastMessage ? (lastMessage.from === "agent" || lastMessage.from === "IA") : false,
          });
        } else {
          set({ isSendDisabled: true });
        }
      },
      
      handleNewNotification: (data) => {
        const { conversationId, message } = data;
        const companyId = get().companyId;
        const compositeId = `${companyId}#${conversationId}`;

        set((state) => {
          let conversationExists = false;
          let updatedConversations = state.conversations.map((conv) => {
            if (conv.id === compositeId) {
              conversationExists = true;
              const isSelected = state.selectedConversationId === compositeId;
              return { ...conv, hasUnread: !isSelected, lastMessage: message };
            }
            return conv;
          });
          if (!conversationExists) {
            updatedConversations.push({
              id: compositeId,
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
        set((state) => ({
          currentChatHistory: [...state.currentChatHistory, message],
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
        
        // Deshabilita el input inmediatamente después de enviar
        set({ isSendDisabled: true });
      },

      updateChatMode: async (newMode) => {
        const chatId = get().selectedConversationId;
        if (!chatId) return;
        try {
          await updateChatModeAPI(chatId, newMode);

          if (newMode === 'humano') {
            const history = get().currentChatHistory;
            const lastMessage = history.length > 0 ? history[history.length - 1] : null;
            // La caja de texto estará deshabilitada si el último mensaje fue de un agente.
            const shouldBeDisabled = lastMessage ? lastMessage.from === 'agent' || lastMessage.from === 'IA' : false;
            set({ isSendDisabled: shouldBeDisabled });
          } else {
            set({ isSendDisabled: true });
          }

          set((state) => ({
            conversations: state.conversations.map((chat) =>
              chat.id === chatId ? { ...chat, modo: newMode } : chat
            ),
          }));
        } catch (error) {
          console.error("Error al cambiar el modo del chat:", error);
        }
      },

      updateSendDisabledOnNewMessage: (message) => {
        const selectedChat = get().conversations.find(
          (c) => c.id === get().selectedConversationId
        );
        // Habilita el input si estamos en modo humano y el mensaje NO es de un agente o IA.
        if (selectedChat?.modo === "humano" && message.from !== "agent" && message.from !== "IA") {
          set({ isSendDisabled: false });
        }
      },
      
      // ... (resto de las funciones de reminders, etc.)
      fetchSchedules: async () => {
        set({ loadingSchedules: true });
        try {
          const schedulesFromApi = await getSchedules();
          set({ schedules: schedulesFromApi, loadingSchedules: false });
        } catch (error) {
          console.error("Error fetching schedules:", error);
          set({ loadingSchedules: false });
        }
      },
      createSchedule: async (scheduleData) => {
        const newSchedule = await createSchedule(scheduleData);
        set((state) => ({
          schedules: [...state.schedules, newSchedule],
        }));
      },
      deleteSchedule: async (scheduleId) => {
        await deleteSchedule(scheduleId);
        set((state) => ({
          schedules: state.schedules.filter((s) => s.scheduleId !== scheduleId),
        }));
      },
    }),
    {
      name: "orvex-chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userData: state.userData,
        accessToken: state.accessToken,
        templates: Array.from(state.templates.entries()),
        companyId: state.companyId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.templates) {
          state.templates = new Map(state.templates);
        }
      },
    }
  )
);