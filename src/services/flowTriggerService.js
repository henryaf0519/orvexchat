import { apiFetch } from './api';

const BASE_ENDPOINT = '/flow-triggers';

/**
 * Obtiene todos los triggers del 'numberId' (automático por apiFetch).
 * GET /flow-triggers
 */
export const getTriggers = async () => {
  const response = await apiFetch(BASE_ENDPOINT);
  if (!response.ok) {
    throw new Error('Error al obtener los triggers');
  }
  return response.json();
};

/**
 * Crea un nuevo trigger.
 * POST /flow-triggers
 * @param {object} triggerData - { name, flow_id, screen_id, flow_cta }
 */
export const createTrigger = async (triggerData) => {
  const response = await apiFetch(BASE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(triggerData),
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || 'Error al crear el trigger');
  }
  return responseData;
};

/**
 * Actualiza un trigger existente.
 * PATCH /flow-triggers/:id
 * @param {string} triggerId - El ID del trigger a actualizar.
 * @param {object} updateData - Los campos a actualizar (ej: { name: "nuevo nombre" })
 */
export const updateTrigger = async (triggerId, updateData) => {
    console.log('Updating trigger:', triggerId, updateData);
  const response = await apiFetch(`${BASE_ENDPOINT}/${triggerId}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });

  const responseData = await response.json();
  if (!response.ok) {
    throw new Error(responseData.message || 'Error al actualizar el trigger');
  }
  return responseData;
};

// NOTA: Aún no has proporcionado un endpoint de ELIMINAR,
// pero cuando lo tengas, lo añadiríamos aquí.
// export const deleteTrigger = async (triggerId) => { ... }