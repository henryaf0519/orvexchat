let socket
const listeners = new Map()

export function initSocket(url) {
  if (socket) return socket
  socket = new WebSocket(url)
  socket.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data)
      const { chatId, message } = data
      if (!chatId || !message) return
      const handlers = listeners.get(chatId) || []
      handlers.forEach((fn) => fn(message))
    } catch (err) {
      console.error('Invalid message from websocket', err)
    }
  })
  return socket
}

export function subscribe(chatId, handler) {
  if (!listeners.has(chatId)) {
    listeners.set(chatId, [])
  }
  listeners.get(chatId).push(handler)
}

export function unsubscribe(chatId, handler) {
  const handlers = listeners.get(chatId)
  if (!handlers) return
  listeners.set(chatId, handlers.filter((h) => h !== handler))
}

export function sendSocketMessage(payload) {
  if (!socket || socket.readyState !== WebSocket.OPEN) return
  socket.send(JSON.stringify(payload))
}
