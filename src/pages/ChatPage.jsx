// src/pages/ChatPage.jsx

import { useEffect, useState, useRef } from "react";
// Importa tus componentes de la aplicación
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import MainSidebar from "../components/MainSidebar";
import MainHeader from "../components/MainHeader";

// Importa herramientas de estado y manejo de íconos
import { useChatStore } from "../store/chatStore";
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; 

// Importa tus servicios de socket
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
    
    // Estado para controlar la visibilidad del sidebar de chats en móvil
    const [isChatSidebarOpen, setIsChatSidebarOpen] = useState(false); 

    const selectedChat = conversations.find(
        (conv) => conv.id === selectedConversationId
    );
    const isHumanControl = selectedChat?.modo === "humano";

    const toggleChatSidebar = () => {
        setIsChatSidebarOpen(!isChatSidebarOpen);
    };
    
    // Función wrapper para seleccionar chat y cerrar el sidebar en móvil
    const handleSelectConversation = (conversationId) => {
        selectConversation(conversationId);
        
        // Cierra el sidebar solo si el usuario está en móvil
        if (window.innerWidth < 768) {
            setIsChatSidebarOpen(false);
        }
    };

    // 1. useEffect: Inicialización de Socket y Tone.js
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

    // 2. useEffect: Manejo de Notificaciones
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

    // 3. useEffect: Manejo de Mensajes y Suscripción al Chat Seleccionado
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
            
            {/* Barra lateral principal (Vertical, oculta/barra inferior en móvil) */}
            <MainSidebar /> 
            
            <div className="flex-1 flex flex-col overflow-hidden">
                
                <MainHeader />
                
                <div className="flex flex-1 overflow-hidden relative">
                    
                    {/* ChatSidebar: Flotante en móvil, estático en md+ */}
                    <ChatSidebar
                        conversations={conversations}
                        selectedId={selectedConversationId}
                        onSelect={handleSelectConversation}
                        className={`
                            transition-transform duration-300 ease-in-out 
                            w-full sm:w-80 md:w-96
                            fixed top-0 left-0 h-full z-30 bg-white shadow-xl md:static md:translate-x-0 md:shadow-none 
                            ${isChatSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        `}
                    />
                    
                    {/* BOTÓN DE TOGGLE (Visible solo en móvil) */}
                    <button
                        onClick={toggleChatSidebar}
                        className={`
                            md:hidden absolute top-1/2 -translate-y-1/2 
                            z-40 px-2 py-3
                            text-gray-900 
                            bg-white rounded-r-lg 
                            shadow-md hover:shadow-lg
                            border border-gray-200 border-l-0
                            focus:outline-none focus:ring-2 focus:ring-red-500
                            transition-all duration-300 ease-in-out 
                            transform 
                            ${
                                // Mueve el botón al borde derecho del sidebar cuando está abierto
                                isChatSidebarOpen 
                                    ? 'translate-x-[calc(100vw-1.5rem)] sm:translate-x-80' 
                                    : 'translate-x-0' // Se queda fijo en el borde izquierdo (visible) cuando está cerrado
                            }
                        `}
                        title={isChatSidebarOpen ? "Ocultar Chats" : "Mostrar Chats"}
                    >
                        {isChatSidebarOpen ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
                    </button>
                    
                    {/* Ventana de Chat: Oculta en móvil si el sidebar está abierto */}
                    <ChatWindow
                        chatId={selectedConversationId}
                        messages={currentChatHistory}
                        isHumanControl={isHumanControl}
                        isSendDisabled={isSendDisabled}
                        onSend={sendMessage}
                        onToggleMode={updateChatMode}
                        className={`flex-1 ${isChatSidebarOpen ? 'hidden md:flex' : 'flex'}`}
                    />
                </div>
            </div>
        </div>
    );
}