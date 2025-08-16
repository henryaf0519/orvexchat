// src/components/ChatPage.jsx

import { useEffect, useState } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import MainSidebar from "../components/MainSidebar";
import MainHeader from "../components/MainHeader";
import { getChats, getMessages, sendMessage } from "../services/chatService";
import {
  initSocket,
  subscribeToChat,
  unsubscribeFromChat,
} from "../services/socketService";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [currentChatHistory, setCurrentChatHistory] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isSendDisabled, setIsSendDisabled] = useState(false);
  const [socket, setSocket] = useState(null);

  const selectedChat = conversations.find(
    (conv) => conv.id === selectedConversationId
  );
  const isHumanControl = selectedChat?.modo === "humano";

  useEffect(() => {
    const newSocket = initSocket("http://localhost:3000");
    setSocket(newSocket);
    getChats().then((data) => {
      setConversations(
        data.map((c) => ({ ...c, hasUnread: false, modo: "IA" }))
      );
    });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      const { conversationId } = data;
      setConversations((prevConversations) => {
        const conversationExists = prevConversations.some(
          (c) => c.id === conversationId
        );
        if (conversationExists) {
          return prevConversations.map((chat) =>
            chat.id === conversationId ? { ...chat, hasUnread: true } : chat
          );
        } else {
          const newChat = {
            id: conversationId,
            name: conversationId,
            hasUnread: true,
            modo: "IA",
          };
          return [newChat, ...prevConversations];
        }
      });
    };

    socket.on("newNotification", handleNotification);

    return () => {
      socket.off("newNotification", handleNotification);
    };
  }, [socket, selectedConversationId]);

  useEffect(() => {
    if (!socket || !selectedConversationId) {
      setCurrentChatHistory([]);
      setIsSendDisabled(false);
      return;
    }

    subscribeToChat(selectedConversationId);

    const handleActiveChatUpdate = (message) => {
      setCurrentChatHistory((prevHistory) => {
        const updatedHistory = [...prevHistory, message];
        // ✅ Lógica de habilitación/deshabilitación del botón
        if (isHumanControl) {
          // Si estamos en modo humano, el botón se habilita si el mensaje es del cliente,
          // y se deshabilita si es nuestro (el agente)
          setIsSendDisabled(message.from === "agent");
        } else {
          // Si estamos en modo IA, el botón SIEMPRE está deshabilitado
          setIsSendDisabled(true);
        }
        return updatedHistory;
      });
    };
    socket.on("newMessage", handleActiveChatUpdate);

    getMessages(selectedConversationId).then((messages) => {
      setCurrentChatHistory(messages);
      if (isHumanControl) {
        // En modo humano, revisamos el último mensaje para determinar el estado inicial
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          setIsSendDisabled(lastMessage.from === "agent");
        } else {
          setIsSendDisabled(false); // Habilitar si la conversación está vacía en modo humano
        }
      } else {
        // En modo IA, el botón está siempre deshabilitado
        setIsSendDisabled(true);
      }
    });

    return () => {
      unsubscribeFromChat(selectedConversationId);
      socket.off("newMessage", handleActiveChatUpdate);
    };
  }, [socket, selectedConversationId, isHumanControl]);

  const handleSend = async (text) => {
    if (!selectedConversationId || isSendDisabled) return;

    const result = await sendMessage(selectedConversationId, text);
    const newMessage = {
      id_mensaje_wa: result.id_mensaje_wa || `temp-${Date.now()}`,
      text: text,
      from: "agent",
      estado: "SENT",
      type: "text",
      SK: `MESSAGE#${new Date().toISOString()}`,
    };

    setCurrentChatHistory((prev) => [...prev, newMessage]);
    // ✅ Deshabilitamos el botón inmediatamente si estamos en modo humano para esperar la respuesta del cliente
    if (isHumanControl) {
      setIsSendDisabled(true);
    }
  };

  const handleChatClick = (conversationId) => {
    setSelectedConversationId(conversationId);
    setConversations((prevConversations) =>
      prevConversations.map((chat) =>
        chat.id === conversationId ? { ...chat, hasUnread: false } : chat
      )
    );
  };

  const updateChatMode = async (newMode) => {
    if (!selectedConversationId) return;

    try {
      await fetch(
        `http://localhost:3000/dynamo/control/${selectedConversationId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newMode }),
        }
      );

      setConversations((prevConversations) =>
        prevConversations.map((chat) =>
          chat.id === selectedConversationId ? { ...chat, modo: newMode } : chat
        )
      );
      console.log(
        `Modo del chat de ${selectedConversationId} actualizado a: ${newMode}`
      );
    } catch (error) {
      console.error("Error al cambiar el modo del chat:", error);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* 1. Main Sidebar (barra azul de la izquierda) */}
      <MainSidebar />

      {/* 2. Contenedor principal del chat (el resto de la interfaz) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Header (con buscador y perfil) */}
        <MainHeader />

        {/* 3. Contenedor de la lista de chats y la ventana de chat */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat Sidebar (la lista de conversaciones) */}
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={handleChatClick}
          />
          {/* Chat Window (la ventana de conversación) */}
          <ChatWindow
            chatId={selectedConversationId}
            messages={currentChatHistory}
            isHumanControl={isHumanControl}
            isSendDisabled={isSendDisabled}
            onSend={handleSend}
            onToggleMode={updateChatMode}
          />
        </div>
      </div>
    </div>
  );
}
