import { useState } from 'react'
import { chats } from './mockData'

export default function App() {
  const [currentChat, setCurrentChat] = useState(chats[0])

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
            <div
              key={msg.id}
              className={`max-w-xs rounded-lg p-2 ${
                msg.from === 'user'
                  ? 'bg-gray-200 self-start'
                  : 'bg-green-200 self-end'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
        <footer className="p-4 border-t border-gray-300">
          <input
            type="text"
            className="w-full border rounded p-2"
            placeholder="Escribe un mensaje..."
            disabled
          />
        </footer>
      </section>
    </div>
  )
}
