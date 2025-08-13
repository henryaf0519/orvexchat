import React from 'react'

export default function MessageItem({ message }) {
  const isUser = message.from === 'user'
  return (
    <div
      className={`max-w-xs rounded-lg p-2 ${
        isUser ? 'bg-gray-200 self-start' : 'bg-green-200 self-end'
      }`}
    >
      {message.text}
    </div>
  )
}
