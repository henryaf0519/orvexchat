import { useEffect, useState, useRef } from 'react'; // ✅ Importa useRef
import MessageItem from '../components/MessageItem';
import MessageInput from '../components/MessageInput';
import { getChats, getMessages, sendMessage } from '../services/chatService';
import { initSocket, subscribeToChat, unsubscribeFromChat } from '../services/socketService';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [currentChatHistory, setCurrentChatHistory] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isSendDisabled, setIsSendDisabled] = useState(false);
  const [socket, setSocket] = useState(null);
  
  // ✅ 1. Crea una referencia para el contenedor de mensajes.
  const messagesEndRef = useRef(null);

  // Efecto 1: Inicializa el socket y carga los chats iniciales.
  useEffect(() => {
    const newSocket = initSocket("http://localhost:3000");
    setSocket(newSocket);
    getChats().then((data) => {
      setConversations(data.map((c) => ({ ...c, hasUnread: false })));
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
        setIsSendDisabled(lastMessage.from === "IA" || lastMessage.from === "agent");
      } else {
        setIsSendDisabled(false);
      }
    });

    return () => {
      unsubscribeFromChat(selectedConversationId);
      socket.off('newMessage', handleActiveChatUpdate);
    };
  }, [socket, selectedConversationId]);

  // ✅ Efecto 4: Scroll automático al final.
  useEffect(() => {
    // Si la referencia existe, haz scroll al elemento.
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChatHistory]); // ✅ Se ejecuta cada vez que el historial de mensajes cambia

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

  return (
    <div className="h-full flex">
      <aside className="w-1/3 max-w-xs border-r border-gray-300">
        <h2 className="p-4 font-semibold border-b border-gray-300">Chats</h2>
        <ul>
          {conversations.map((conv) => (
            <li
              key={conv.id}
              className={`p-4 cursor-pointer relative hover:bg-gray-100 ${
                selectedConversationId === conv.id ? "bg-gray-200" : ""
              }`}
              onClick={() => handleChatClick(conv.id)}
            >
              {conv.name}
              {conv.hasUnread && (
                <span className="absolute top-4 right-4 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-300">
          {selectedConversationId
            ? `Chat con ${selectedConversationId}`
            : "Selecciona un chat"}
        </header>
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {currentChatHistory.length > 0 ? (
            currentChatHistory.map((msg,index) => (
              <MessageItem key={msg.SK || `message-${index}`} message={msg} />
            ))
          ) : (
            <p className="text-center text-gray-500 mt-10">
              No hay mensajes en esta conversación.
            </p>
          )}
          {/* ✅ 2. Añade un div vacío con la referencia al final */}
          <div ref={messagesEndRef} />
        </div>
        <footer className="p-4 border-t border-gray-300">
          <MessageInput onSend={handleSend} isDisabled={isSendDisabled} />
        </footer>
      </section>
    </div>
  );
}