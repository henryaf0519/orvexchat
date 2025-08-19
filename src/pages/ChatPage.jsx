// src/components/ChatPage.jsx

import { useEffect, useState, useRef } from "react"; // Importar useRef
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
  const synthRef = useRef(null); // Referencia para el sintetizador de Tone.js
  const [audioContextReady, setAudioContextReady] = useState(false); // Nuevo estado para controlar si el AudioContext está listo
  const canPlaySoundRef = useRef(true); // Nuevo ref para controlar la frecuencia del sonido

  const selectedChat = conversations.find(
    (conv) => conv.id === selectedConversationId
  );
  const isHumanControl = selectedChat?.modo === "humano";

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
        // La importación dinámica simplemente ejecuta el script que coloca 'Tone' en el objeto global 'window'.
        await import('https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js');
        const Tone = window.Tone; // Accede al objeto Tone global

        // CAMBIO CLAVE AQUÍ: Usar Tone.MembraneSynth para un sonido de notificación similar a WhatsApp
        if (!Tone || !Tone.MembraneSynth) { // Asegúrate de validar MembraneSynth
          throw new Error("Tone.js o Tone.MembraneSynth no se cargaron correctamente en el ámbito global.");
        }

        console.log('Tone.js cargado desde window:', Tone);

        // Crea un sintetizador de tipo MembraneSynth con parámetros ajustados para un "pop"
        const synth = new Tone.MembraneSynth({
          pitchDecay: 0.008, // Decaimiento rápido del tono
          octaves: 1, // Rango de octavas
          envelope: {
            attack: 0.001, // Ataque muy rápido
            decay: 0.05,  // Decaimiento rápido
            sustain: 0,   // Sin sostenido
            release: 0.005, // Liberación muy rápida
          },
          oscillator: {
            type: "sine", // Onda senoidal para un sonido limpio
          }
        }).toDestination();
        
        synthRef.current = synth; // Guarda el sintetizador en la referencia
        console.log('Sintetizador de Tone.js creado:', synth);

        // Función para iniciar el contexto de audio
        const startAudioContext = () => {
          if (Tone.context.state !== 'running') {
            Tone.start().then(() => {
              console.log('Audio context iniciado correctamente');
              setAudioContextReady(true);
            }).catch(e => {
              console.error('Error al iniciar el contexto de audio:', e);
            });
          } else {
            console.log('Audio context ya está corriendo.');
            setAudioContextReady(true);
          }
        };

        // Escucha eventos de interacción del usuario para iniciar el contexto de audio
        document.documentElement.addEventListener('mousedown', startAudioContext, { once: true });
        document.documentElement.addEventListener('keydown', startAudioContext, { once: true });
        document.documentElement.addEventListener('touchstart', startAudioContext, { once: true });

        // Si la página ya está cargada, intenta iniciar el contexto de audio de inmediato
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          startAudioContext();
        }

      } catch (error) {
        console.error("Error al cargar Tone.js o configurar el sintetizador:", error);
      }
    };

    loadToneJs();

    // Limpieza al desmontar el componente
    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        console.log('Sintetizador Tone.js dispuesto.');
      }
      if (socket) {
        socket.disconnect();
        console.log('Socket desconectado.');
      }
    };
  }, []); // Se ejecuta una sola vez al montar el componente

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
            id: conversationId,
            name: conversationId,
            hasUnread: true,
            modo: "IA",
          };
          updatedConversations = [newChat, ...prevConversations];
        }

        // Reproducir sonido si el contexto de audio está listo y no está en cooldown
        if (synthRef.current && audioContextReady && canPlaySoundRef.current) {
          console.log(`Reproduciendo sonido para la conversación: ${conversationId}`);
          // CAMBIO CLAVE AQUÍ: Nota y duración para un "pop" agudo
          synthRef.current.triggerAttackRelease("C6", "32n"); // Nota C6, duración de 32avos
          canPlaySoundRef.current = false; // Deshabilita la reproducción inmediata
          setTimeout(() => {
            canPlaySoundRef.current = true; // Habilita la reproducción después de 200ms
          }, 200); // Cooldown de 200 milisegundos
        } else if (!audioContextReady) {
          console.warn('No se pudo reproducir el sonido: AudioContext no está listo. Por favor, interactúa con la página.');
        } else if (!synthRef.current) {
          console.warn('No se pudo reproducir el sonido: Sintetizador Tone.js no inicializado.');
        } else if (!canPlaySoundRef.current) {
          console.log('Sonido omitido: En cooldown.');
        }
        return updatedConversations;
      });
    };

    socket.on("newNotification", handleNotification);

    return () => {
      socket.off("newNotification", handleNotification);
    };
  }, [socket, selectedConversationId, audioContextReady]);

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
        if (isHumanControl) {
          setIsSendDisabled(message.from === "agent");
        } else {
          setIsSendDisabled(true);
        }
        return updatedHistory;
      });
    };
    socket.on("newMessage", handleActiveChatUpdate);

    getMessages(selectedConversationId).then((messages) => {
      setCurrentChatHistory(messages);
      if (isHumanControl) {
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          setIsSendDisabled(lastMessage.from === "agent");
        } else {
          setIsSendDisabled(false);
        }
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
