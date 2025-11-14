// src/store/chatStore.js

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  getFlows, // <--- La que trae todos
  getFlowById,
  createFlow as createFlowAPI,
  deleteFlow as deleteFlowAPI
} from '../services/flowService';
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
import {
  getTriggers,
  createTrigger,
  updateTrigger as updateTriggerAPI
} from '../services/flowTriggerService';

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
      templates: [],
      conversations: [],
      currentChatHistory: [],
      selectedConversationId: null,
      loadingMessages: false,
      isSendDisabled: false,
      schedules: [],
      loadingSchedules: false,
      companyId: null,
      flows: [],
      loadingFlows: false,
      currentEditingFlow: null,
      loadingCurrentFlow: false,
      triggers: [],
      loadingTriggers: false, 
      googleAuthStatus: null,

      setAuthData: (data) => {
        set({
          userData: data.userData,
          accessToken: data.accessToken,
          isAuthenticated: !!data.accessToken,
          companyId: data.userData?.number_id,
          googleAuthStatus: data.userData?.hasGoogleAuth ? 'connected' : null,
        });
      },

      setGoogleAuthStatus: (status) => {
        set({ googleAuthStatus: status });
      },

      setTemplates: (templatesArray) => {
        set({ templates: templatesArray || [] });
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
      fetchFlows: async () => {
        set({ loadingFlows: true });
        try {
          // Y aquí llama a 'getFlows' del servicio
          const flowsFromApi = await getFlows(); 
          set({ flows: flowsFromApi || [], loadingFlows: false });
        } catch (error) {
          console.error('Error fetching flows:', error);
          set({ loadingFlows: false });
        }
      },
      createNewFlow: async (name) => {
        try {
          const newFlow = await createFlowAPI(name);
          set((state) => ({
            flows: [...state.flows, newFlow],
          }));
          return newFlow;
        } catch (error) {
          console.error('Error creating flow:', error);
          throw error;
        }
      },

      // Esta acción llama a 'deleteFlowAPI'
      deleteFlow: async (flowId) => {
        try {
          console.log('Deleting flow with ID:', flowId);
          await deleteFlowAPI(flowId);
          set((state) => ({
            flows: state.flows.filter((f) => f.id !== flowId),
          }));
        } catch (error) {
          console.error('Error deleting flow:', error);
          throw error; // Lanza el error para que el toast lo atrape
        }
      },

      fetchFlowById: async (flowId) => {
        set({ loadingCurrentFlow: true, currentEditingFlow: null });
        
        // 1. Obtener la data mínima del flujo desde el estado local (la lista)
        const existingFlow = get().flows.find(f => f.id === flowId); 

        try {
          // 2. Intentar llamar a la API (Esto falla para flujos nuevos)
          const flowDetails = await getFlowById(flowId);
          
          const combinedFlowData = {
            ...existingFlow, 
            ...flowDetails,
          };

          set({ currentEditingFlow: combinedFlowData, loadingCurrentFlow: false });
        } catch (error) {
          // 3. Si la API falla, manejar el error
          console.error('Error fetching flow by ID:', error);
          
          // 4. Si tenemos la data mínima del flujo (nombre, ID, etc.), la usamos
          if (existingFlow) {
              set({ 
                  currentEditingFlow: existingFlow, 
                  loadingCurrentFlow: false 
              });
              console.warn(`[FlowStore] Fallback exitoso: La API falló, cargando editor con datos mínimos.`);
              return; // Salir exitosamente
          }
          
          // 5. Si no tenemos ni la data mínima, el error es grave, lo re-lanza o lo muestra
          set({ loadingCurrentFlow: false });
        }
      },
      
      clearCurrentEditingFlow: () => {
        set({ currentEditingFlow: null });
      },
      fetchTriggers: async () => {
        set({ loadingTriggers: true });
        try {
          const triggersFromApi = await getTriggers();
          set({ triggers: triggersFromApi || [], loadingTriggers: false });
        } catch (error) {
          console.error('Error fetching triggers:', error);
          set({ loadingTriggers: false });
        }
      },

      /**
       * Crea un nuevo trigger, lo añade al store y lo devuelve.
       */
      createNewTrigger: async (triggerData) => {
        try {
          const newTrigger = await createTrigger(triggerData);
          set((state) => ({
            triggers: [...state.triggers, newTrigger],
          }));
          return newTrigger;
        } catch (error) {
          console.error('Error creating trigger:', error);
          throw error; // Lanza el error para que el modal lo atrape
        }
      },

      /**
       * Actualiza un trigger en el store.
       */
      updateTrigger: async (triggerId, updateData) => {
        try {
          // 1. Llama a la API para guardar los cambios
          await updateTriggerAPI(triggerId, updateData);

          // 2. ¡LA SOLUCIÓN! Vuelve a llamar a fetchTriggers
          //    Usamos get() para llamar a otra acción dentro del store.
          await get().fetchTriggers();

        } catch (error) {
          console.error('Error updating trigger:', error);
          throw error; // Lanza el error para que el modal lo atrape
        }
      },
    }),
    {
      name: "orvex-chat-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        userData: state.userData,
        accessToken: state.accessToken,
        templates: state.templates,
        companyId: state.companyId,
        googleAuthStatus: state.googleAuthStatus,
      }),
      onRehydrateStorage: () => (state) => {
      },
    }
  )
);