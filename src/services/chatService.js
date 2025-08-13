import { chats as mockChats } from '../mockData'

let chats = mockChats.map((chat) => ({
  ...chat,
  messages: [...chat.messages],
}))

export async function getChats() {
  return chats
}

export async function sendMessage(chatId, text) {
  const chat = chats.find((c) => c.id === chatId)
  if (!chat) throw new Error('Chat not found')
  const message = { id: Date.now(), from: 'user', text }
  chat.messages = [...chat.messages, message]
  return chat
}

export async function getMessages(chatId) {
  const chat = chats.find((c) => c.id === chatId)
  return chat ? chat.messages : []
}
