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
  const canPlaySoundRef = useRef(true);

  const selectedChat = conversations.find(
    (conv) => conv.id === selectedConversationId
  );
  const isHumanControl = selectedChat?.modo === "humano";

  // ... (El primer useEffect para inicializar todo se mantiene igual)
  useEffect(() => {
    // Inicializar el socket
    const newSocket = initSocket();
    setSocket(newSocket);

    // Cargar los chats iniciales
    getChats().then((data) => {
      setConversations(
        data.map((c) => ({ ...c, hasUnread: false, modo: "IA" }))
      );
    });

    // Cargar Tone.js y configurar el sintetizador
    const loadToneJs = async () => {
      try {
        await import('https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js');
        const Tone = window.Tone;

        if (!Tone || !Tone.MembraneSynth) {
          throw new Error("Tone.js o Tone.MembraneSynth no se cargaron correctamente.");
        }

        const synth = new Tone.MembraneSynth({
          pitchDecay: 0.008,
          octaves: 1,
          envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.005 },
          oscillator: { type: "sine" }
        }).toDestination();
        
        synthRef.current = synth;

        const startAudioContext = () => {
          if (Tone.context.state !== 'running') {
            Tone.start().then(() => setAudioContextReady(true));
          } else {
            setAudioContextReady(true);
          }
        };

        document.documentElement.addEventListener('mousedown', startAudioContext, { once: true });
        document.documentElement.addEventListener('keydown', startAudioContext, { once: true });
        document.documentElement.addEventListener('touchstart', startAudioContext, { once: true });

        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          startAudioContext();
        }

      } catch (error) {
        console.error("Error al cargar Tone.js:", error);
      }
    };

    loadToneJs();

    return () => {
      if (synthRef.current) synthRef.current.dispose();
      if (socket) socket.disconnect();
    };
  }, []);


  // ... (El useEffect para las notificaciones se mantiene igual)
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data) => {
      const { conversationId } = data;
      setConversations((prevConversations) => {
        const existingConversationIndex = prevConversations.findIndex(
          (c) => c.id === conversationId
        );
        let updatedConversations;
        if (existingConversationIndex !== -1) {
          const conversationToMove = {
            ...prevConversations[existingConversationIndex],
            hasUnread: true,
          };
          updatedConversations = [...prevConversations];
          updatedConversations.splice(existingConversationIndex, 1);
          updatedConversations.unshift(conversationToMove);
        } else {
          const newChat = {
            id: conversationId, name: conversationId, hasUnread: true, modo: "IA",
          };
          updatedConversations = [newChat, ...prevConversations];
        }

        if (synthRef.current && audioContextReady && canPlaySoundRef.current) {
          synthRef.current.triggerAttackRelease("C6", "32n");
          canPlaySoundRef.current = false;
          setTimeout(() => { canPlaySoundRef.current = true; }, 200);
        }
        return updatedConversations;
      });
    };

    socket.on("newNotification", handleNotification);
    return () => socket.off("newNotification", handleNotification);
  }, [socket, audioContextReady]);


  // ✅ AQUÍ ESTÁ EL CAMBIO
  useEffect(() => {
    if (!socket || !selectedConversationId) {
      setCurrentChatHistory([]);
      setIsSendDisabled(false);
      return;
    }

    subscribeToChat(selectedConversationId);

    const handleActiveChatUpdate = (message) => {
      const messageWithTimestamp = {
        ...message,
        SK: message.SK || `MESSAGE#${new Date().toISOString()}`,
      };

      setCurrentChatHistory((prevHistory) => [...prevHistory, messageWithTimestamp]);
    };
    
    socket.on("newMessage", handleActiveChatUpdate);

    getMessages(selectedConversationId).then((messages) => {
      setCurrentChatHistory(messages);
      const lastMessage = messages[messages.length - 1];
      if (isHumanControl) {
        setIsSendDisabled(lastMessage ? lastMessage.from === "agent" : false);
      } else {
        setIsSendDisabled(true); // En modo IA, siempre deshabilitado hasta que responda
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
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newMode }),
        }
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
      </div>
    </div>
  );
}