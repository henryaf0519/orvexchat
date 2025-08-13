import { useState } from 'react'

export default function MessageInput({ onSend }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const text = value.trim()
    if (!text) return
    onSend(text)
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        className="flex-1 border rounded p-2"
        placeholder="Escribe un mensaje..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={!value.trim()}
      >
        Enviar
      </button>
    </form>
  )
}
