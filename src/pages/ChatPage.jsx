// src/components/ChatPage.jsx

import { useEffect, useState } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import { getChats, getMessages, sendMessage } from '../services/chatService';
import { initSocket, subscribeToChat, unsubscribeFromChat } from '../services/socketService';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [currentChatHistory, setCurrentChatHistory] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isSendDisabled, setIsSendDisabled] = useState(false);
  const [socket, setSocket] = useState(null);

  const selectedChat = conversations.find(conv => conv.id === selectedConversationId);
  const isHumanControl = selectedChat?.modo === 'humano';

  // Efecto 1: Inicializa el socket y carga los chats iniciales.
  useEffect(() => {
    const newSocket = initSocket("http://localhost:3000");
    setSocket(newSocket);
    getChats().then((data) => {
      setConversations(data.map((c) => ({ ...c, hasUnread: false, modo: 'IA' })));
    });
  }, []);

  // Efecto 2: Oyente GLOBAL para NOTIFICACIONES.
  useEffect(() => {
    if (!socket) return;
    
    const handleNotification = (data) => {
      const { conversationId } = data;
      setConversations(prevConversations => {
          const conversationExists = prevConversations.some(c => c.id === conversationId);
          if (conversationExists) {
            return prevConversations.map(chat => 
                chat.id === conversationId ? { ...chat, hasUnread: true } : chat
            );
          } else {
            const newChat = {
                id: conversationId,
                name: conversationId,
                hasUnread: true,
                modo: 'IA'
            };
            return [newChat, ...prevConversations];
          }
      });
    };
    
    socket.on('newNotification', handleNotification);
    
    return () => {
      socket.off('newNotification', handleNotification);
    };
  }, [socket, selectedConversationId]);

  // Efecto 3: Lógica para el CHAT ACTIVO.
  useEffect(() => {
    if (!socket || !selectedConversationId) {
      setCurrentChatHistory([]);
      setIsSendDisabled(false);
      return;
    }
    subscribeToChat(selectedConversationId);
    
    const handleActiveChatUpdate = (message) => {
        setCurrentChatHistory(prevHistory => [...prevHistory, message]);
    };
    socket.on('newMessage', handleActiveChatUpdate);
    
    getMessages(selectedConversationId).then((messages) => {
      setCurrentChatHistory(messages);
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        setIsSendDisabled(!isHumanControl && lastMessage.from === "IA");
      } else {
        setIsSendDisabled(false);
      }
    });

    return () => {
      unsubscribeFromChat(selectedConversationId);
      socket.off('newMessage', handleActiveChatUpdate);
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
    setIsSendDisabled(true);
  };

  const handleChatClick = (conversationId) => {
    setSelectedConversationId(conversationId);
    setConversations((prevConversations) =>
      prevConversations.map((chat) =>
        chat.id === conversationId ? { ...chat, hasUnread: false } : chat
      )
    );
  };

  // ✅ FUNCIONES ACTUALIZADAS PARA LLAMAR AL SERVICIO
  const updateChatMode = async (newMode) => {
    if (!selectedConversationId) return;

    try {
      await fetch(`http://localhost:3000/dynamo/control/${selectedConversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newMode }),
      });

      // Actualiza el estado localmente para reflejar el cambio en la interfaz
      setConversations(prevConversations =>
        prevConversations.map(chat =>
          chat.id === selectedConversationId ? { ...chat, modo: newMode } : chat
        )
      );
      console.log(`Modo del chat de ${selectedConversationId} actualizado a: ${newMode}`);
      
    } catch (error) {
      console.error('Error al cambiar el modo del chat:', error);
      // Opcional: Revertir el estado del frontend si la llamada falla
    }
  };
  
  // ✅ El resto de tu componente permanece igual
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      <ChatSidebar
        conversations={conversations}
        selectedId={selectedConversationId}
        onSelect={handleChatClick}
      />
      <ChatWindow
        chatId={selectedConversationId}
        messages={currentChatHistory}
        isHumanControl={isHumanControl}
        isSendDisabled={isSendDisabled}
        onSend={handleSend}
        onToggleMode={updateChatMode}
      />
    </div>
  );
}