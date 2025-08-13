import { useEffect, useState } from 'react'
import MessageItem from '../components/MessageItem'
import MessageInput from '../components/MessageInput'
import { getChats, sendMessage } from '../services/chatService'

export default function ChatPage() {
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)

  useEffect(() => {
    getChats().then((data) => {
      setChats(data)
      setCurrentChat(data[0] ?? null)
    })
  }, [])

  const handleSend = async (text) => {
    if (!currentChat) return
    const updated = await sendMessage(currentChat.id, text)
    setChats((prev) =>
      prev.map((chat) => (chat.id === updated.id ? updated : chat)),
    )
    setCurrentChat(updated)
  }

  return (
    <div className="h-full flex">
      <aside className="w-1/3 max-w-xs border-r border-gray-300">
        <h2 className="p-4 font-semibold border-b border-gray-300">Chats</h2>
        <ul>
          {chats.map((chat) => (
            <li
              key={chat.id}
              className={`p-4 cursor-pointer hover:bg-gray-100 ${
                currentChat?.id === chat.id ? 'bg-gray-200' : ''
              }`}
              onClick={() => setCurrentChat(chat)}
            >
              {chat.name}
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1 flex flex-col">
        <header className="p-4 border-b border-gray-300">
          {currentChat ? currentChat.name : 'Selecciona un chat'}
        </header>
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {currentChat?.messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
        </div>
        <footer className="p-4 border-t border-gray-300">
          <MessageInput onSend={handleSend} />
        </footer>
      </section>
    </div>
  )
}
