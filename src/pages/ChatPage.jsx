// src/pages/ChatPage.jsx

import { useEffect, useState, useRef } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import MainSidebar from "../components/MainSidebar";
import MainHeader from "../components/MainHeader";
import { useChatStore } from "../store/chatStore";
import {
  initSocket,
  subscribeToChat,
  unsubscribeFromChat,
  subscribeToCompany 
} from "../services/socketService";

export default function ChatPage() {
  const {
    conversations,
    currentChatHistory,
    selectedConversationId,
    isSendDisabled,
    fetchConversations,
    selectConversation,
    handleNewNotification,
    addMessageToHistory,
    sendMessage,
    updateChatMode,
    updateSendDisabledOnNewMessage,
  } = useChatStore();

  const companyId = useChatStore((state) => state.companyId);
  const [socket, setSocket] = useState(null); 
  const synthRef = useRef(null);
  const canPlaySoundRef = useRef(true);
  const [audioContextReady, setAudioContextReady] = useState(false);
  
  const selectedChat = conversations.find(
    (conv) => conv.id === selectedConversationId
  );
  const isHumanControl = selectedChat?.modo === "humano";

  useEffect(() => {
    const newSocket = initSocket();
    setSocket(newSocket);
    fetchConversations();
    console.log("Socket initialized:", companyId);
    newSocket.on('connect', () => {
      if (companyId) {
         console.log(`Suscribiendo a la sala de la empresa: ${companyId}`);
        subscribeToCompany(companyId);
      }
    });

    const loadToneJs = async () => {
      try {
        await import('https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js');
        const Tone = window.Tone;
        if (!Tone || !Tone.Synth) throw new Error("Tone.js no cargó.");
        
        const synth = new Tone.Synth({ volume: -10 }).toDestination();
        synthRef.current = synth;

        const startAudioContext = () => {
          if (Tone.context.state !== 'running') {
            Tone.start().then(() => setAudioContextReady(true));
          } else {
            setAudioContextReady(true);
          }
        };
        document.documentElement.addEventListener('click', startAudioContext, { once: true });
      } catch (error) {
        console.error("Error al cargar Tone.js:", error);
      }
    };
    loadToneJs();

    return () => {
      if (synthRef.current) synthRef.current.dispose();
      if (socket) socket.disconnect();
    };
  }, [fetchConversations, companyId]);

  useEffect(() => {
    if (!socket) return;

    const notificationHandler = (data) => {
      handleNewNotification(data);
      
      if (synthRef.current && audioContextReady && canPlaySoundRef.current) {
        synthRef.current.triggerAttackRelease("C6", "32n");
        canPlaySoundRef.current = false;
        setTimeout(() => { canPlaySoundRef.current = true; }, 200);
      }
    };

    socket.on("newNotification", notificationHandler);
    return () => socket.off("newNotification", notificationHandler);
  }, [socket, audioContextReady, handleNewNotification]);

  useEffect(() => {
    if (!socket || !selectedConversationId) return;
    console.log(`[FRONTEND] Intentando suscribir al chat ID: ${selectedConversationId}`);
   
    subscribeToChat(selectedConversationId);
    
    const activeChatUpdateHandler = (message) => {
      addMessageToHistory(message); 
      updateSendDisabledOnNewMessage(message);
    };
    
    socket.on("newMessage", activeChatUpdateHandler);

    return () => {
      unsubscribeFromChat(selectedConversationId);
      socket.off("newMessage", activeChatUpdateHandler);
    };
  }, [socket, selectedConversationId, addMessageToHistory, updateSendDisabledOnNewMessage]);

  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader />
        <div className="flex flex-1 overflow-hidden">
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={selectConversation} 
          />
          <ChatWindow
            chatId={selectedConversationId}
            messages={currentChatHistory}
            isHumanControl={isHumanControl}
            isSendDisabled={isSendDisabled}
            onSend={sendMessage}
            onToggleMode={updateChatMode}
          />
        </div>
      </div>
    </div>
  );
}