import { apiFetch } from './api';

/**
 * Obtiene TODOS los flujos (GET /flow)
 */
export const getFlows = async () => {
  const response = await apiFetch('/flow');
  if (!response.ok) {
    throw new Error('Error al obtener los flujos');
  }
  const result = await response.json(); // result es { data: [...] }
  return result.data || []; // <-- ¡ESTA ES LA CORRECCIÓN!
};

/**
 * Obtiene UN flujo por su ID (GET /flow/:flowId)
 */
export const getFlowById = async (flowId) => {
    const response = await apiFetch(`/flow/${flowId}`);
    if (!response.ok) {
        throw new Error('Error al obtener el flujo');
    }
    return response.json();
};

/**
 * Crea un nuevo flujo (POST /flow)
 */
export const createFlow = async (name) => {
  
  const newFlowData = {
    name: name,
    categories: ["OTHER"] 
  };

  const response = await apiFetch('/flow', {
    method: 'POST',
    body: JSON.stringify(newFlowData),
  });

  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || 'Error al crear el flujo');
    } catch (e) {
      throw new Error('Error al crear el flujo');
    }
  }
  return response.json(); 
};

/**
 * Actualiza un flujo (PATCH /flow/:flowId)
 */
export const updateFlowJson = async (flowId, flowJsonString, navigationMapString) => {
  console.log("Updating flow with:", {flowId, flowJsonString, navigationMapString});
  const response = await apiFetch(`/flow/${flowId}/assets`, {
    method: 'PUT',
    body: JSON.stringify({ 
      flowJson: flowJsonString,       // El JSON para Meta
      navigationMap: navigationMapString // El JSON para tu Backend
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al guardar el JSON del flujo');
  }
  return response.json();
};

/**
 * Elimina un flujo (DELETE /flow/:flowId)
 */
export const deleteFlow = async (flowId) => {
  const response = await apiFetch(`/flow/${flowId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})); 
    throw new Error(error.message || 'Error al eliminar el flujo');
  }
  
  // Muchos endpoints DELETE devuelven 204 (No Content) o un JSON de éxito
  // Intentamos parsear el JSON, si falla, devolvemos un objeto de éxito
  try {
    return await response.json();
  } catch (e) {
    return { success: true, id: flowId };
  }
};


export const sendTestFlow = async (internalFlowId,  to, screen, flowName) => {
  console.log("Sending test flow with:", {internalFlowId,  to, screen, flowName});

  const testData = {
    flowId: internalFlowId, 
    to: to,
    screen: screen,
    flowName: flowName
  };

  const response = await apiFetch(`/flow/${internalFlowId}/test`, {
    method: 'POST',
    body: JSON.stringify(testData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al enviar la prueba del flujo');
  }
  return response.json();
};

export const publishFlow = async (flowId, name) => {
  const response = await apiFetch('/flow/publish', { // Llama al POST /flow/publish
    method: 'POST',
    body: JSON.stringify({ flowId, name }), // Envía el body { flowId, name }
  });

  const responseData = await response.json();

  if (!response.ok) {
    throw responseData; 
  }
  return responseData;
};
