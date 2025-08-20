// src/pages/ChatPage.jsx

import { useEffect, useState, useRef } from "react";
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
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [conversations, setConversations] = useState([]);
  const [currentChatHistory, setCurrentChatHistory] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isSendDisabled, setIsSendDisabled] = useState(false);
  const [socket, setSocket] = useState(null);
  const synthRef = useRef(null);
  const [audioContextReady, setAudioContextReady] = useState(false);
  
  // ✅ REINTRODUCIMOS LA REFERENCIA PARA EL COOLDOWN
  const canPlaySoundRef = useRef(true);

  const selectedChat = conversations.find(
    (conv) => conv.id === selectedConversationId
  );
  const isHumanControl = selectedChat?.modo === "humano";

  // Efecto 1: Carga inicial de conversaciones
  useEffect(() => {
    const newSocket = initSocket();
    setSocket(newSocket);

    const fetchConversationsDetails = async () => {
      const chatList = await getChats();
      const conversationsWithDetails = await Promise.all(
        chatList.map(async (chat) => {
          const messages = await getMessages(chat.id);
          const lastMessage = messages[messages.length - 1] || null;
          return { ...chat, hasUnread: false, modo: "IA", lastMessage: lastMessage };
        })
      );
      
      conversationsWithDetails.sort((a, b) => {
        if (!a.lastMessage?.SK) return 1;
        if (!b.lastMessage?.SK) return -1;
        return new Date(b.lastMessage.SK.split('#')[1]) - new Date(a.lastMessage.SK.split('#')[1]);
      });
      
      setConversations(conversationsWithDetails);
    };

    fetchConversationsDetails();

    const loadToneJs = async () => {
        try {
          await import('https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js');
          const Tone = window.Tone;
          if (!Tone || !Tone.MembraneSynth) { throw new Error("Tone.js no cargado."); }
          const synth = new Tone.MembraneSynth().toDestination();
          synthRef.current = synth;
          const startAudioContext = () => {
            if (Tone.context.state !== 'running') Tone.start().then(() => setAudioContextReady(true));
            else setAudioContextReady(true);
          };
          document.documentElement.addEventListener('click', startAudioContext, { once: true });
          if (document.readyState === 'complete') startAudioContext();
        } catch (error) { console.error("Error al cargar Tone.js:", error); }
    };
    loadToneJs();

    return () => {
      if (synthRef.current) synthRef.current.dispose();
      if (socket) socket.disconnect();
    };
  }, []);

  // Efecto 2: Manejo de notificaciones
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      const { conversationId, message } = data;
      
      setConversations((prevConversations) => {
        let conversationExists = false;
        let updatedConversations = prevConversations.map((conv) => {
          if (conv.id === conversationId) {
            conversationExists = true;
            return { ...conv, hasUnread: true, lastMessage: message };
          }
          return conv;
        });

        if (!conversationExists) {
          updatedConversations.push({
            id: conversationId, name: conversationId, hasUnread: true, modo: "IA", lastMessage: message,
          });
        }
        
        updatedConversations.sort((a, b) => {
            if (!a.lastMessage?.SK) return 1;
            if (!b.lastMessage?.SK) return -1;
            return new Date(b.lastMessage.SK.split('#')[1]) - new Date(a.lastMessage.SK.split('#')[1]);
        });
        
        // ✅ LÓGICA DE SONIDO CORREGIDA CON COOLDOWN
        if (synthRef.current && audioContextReady && canPlaySoundRef.current) {
            // Reproducimos el sonido
            synthRef.current.triggerAttackRelease("C6", "32n");
            // Bloqueamos la reproducción por 200ms
            canPlaySoundRef.current = false;
            setTimeout(() => {
              canPlaySoundRef.current = true;
            }, 200);
        }
        
        return updatedConversations;
      });
    };

    socket.on("newNotification", handleNotification);
    return () => socket.off("newNotification", handleNotification);
  }, [socket, audioContextReady]);

  // ... (El resto del archivo se mantiene igual)
  useEffect(() => {
    if (!socket || !selectedConversationId) {
      setCurrentChatHistory([]);
      setIsSendDisabled(false);
      return;
    }
    subscribeToChat(selectedConversationId);
    const handleActiveChatUpdate = (message) => {
      const formattedMessage = {
        ...message,
        SK: message.SK || (message.timestamp ? `MESSAGE#${message.timestamp}` : `MESSAGE#${new Date().toISOString()}`),
      };
      setCurrentChatHistory((prevHistory) => [...prevHistory, formattedMessage]);
    };
    socket.on("newMessage", handleActiveChatUpdate);
    getMessages(selectedConversationId).then((messages) => {
      setCurrentChatHistory(messages);
      const lastMessage = messages[messages.length - 1];
      if (isHumanControl) {
        setIsSendDisabled(lastMessage ? lastMessage.from === "agent" : false);
      } else {
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
      text: text, from: "agent", estado: "SENT", type: "text",
      SK: `MESSAGE#${new Date().toISOString()}`,
    };
    setCurrentChatHistory((prev) => [...prev, newMessage]);
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
        `${API_BASE_URL}/dynamo/control/${selectedConversationId}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newMode }) }
      );
      setConversations((prevConversations) =>
        prevConversations.map((chat) =>
          chat.id === selectedConversationId ? { ...chat, modo: newMode } : chat
        )
      );
    } catch (error) {
      console.error("Error al cambiar el modo del chat:", error);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader />
        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar
            conversations={conversations} selectedId={selectedConversationId} onSelect={handleChatClick}
          />
          <ChatWindow
            chatId={selectedConversationId} messages={currentChatHistory}
            isHumanControl={isHumanControl} isSendDisabled={isSendDisabled}
            onSend={handleSend} onToggleMode={updateChatMode}
          />
        </div>
      </div>
    </div>
  );
}