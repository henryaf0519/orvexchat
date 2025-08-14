import { useEffect, useState } from 'react';
import MessageItem from '../components/MessageItem';
import MessageInput from '../components/MessageInput';
import { getChats, getMessages, sendMessage } from '../services/chatService';
import {
  initSocket,
  subscribe,
  unsubscribe,
} from '../services/socketService';

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [currentChatHistory, setCurrentChatHistory] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  useEffect(() => {
    getChats().then((data) => {
      setConversations(data);
    });
    initSocket('ws://localhost:8080');
  }, []);

  useEffect(() => {
    if (!selectedConversationId) {
      setCurrentChatHistory([]);
      return;
    }
    getMessages(selectedConversationId).then((messages) => {
      setCurrentChatHistory(messages);
    });
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const handler = (message) => {
      setCurrentChatHistory((prev) => [...prev, message]);
    };

    subscribe(selectedConversationId, handler);

    return () => unsubscribe(selectedConversationId, handler);
  }, [selectedConversationId]);

  const handleSend = async (text) => {
    if (!selectedConversationId) return;

    const result = await sendMessage(selectedConversationId, text);
    const newMessage = {
      id_mensaje_wa: result.id_mensaje_wa || `temp-${Date.now()}`,
      text: text,
      from: 'agent',
      estado: 'SENT',
      type: 'text',
      SK: `MESSAGE#${new Date().toISOString()}`,
    };

    setCurrentChatHistory((prev) => [...prev, newMessage]);
  };

  return (
    <div className="h-full flex">
      <aside className="w-1/3 max-w-xs border-r border-gray-300">
        <h2 className="p-4 font-semibold border-b border-gray-300">Chats</h2>
        <ul>
          {conversations.map((conv) => (
            <li
              key={conv.id}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                selectedConversationId === conv.id ? 'bg-gray-200' : ''
              }`}
              onClick={() => setSelectedConversationId(conv.id)}
            >
              {conv.name}
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-300">
          {selectedConversationId ? `Chat con ${selectedConversationId}` : 'Selecciona un chat'}
        </header>
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {currentChatHistory.map((msg) => (
            <MessageItem key={msg.SK} message={msg} />
          ))}
        </div>
        <footer className="p-4 border-t border-gray-300">
          <MessageInput onSend={handleSend} />
        </footer>
      </section>
    </div>
  );
}