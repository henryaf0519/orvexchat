const API_URL = 'http://localhost:3000/dynamo';

export async function getChats() {
  try {
    const response = await fetch(`${API_URL}/conversations`);
    if (!response.ok) {
      throw new Error('Error al obtener la lista de conversaciones.');
    }
    const conversationIds = await response.json();
    return conversationIds.map((id) => ({
      id: id,
      name: id,
      messages: [],
    }));
  } catch (error) {
    console.error('Fallo en getChats:', error);
    return [];
  }
}

export async function sendMessage(chatId, text) {
  try {
    const response = await fetch(`${API_URL}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: chatId,
        from: 'agent',
        text: text,
        messageId: `sent-${Date.now()}`,
        status: 'SENT',
        type: 'text',
      }),
    });
    if (!response.ok) {
      throw new Error('Error al enviar el mensaje.');
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Fallo en sendMessage:', error);
    return null;
  }
}

export async function getMessages(chatId) {
  try {
    const response = await fetch(`${API_URL}/messages/${chatId}`);
    if (!response.ok) {
      throw new Error('Error al obtener los mensajes de la conversación.');
    }
    const messages = await response.json();
    return messages;
  } catch (error) {
    console.error('Fallo en getMessages:', error);
    return [];
  }
}