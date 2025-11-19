// src/services/crmService.js
import { apiFetch } from './api';

const BASE_ENDPOINT = '/crm/stages';

/**
 * Obtiene las etapas del CRM configuradas por el usuario.
 * GET /crm/stages
 */
export const getStages = async () => {
    console.log('llamando stage')
  const response = await apiFetch(BASE_ENDPOINT);
  if (!response.ok) {
    throw new Error('Error al obtener las etapas del CRM');
  }
  const data = await response.json();
  // Aseguramos devolver un array, dependiendo de si el back devuelve { stages: [] } o directamente []
  return data.stages || data; 
};

/**
 * Guarda o actualiza la lista completa de etapas.
 * POST /crm/stages
 * Body: { stages: [...] }
 */
export const updateStages = async (stagesArray) => {
  const response = await apiFetch(BASE_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ stages: stagesArray }), // Envolvemos en el objeto "stages" según tu curl
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || 'Error al guardar las etapas');
  }
  
  const data = await response.json();
  return data.stages || data;
};